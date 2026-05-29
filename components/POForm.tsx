import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Field } from './ui';
import DateField from './DateField';
import SegmentSelect from './SegmentSelect';
import SelectOrText from './SelectOrText';
import { logActividad } from '../lib/actividad';
import { formatMoney, parseMoney } from '../lib/money';
import { supabase } from '../lib/supabase';
import { colors, estadoPOColor } from '../lib/theme';
import { useTheme } from '../lib/themeContext';
import { Cotizacion, Moneda, OrdenCompra } from '../lib/types';

const TERMINOS = ['100% anticipo', '50% anticipo / 50% entrega', '30% anticipo / 70% entrega', 'Neto 30', 'Neto 60', 'Contra entrega'];

const MONEDAS: Moneda[] = ['MXN', 'USD', 'EUR'];

interface POInput {
  cotizacion_id: string;
  cliente_id: string | null;
  monto_po: string;
  moneda: Moneda;
  fecha_recepcion: string;
  terminos_pago: string;
  fecha_entrega_esperada: string;
  estado: OrdenCompra['estado'];
  archivo_adjunto: string;
}

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function POForm({
  initial,
  poId,
  onSaved,
}: {
  initial?: Partial<OrdenCompra>;
  poId?: string;
  onSaved: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const [f, setF] = useState<POInput>({
    cotizacion_id: initial?.cotizacion_id ?? '',
    cliente_id: initial?.cliente_id ?? null,
    monto_po: initial?.monto_po != null ? String(initial.monto_po) : '',
    moneda: (initial?.moneda as Moneda) ?? 'MXN',
    fecha_recepcion: initial?.fecha_recepcion ?? hoy(),
    terminos_pago: initial?.terminos_pago ?? '',
    fecha_entrega_esperada: initial?.fecha_entrega_esperada ?? '',
    estado: initial?.estado ?? 'recibida',
    archivo_adjunto: initial?.archivo_adjunto ?? '',
  });

  useEffect(() => {
    // Para crear PO: cotizaciones aprobadas (las demás también visibles por si acaso)
    supabase
      .from('cotizaciones')
      .select('*, clientes(empresa, correo_principal)')
      .order('creado_en', { ascending: false })
      .then(({ data }) => setCotizaciones((data as Cotizacion[]) ?? []));
  }, []);

  function set<K extends keyof POInput>(k: K, v: POInput[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  const cotizSel = cotizaciones.find((c) => c.id === f.cotizacion_id);

  function pickCotiz(c: Cotizacion) {
    setF((prev) => ({
      ...prev,
      cotizacion_id: c.id,
      cliente_id: c.cliente_id,
      monto_po: prev.monto_po || String(c.monto),
      moneda: c.moneda,
      terminos_pago: prev.terminos_pago || (c.terminos_pago ?? ''),
    }));
    setPickerOpen(false);
  }

  async function save() {
    if (!f.cotizacion_id) return Alert.alert('Falta cotización', 'Selecciona la cotización origen.');

    const payload = {
      cotizacion_id: f.cotizacion_id,
      cliente_id: f.cliente_id,
      monto_po: Number(f.monto_po) || 0,
      moneda: f.moneda,
      fecha_recepcion: f.fecha_recepcion,
      terminos_pago: f.terminos_pago || null,
      fecha_entrega_esperada: f.fecha_entrega_esperada || null,
      estado: f.estado,
      archivo_adjunto: f.archivo_adjunto || null,
    };

    setLoading(true);
    if (poId) {
      const { error } = await supabase.from('ordenes_compra').update(payload).eq('id', poId);
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      logActividad('editó', 'po', poId, `PO orden de compra`);
      onSaved(poId);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('ordenes_compra')
        .insert({ ...payload, generada_por: u.user?.id })
        .select('id')
        .single();
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      const newId = (data as { id: string }).id;
      logActividad('creó', 'po', newId, `PO orden de compra`);
      onSaved(newId);
    }
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Text style={styles.label}>Cotización origen *</Text>
      <TouchableOpacity
        style={[styles.picker, !!poId && { opacity: 0.5 }]}
        onPress={() => !poId && setPickerOpen(true)}
        disabled={!!poId}
      >
        <Text style={{ color: cotizSel ? colors.text : colors.textMuted, fontSize: 16 }}>
          {cotizSel
            ? `${cotizSel.titulo} — ${cotizSel.clientes?.empresa ?? ''}`
            : 'Seleccionar cotización...'}
        </Text>
      </TouchableOpacity>

      <Field label="Monto PO" value={formatMoney(f.monto_po)} onChangeText={(v) => set('monto_po', parseMoney(v))} keyboardType="decimal-pad" />

      <SegmentSelect
        label="Moneda"
        options={MONEDAS.map((m) => ({ value: m, label: m }))}
        value={f.moneda}
        onChange={(v) => set('moneda', v as Moneda)}
      />

      <DateField label="Fecha recepción" value={f.fecha_recepcion} onChange={(v) => set('fecha_recepcion', v)} />
      <DateField label="Fecha entrega esperada" value={f.fecha_entrega_esperada} onChange={(v) => set('fecha_entrega_esperada', v)} clearable />
      <SelectOrText label="Términos de pago" value={f.terminos_pago} onChange={(v) => set('terminos_pago', v)} options={TERMINOS} />
      <Field label="Archivo adjunto (URL PDF)" value={f.archivo_adjunto} onChangeText={(v) => set('archivo_adjunto', v)} autoCapitalize="none" />

      <SegmentSelect
        label="Estado"
        options={[
          { value: 'recibida', label: 'Recibida' },
          { value: 'en_proceso', label: 'En proceso' },
          { value: 'completada', label: 'Completada' },
          { value: 'cancelada', label: 'Cancelada' },
        ]}
        value={f.estado}
        onChange={(v) => set('estado', v as OrdenCompra['estado'])}
        colorMap={estadoPOColor}
      />

      <Button title={poId ? 'Guardar cambios' : 'Crear PO'} onPress={save} loading={loading} />

      <Modal visible={pickerOpen} animationType="slide" onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Selecciona cotización</Text>
          <TouchableOpacity onPress={() => setPickerOpen(false)}>
            <Text style={styles.modalClose}>Cerrar</Text>
          </TouchableOpacity>
        </View>
        <FlatList
          data={cotizaciones}
          keyExtractor={(c) => c.id}
          ListEmptyComponent={<Text style={styles.empty}>No hay cotizaciones.</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.cItem} onPress={() => pickCotiz(item)}>
              <Text style={styles.cTitulo}>{item.titulo}</Text>
              <Text style={styles.cSub}>
                {item.clientes?.empresa ?? '—'} · {item.moneda} {item.monto.toLocaleString('es-MX')} · {item.estado}
              </Text>
            </TouchableOpacity>
          )}
        />
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  label: { fontSize: 13, fontWeight: '600', color: colors.textMuted, marginBottom: 6 },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    padding: 14,
    marginBottom: 14,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    backgroundColor: colors.primary,
  },
  modalTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  modalClose: { color: '#fff', fontWeight: '600' },
  cItem: { padding: 16, borderBottomWidth: 1, borderBottomColor: colors.border },
  cTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  cSub: { color: colors.textMuted, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, marginTop: 40 },
});
