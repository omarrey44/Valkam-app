import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { pickAndUpload } from '../lib/upload';
import { colors, font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

export default function PerfilEditar() {
  const { colors } = useTheme();
  const { profile, session, refreshProfile } = useAuth();
  const [nombre, setNombre] = useState(profile?.nombre ?? '');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile?.avatar_url ?? null);
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const inicial = (profile?.nombre ?? profile?.email ?? 'U').charAt(0).toUpperCase();

  async function pickAvatar() {
    if (!session?.user) return;
    try {
      setUploading(true);
      const url = await pickAndUpload('avatars', `avatar_${session.user.id}`);
      if (url) setAvatarUrl(url);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir la foto.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!session?.user) return;
    if (!nombre.trim()) return Alert.alert('Falta nombre', 'Escribe tu nombre.');

    if (newPass || confirmPass) {
      if (newPass.length < 6) return Alert.alert('Contraseña débil', 'Mínimo 6 caracteres.');
      if (newPass !== confirmPass) return Alert.alert('No coinciden', 'Las contraseñas no coinciden.');
    }

    setLoading(true);

    const { error: profileError } = await supabase
      .from('profiles')
      .update({ nombre: nombre.trim(), avatar_url: avatarUrl })
      .eq('id', session.user.id);

    if (profileError) {
      setLoading(false);
      return Alert.alert('Error', profileError.message);
    }

    if (newPass) {
      const { error: passError } = await supabase.auth.updateUser({ password: newPass });
      if (passError) {
        setLoading(false);
        return Alert.alert('Error al cambiar contraseña', passError.message);
      }
    }

    setLoading(false);
    await refreshProfile();
    router.back();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Avatar picker */}
      <TouchableOpacity style={styles.avatarWrap} onPress={pickAvatar} disabled={uploading} activeOpacity={0.8}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={styles.avatarImg} />
        ) : (
          <View style={styles.avatarPlaceholder}>
            <Text style={styles.avatarInitial}>{inicial}</Text>
          </View>
        )}
        <View style={styles.cameraBtn}>
          <Ionicons name={uploading ? 'hourglass-outline' : 'camera'} size={16} color={colors.primaryBright} />
        </View>
        <Text style={styles.hint}>{uploading ? 'Subiendo…' : 'Toca para cambiar foto'}</Text>
      </TouchableOpacity>

      {/* Info básica */}
      <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
      <Field label="Correo" value={profile?.email ?? ''} editable={false} />

      {/* Cambiar contraseña */}
      <Text style={styles.sectionTitle}>Cambiar contraseña</Text>
      <Text style={styles.sectionSub}>Deja vacío si no quieres cambiarla</Text>

      <View style={[styles.passField, { backgroundColor: colors.card }]}>
        <Text style={styles.passLabel}>Nueva contraseña</Text>
        <View style={styles.passRow}>
          <TextInput
            style={styles.passInput}
            value={newPass}
            onChangeText={setNewPass}
            placeholder="Mínimo 6 caracteres"
            placeholderTextColor={colors.textFaint}
            secureTextEntry={!showNew}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowNew((v) => !v)} hitSlop={8}>
            <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <View style={[styles.passField, { backgroundColor: colors.card }]}>
        <Text style={styles.passLabel}>Confirmar contraseña</Text>
        <View style={styles.passRow}>
          <TextInput
            style={styles.passInput}
            value={confirmPass}
            onChangeText={setConfirmPass}
            placeholder="Repite la contraseña"
            placeholderTextColor={colors.textFaint}
            secureTextEntry={!showConfirm}
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={() => setShowConfirm((v) => !v)} hitSlop={8}>
            <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      <Button title="Guardar cambios" onPress={save} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  avatarWrap: { alignItems: 'center', marginBottom: 24 },
  avatarImg: { width: 110, height: 110, borderRadius: 55 },
  avatarPlaceholder: {
    width: 110,
    height: 110,
    borderRadius: 55,
    backgroundColor: colors.primaryBright,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.blue,
  },
  avatarInitial: { color: '#fff', fontSize: 48, fontFamily: font.black },
  cameraBtn: {
    position: 'absolute',
    bottom: 20,
    right: '33%',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  hint: { marginTop: 6, fontSize: 12, fontFamily: font.medium, color: colors.textMuted },
  sectionTitle: { fontSize: 17, fontFamily: font.bold, color: colors.text, marginTop: 20, marginBottom: 2 },
  sectionSub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginBottom: 12 },
  passField: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 10,
    ...shadow.card,
  },
  passLabel: { fontSize: 13, fontFamily: font.semibold, color: colors.textMuted, marginBottom: 6 },
  passRow: { flexDirection: 'row', alignItems: 'center' },
  passInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: font.medium,
    color: colors.text,
  },
});
