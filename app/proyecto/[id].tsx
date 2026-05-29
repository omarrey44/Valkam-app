import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Badge, Button, Card } from '../../components/ui';
import GradientHeader from '../../components/GradientHeader';
import ProyectoForm from '../../components/ProyectoForm';
import TareaModal from '../../components/TareaModal';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, estadoTareaColor, gradients, prioridadColor } from '../../lib/theme';
import { Factura, Proyecto, Tarea } from '../../lib/types';

export default function ProyectoDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [p, setP] = useState<Proyecto | null>(null);
  const [responsable, setResponsable] = useState<string>('—');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [factura, setFactura] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [tareaSel, setTareaSel] = useState<Tarea | null>(null);
  const [notas, setNotas] = useState<{ id: string; contenido: string; creado_en: string; profiles: { nombre: string | null } | null }[]>([]);
  const [nuevaNota, setNuevaNota] = useState('');
  const [loadingNota, setLoadingNota] = useState(false);

  const puedeFacturar = profile?.rol === 'administrador' || profile?.rol === 'aprobador';

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('proyectos')
      .select('*, clientes(empresa), ordenes_compra(numero_po)')
      .eq('id', id)
      .single();
    const proy = (data as Proyecto) ?? null;
    setP(proy);
    if (proy?.responsable) {
      const { data: prof } = await supabase
        .from('profiles')
        .select('nombre, email')
        .eq('id', proy.responsable)
        .maybeSingle();
      setResponsable((prof as { nombre?: string; email?: string })?.nombre ?? (prof as { email?: string })?.email ?? '—');
    } else setResponsable('Sin asignar');
    const { data: t } = await supabase
      .from('tareas')
      .select('*')
      .eq('proyecto_id', id)
      .order('creado_en', { ascending: true });
    setTareas((t as Tarea[]) ?? []);
    const { data: fac } = await supabase
      .from('facturas')
      .select('*')
      .eq('proyecto_id', id)
      .maybeSingle();
    setFactura((fac as Factura) ?? null);
    const { data: nts } = await supabase
      .from('proyecto_notas')
      .select('id, contenido, creado_en, profiles(nombre)')
      .eq('proyecto_id', id)
      .order('creado_en', { ascending: true });
    setNotas((nts as typeof notas) ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function setEstado(estado: Proyecto['estado']) {
    setBusy(true);
    const patch: Record<string, unknown> = { estado };
    if (estado === 'completado') patch.fecha_fin_real = new Date().toISOString().slice(0, 10);
    const { error } = await supabase.from('proyectos').update(patch).eq('id', id);
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    load();
  }

  async function toggleTarea(t: Tarea) {
    const completada = t.estado !== 'completada';
    const { error } = await supabase
      .from('tareas')
      .update({
        estado: completada ? 'completada' : 'pendiente',
        fecha_completada: completada ? new Date().toISOString().slice(0, 10) : null,
      })
      .eq('id', t.id);
    if (error) return Alert.alert('Error', error.message);
    load();
  }

  async function generarFactura() {
    if (!p) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    let monto = 0;
    let moneda = 'MXN';
    let terminos: string | null = null;
    if (p.po_id) {
      const { data: po } = await supabase
        .from('ordenes_compra')
        .select('monto_po, moneda')
        .eq('id', p.po_id)
        .maybeSingle();
      if (po) {
        monto = Number((po as { monto_po: number }).monto_po);
        moneda = (po as { moneda: string }).moneda;
      }
    }
    if (p.cotizacion_id) {
      const { data: c } = await supabase
        .from('cotizaciones')
        .select('terminos_pago, monto, moneda')
        .eq('id', p.cotizacion_id)
        .maybeSingle();
      if (c) {
        terminos = (c as { terminos_pago: string | null }).terminos_pago;
        if (!monto) {
          monto = Number((c as { monto: number }).monto);
          moneda = (c as { moneda: string }).moneda;
        }
      }
    }
    const venc = new Date();
    venc.setDate(venc.getDate() + 30);
    const { data, error } = await supabase
      .from('facturas')
      .insert({
        proyecto_id: p.id,
        po_id: p.po_id,
        cotizacion_id: p.cotizacion_id,
        monto,
        moneda,
        terminos_pago: terminos,
        fecha_emision: new Date().toISOString().slice(0, 10),
        fecha_vencimiento: venc.toISOString().slice(0, 10),
        creado_por: u.user?.id,
        estado: 'pendiente',
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    router.push(`/factura/${(data as { id: string }).id}`);
  }

  async function agregarNota() {
    if (!nuevaNota.trim()) return;
    setLoadingNota(true);
    const { data: u } = await supabase.auth.getUser();
    await supabase.from('proyecto_notas').insert({
      proyecto_id: id,
      usuario_id: u.user?.id,
      contenido: nuevaNota.trim(),
    });
    setNuevaNota('');
    setLoadingNota(false);
    load();
  }

  function openNueva() {
    setTareaSel(null);
    setModalOpen(true);
  }
  function openEditar(t: Tarea) {
    setTareaSel(t);
    setModalOpen(true);
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!p) return <View style={styles.center} />;

  if (editing)
    return (
      <>
        <Stack.Screen options={{ title: 'Editar proyecto' }} />
        <ProyectoForm
          initial={p}
          proyectoId={id}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      </>
    );

  const completadas = tareas.filter((t) => t.estado === 'completada').length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <Stack.Screen options={{ title: p.nombre_proyecto ?? 'Proyecto' }} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 96 }}>
        <GradientHeader
          colors={gradients.slate}
          icon="construct-outline"
          eyebrow={p.clientes?.empresa ?? undefined}
          title={p.nombre_proyecto ?? 'Proyecto'}
          subtitle={`PO: ${p.ordenes_compra?.numero_po ?? '—'} · ${responsable}`}
          badge={{ label: p.estado }}
        />

        <Card>
          {!!p.descripcion && <Campo label="Descripción" value={p.descripcion} />}
          {!!p.fecha_inicio && <Campo label="Inicio" value={p.fecha_inicio} />}
          {!!p.fecha_fin_estimada && <Campo label="Fin estimada" value={p.fecha_fin_estimada} />}
          {!!p.fecha_fin_real && <Campo label="Fin real" value={p.fecha_fin_real} />}
        </Card>

        <View style={{ gap: 10, marginBottom: 16 }}>
          <Button title="Editar proyecto" variant="secondary" onPress={() => setEditing(true)} />
          <Button title="🛡 Validación de calidad" variant="secondary" onPress={() => router.push(`/validacion/${id}`)} />
          {p.estado !== 'completado' && (
            <Button title="🚚 Registrar entrega" onPress={() => router.push(`/entrega/${id}`)} />
          )}
          {p.estado === 'completado' &&
            (factura ? (
              <Button title="🧾 Ver factura →" onPress={() => router.push(`/factura/${factura.id}`)} />
            ) : puedeFacturar ? (
              <Button title="🧾 Generar factura" onPress={generarFactura} loading={busy} />
            ) : null)}
        </View>

        <View style={styles.rowTop}>
          <Text style={styles.histTitle}>Tareas</Text>
          <Text style={styles.progress}>
            {completadas}/{tareas.length}
          </Text>
        </View>

        {tareas.length === 0 ? (
          <Text style={styles.empty}>Sin tareas. Agrega con +</Text>
        ) : (
          tareas.map((t) => (
            <Card key={t.id} onPress={() => openEditar(t)}>
              <View style={styles.tareaRow}>
                <TouchableOpacity onPress={() => toggleTarea(t)} hitSlop={8}>
                  <Ionicons
                    name={t.estado === 'completada' ? 'checkbox' : 'square-outline'}
                    size={24}
                    color={t.estado === 'completada' ? colors.success : colors.textMuted}
                  />
                </TouchableOpacity>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text
                    style={[
                      styles.tareaTitulo,
                      t.estado === 'completada' && { textDecorationLine: 'line-through', color: colors.textMuted },
                    ]}
                  >
                    {t.titulo}
                  </Text>
                  <View style={styles.badgeRow}>
                    <Badge label={t.prioridad} color={prioridadColor[t.prioridad]} />
                    <Badge label={t.estado} color={estadoTareaColor[t.estado]} />
                    {!!t.fecha_vencimiento && <Text style={styles.vence}>Vence {t.fecha_vencimiento}</Text>}
                  </View>
                </View>
              </View>
            </Card>
          ))
        )}
        {/* Notas internas */}
        <Text style={styles.histTitle}>Notas del equipo</Text>
        {notas.map((n) => (
          <View key={n.id} style={styles.notaCard}>
            <Text style={styles.notaAutor}>{n.profiles?.nombre ?? 'Usuario'} · {n.creado_en.slice(0, 10)}</Text>
            <Text style={styles.notaTexto}>{n.contenido}</Text>
          </View>
        ))}
        <View style={styles.notaInputRow}>
          <TextInput
            style={styles.notaInput}
            value={nuevaNota}
            onChangeText={setNuevaNota}
            placeholder="Escribe una nota..."
            placeholderTextColor={colors.textFaint}
            multiline
          />
          <TouchableOpacity style={styles.notaBtn} onPress={agregarNota} disabled={loadingNota || !nuevaNota.trim()}>
            {loadingNota ? <ActivityIndicator color="#fff" size="small" /> : <Ionicons name="send" size={18} color="#fff" />}
          </TouchableOpacity>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={openNueva}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>

      <TareaModal
        visible={modalOpen}
        proyectoId={id}
        tarea={tareaSel}
        onClose={() => setModalOpen(false)}
        onSaved={() => {
          setModalOpen(false);
          load();
        }}
      />
    </View>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={styles.campoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  sub: { color: colors.textMuted, marginTop: 4, fontSize: 15 },
  campoLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  campoValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  histTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginVertical: 8 },
  progress: { fontSize: 16, fontWeight: '800', color: colors.primary },
  tareaRow: { flexDirection: 'row', alignItems: 'flex-start' },
  tareaTitulo: { fontSize: 16, fontWeight: '700', color: colors.text },
  badgeRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6, flexWrap: 'wrap' },
  vence: { color: colors.textMuted, fontSize: 12 },
  empty: { color: colors.textMuted, marginTop: 8 },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  notaCard: { backgroundColor: colors.card, borderRadius: radius.md, padding: 12, marginBottom: 8 },
  notaAutor: { fontSize: 11, fontFamily: font.semibold, color: colors.textMuted, marginBottom: 4 },
  notaTexto: { fontSize: 14, fontFamily: font.regular, color: colors.text },
  notaInputRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 16 },
  notaInput: {
    flex: 1, backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: 14, paddingVertical: 10, fontFamily: font.regular,
    color: colors.text, fontSize: 14, minHeight: 44, maxHeight: 100,
  },
  notaBtn: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: colors.primaryBright, alignItems: 'center', justifyContent: 'center',
  },
});
