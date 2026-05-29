import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Field } from './ui';
import SelectOrText from './SelectOrText';
import { logActividad } from '../lib/actividad';
import { formatMoney, parseMoney } from '../lib/money';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { InventarioItem } from '../lib/types';

const CATEGORIAS = ['Materia prima', 'Herramienta', 'Consumible', 'Refacción', 'Equipo', 'Electrónico', 'Estructura'];
const UNIDADES   = ['pza', 'kg', 'g', 'm', 'm²', 'm³', 'lt', 'ml', 'caja', 'juego', 'hr'];

export default function InventarioForm({
  initial,
  itemId,
  onSaved,
}: {
  initial?: Partial<InventarioItem>;
  itemId?: string;
  onSaved: (id: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    nombre: initial?.nombre ?? '',
    sku: initial?.sku ?? '',
    categoria: initial?.categoria ?? '',
    descripcion: initial?.descripcion ?? '',
    cantidad: initial?.cantidad != null ? String(initial.cantidad) : '0',
    unidad: initial?.unidad ?? 'pza',
    precio_unitario: initial?.precio_unitario != null ? String(initial.precio_unitario) : '0',
    stock_minimo: initial?.stock_minimo != null ? String(initial.stock_minimo) : '0',
    ubicacion: initial?.ubicacion ?? '',
  });

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!f.nombre.trim()) return Alert.alert('Falta nombre', 'El artículo necesita nombre.');
    const payload = {
      nombre: f.nombre.trim(),
      sku: f.sku || null,
      categoria: f.categoria || null,
      descripcion: f.descripcion || null,
      cantidad: Number(f.cantidad) || 0,
      unidad: f.unidad || 'pza',
      precio_unitario: Number(f.precio_unitario) || 0,
      stock_minimo: Number(f.stock_minimo) || 0,
      ubicacion: f.ubicacion || null,
    };
    setLoading(true);
    if (itemId) {
      const { error } = await supabase.from('inventario').update(payload).eq('id', itemId);
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      logActividad('editó', 'inventario', itemId, `Artículo: ${payload.nombre}`);
      onSaved(itemId);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('inventario')
        .insert({ ...payload, creado_por: u.user?.id })
        .select('id')
        .single();
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      const newId = (data as { id: string }).id;
      logActividad('creó', 'inventario', newId, `Artículo: ${payload.nombre}`);
      onSaved(newId);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Field label="Nombre *" value={f.nombre} onChangeText={(v) => set('nombre', v)} />
      <Field label="SKU / Código" value={f.sku} onChangeText={(v) => set('sku', v)} autoCapitalize="characters" />
      <SelectOrText label="Categoría" value={f.categoria} onChange={(v) => set('categoria', v)} options={CATEGORIAS} placeholder="Escribe una categoría..." />
      <Field label="Descripción" value={f.descripcion} onChangeText={(v) => set('descripcion', v)} multiline />
      <Field label="Cantidad (existencias)" value={f.cantidad} onChangeText={(v) => set('cantidad', v)} keyboardType="decimal-pad" />
      <SelectOrText label="Unidad" value={f.unidad} onChange={(v) => set('unidad', v)} options={UNIDADES} placeholder="Escribe la unidad..." />
      <Field label="Stock mínimo" value={f.stock_minimo} onChangeText={(v) => set('stock_minimo', v)} keyboardType="decimal-pad" />
      <Field label="Precio unitario" value={formatMoney(f.precio_unitario)} onChangeText={(v) => set('precio_unitario', parseMoney(v))} keyboardType="decimal-pad" />
      <Field label="Ubicación" value={f.ubicacion} onChangeText={(v) => set('ubicacion', v)} placeholder="Almacén A, Estante 3..." />
      <Button title={itemId ? 'Guardar cambios' : 'Agregar artículo'} onPress={save} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
