import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Field } from './ui';
import DateField from './DateField';
import SegmentSelect from './SegmentSelect';
import { formatMoney, parseMoney } from '../lib/money';
import { supabase } from '../lib/supabase';
import { colors, estadoFacturaColor } from '../lib/theme';
import { Factura, Moneda } from '../lib/types';

const MONEDAS: Moneda[] = ['MXN', 'USD', 'EUR'];

const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'pagada', label: 'Pagada' },
  { value: 'vencida', label: 'Vencida' },
  { value: 'cancelada', label: 'Cancelada' },
];

export default function FacturaForm({
  initial,
  facturaId,
  onSaved,
}: {
  initial: Factura;
  facturaId: string;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    monto: String(initial.monto ?? ''),
    moneda: initial.moneda as Moneda,
    terminos_pago: initial.terminos_pago ?? '',
    fecha_emision: initial.fecha_emision ?? '',
    fecha_vencimiento: initial.fecha_vencimiento ?? '',
    fecha_pago: initial.fecha_pago ?? '',
    estado: initial.estado as string,
  });

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setLoading(true);
    const { error } = await supabase
      .from('facturas')
      .update({
        monto: Number(f.monto) || 0,
        moneda: f.moneda,
        terminos_pago: f.terminos_pago || null,
        fecha_emision: f.fecha_emision || null,
        fecha_vencimiento: f.fecha_vencimiento || null,
        fecha_pago: f.fecha_pago || null,
        estado: f.estado,
      })
      .eq('id', facturaId);
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    onSaved();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Field label="Monto" value={formatMoney(f.monto)} onChangeText={(v) => set('monto', parseMoney(v))} keyboardType="decimal-pad" />
      <SegmentSelect
        label="Moneda"
        options={MONEDAS.map((m) => ({ value: m, label: m }))}
        value={f.moneda}
        onChange={(v) => set('moneda', v as Moneda)}
      />
      <Field label="Términos de pago" value={f.terminos_pago} onChangeText={(v) => set('terminos_pago', v)} />
      <DateField label="Fecha emisión" value={f.fecha_emision} onChange={(v) => set('fecha_emision', v)} />
      <DateField label="Fecha vencimiento" value={f.fecha_vencimiento} onChange={(v) => set('fecha_vencimiento', v)} clearable />
      <DateField label="Fecha pago" value={f.fecha_pago} onChange={(v) => set('fecha_pago', v)} clearable />
      <SegmentSelect
        label="Estado"
        options={ESTADOS}
        value={f.estado}
        onChange={(v) => set('estado', v)}
        colorMap={estadoFacturaColor}
      />
      <Button title="Guardar cambios" onPress={save} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
