import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import IconField from '../../components/IconField';
import { supabase } from '../../lib/supabase';
import { colors, estadoColor, font, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { Cotizacion } from '../../lib/types';

const FILTROS = ['todas', 'pendiente', 'enviada', 'aprobada', 'rechazada'] as const;
type Filtro = (typeof FILTROS)[number];

export default function Cotizaciones() {
  const { colors } = useTheme();
  const [data, setData] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todas');

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*, clientes(empresa, correo_principal)')
      .order('creado_en', { ascending: false });
    if (!error) setData((data as Cotizacion[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const filtered = data.filter((c) => {
    const matchQ = c.titulo.toLowerCase().includes(q.toLowerCase()) || c.clientes?.empresa?.toLowerCase().includes(q.toLowerCase());
    const matchF = filtro === 'todas' || c.estado === filtro;
    return matchQ && matchF;
  });

  const montoTotal = data.reduce((s, c) => s + Number(c.monto), 0);
  const aprobadas = data.filter((c) => c.estado === 'aprobada').length;

  if (loading)
    return <View style={[styles.center, { backgroundColor: colors.bg }]}><ActivityIndicator size="large" color={colors.primaryBright} /></View>;

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <View style={[styles.topHeader, { backgroundColor: colors.bg }]}>
        <Text style={[styles.topTitle, { color: colors.text }]}>Cotizaciones</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/cotizacion/nueva')}>
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={filtered}
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListHeaderComponent={
          <View>
            <View style={styles.kpis}>
              <Kpi value={String(data.length)} label="Total" colors={colors} />
              <Kpi value={`$${(montoTotal / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`} label="Cotizado" colors={colors} />
              <Kpi value={String(aprobadas)} label="Aprobadas" tint={colors.success} colors={colors} />
            </View>
            <IconField icon="search-outline" placeholder="Buscar título o empresa..." value={q} onChangeText={setQ} />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: 14 }}>
              {FILTROS.map((f) => {
                const active = filtro === f;
                return (
                  <TouchableOpacity key={f} onPress={() => setFiltro(f)}
                    style={[styles.chip, { backgroundColor: colors.card, borderColor: colors.border }, active && { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright }]}>
                    <Text style={[styles.chipText, { color: active ? '#fff' : colors.textMuted }]}>
                      {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<Text style={[styles.empty, { color: colors.textMuted }]}>Sin cotizaciones. Crea la primera con +</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/cotizacion/${item.id}`)}>
            <View style={styles.iconTile}>
              <Ionicons name="document-text-outline" size={24} color={colors.primaryBright} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={1}>{item.titulo}</Text>
              <Text style={[styles.empresa, { color: colors.textMuted }]} numberOfLines={1}>{item.clientes?.empresa ?? '—'}</Text>
              <View style={styles.cardBottom}>
                <Text style={[styles.monto, { color: colors.primaryBright }]}>
                  {item.moneda} {item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={[styles.rev, { color: colors.textFaint }]}>Rev. {item.revision_current}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.pill, { backgroundColor: (estadoColor[item.estado] ?? colors.textMuted) + '1A' }]}>
                <Text style={[styles.pillText, { color: estadoColor[item.estado] ?? colors.textMuted }]}>{item.estado.toUpperCase()}</Text>
              </View>
              {(item.estado === 'pendiente' || item.estado === 'enviada') &&
                Math.floor((Date.now() - new Date(item.fecha_cotizacion).getTime()) / 86400000) > 30 && (
                <View style={styles.vencidaBadge}>
                  <Ionicons name="time-outline" size={11} color="#fff" />
                  <Text style={styles.vencidaText}>+30d</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Kpi({ value, label, tint, colors: c }: { value: string; label: string; tint?: string; colors: typeof import('../../lib/theme').colors }) {
  return (
    <View style={[styles.kpi, { backgroundColor: c.card }]}>
      <Text style={[styles.kpiValue, { color: tint ?? c.primaryBright }]}>{value}</Text>
      <Text style={[styles.kpiLabel, { color: c.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  kpis: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  kpi: { flex: 1, borderRadius: radius.lg, padding: 14, alignItems: 'center', ...shadow.card },
  kpiValue: { fontSize: 20, fontFamily: font.black },
  kpiLabel: { fontSize: 12, fontFamily: font.medium, marginTop: 2 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: radius.pill, borderWidth: 1 },
  chipText: { fontFamily: font.semibold, fontSize: 13 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow.card },
  iconTile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 16, fontFamily: font.bold },
  empresa: { fontSize: 13, fontFamily: font.medium, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  monto: { fontSize: 15, fontFamily: font.bold },
  rev: { fontSize: 12, fontFamily: font.medium },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  empty: { textAlign: 'center', fontFamily: font.regular, marginTop: 40 },
  vencidaBadge: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: colors.warning, borderRadius: radius.pill, paddingHorizontal: 7, paddingVertical: 3 },
  vencidaText: { fontSize: 10, fontFamily: font.bold, color: '#fff' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  topTitle: { fontSize: 26, fontFamily: font.black },
  addBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.float },
});
