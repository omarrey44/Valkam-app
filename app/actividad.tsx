import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors, font, radius, shadow } from '../lib/theme';

interface LogRow {
  id: string;
  accion: string;
  modulo: string;
  descripcion: string;
  creado_en: string;
  profiles: { nombre: string | null; email: string | null } | null;
}

const MODULO_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  cotizacion: 'document-text-outline',
  cliente:    'business-outline',
  po:         'receipt-outline',
  factura:    'cash-outline',
  inventario: 'cube-outline',
  proyecto:   'construct-outline',
};

const ACCION_COLOR: Record<string, string> = {
  'creó':     colors.success,
  'editó':    colors.primaryBright,
  'eliminó':  colors.danger,
};

function fmtFecha(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
    + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
}

export default function ActividadScreen() {
  const { profile } = useAuth();
  const esAdmin = profile?.rol === 'administrador';
  const [data, setData] = useState<LogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [soloMio, setSoloMio] = useState(!esAdmin);

  const load = useCallback(async () => {
    setLoading(true);
    let q = supabase
      .from('actividad_log')
      .select('id, accion, modulo, descripcion, creado_en, profiles(nombre, email)')
      .order('creado_en', { ascending: false })
      .limit(100);

    if (soloMio) {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) q = q.eq('usuario_id', user.id);
    }

    const { data: rows } = await q;
    setData((rows as LogRow[]) ?? []);
    setLoading(false);
  }, [soloMio]);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  function autor(row: LogRow) {
    return row.profiles?.nombre ?? row.profiles?.email ?? 'Usuario';
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Historial de actividad' }} />
      <View style={styles.container}>
        {esAdmin && (
          <View style={styles.filterRow}>
            <TouchableOpacity
              style={[styles.filterBtn, !soloMio && styles.filterActive]}
              onPress={() => setSoloMio(false)}
            >
              <Text style={[styles.filterText, !soloMio && styles.filterTextActive]}>Todos</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.filterBtn, soloMio && styles.filterActive]}
              onPress={() => setSoloMio(true)}
            >
              <Text style={[styles.filterText, soloMio && styles.filterTextActive]}>Solo yo</Text>
            </TouchableOpacity>
          </View>
        )}

        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.primaryBright} />
          </View>
        ) : (
          <FlatList
            data={data}
            keyExtractor={(r) => r.id}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
            refreshControl={<RefreshControl refreshing={false} onRefresh={load} />}
            ListEmptyComponent={<Text style={styles.empty}>Sin actividad registrada.</Text>}
            renderItem={({ item }) => {
              const iconName = MODULO_ICON[item.modulo] ?? 'ellipse-outline';
              const accionColor = ACCION_COLOR[item.accion] ?? colors.textMuted;
              return (
                <View style={styles.card}>
                  <View style={[styles.iconBox, { backgroundColor: accionColor + '18' }]}>
                    <Ionicons name={iconName} size={20} color={accionColor} />
                  </View>
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <View style={styles.topRow}>
                      <Text style={[styles.accion, { color: accionColor }]}>{item.accion}</Text>
                      <Text style={styles.modulo}>{item.modulo}</Text>
                    </View>
                    <Text style={styles.desc} numberOfLines={2}>{item.descripcion}</Text>
                    <Text style={styles.meta}>{autor(item)} · {fmtFecha(item.creado_en)}</Text>
                  </View>
                </View>
              );
            }}
          />
        )}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  filterRow: { flexDirection: 'row', gap: 8, padding: 16, paddingBottom: 4 },
  filterBtn: {
    paddingHorizontal: 18, paddingVertical: 8, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  filterActive: { backgroundColor: colors.primaryBright, borderColor: colors.primaryBright },
  filterText: { fontFamily: font.semibold, color: colors.textMuted, fontSize: 13 },
  filterTextActive: { color: '#fff' },
  card: {
    flexDirection: 'row', alignItems: 'flex-start',
    backgroundColor: colors.card, borderRadius: radius.lg,
    padding: 14, marginBottom: 10, ...shadow.card,
  },
  iconBox: { width: 40, height: 40, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 2 },
  accion: { fontFamily: font.bold, fontSize: 13 },
  modulo: { fontFamily: font.medium, fontSize: 12, color: colors.textMuted, textTransform: 'uppercase' },
  desc: { fontFamily: font.medium, fontSize: 14, color: colors.text },
  meta: { fontFamily: font.regular, fontSize: 12, color: colors.textFaint, marginTop: 4 },
  empty: { textAlign: 'center', color: colors.textMuted, fontFamily: font.regular, marginTop: 40 },
});
