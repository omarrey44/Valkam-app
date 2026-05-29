import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
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
import GradientHeader from '../../components/GradientHeader';
import { Button } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { colors, font, radius, shadow } from '../../lib/theme';
import { Proyecto, ValidacionItem } from '../../lib/types';

const SUGERIDOS = [
  'Pruebas funcionales OK',
  'Dimensiones y tolerancias',
  'Seguridad eléctrica',
  'Documentación entregada',
  'Limpieza y acabado',
];

export default function Validacion() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [items, setItems] = useState<ValidacionItem[]>([]);
  const [nuevo, setNuevo] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const { data: p } = await supabase.from('proyectos').select('*, clientes(empresa)').eq('id', id).single();
    setProyecto((p as Proyecto) ?? null);
    const { data } = await supabase
      .from('validacion_checklist')
      .select('*')
      .eq('proyecto_id', id)
      .order('orden');
    setItems((data as ValidacionItem[]) ?? []);
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function agregar(texto: string) {
    if (!texto.trim()) return;
    await supabase.from('validacion_checklist').insert({ proyecto_id: id, item: texto.trim(), orden: items.length });
    setNuevo('');
    load();
  }

  async function toggle(it: ValidacionItem) {
    await supabase.from('validacion_checklist').update({ completado: !it.completado }).eq('id', it.id);
    setItems((prev) => prev.map((x) => (x.id === it.id ? { ...x, completado: !x.completado } : x)));
  }

  async function eliminar(it: ValidacionItem) {
    await supabase.from('validacion_checklist').delete().eq('id', it.id);
    load();
  }

  async function aprobarCalidad() {
    const pend = items.filter((i) => !i.completado).length;
    const go = async () => {
      setBusy(true);
      const { error } = await supabase.from('proyectos').update({ estado: 'validacion' }).eq('id', id);
      setBusy(false);
      if (error) return Alert.alert('Error', error.message);
      router.back();
    };
    if (pend > 0) {
      Alert.alert('Items pendientes', `Faltan ${pend} sin marcar. ¿Aprobar de todas formas?`, [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Aprobar', onPress: go },
      ]);
    } else go();
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  const hechos = items.filter((i) => i.completado).length;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <GradientHeader
        colors={['#6D28D9', '#8B5CF6']}
        icon="shield-checkmark-outline"
        eyebrow={proyecto?.clientes?.empresa ?? undefined}
        title="Validación de calidad"
        subtitle={`${proyecto?.nombre_proyecto ?? ''} · ${hechos}/${items.length} OK`}
      />

      <View style={styles.addRow}>
        <TextInput
          placeholder="Nuevo punto de revisión..."
          placeholderTextColor={colors.textFaint}
          value={nuevo}
          onChangeText={setNuevo}
          style={styles.addInput}
          onSubmitEditing={() => agregar(nuevo)}
        />
        <TouchableOpacity style={styles.addBtn} onPress={() => agregar(nuevo)}>
          <Ionicons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {items.length === 0 && (
        <View style={styles.sugWrap}>
          <Text style={styles.sugTitle}>Sugeridos (toca para agregar):</Text>
          <View style={styles.sugRow}>
            {SUGERIDOS.map((s) => (
              <TouchableOpacity key={s} style={styles.sugChip} onPress={() => agregar(s)}>
                <Text style={styles.sugText}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}

      {items.map((it) => (
        <View key={it.id} style={styles.itemCard}>
          <TouchableOpacity onPress={() => toggle(it)} hitSlop={8}>
            <Ionicons
              name={it.completado ? 'checkbox' : 'square-outline'}
              size={26}
              color={it.completado ? colors.success : colors.textMuted}
            />
          </TouchableOpacity>
          <Text style={[styles.itemText, it.completado && { color: colors.textMuted, textDecorationLine: 'line-through' }]}>
            {it.item}
          </Text>
          <TouchableOpacity onPress={() => eliminar(it)} hitSlop={8}>
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
          </TouchableOpacity>
        </View>
      ))}

      <View style={{ marginTop: 16 }}>
        <Button title="✔ Aprobar calidad" onPress={aprobarCalidad} loading={busy} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  addRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  addInput: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: 16,
    height: 52,
    fontFamily: font.regular,
    fontSize: 15,
    color: colors.text,
    ...shadow.card,
  },
  addBtn: { width: 52, height: 52, borderRadius: radius.lg, backgroundColor: colors.primaryBright, alignItems: 'center', justifyContent: 'center', ...shadow.blue },
  sugWrap: { marginBottom: 16 },
  sugTitle: { fontFamily: font.semibold, color: colors.textMuted, fontSize: 13, marginBottom: 8 },
  sugRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  sugChip: { backgroundColor: '#EDE9FE', borderRadius: radius.pill, paddingHorizontal: 12, paddingVertical: 8 },
  sugText: { color: '#6D28D9', fontFamily: font.semibold, fontSize: 13 },
  itemCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  itemText: { flex: 1, fontFamily: font.medium, color: colors.text, fontSize: 15 },
});
