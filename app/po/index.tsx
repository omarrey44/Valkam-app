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
import { supabase } from '../../lib/supabase';
import { colors, estadoPOColor, font, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { OrdenCompra } from '../../lib/types';

export default function POList() {
  const { colors } = useTheme();
  const [data, setData] = useState<OrdenCompra[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('ordenes_compra')
      .select('*, clientes(empresa), cotizaciones(titulo)')
      .order('creado_en', { ascending: false });
    if (!error) setData((data as OrdenCompra[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      <FlatList
        data={data}
        keyExtractor={(p) => p.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListEmptyComponent={
          <Text style={styles.empty}>
            Sin órdenes de compra. Se crean al aprobar una cotización, o agrega con +
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/po/${item.id}`)}>
            <View style={styles.tile}>
              <Ionicons name="receipt-outline" size={24} color={colors.primaryBright} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.numero, { color: colors.text }]}>{item.numero_po ?? 'PO'}</Text>
              <Text style={styles.sub} numberOfLines={1}>{item.cotizaciones?.titulo ?? '—'}</Text>
              <Text style={styles.sub} numberOfLines={1}>{item.clientes?.empresa ?? '—'}</Text>
              <Text style={styles.monto}>
                {item.moneda} {item.monto_po.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.pill, { backgroundColor: estadoPOColor[item.estado] + '1A' }]}>
              <Text style={[styles.pillText, { color: estadoPOColor[item.estado] }]}>
                {item.estado.replace('_', ' ').toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
      <TouchableOpacity style={styles.fab} onPress={() => router.push('/po/nueva')}>
        <Ionicons name="add" size={32} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow.card },
  tile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  numero: { fontSize: 17, fontFamily: font.bold, color: colors.text },
  sub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  monto: { fontSize: 15, fontFamily: font.bold, color: colors.primaryBright, marginTop: 4 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
  fab: { position: 'absolute', right: 20, bottom: 24, width: 60, height: 60, borderRadius: 30, backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center', ...shadow.float },
});
