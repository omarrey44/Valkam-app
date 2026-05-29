import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateField from './DateField';
import { FieldIcon, SelectIcon } from './FieldIcon';
import SelectOrText from './SelectOrText';
import { logActividad } from '../lib/actividad';
import { supabase } from '../lib/supabase';
import { formatMoney, parseMoney } from '../lib/money';
import { colors, font, gradients, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';
import { Cliente, Cotizacion, CotizacionItem, Moneda } from '../lib/types';

const TERMINOS = ['100% anticipo', '50% anticipo / 50% entrega', '30% anticipo / 70% entrega', 'Neto 30', 'Neto 60', 'Contra entrega'];
const TIEMPOS  = ['1 semana', '2 semanas', '3 semanas', '1 mes', '2 meses', '3 meses', '6 meses', 'A definir'];

const MONEDAS: { v: Moneda; icon: keyof typeof Ionicons.glyphMap }[] = [
  { v: 'MXN', icon: 'cash-outline' },
  { v: 'USD', icon: 'cash-outline' },
  { v: 'EUR', icon: 'cash-outline' },
];

interface ItemRow {
  descripcion: string;
  cantidad: string;
  precio_unitario: string;
}

interface CotizInput {
  cliente_id: string;
  titulo: string;
  descripcion: string;
  monto: string;
  moneda: Moneda;
  terminos_pago: string;
  tiempo_entrega: string;
  detalles_tecnicos: string;
  fecha_cotizacion: string;
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function CotizacionForm({
  initial,
  cotizacionId,
  onSaved,
}: {
  initial?: Partial<Cotizacion>;
  cotizacionId?: string;
  onSaved: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<ItemRow[]>([]);

  const [f, setF] = useState<CotizInput>({
    cliente_id: initial?.cliente_id ?? '',
    titulo: initial?.titulo ?? '',
    descripcion: initial?.descripcion ?? '',
    monto: initial?.monto != null ? String(initial.monto) : '',
    moneda: (initial?.moneda as Moneda) ?? 'MXN',
    terminos_pago: initial?.terminos_pago ?? '',
    tiempo_entrega: initial?.tiempo_entrega ?? '',
    detalles_tecnicos: initial?.detalles_tecnicos ?? '',
    fecha_cotizacion: initial?.fecha_cotizacion ?? hoy(),
  });

  useEffect(() => {
    supabase.from('clientes').select('*').order('empresa').then(({ data }) => setClientes((data as Cliente[]) ?? []));
  }, []);

  useEffect(() => {
    if (!cotizacionId) return;
    supabase
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_id', cotizacionId)
      .order('orden')
      .then(({ data }) =>
        setItems(
          ((data as CotizacionItem[]) ?? []).map((i) => ({
            descripcion: i.descripcion,
            cantidad: String(i.cantidad),
            precio_unitario: String(i.precio_unitario),
          }))
        )
      );
  }, [cotizacionId]);

  function set<K extends keyof CotizInput>(k: K, v: CotizInput[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }
  function setItem(idx: number, k: keyof ItemRow, v: string) {
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, [k]: v } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { descripcion: '', cantidad: '1', precio_unitario: '' }]);
  }
  function removeItem(idx: number) {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }

  const itemsTotal = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0), 0);
  const usaPartidas = items.length > 0;
  const montoFinal = usaPartidas ? itemsTotal : Number(f.monto) || 0;
  const clienteSel = clientes.find((c) => c.id === f.cliente_id);

  function fmt(n: number) {
    return `${f.moneda} ${n.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
  }

  async function syncItems(id: string) {
    await supabase.from('cotizacion_items').delete().eq('cotizacion_id', id);
    if (usaPartidas) {
      const rows = items
        .filter((it) => it.descripcion.trim())
        .map((it, idx) => ({
          cotizacion_id: id,
          descripcion: it.descripcion.trim(),
          cantidad: Number(it.cantidad) || 0,
          precio_unitario: Number(it.precio_unitario) || 0,
          orden: idx,
        }));
      if (rows.length) await supabase.from('cotizacion_items').insert(rows);
    }
  }

  async function save() {
    if (!f.cliente_id) return Alert.alert('Falta cliente', 'Selecciona un cliente.');
    if (!f.titulo.trim() || !f.descripcion.trim())
      return Alert.alert('Faltan datos', 'Título y descripción son obligatorios.');

    const payload = {
      cliente_id: f.cliente_id,
      titulo: f.titulo,
      descripcion: f.descripcion,
      monto: montoFinal,
      moneda: f.moneda,
      terminos_pago: f.terminos_pago || null,
      tiempo_entrega: f.tiempo_entrega || null,
      detalles_tecnicos: f.detalles_tecnicos || null,
      fecha_cotizacion: f.fecha_cotizacion,
    };

    setLoading(true);
    if (cotizacionId) {
      const { error } = await supabase.from('cotizaciones').update(payload).eq('id', cotizacionId);
      if (!error) {
        await syncItems(cotizacionId);
        logActividad('editó', 'cotizacion', cotizacionId, `Cotización: ${f.titulo}`);
      }
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      onSaved(cotizacionId);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('cotizaciones')
        .insert({ ...payload, cotizado_por: u.user?.id, estado: 'pendiente' })
        .select('id')
        .single();
      if (!error && data) {
        const newId = (data as { id: string }).id;
        await syncItems(newId);
        logActividad('creó', 'cotizacion', newId, `Cotización: ${f.titulo}`);
      }
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      onSaved((data as { id: string }).id);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <SelectIcon
        label="Cliente *"
        icon="person-outline"
        iconTint={colors.primaryBright}
        iconBg="#EAF1FE"
        value={clienteSel?.empresa}
        placeholder="Seleccionar cliente..."
        onPress={() => setPickerOpen(true)}
      />

      <FieldIcon
        label="Título *"
        icon="document-text-outline"
        value={f.titulo}
        onChangeText={(v) => set('titulo', v)}
        placeholder="Ej. Servicio de automatización industrial"
      />

      <FieldIcon
        label="Descripción *"
        icon="create-outline"
        value={f.descripcion}
        onChangeText={(v) => set('descripcion', v)}
        placeholder="Describe los detalles de la cotización..."
        multiline
      />

      {/* Moneda */}
      <Text style={styles.label}>Moneda</Text>
      <View style={styles.monedaRow}>
        {MONEDAS.map((m) => {
          const active = f.moneda === m.v;
          return (
            <TouchableOpacity
              key={m.v}
              onPress={() => set('moneda', m.v)}
              style={[styles.monedaBtn, active && styles.monedaBtnActive]}
            >
              <Ionicons
                name={m.v === 'EUR' ? 'logo-euro' : 'cash-outline'}
                size={16}
                color={active ? colors.primaryBright : colors.textMuted}
              />
              <Text style={[styles.monedaText, active && { color: colors.primaryBright }]}>{m.v}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Partidas */}
      <View style={styles.partidasHead}>
        <Text style={styles.label}>Partidas</Text>
        <TouchableOpacity onPress={addItem} style={styles.addLink}>
          <Ionicons name="add-circle" size={20} color={colors.primaryBright} />
          <Text style={styles.addLinkText}>Agregar</Text>
        </TouchableOpacity>
      </View>

      {items.length === 0 ? (
        <FieldIcon
          label="Monto"
          icon="cash-outline"
          iconTint={colors.success}
          iconBg="#DCFCE7"
          value={formatMoney(f.monto)}
          onChangeText={(v) => set('monto', parseMoney(v))}
          keyboardType="decimal-pad"
          placeholder="Ingresa el monto total"
        />
      ) : (
        items.map((it, idx) => {
          const sub = (Number(it.cantidad) || 0) * (Number(it.precio_unitario) || 0);
          return (
            <View key={idx} style={styles.itemCard}>
              <View style={styles.itemTop}>
                <TextInput
                  placeholder="Descripción"
                  placeholderTextColor={colors.textFaint}
                  value={it.descripcion}
                  onChangeText={(v) => setItem(idx, 'descripcion', v)}
                  style={styles.itemDesc}
                />
                <TouchableOpacity onPress={() => removeItem(idx)} hitSlop={8}>
                  <Ionicons name="close-circle" size={22} color={colors.danger} />
                </TouchableOpacity>
              </View>
              <View style={styles.itemRow}>
                <View style={styles.itemMini}>
                  <Text style={styles.miniLabel}>Cant.</Text>
                  <TextInput value={it.cantidad} onChangeText={(v) => setItem(idx, 'cantidad', v)} keyboardType="decimal-pad" style={styles.miniInput} />
                </View>
                <View style={styles.itemMini}>
                  <Text style={styles.miniLabel}>Precio</Text>
                  <TextInput value={formatMoney(it.precio_unitario)} onChangeText={(v) => setItem(idx, 'precio_unitario', parseMoney(v))} keyboardType="decimal-pad" style={styles.miniInput} />
                </View>
                <View style={[styles.itemMini, { alignItems: 'flex-end' }]}>
                  <Text style={styles.miniLabel}>Subtotal</Text>
                  <Text style={styles.subtotal}>{fmt(sub)}</Text>
                </View>
              </View>
            </View>
          );
        })
      )}

      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Total</Text>
        <Text style={styles.totalValue}>{fmt(montoFinal)}</Text>
      </View>

      <SelectOrText
        label="Términos de pago"
        value={f.terminos_pago}
        onChange={(v) => set('terminos_pago', v)}
        options={TERMINOS}
        placeholder="Ej. 40% anticipo, 60% contra entrega"
      />
      <SelectOrText
        label="Tiempo de entrega"
        value={f.tiempo_entrega}
        onChange={(v) => set('tiempo_entrega', v)}
        options={TIEMPOS}
        placeholder="Ej. 4-6 semanas laborables"
      />
      <FieldIcon
        label="Detalles técnicos"
        icon="layers-outline"
        value={f.detalles_tecnicos}
        onChangeText={(v) => set('detalles_tecnicos', v)}
        placeholder="Especificaciones técnicas, materiales, observaciones..."
        multiline
      />

      <DateField label="Fecha cotización" value={f.fecha_cotizacion} onChange={(v) => set('fecha_cotizacion', v)} />

      <TouchableOpacity activeOpacity={0.9} onPress={save} disabled={loading} style={{ marginTop: 6 }}>
        <LinearGradient colors={gradients.blue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submit, { opacity: loading ? 0.7 : 1 }]}>
          <Ionicons name="document-text-outline" size={20} color="#fff" />
          <Text style={styles.submitText}>{loading ? 'Guardando…' : cotizacionId ? 'Guardar cambios' : 'Crear cotización'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark-outline" size={15} color={colors.textMuted} />
        <Text style={styles.footerText}>La información que ingreses está protegida</Text>
      </View>

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona cliente</Text>
          <TouchableOpacity onPress={() => setPickerOpen(false)}>
            <Text style={styles.modalClose}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={clientes}
          keyExtractor={(c) => c.id}
          ListEmptyComponent={<Text style={styles.empty}>No hay clientes. Crea uno primero.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.clienteItem}
              onPress={() => {
                set('cliente_id', item.id);
                setPickerOpen(false);
              }}
            >
              <Text style={styles.clienteEmpresa}>{item.empresa}</Text>
              <Text style={styles.clienteSub}>{item.correo_principal}</Text>
            </TouchableOpacity>
          )}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontSize: 14, fontFamily: font.bold, color: colors.text, marginBottom: 8 },
  monedaRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  monedaBtn: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: 'transparent',
    ...shadow.card,
  },
  monedaBtnActive: { backgroundColor: '#EAF1FE', borderColor: colors.primaryBright },
  monedaText: { fontFamily: font.bold, color: colors.textMuted, fontSize: 14 },
  partidasHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  addLink: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addLinkText: { color: colors.primaryBright, fontFamily: font.bold },
  itemCard: { backgroundColor: '#fff', borderRadius: radius.md, padding: 12, marginBottom: 10, ...shadow.card },
  itemTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemDesc: { flex: 1, fontSize: 15, fontFamily: font.semibold, color: colors.text },
  itemRow: { flexDirection: 'row', gap: 12, marginTop: 10 },
  itemMini: { flex: 1 },
  miniLabel: { fontSize: 11, fontFamily: font.medium, color: colors.textMuted, marginBottom: 4 },
  miniInput: { borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8, fontFamily: font.regular, color: colors.text },
  subtotal: { fontFamily: font.bold, color: colors.primaryBright, fontSize: 14, paddingVertical: 8 },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#EAF1FE', borderRadius: radius.lg, padding: 16, marginBottom: 16 },
  totalLabel: { fontFamily: font.bold, color: colors.text, fontSize: 16 },
  totalValue: { fontFamily: font.black, color: colors.primaryBright, fontSize: 20 },
  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: radius.lg, ...shadow.blue },
  submitText: { color: '#fff', fontFamily: font.bold, fontSize: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerText: { color: colors.textMuted, fontFamily: font.medium, fontSize: 13 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingTop: 56, backgroundColor: colors.primary },
  modalTitle: { color: '#fff', fontSize: 18, fontFamily: font.bold },
  modalClose: { color: '#fff', fontFamily: font.semibold },
  clienteItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  clienteEmpresa: { fontSize: 16, fontFamily: font.bold, color: colors.text },
  clienteSub: { color: colors.textMuted, marginTop: 2, fontFamily: font.regular },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
