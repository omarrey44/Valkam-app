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
import { Cotizacion } from '../../lib/types';

const FILTROS = ['todas', 'pendiente', 'enviada', 'aprobada', 'rechazada'] as const;
type Filtro = (typeof FILTROS)[number];

export default function Cotizaciones() {
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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = data.filter((c) => {
    const matchQ =
      c.titulo.toLowerCase().includes(q.toLowerCase()) ||
      c.clientes?.empresa?.toLowerCase().includes(q.toLowerCase());
    const matchF = filtro === 'todas' || c.estado === filtro;
    return matchQ && matchF;
  });

  const montoTotal = data.reduce((s, c) => s + Number(c.monto), 0);
  const aprobadas = data.filter((c) => c.estado === 'aprobada').length;

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Cotizaciones</Text>
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
            {/* KPIs */}
            <View style={styles.kpis}>
              <Kpi value={String(data.length)} label="Total" />
              <Kpi value={`$${(montoTotal / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`} label="Cotizado" />
              <Kpi value={String(aprobadas)} label="Aprobadas" tint={colors.success} />
            </View>

            {/* Búsqueda */}
            <IconField
              icon="search-outline"
              placeholder="Buscar título o empresa..."
              value={q}
              onChangeText={setQ}
            />

            {/* Filtros */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 14 }}
            >
              {FILTROS.map((f) => {
                const active = filtro === f;
                return (
                  <TouchableOpacity
                    key={f}
                    onPress={() => setFiltro(f)}
                    style={[styles.chip, active && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, active && { color: '#fff' }]}>
                      {f === 'todas' ? 'Todas' : f.charAt(0).toUpperCase() + f.slice(1)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Sin cotizaciones. Crea la primera con +</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => router.push(`/cotizacion/${item.id}`)}
          >
            <View style={styles.iconTile}>
              <Ionicons name="document-text-outline" size={24} color={colors.primaryBright} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.titulo} numberOfLines={1}>
                {item.titulo}
              </Text>
              <Text style={styles.empresa} numberOfLines={1}>
                {item.clientes?.empresa ?? '—'}
              </Text>
              <View style={styles.cardBottom}>
                <Text style={styles.monto}>
                  {item.moneda} {item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
                <Text style={styles.rev}>Rev. {item.revision_current}</Text>
              </View>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <View style={[styles.pill, { backgroundColor: (estadoColor[item.estado] ?? colors.textMuted) + '1A' }]}>
                <Text style={[styles.pillText, { color: estadoColor[item.estado] ?? colors.textMuted }]}>
                  {item.estado.toUpperCase()}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

function Kpi({ value, label, tint }: { value: string; label: string; tint?: string }) {
  return (
    <View style={styles.kpi}>
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
  kpiValue: { fontSize: 20, fontFamily: font.black, color: colors.primaryBright },
  kpiLabel: { fontSize: 12, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: radius.pill,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright },
  chipText: { fontFamily: font.semibold, color: colors.textMuted, fontSize: 13 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow.card,
  },
  iconTile: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titulo: { fontSize: 16, fontFamily: font.bold, color: colors.text },
  empresa: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 6 },
  monto: { fontSize: 15, fontFamily: font.bold, color: colors.primaryBright },
  rev: { fontSize: 12, fontFamily: font.medium, color: colors.textFaint },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  pillText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: colors.bg,
  },
  topTitle: { fontSize: 26, fontFamily: font.black, color: colors.text },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.float,
  },
});
