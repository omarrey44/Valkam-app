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
import GradientHeader from '../../components/GradientHeader';
import POForm from '../../components/POForm';
import { supabase } from '../../lib/supabase';
import { colors, gradients } from '../../lib/theme';
import { OrdenCompra, Proyecto } from '../../lib/types';

export default function PODetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [po, setPO] = useState<OrdenCompra | null>(null);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('ordenes_compra')
      .select('*, clientes(empresa), cotizaciones(titulo)')
      .eq('id', id)
      .single();
    setPO((data as OrdenCompra) ?? null);
    const { data: proy } = await supabase
      .from('proyectos')
      .select('*')
      .eq('po_id', id)
      .maybeSingle();
    setProyecto((proy as Proyecto) ?? null);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function generarProyecto() {
    if (!po) return;
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from('proyectos')
      .insert({
        po_id: po.id,
        cotizacion_id: po.cotizacion_id,
        cliente_id: po.cliente_id,
        nombre_proyecto: po.cotizaciones?.titulo ?? 'Proyecto',
        estado: 'programado',
        responsable: u.user?.id,
      })
      .select('id')
      .single();
    if (!error) await supabase.from('ordenes_compra').update({ estado: 'en_proceso' }).eq('id', po.id);
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    router.push(`/proyecto/${(data as { id: string }).id}`);
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!po) return <View style={styles.center} />;

  if (editing)
    return (
      <>
        <Stack.Screen options={{ title: `Editar ${po.numero_po}` }} />
        <POForm
          initial={po}
          poId={id}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      </>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen options={{ title: po.numero_po ?? 'PO' }} />

      <GradientHeader
        colors={gradients.blue}
        icon="receipt-outline"
        eyebrow={po.clientes?.empresa ?? undefined}
        title={po.numero_po ?? 'PO'}
        subtitle={`${po.moneda} ${po.monto_po.toLocaleString('es-MX', { minimumFractionDigits: 2 })} · ${po.cotizaciones?.titulo ?? ''}`}
        badge={{ label: po.estado }}
      />

      <Card>
        <Campo label="Fecha recepción" value={po.fecha_recepcion} />
        {!!po.fecha_entrega_esperada && <Campo label="Entrega esperada" value={po.fecha_entrega_esperada} />}
        {!!po.terminos_pago && <Campo label="Términos de pago" value={po.terminos_pago} />}
        {!!po.archivo_adjunto && <Campo label="Archivo" value={po.archivo_adjunto} />}
      </Card>

      <View style={{ gap: 10 }}>
        {proyecto ? (
          <Button title="Ver proyecto →" onPress={() => router.push(`/proyecto/${proyecto.id}`)} />
        ) : (
          <Button title="⚙ Generar proyecto" onPress={generarProyecto} loading={busy} />
        )}
        <Button title="Editar PO" variant="secondary" onPress={() => setEditing(true)} />
      </View>
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
  numero: { fontSize: 22, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 6, fontSize: 15 },
  monto: { fontSize: 22, fontWeight: '900', color: colors.primary, marginTop: 8 },
  campoLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  campoValue: { fontSize: 15, color: colors.text, marginTop: 2 },
});
