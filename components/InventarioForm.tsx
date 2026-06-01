import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Field } from './ui';
import SelectOrText from './SelectOrText';
import { logActividad } from '../lib/actividad';
import { formatMoney, parseMoney } from '../lib/money';
import { supabase } from '../lib/supabase';
import { colors, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';
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
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [camPerm, requestCamPerm] = useCameraPermissions();

  async function openScanner() {
    if (!camPerm?.granted) {
      const { granted } = await requestCamPerm();
      if (!granted) return Alert.alert('Permiso requerido', 'Necesitamos acceso a la cámara.');
    }
    setScanning(true);
  }

  function onBarcode(result: { data: string }) {
    setScanning(false);
    set('sku', result.data);
  }
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
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Field label="Nombre *" value={f.nombre} onChangeText={(v) => set('nombre', v)} />
      <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8 }}>
        <View style={{ flex: 1 }}>
          <Field label="SKU / Código" value={f.sku} onChangeText={(v) => set('sku', v)} autoCapitalize="characters" />
        </View>
        <TouchableOpacity style={[styles.scanBtn, { backgroundColor: colors.card }]} onPress={openScanner}>
          <Ionicons name="barcode-outline" size={24} color={colors.primaryBright} />
        </TouchableOpacity>
      </View>

      <Modal visible={scanning} animationType="slide" onRequestClose={() => setScanning(false)}>
        <View style={{ flex: 1, backgroundColor: '#000' }}>
          <CameraView
            style={{ flex: 1 }}
            barcodeScannerSettings={{ barcodeTypes: ['qr', 'ean13', 'ean8', 'code128', 'code39', 'upc_a', 'upc_e'] }}
            onBarcodeScanned={onBarcode}
          />
          <TouchableOpacity style={styles.closeScanner} onPress={() => setScanning(false)}>
            <Ionicons name="close-circle" size={44} color="#fff" />
            <Text style={{ color: '#fff', marginTop: 8, fontSize: 15 }}>Cancelar</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
  scanBtn: { width: 52, height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', marginBottom: 16, ...shadow.card },
  closeScanner: { position: 'absolute', bottom: 48, alignSelf: 'center', alignItems: 'center' },
});
