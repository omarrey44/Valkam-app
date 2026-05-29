import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  DimensionValue,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BarChart, Donut } from '../components/Charts';
import { Card } from '../components/ui';
import { supabase } from '../lib/supabase';
import { colors, font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';
import { MetricaVendedor } from '../lib/types';

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

type Rango = 'mes' | 'anio' | 'todo';

function rangoFechas(r: Rango): { desde: string | null; hasta: string | null } {
  const now = new Date();
  const hasta = now.toISOString().slice(0, 10);
  if (r === 'mes') {
    const d = new Date(now.getFullYear(), now.getMonth(), 1);
    return { desde: d.toISOString().slice(0, 10), hasta };
  }
  if (r === 'anio') {
    const d = new Date(now.getFullYear(), 0, 1);
    return { desde: d.toISOString().slice(0, 10), hasta };
  }
  return { desde: null, hasta: null };
}

export default function Dashboard() {
  const { colors } = useTheme();
  const [rango, setRango] = useState<Rango>('mes');
  const [data, setData] = useState<MetricaVendedor[]>([]);
  const [porMes, setPorMes] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    const { desde, hasta } = rangoFechas(rango);
    const { data, error } = await supabase.rpc('metricas_vendedor', { desde, hasta });
    if (!error) setData((data as MetricaVendedor[]) ?? []);

    // Barras: cotizaciones por mes (últimos 6 meses)
    const now = new Date();
    const buckets: { key: string; label: string; value: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      buckets.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MESES[d.getMonth()], value: 0 });
    }
    const desdeBar = new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10);
    const { data: cots } = await supabase
      .from('cotizaciones')
      .select('fecha_cotizacion')
      .gte('fecha_cotizacion', desdeBar);
    for (const c of (cots as { fecha_cotizacion: string }[]) ?? []) {
      const d = new Date(c.fecha_cotizacion + 'T00:00:00');
      const k = `${d.getFullYear()}-${d.getMonth()}`;
      const b = buckets.find((x) => x.key === k);
      if (b) b.value++;
    }
    setPorMes(buckets.map((b) => ({ label: b.label, value: b.value })));

    setLoading(false);
  }, [rango]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const totalCotizado = data.reduce((s, m) => s + Number(m.monto_total_cotizado), 0);
  const totalCotiz = data.reduce((s, m) => s + Number(m.cotizaciones_realizadas), 0);
  const totalAprob = data.reduce((s, m) => s + Number(m.cotizaciones_aprobadas), 0);
  const maxMonto = Math.max(1, ...data.map((m) => Number(m.monto_total_cotizado)));

  const RANGOS: { v: Rango; label: string }[] = [
    { v: 'mes', label: 'Este mes' },
    { v: 'anio', label: 'Este año' },
    { v: 'todo', label: 'Todo' },
  ];

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <View style={styles.tabs}>
        {RANGOS.map((r) => (
          <TouchableOpacity
            key={r.v}
            onPress={() => setRango(r.v)}
            style={[styles.tab, { backgroundColor: colors.card }, rango === r.v && styles.tabActive]}
          >
            <Text style={[styles.tabText, rango === r.v && { color: '#fff' }]}>{r.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.kpis}>
        <Kpi label="Cotizado" value={`$${(totalCotizado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`} />
        <Kpi label="Cotizaciones" value={String(totalCotiz)} />
        <Kpi label="Aprobadas" value={String(totalAprob)} />
      </View>

      <Card>
        <Text style={styles.chartTitle}>Cotizaciones por mes</Text>
        <BarChart data={porMes} />
      </Card>

      <Card>
        <Text style={styles.chartTitle}>Tasa de aprobación</Text>
        <View style={styles.donutRow}>
          <Donut pct={totalCotiz ? (totalAprob / totalCotiz) * 100 : 0} label="aprobadas" />
          <View style={{ flex: 1, marginLeft: 16, gap: 10 }}>
            <Legend color={colors.success} label="Aprobadas" value={totalAprob} />
            <Legend color={colors.textFaint} label="Otras" value={Math.max(0, totalCotiz - totalAprob)} />
          </View>
        </View>
      </Card>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>Por vendedor</Text>

      {loading ? (
        <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
      ) : data.length === 0 ? (
        <Text style={styles.empty}>Sin datos en el rango.</Text>
      ) : (
        data.map((m) => {
          const pct = (Number(m.monto_total_cotizado) / maxMonto) * 100;
          return (
            <Card key={m.vendedor_id}>
              <Text style={styles.nombre}>{m.nombre ?? m.email ?? 'Sin nombre'}</Text>
              <View style={styles.barTrack}>
                <View style={[styles.barFill, { width: `${pct}%` as DimensionValue }]} />
              </View>
              <Text style={styles.monto}>
                ${Number(m.monto_total_cotizado).toLocaleString('es-MX', { minimumFractionDigits: 2 })} cotizado
              </Text>
              <View style={styles.statsRow}>
                <Stat label="Cotizaciones" value={String(m.cotizaciones_realizadas)} />
                <Stat label="Aprobadas" value={String(m.cotizaciones_aprobadas)} />
                <Stat label="Tasa aprob." value={`${m.tasa_aprobacion}%`} />
                <Stat label="PO generadas" value={String(m.po_generadas)} />
              </View>
            </Card>
          );
        })
      )}
    </ScrollView>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiValue}>{value}</Text>
      <Text style={styles.kpiLabel}>{label}</Text>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function Legend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  tab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: radius.md,
    alignItems: 'center',
    backgroundColor: '#fff',
    ...shadow.card,
  },
  tabActive: { backgroundColor: colors.primaryBright },
  tabText: { fontFamily: font.bold, color: colors.textMuted, fontSize: 13 },
  kpis: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  kpi: {
    flex: 1,
    backgroundColor: colors.primaryBright,
    borderRadius: radius.lg,
    padding: 16,
    alignItems: 'center',
    ...shadow.blue,
  },
  kpiValue: { color: '#fff', fontSize: 20, fontFamily: font.black },
  kpiLabel: { color: '#cfe3f5', fontSize: 12, fontFamily: font.medium, marginTop: 2 },
  nombre: { fontSize: 16, fontFamily: font.bold, color: colors.text, marginBottom: 8 },
  barTrack: { height: 10, borderRadius: 5, backgroundColor: colors.border, overflow: 'hidden' },
  barFill: { height: 10, borderRadius: 5, backgroundColor: colors.accent },
  monto: { color: colors.primaryBright, fontFamily: font.bold, marginTop: 6 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  stat: { alignItems: 'center', flex: 1 },
  statValue: { fontSize: 16, fontFamily: font.black, color: colors.text },
  statLabel: { fontSize: 11, fontFamily: font.medium, color: colors.textMuted, marginTop: 2, textAlign: 'center' },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
  chartTitle: { fontSize: 15, fontFamily: font.bold, color: colors.text, marginBottom: 10 },
  sectionTitle: { fontSize: 17, fontFamily: font.bold, color: colors.text, marginTop: 8, marginBottom: 10 },
  donutRow: { flexDirection: 'row', alignItems: 'center' },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 12, height: 12, borderRadius: 6 },
  legendLabel: { flex: 1, fontFamily: font.medium, color: colors.textMuted, fontSize: 14 },
  legendValue: { fontFamily: font.bold, color: colors.text, fontSize: 15 },
});
