import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { colors, font, radius, shadow } from '../../lib/theme';

const rolLabel: Record<string, string> = {
  vendedor: 'Vendedor',
  administrador: 'Administrador',
  aprobador: 'Aprobador',
};

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut } = useAuth();
  const nombre = profile?.nombre ?? profile?.email ?? '—';
  const inicial = nombre.charAt(0).toUpperCase();
  const esAdmin = profile?.rol === 'administrador';
  const esGestion = esAdmin || profile?.rol === 'aprobador';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.hTitle}>Perfil</Text>
          <Text style={styles.hSub}>Gestiona tu información y ajustes</Text>
        </View>
        <TouchableOpacity style={styles.gear} onPress={() => router.push('/perfil-editar')}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tarjeta perfil */}
      <LinearGradient colors={['#EAF1FE', '#F8FAFC']} style={styles.profileCard}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{inicial}</Text>
          </View>
          <TouchableOpacity
            style={styles.camera}
            onPress={() => Alert.alert('Foto de perfil', 'Subir foto: próximamente.')}
          >
            <Ionicons name="camera" size={16} color={colors.primaryBright} />
          </TouchableOpacity>
        </View>
        <Text style={styles.nombre}>{profile?.nombre ?? '—'}</Text>
        <Text style={styles.email}>{profile?.email ?? session?.user.email}</Text>
        <View style={styles.rolPill}>
          <Ionicons name="ribbon" size={16} color={colors.primaryBright} />
          <Text style={styles.rolText}>{rolLabel[profile?.rol ?? 'vendedor']}</Text>
        </View>
      </LinearGradient>

      {/* Menú */}
      <View style={styles.menuCard}>
        <MenuRow
          icon="create-outline"
          tint={colors.primaryBright}
          title="Editar perfil"
          subtitle="Actualiza tu información personal"
          onPress={() => router.push('/perfil-editar')}
        />
        {esGestion && (
          <>
            <View style={styles.divider} />
            <MenuRow
              icon="bar-chart-outline"
              tint="#fff"
              title="Dashboard de productividad"
              subtitle="Visualiza tus métricas y desempeño"
              onPress={() => router.push('/dashboard')}
              highlight
            />
          </>
        )}
        {esAdmin && (
          <>
            <View style={styles.divider} />
            <MenuRow
              icon="people-outline"
              tint="#7C3AED"
              title="Usuarios y roles"
              subtitle="Gestiona usuarios y permisos"
              onPress={() => router.push('/usuarios')}
            />
          </>
        )}
      </View>

      {/* Cerrar sesión */}
      <View style={styles.menuCard}>
        <MenuRow
          icon="log-out-outline"
          tint={colors.danger}
          title="Cerrar sesión"
          subtitle="Salir de tu cuenta de manera segura"
          onPress={signOut}
          danger
        />
      </View>

      {/* Footer seguridad */}
      <View style={styles.secCard}>
        <View style={styles.secIcon}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primaryBright} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.secTitle}>Tu información está protegida</Text>
          <Text style={styles.secText}>
            Usamos encriptación y buenas prácticas para mantener tu información segura.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuRow({
  icon,
  tint,
  title,
  subtitle,
  onPress,
  highlight,
  danger,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
  danger?: boolean;
}) {
  const fg = highlight ? '#fff' : danger ? colors.danger : colors.text;
  const subFg = highlight ? 'rgba(255,255,255,0.85)' : colors.textMuted;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.row, highlight && styles.rowHighlight]}
    >
      <View
        style={[
          styles.rowTile,
          { backgroundColor: highlight ? 'rgba(255,255,255,0.2)' : tint + '15' },
        ]}
      >
        <Ionicons name={icon} size={22} color={highlight ? '#fff' : tint} />
      </View>
      <View style={{ flex: 1, marginLeft: 14 }}>
        <Text style={[styles.rowTitle, { color: fg }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: subFg }]}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={highlight ? '#fff' : danger ? colors.danger : colors.textFaint} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  hTitle: { fontSize: 28, fontFamily: font.black, color: colors.text },
  hSub: { fontSize: 14, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  gear: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  profileCard: { borderRadius: radius.xl, padding: 24, alignItems: 'center', marginBottom: 16, ...shadow.card },
  avatarWrap: { marginBottom: 14 },
  avatar: { width: 110, height: 110, borderRadius: 55, backgroundColor: colors.primaryBright, alignItems: 'center', justifyContent: 'center', ...shadow.blue },
  avatarText: { color: '#fff', fontSize: 48, fontFamily: font.black },
  camera: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.card },
  nombre: { fontSize: 26, fontFamily: font.black, color: colors.text },
  email: { fontSize: 15, fontFamily: font.medium, color: colors.textMuted, marginTop: 4 },
  rolPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, backgroundColor: '#EAF1FE', paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  rolText: { color: colors.primaryBright, fontFamily: font.bold, fontSize: 15 },
  menuCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 8, marginBottom: 16, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md },
  rowHighlight: { backgroundColor: colors.primaryBright, ...shadow.blue },
  rowTile: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontFamily: font.bold },
  rowSub: { fontSize: 13, fontFamily: font.medium, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginHorizontal: 12 },
  secCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, ...shadow.card },
  secIcon: { width: 44, height: 44, borderRadius: radius.md, backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 15, fontFamily: font.bold, color: colors.primaryBright },
  secText: { fontSize: 13, fontFamily: font.regular, color: colors.textMuted, marginTop: 2 },
});
