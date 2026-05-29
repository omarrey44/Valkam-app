import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import IconField from '../../components/IconField';
import { supabase } from '../../lib/supabase';
import { colors, font, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { InventarioItem } from '../../lib/types';

export default function Inventario() {
  const { colors } = useTheme();
  const [data, setData] = useState<InventarioItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('inventario').select('*').order('nombre');
    if (!error) setData((data as InventarioItem[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = data.filter((i) => {
    const s = q.toLowerCase();
    return i.nombre.toLowerCase().includes(s) || i.sku?.toLowerCase().includes(s) || i.categoria?.toLowerCase().includes(s);
  });

  const bajos = data.filter((i) => i.cantidad <= i.stock_minimo).length;
  const valorTotal = data.reduce((s, i) => s + i.cantidad * i.precio_unitario, 0);

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={filtered}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <View style={styles.kpis}>
              <Kpi value={String(data.length)} label="Artículos" />
              <Kpi value={`$${(valorTotal / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`} label="Valor" />
              <Kpi value={String(bajos)} label="Stock bajo" tint={bajos > 0 ? colors.danger : colors.success} />
            </View>
            <IconField icon="search-outline" placeholder="Buscar nombre, SKU, categoría..." value={q} onChangeText={setQ} />
            <View style={{ height: 14 }} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Sin artículos. Agrega uno con +</Text>}
        renderItem={({ item }) => {
          const bajo = item.cantidad <= item.stock_minimo;
          return (
            <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/inventario/${item.id}`)}>
              <View style={[styles.tile, bajo && { backgroundColor: '#FEE2E2' }]}>
                <Ionicons name="cube-outline" size={24} color={bajo ? colors.danger : colors.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.nombre, { color: colors.text }]} numberOfLines={1}>{item.nombre}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                  {item.categoria ?? 'Sin categoría'}{item.sku ? ` · ${item.sku}` : ''}
                </Text>
              </View>
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.cant, bajo && { color: colors.danger }]}>
                  {item.cantidad} {item.unidad}
                </Text>
                {bajo && <Text style={styles.bajoTag}>BAJO</Text>}
              </View>
            </TouchableOpacity>
          );
        }}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/inventario/nuevo')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

function Kpi({ value, label, tint }: { value: string; label: string; tint?: string }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.kpi, { backgroundColor: colors.card }]}>
      <Text style={[styles.kpiValue, tint && { color: tint }]}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  kpis: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpi: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, alignItems: 'center', ...shadow.card },
  kpiValue: { fontSize: 19, fontFamily: font.black, color: colors.primaryBright },
  kpiLabel: { fontSize: 12, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow.card },
  tile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  nombre: { fontSize: 16, fontFamily: font.bold, color: colors.text },
  sub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  cant: { fontSize: 16, fontFamily: font.black, color: colors.text },
  bajoTag: { fontSize: 10, fontFamily: font.bold, color: colors.danger, marginTop: 2 },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.float },
});
