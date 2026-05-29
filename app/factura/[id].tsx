import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Card } from '../../components/ui';
import FacturaForm from '../../components/FacturaForm';
import GradientHeader from '../../components/GradientHeader';
import { useAuth } from '../../lib/auth';
import { buildFacturaHtml, compartirFacturaPdf } from '../../lib/facturaPdf';
import { supabase } from '../../lib/supabase';
import { colors, gradients } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { Factura } from '../../lib/types';

export default function FacturaDetalle() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuth();
  const [f, setF] = useState<Factura | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);

  const puedeEditar = profile?.rol === 'administrador' || profile?.rol === 'aprobador';

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('facturas')
      .select('*, proyectos(nombre_proyecto, clientes(empresa))')
      .eq('id', id)
      .single();
    setF((data as Factura) ?? null);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function marcarPagada() {
    setBusy(true);
    const { error } = await supabase
      .from('facturas')
      .update({ estado: 'pagada', fecha_pago: new Date().toISOString().slice(0, 10) })
      .eq('id', id);
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    load();
  }

  async function exportarPdf() {
    if (!f) return;
    setPdfBusy(true);
    try {
      const empresa = f.proyectos?.clientes?.empresa ?? '—';
      const proyecto = f.proyectos?.nombre_proyecto ?? '—';
      const html = buildFacturaHtml(f, empresa, proyecto);
      await compartirFacturaPdf(html);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo generar el PDF.');
    } finally {
      setPdfBusy(false);
    }
  }

  function confirmarEliminar() {
    Alert.alert('Eliminar factura', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('facturas').delete().eq('id', id);
          if (error) return Alert.alert('Error', error.message);
          router.back();
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
  if (!f) return <View style={styles.center} />;

  if (editing)
    return (
      <>
        <Stack.Screen options={{ title: `Editar ${f.numero_factura}` }} />
        <FacturaForm
          initial={f}
          facturaId={id}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      </>
    );

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Stack.Screen
        options={{
          title: f.numero_factura ?? 'Factura',
          headerRight: () =>
            puedeEditar ? (
              <TouchableOpacity onPress={confirmarEliminar}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
            ) : null,
        }}
      />

      <GradientHeader
        colors={gradients.green}
        icon="cash-outline"
        eyebrow={f.proyectos?.clientes?.empresa ?? undefined}
        title={f.numero_factura ?? 'Factura'}
        subtitle={`${f.moneda} ${f.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })} · ${f.proyectos?.nombre_proyecto ?? ''}`}
        badge={{ label: f.estado }}
      />

      <Card>
        <Campo label="Emisión" value={f.fecha_emision} />
        {!!f.fecha_vencimiento && <Campo label="Vencimiento" value={f.fecha_vencimiento} />}
        {!!f.fecha_pago && <Campo label="Pago" value={f.fecha_pago} />}
        {!!f.terminos_pago && <Campo label="Términos de pago" value={f.terminos_pago} />}
      </Card>

      <View style={{ gap: 10 }}>
        <Button title={pdfBusy ? 'Generando PDF…' : 'Compartir PDF'} variant="secondary" onPress={exportarPdf} loading={pdfBusy} />
        {puedeEditar && (
          <>
            {f.estado !== 'pagada' && (
              <Button title="✔ Marcar como pagada" onPress={marcarPagada} loading={busy} />
            )}
            <Button title="Editar factura" variant="secondary" onPress={() => setEditing(true)} />
          </>
        )}
        {!puedeEditar && (
          <Text style={styles.nota}>Solo administrador/aprobador puede editar facturas.</Text>
        )}
      </View>
    </ScrollView>
  );
}

function Campo({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: 10 }}>
      <Text style={styles.campoLabel}>{label}</Text>
      <Text style={[styles.campoValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  numero: { fontSize: 22, fontWeight: '900', color: colors.text },
  sub: { color: colors.textMuted, marginTop: 6, fontSize: 15 },
  monto: { fontSize: 24, fontWeight: '900', color: colors.primary, marginTop: 8 },
  campoLabel: { fontSize: 12, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase' },
  campoValue: { fontSize: 15, color: colors.text, marginTop: 2 },
  nota: { color: colors.textMuted, fontStyle: 'italic', textAlign: 'center' },
});
