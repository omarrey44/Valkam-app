import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Alert, Image, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { pickAndUpload } from '../../lib/upload';
import { font, radius, shadow } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';

const rolLabel: Record<string, string> = {
  vendedor: 'Vendedor',
  administrador: 'Administrador',
  aprobador: 'Aprobador',
};

export default function Perfil() {
  const insets = useSafeAreaInsets();
  const { profile, session, signOut, refreshProfile } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const nombre = profile?.nombre ?? profile?.email ?? '—';
  const inicial = nombre.charAt(0).toUpperCase();
  const esAdmin = profile?.rol === 'administrador';
  const esGestion = esAdmin || profile?.rol === 'aprobador';

  async function uploadAvatar() {
    if (!session?.user) return;
    try {
      const url = await pickAndUpload('avatars', `avatar_${session.user.id}`);
      if (!url) return;
      await supabase.from('profiles').update({ avatar_url: url }).eq('id', session.user.id);
      await refreshProfile();
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la foto.');
    }
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={{ paddingTop: insets.top + 10, paddingHorizontal: 16, paddingBottom: 130 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={[styles.hTitle, { color: colors.text }]}>Perfil</Text>
          <Text style={[styles.hSub, { color: colors.textMuted }]}>Gestiona tu información y ajustes</Text>
        </View>
        <TouchableOpacity style={[styles.gear, { backgroundColor: colors.card }]} onPress={() => router.push('/perfil-editar')}>
          <Ionicons name="settings-outline" size={22} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Tarjeta perfil */}
      <LinearGradient
        colors={isDark ? ['#1E3A5F', '#1E293B'] : ['#EAF1FE', '#F8FAFC']}
        style={[styles.profileCard, shadow.card]}
      >
        <View style={styles.avatarWrap}>
          {profile?.avatar_url ? (
            <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.primaryBright }]}>
              <Text style={styles.avatarText}>{inicial}</Text>
            </View>
          )}
          <TouchableOpacity style={styles.camera} onPress={uploadAvatar}>
            <Ionicons name="camera" size={16} color={colors.primaryBright} />
          </TouchableOpacity>
        </View>
        <Text style={[styles.nombre, { color: colors.text }]}>{profile?.nombre ?? '—'}</Text>
        <Text style={[styles.email, { color: colors.textMuted }]}>{profile?.email ?? session?.user.email}</Text>
        <View style={[styles.rolPill, { backgroundColor: colors.primaryBright + '20' }]}>
          <Ionicons name="ribbon" size={16} color={colors.primaryBright} />
          <Text style={[styles.rolText, { color: colors.primaryBright }]}>{rolLabel[profile?.rol ?? 'vendedor']}</Text>
        </View>
      </LinearGradient>

      {/* Apariencia */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <View style={styles.row}>
          <View style={[styles.rowTile, { backgroundColor: '#7C3AED15' }]}>
            <Ionicons name={isDark ? 'moon' : 'sunny-outline'} size={22} color="#7C3AED" />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>Modo oscuro</Text>
            <Text style={[styles.rowSub, { color: colors.textMuted }]}>{isDark ? 'Activado' : 'Desactivado'}</Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: '#7C3AED' }}
            thumbColor="#fff"
          />
        </View>
      </View>

      {/* Menú */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <MenuRow
          icon="create-outline"
          tint={colors.primaryBright}
          title="Editar perfil"
          subtitle="Actualiza tu información personal"
          onPress={() => router.push('/perfil-editar')}
          colors={colors}
        />
        {esGestion && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="bar-chart-outline"
              tint="#fff"
              title="Dashboard de productividad"
              subtitle="Visualiza tus métricas y desempeño"
              onPress={() => router.push('/dashboard')}
              highlight
              colors={colors}
            />
          </>
        )}
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <MenuRow
          icon="time-outline"
          tint={colors.warning}
          title="Historial de actividad"
          subtitle={esAdmin ? 'Ve lo que hace el equipo' : 'Tu actividad reciente'}
          onPress={() => router.push('/actividad')}
          colors={colors}
        />
        {esAdmin && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <MenuRow
              icon="people-outline"
              tint="#7C3AED"
              title="Usuarios y roles"
              subtitle="Gestiona usuarios y permisos"
              onPress={() => router.push('/usuarios')}
              colors={colors}
            />
          </>
        )}
      </View>

      {/* Cerrar sesión */}
      <View style={[styles.menuCard, { backgroundColor: colors.card }]}>
        <MenuRow
          icon="log-out-outline"
          tint={colors.danger}
          title="Cerrar sesión"
          subtitle="Salir de tu cuenta de manera segura"
          onPress={signOut}
          danger
          colors={colors}
        />
      </View>

      {/* Footer seguridad */}
      <View style={[styles.secCard, { backgroundColor: colors.card }]}>
        <View style={[styles.secIcon, { backgroundColor: colors.primaryBright + '15' }]}>
          <Ionicons name="shield-checkmark" size={22} color={colors.primaryBright} />
        </View>
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={[styles.secTitle, { color: colors.primaryBright }]}>Tu información está protegida</Text>
          <Text style={[styles.secText, { color: colors.textMuted }]}>
            Usamos encriptación y buenas prácticas para mantener tu información segura.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function MenuRow({
  icon, tint, title, subtitle, onPress, highlight, danger, colors,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  title: string;
  subtitle: string;
  onPress: () => void;
  highlight?: boolean;
  danger?: boolean;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  const fg = highlight ? '#fff' : danger ? colors.danger : colors.text;
  const subFg = highlight ? 'rgba(255,255,255,0.85)' : colors.textMuted;
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={[styles.row, highlight && { backgroundColor: colors.primaryBright, ...shadow.blue }]}
    >
      <View style={[styles.rowTile, { backgroundColor: highlight ? 'rgba(255,255,255,0.2)' : tint + '15' }]}>
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
  container: { flex: 1 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  hTitle: { fontSize: 28, fontFamily: font.black },
  hSub: { fontSize: 14, fontFamily: font.medium, marginTop: 2 },
  gear: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  profileCard: { borderRadius: radius.xl, padding: 24, alignItems: 'center', marginBottom: 16 },
  avatarWrap: { marginBottom: 14 },
  avatar: { width: 110, height: 110, borderRadius: 55, alignItems: 'center', justifyContent: 'center', ...shadow.blue },
  avatarText: { color: '#fff', fontSize: 48, fontFamily: font.black },
  camera: { position: 'absolute', bottom: 0, right: 0, width: 36, height: 36, borderRadius: 18, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center', ...shadow.card },
  nombre: { fontSize: 26, fontFamily: font.black },
  email: { fontSize: 15, fontFamily: font.medium, marginTop: 4 },
  rolPill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 14, paddingHorizontal: 16, paddingVertical: 8, borderRadius: radius.pill },
  rolText: { fontFamily: font.bold, fontSize: 15 },
  menuCard: { borderRadius: radius.lg, padding: 8, marginBottom: 16, ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: radius.md },
  rowTile: { width: 46, height: 46, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  rowTitle: { fontSize: 16, fontFamily: font.bold },
  rowSub: { fontSize: 13, fontFamily: font.medium, marginTop: 2 },
  divider: { height: 1, marginHorizontal: 12 },
  secCard: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: 16, ...shadow.card },
  secIcon: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  secTitle: { fontSize: 15, fontFamily: font.bold },
  secText: { fontSize: 13, fontFamily: font.regular, marginTop: 2 },
});
