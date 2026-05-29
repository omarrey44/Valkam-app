import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
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
import { colors, estadoColor, font, gradients, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { Cotizacion } from '../../lib/types';

export default function Pendientes() {
  const { colors } = useTheme();
  const [data, setData] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data, error } = await supabase
      .from('cotizaciones')
      .select('*, clientes(empresa, correo_principal)')
      .eq('estado', 'pendiente')
      .order('fecha_cotizacion', { ascending: true });
    if (!error) setData((data as Cotizacion[]) ?? []);
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
        keyExtractor={(c) => c.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
        ListHeaderComponent={
          <LinearGradient colors={gradients.amber} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.counter}>
            <View style={styles.blob} />
            <Ionicons name="notifications" size={30} color="#fff" />
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={styles.counterNum}>{data.length}</Text>
              <Text style={styles.counterLabel}>pendientes de cotizar</Text>
            </View>
          </LinearGradient>
        }
        ListEmptyComponent={<Text style={styles.empty}>Nada pendiente 🎉</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.85} style={[styles.card, { backgroundColor: colors.card }]} onPress={() => router.push(`/cotizacion/${item.id}`)}>
            <View style={styles.tile}>
              <Ionicons name="document-text-outline" size={24} color={colors.warning} />
            </View>
            <View style={{ flex: 1, marginLeft: 14 }}>
              <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={1}>{item.titulo}</Text>
              <Text style={styles.sub} numberOfLines={1}>{item.clientes?.empresa ?? '—'}</Text>
              <Text style={styles.fecha}>{item.fecha_cotizacion}</Text>
            </View>
            <View style={[styles.pill, { backgroundColor: estadoColor[item.estado] + '1A' }]}>
              <Text style={[styles.pillText, { color: estadoColor[item.estado] }]}>{item.estado.toUpperCase()}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  counter: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: 20, marginBottom: 16, overflow: 'hidden', ...shadow.card },
  blob: { position: 'absolute', right: -30, top: -40, width: 130, height: 130, borderRadius: 65, backgroundColor: 'rgba(255,255,255,0.14)' },
  counterNum: { color: '#fff', fontSize: 32, fontFamily: font.black },
  counterLabel: { color: 'rgba(255,255,255,0.9)', fontSize: 14, fontFamily: font.semibold },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 14, marginBottom: 12, ...shadow.card },
  tile: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: '#FEF3E2', alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 16, fontFamily: font.bold, color: colors.text },
  sub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  fecha: { fontSize: 12, fontFamily: font.medium, color: colors.textFaint, marginTop: 2 },
  pill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' },
  pillText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
});
