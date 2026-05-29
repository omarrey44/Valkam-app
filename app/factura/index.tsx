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
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { colors, estadoFacturaColor, font, gradients, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { Factura } from '../../lib/types';

export default function FacturaList() {
  const { colors } = useTheme();
  const [data, setData] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('facturas')
      .select('*, proyectos(nombre_proyecto, clientes(empresa))')
      .order('creado_en', { ascending: false });
    if (!error) setData((data as Factura[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function estadoMostrar(fac: Factura): Factura['estado'] {
    if (
      fac.estado === 'pendiente' &&
      fac.fecha_vencimiento &&
      fac.fecha_vencimiento < new Date().toISOString().slice(0, 10)
    )
      return 'vencida';
    return fac.estado;
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  const totalPendiente = data
    .filter((f) => f.estado !== 'pagada' && f.estado !== 'cancelada')
    .reduce((s, f) => s + f.monto, 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={data}
        keyExtractor={(f) => f.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListHeaderComponent={
          <LinearGradient colors={gradients.green} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.summary}>
            <View style={styles.blob} />
            <Text style={styles.summaryLabel}>Por cobrar</Text>
            <Text style={styles.summaryNum}>
              ${totalPendiente.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
            </Text>
          </LinearGradient>
        }
        ListEmptyComponent={
          <Text style={styles.empty}>Sin facturas. Genera una desde un proyecto completado.</Text>
        }
        renderItem={({ item }) => {
          const est = estadoMostrar(item);
          return (
            <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/factura/${item.id}`)}>
              <View style={styles.tile}>
                <Ionicons name="cash-outline" size={24} color={colors.success} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={[styles.numero, { color: colors.text }]}>{item.numero_factura ?? 'Factura'}</Text>
                <Text style={styles.sub} numberOfLines={1}>{item.proyectos?.clientes?.empresa ?? '—'}</Text>
                <Text style={styles.monto}>
                  {item.moneda} {item.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                </Text>
              </View>
              <View style={[styles.pill, { backgroundColor: estadoFacturaColor[est] + '1A' }]}>
                <Text style={[styles.pillText, { color: estadoFacturaColor[est] }]}>{est.toUpperCase()}</Text>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  summary: { borderRadius: radius.lg, padding: 20, marginBottom: 16, overflow: 'hidden', ...shadow.green },
  blob: { position: 'absolute', right: -30, top: -40, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.12)' },
  summaryLabel: { color: 'rgba(255,255,255,0.85)', fontSize: 13, fontFamily: font.semibold },
  summaryNum: { color: '#fff', fontSize: 30, fontFamily: font.black, marginTop: 2 },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow.card },
  tile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#DCFCE7', alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 17, fontFamily: font.bold, color: colors.text },
  sub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  monto: { fontSize: 15, fontFamily: font.bold, color: colors.success, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
});
