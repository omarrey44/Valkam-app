import { Ionicons } from '@expo/vector-icons';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import GradientCard from '../../components/GradientCard';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, estadoProyectoColor, font, gradients, radius, shadow } from '../../lib/theme';
import { Proyecto } from '../../lib/types';

export default function Proyectos() {
  const insets = useSafeAreaInsets();
  const { profile } = useAuth();
  const [data, setData] = useState<Proyecto[]>([]);
  const [poCount, setPoCount] = useState(0);
  const [pendCount, setPendCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const { data } = await supabase
      .from('proyectos')
      .select('*, clientes(empresa), ordenes_compra(numero_po)')
      .order('creado_en', { ascending: false });
    setData((data as Proyecto[]) ?? []);
    const { count: po } = await supabase.from('ordenes_compra').select('id', { count: 'exact', head: true });
    setPoCount(po ?? 0);
    const { count: pend } = await supabase
      .from('cotizaciones')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente');
    setPendCount(pend ?? 0);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const nombre = (profile?.nombre ?? profile?.email ?? 'equipo').split(' ')[0].split('@')[0];
  const iniciales = (profile?.nombre ?? profile?.email ?? 'U')
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.push('/usuarios')} hitSlop={8}>
          <Ionicons name="menu" size={28} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerRight}>
          <TouchableOpacity onPress={() => router.push('/(tabs)/pendientes')} hitSlop={8}>
            <Ionicons name="notifications-outline" size={26} color={colors.text} />
            {pendCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>{pendCount}</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(tabs)/perfil')}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{iniciales}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Saludo */}
      <View style={styles.greetWrap}>
        <Text style={styles.hola}>Hola, {nombre}</Text>
        <Text style={styles.sub}>Aquí tienes el resumen de tu negocio</Text>
      </View>

      {/* Tarjetas principales */}
      <View style={styles.section}>
        <GradientCard
          colors={gradients.blue}
          icon="receipt-outline"
          title="Órdenes de compra"
          subtitle={`${poCount} ${poCount === 1 ? 'registrada' : 'registradas'}`}
          onPress={() => router.push('/po')}
          glow={shadow.blue}
        />
        <GradientCard
          colors={gradients.green}
          icon="cash-outline"
          title="Facturas"
          subtitle="Cobranza y estado de pago"
          onPress={() => router.push('/factura')}
          glow={shadow.green}
        />
      </View>

      {/* Proyectos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Proyectos programados</Text>
      </View>
      <View style={styles.section}>
        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 12 }} />
        ) : data.length === 0 ? (
          <Text style={styles.empty}>Sin proyectos. Genera uno desde una orden de compra.</Text>
        ) : (
          data.slice(0, 5).map((p) => (
            <TouchableOpacity
              key={p.id}
              activeOpacity={0.8}
              style={styles.projCard}
              onPress={() => router.push(`/proyecto/${p.id}`)}
            >
              <View style={styles.projIcon}>
                <Ionicons name="cube-outline" size={26} color={colors.primaryBright} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.projName} numberOfLines={1}>
                  {p.nombre_proyecto ?? 'Proyecto'}
                </Text>
                <Text style={styles.projSub} numberOfLines={1}>
                  {p.clientes?.empresa ?? '—'}
                </Text>
                <Text style={styles.projPo}>PO: {p.ordenes_compra?.numero_po ?? '—'}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 6 }}>
                <View style={[styles.statusPill, { backgroundColor: estadoProyectoColor[p.estado] + '1A' }]}>
                  <Text style={[styles.statusText, { color: estadoProyectoColor[p.estado] }]}>
                    {p.estado.toUpperCase()}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textFaint} />
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Accesos rápidos */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Accesos rápidos</Text>
      </View>
      <View style={styles.quickRow}>
        <QuickTile
          icon="people-outline"
          tint={colors.primaryBright}
          title="Clientes"
          subtitle="Gestionar"
          onPress={() => router.push('/(tabs)/clientes')}
        />
        <QuickTile
          icon="trending-up-outline"
          tint="#7C3AED"
          title="Reportes"
          subtitle="Ver métricas"
          onPress={() => router.push('/dashboard')}
        />
        <QuickTile
          icon="cube-outline"
          tint={colors.success}
          title="Inventario"
          subtitle="Ver existencias"
          onPress={() => router.push('/inventario')}
        />
      </View>
    </ScrollView>
  );
}

function QuickTile({
  icon,
  tint,
  title,
  subtitle,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity activeOpacity={0.8} style={styles.quickTile} onPress={onPress}>
      <View style={[styles.quickIcon, { backgroundColor: tint + '15' }]}>
        <Ionicons name={icon} size={22} color={tint} />
      </View>
      <Text style={styles.quickTitle}>{title}</Text>
      <Text style={styles.quickSub} numberOfLines={1}>
        {subtitle}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 18 },
  bellBadge: {
    position: 'absolute',
    top: -6,
    right: -8,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bellBadgeText: { color: '#fff', fontSize: 10, fontFamily: font.bold },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontFamily: font.bold, fontSize: 15 },
  greetWrap: { paddingHorizontal: 20, marginBottom: 22 },
  hola: { fontSize: 34, fontFamily: font.black, color: colors.text, letterSpacing: -0.5 },
  sub: { fontSize: 15, fontFamily: font.medium, color: colors.textMuted, marginTop: 4 },
  section: { paddingHorizontal: 20 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 19, fontFamily: font.bold, color: colors.text },
  empty: { color: colors.textMuted, fontFamily: font.regular, textAlign: 'center', marginVertical: 16 },
  projCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 16,
    marginBottom: 12,
    ...shadow.card,
  },
  projIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  projName: { fontSize: 17, fontFamily: font.bold, color: colors.text },
  projSub: { fontSize: 14, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  projPo: { fontSize: 13, fontFamily: font.medium, color: colors.textFaint, marginTop: 2 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  statusText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  quickRow: { flexDirection: 'row', paddingHorizontal: 20, gap: 12 },
  quickTile: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: 14,
    ...shadow.card,
  },
  quickIcon: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  quickTitle: { fontSize: 14, fontFamily: font.bold, color: colors.text },
  quickSub: { fontSize: 12, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
});
