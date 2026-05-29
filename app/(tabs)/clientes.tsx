import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Linking,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import IconField from '../../components/IconField';
import { supabase } from '../../lib/supabase';
import { colors, estadoClienteColor, font, radius, shadow, whatsappUrl } from '../../lib/theme';
import { Cliente } from '../../lib/types';

export default function Clientes() {
  const [data, setData] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    const { data, error } = await supabase.from('clientes').select('*').order('empresa', { ascending: true });
    if (!error) setData((data as Cliente[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const filtered = data.filter((c) => {
    const s = q.toLowerCase();
    return (
      c.empresa.toLowerCase().includes(s) ||
      c.ingeniero?.toLowerCase().includes(s) ||
      c.solicitante?.toLowerCase().includes(s)
    );
  });

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <View style={styles.container}>
      <View style={styles.topHeader}>
        <Text style={styles.topTitle}>Clientes</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/cliente/nuevo')}>
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
            <View style={styles.countRow}>
              <Text style={styles.count}>{data.length}</Text>
              <Text style={styles.countLabel}>{data.length === 1 ? 'cliente' : 'clientes'}</Text>
            </View>
            <IconField
              icon="search-outline"
              placeholder="Buscar empresa, ingeniero..."
              value={q}
              onChangeText={setQ}
            />
            <View style={{ height: 14 }} />
          </View>
        }
        ListEmptyComponent={<Text style={styles.empty}>Sin clientes. Agrega uno con +</Text>}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            style={styles.card}
            onPress={() => router.push(`/cliente/${item.id}`)}
          >
            {item.logo_url ? (
              <Image source={{ uri: item.logo_url }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.empresa.charAt(0).toUpperCase()}</Text>
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 14 }}>
              <View style={styles.empresaRow}>
                <Text style={styles.empresa} numberOfLines={1}>
                  {item.empresa}
                </Text>
                <View style={[styles.dot, { backgroundColor: estadoClienteColor[item.estado] }]} />
              </View>
              {!!item.ingeniero && <Text style={styles.sub} numberOfLines={1}>Ing. {item.ingeniero}</Text>}
              <Text style={styles.sub} numberOfLines={1}>{item.correo_principal}</Text>
            </View>
            <View style={styles.actions}>
              {!!item.telefono && (
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => Linking.openURL(whatsappUrl(item.telefono!))}
                  hitSlop={6}
                >
                  <Ionicons name="logo-whatsapp" size={18} color="#25D366" />
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => Linking.openURL(`mailto:${item.correo_principal}`)}
                hitSlop={6}
              >
                <Ionicons name="mail-outline" size={18} color={colors.primaryBright} />
              </TouchableOpacity>
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
  countRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginBottom: 14 },
  count: { fontSize: 28, fontFamily: font.black, color: colors.text },
  countLabel: { fontSize: 15, fontFamily: font.medium, color: colors.textMuted },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    marginBottom: 12,
    ...shadow.card,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 20, fontFamily: font.black, color: colors.primaryBright },
  empresaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  empresa: { fontSize: 16, fontFamily: font.bold, color: colors.text, flexShrink: 1 },
  sub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
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
