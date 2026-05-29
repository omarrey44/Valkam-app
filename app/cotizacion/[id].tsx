import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Button, Card } from '../../components/ui';
import CotizacionForm from '../../components/CotizacionForm';
import GradientHeader from '../../components/GradientHeader';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, font, gradients } from '../../lib/theme';
import { buildCotizacionHtml, compartirCotizacionPdf } from '../../lib/cotizacionPdf';
import { Cotizacion, CotizacionItem, CotizacionRevision } from '../../lib/types';

function nextRev(r: string) {
  return String.fromCharCode(r.charCodeAt(0) + 1);
}

export default function CotizacionDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [c, setC] = useState<Cotizacion | null>(null);
  const [items, setItems] = useState<CotizacionItem[]>([]);
  const [revs, setRevs] = useState<CotizacionRevision[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const puedeAprobar = profile?.rol === 'administrador' || profile?.rol === 'aprobador';

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('cotizaciones')
      .select('*, clientes(empresa, correo_principal)')
      .eq('id', id)
      .single();
    setC((data as Cotizacion) ?? null);
    const { data: its } = await supabase
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_id', id)
      .order('orden');
    setItems((its as CotizacionItem[]) ?? []);
    const { data: r } = await supabase
      .from('cotizaciones_revisions')
      .select('*')
      .eq('cotizacion_id', id)
      .order('creado_en', { ascending: false });
    setRevs((r as CotizacionRevision[]) ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function setEstado(estado: Cotizacion['estado'], extra: Partial<Cotizacion> = {}) {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const patch: Record<string, unknown> = { estado, ...extra };
    if (estado === 'enviada') patch.fecha_envio = new Date().toISOString().slice(0, 10);
    if (estado === 'aprobada') {
      patch.autorizacion = true;
      patch.aprobado_por = u.user?.id;
      patch.fecha_aprobacion = new Date().toISOString().slice(0, 10);
    }
    const { error } = await supabase.from('cotizaciones').update(patch).eq('id', id);
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    load();
  }

  // Al editar: guardar revisión (snapshot del estado previo) y subir letra
  async function onEdited() {
    if (c) {
      const { data: u } = await supabase.auth.getUser();
      const nueva = nextRev(c.revision_current);
      await supabase.from('cotizaciones_revisions').insert({
        cotizacion_id: id,
        revision: c.revision_current,
        cambio_descrito: `Modificada (Rev. ${c.revision_current} → ${nueva})`,
        creado_por: u.user?.id,
        snapshot_data: c as unknown as Record<string, unknown>,
      });
      await supabase
        .from('cotizaciones')
        .update({ revision_current: nueva, estado: 'modificada' })
        .eq('id', id);
    }
    setEditing(false);
    load();
  }

  async function duplicar() {
    if (!c) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('cotizaciones')
      .insert({
        cliente_id: c.cliente_id,
        titulo: `${c.titulo} (copia)`,
        descripcion: c.descripcion,
        monto: c.monto,
        moneda: c.moneda,
        terminos_pago: c.terminos_pago,
        tiempo_entrega: c.tiempo_entrega,
        detalles_tecnicos: c.detalles_tecnicos,
        precio_unitario: c.precio_unitario,
        cantidad: c.cantidad,
        estado: 'pendiente',
        revision_current: 'A',
        cotizado_por: u.user?.id,
        fecha_cotizacion: new Date().toISOString().slice(0, 10),
      })
      .select('id')
      .single();
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    router.replace(`/cotizacion/${(data as { id: string }).id}`);
  }

  async function compartirPdf() {
    if (!c) return;
    setBusy(true);
    try {
      const html = buildCotizacionHtml(c, items, c.clientes?.empresa ?? '');
      await compartirCotizacionPdf(html);
    } catch (e) {
      Alert.alert('Error', String(e instanceof Error ? e.message : e));
    }
    setBusy(false);
  }

  function enviarCorreo() {
    if (!c) return;
    const destino = c.clientes?.correo_principal;
    Alert.alert('Enviar cotización', `Se enviará por correo a ${destino}. ¿Continuar?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Enviar',
        onPress: async () => {
          setBusy(true);
          const { error } = await supabase.functions.invoke('enviar-cotizacion', {
            body: { cotizacion_id: id },
          });
          if (!error && (c.estado === 'pendiente' || c.estado === 'borrador')) {
            await supabase
              .from('cotizaciones')
              .update({ estado: 'enviada', fecha_envio: new Date().toISOString().slice(0, 10) })
              .eq('id', id);
          }
          setBusy(false);
          if (error)
            return Alert.alert(
              'No se pudo enviar',
              `${error.message}\n\nVerifica que la Edge Function "enviar-cotizacion" esté desplegada (ver supabase/functions).`
            );
          Alert.alert('Enviada', `Cotización enviada a ${destino}.`);
          load();
        },
      },
    ]);
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!c) return <View style={styles.center} />;

  if (editing)
    return (
      <>
        <Stack.Screen options={{ title: `Editar · Rev. ${c.revision_current}` }} />
        <CotizacionForm initial={c} cotizacionId={id} onSaved={onEdited} />
      </>
    );

  const monto = `${c.moneda} ${c.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: `Rev. ${c.revision_current}` }} />

      <GradientHeader
        colors={gradients.blue}
        icon="document-text-outline"
        eyebrow={c.clientes?.empresa ?? undefined}
        title={c.titulo}
        subtitle={`${monto} · Rev. ${c.revision_current}`}
        badge={{ label: c.estado }}
      />

      {items.length > 0 && (
        <Card>
          <Text style={styles.partidasTitle}>Partidas</Text>
          {items.map((it) => (
            <View key={it.id} style={styles.itemRow}>
              <Text style={styles.itemDesc} numberOfLines={2}>
                {it.descripcion}
              </Text>
              <Text style={styles.itemQty}>
                {it.cantidad} × {it.precio_unitario.toLocaleString('es-MX')}
              </Text>
              <Text style={styles.itemSub}>
                {(Number(it.cantidad) * Number(it.precio_unitario)).toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
          ))}
        </Card>
      )}

      <Card>
        <Campo label="Descripción" value={c.descripcion} />
        {!!c.detalles_tecnicos && <Campo label="Detalles técnicos" value={c.detalles_tecnicos} />}
        {!!c.precio_unitario && <Campo label="Precio unitario" value={String(c.precio_unitario)} />}
        {!!c.cantidad && <Campo label="Cantidad" value={String(c.cantidad)} />}
        {!!c.terminos_pago && <Campo label="Términos de pago" value={c.terminos_pago} />}
        {!!c.tiempo_entrega && <Campo label="Tiempo de entrega" value={c.tiempo_entrega} />}
        <Campo label="Fecha cotización" value={c.fecha_cotizacion} />
        {!!c.fecha_envio && <Campo label="Fecha envío" value={c.fecha_envio} />}
        {!!c.fecha_aprobacion && <Campo label="Fecha aprobación" value={c.fecha_aprobacion} />}
      </Card>

      <View style={{ gap: 10, marginBottom: 12 }}>
        <Button title="✉  Enviar por correo" onPress={enviarCorreo} loading={busy} />
        <Button title="📄 Compartir PDF" variant="secondary" onPress={compartirPdf} loading={busy} />
        <Button title="Editar (nueva revisión)" variant="secondary" onPress={() => setEditing(true)} />
        <Button title="⧉ Duplicar cotización" variant="secondary" onPress={duplicar} loading={busy} />
        {c.estado !== 'enviada' && c.estado !== 'aprobada' && (
          <Button title="Marcar como enviada" variant="secondary" onPress={() => setEstado('enviada')} loading={busy} />
        )}
        {puedeAprobar && c.estado !== 'aprobada' && (
          <Button title="✔ Aprobar / autorizar" onPress={() => setEstado('aprobada')} loading={busy} />
        )}
        {puedeAprobar && c.estado !== 'rechazada' && (
          <Button title="Rechazar" variant="danger" onPress={() => setEstado('rechazada')} loading={busy} />
        )}
      </View>

      <Text style={styles.histTitle}>Historial de revisiones</Text>
      {revs.length === 0 ? (
        <Text style={styles.empty}>Sin revisiones previas.</Text>
      ) : (
        revs.map((r) => (
          <Card key={r.id}>
            <View style={styles.rowTop}>
              <Text style={styles.revLetra}>Rev. {r.revision}</Text>
              <Text style={styles.revFecha}>{r.creado_en.slice(0, 10)}</Text>
            </View>
            {!!r.cambio_descrito && <Text style={styles.revDesc}>{r.cambio_descrito}</Text>}
          </Card>
        ))
      )}
    </ScrollView>
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
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titulo: { fontSize: 20, fontWeight: '800', color: colors.text, flex: 1, marginRight: 8 },
  empresa: { color: colors.textMuted, marginTop: 6, fontSize: 15 },
  monto: { fontSize: 24, fontWeight: '900', color: colors.primary, marginTop: 8 },
  partidasTitle: { fontSize: 13, fontFamily: font.bold, color: colors.textMuted, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.3 },
  itemRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8, borderTopWidth: 1, borderTopColor: colors.border },
  itemDesc: { flex: 1, color: colors.text, fontSize: 14, marginRight: 8, fontFamily: font.medium },
  itemQty: { color: colors.textMuted, fontSize: 12, marginRight: 10, fontFamily: font.regular },
  itemSub: { color: colors.primaryBright, fontFamily: font.bold, fontSize: 14, minWidth: 70, textAlign: 'right' },
  campoLabel: { fontSize: 12, fontFamily: font.bold, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.3 },
  campoValue: { fontSize: 15, color: colors.text, marginTop: 2, fontFamily: font.medium },
  histTitle: { fontSize: 17, fontFamily: font.bold, color: colors.text, marginBottom: 10, marginTop: 4 },
  revLetra: { fontFamily: font.bold, color: colors.primaryBright },
  revFecha: { color: colors.textMuted, fontFamily: font.regular },
  revDesc: { color: colors.text, marginTop: 4, fontFamily: font.regular },
  empty: { color: colors.textMuted, fontFamily: font.regular },
});
