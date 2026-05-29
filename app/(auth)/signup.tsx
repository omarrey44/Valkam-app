import { Ionicons } from '@expo/vector-icons';
import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthShell from '../../components/AuthShell';
import IconField from '../../components/IconField';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { colors, font, radius, shadow } from '../../lib/theme';

export default function Signup() {
  const { session } = useAuth();
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  if (session) return <Redirect href="/(tabs)" />;

  async function onSignup() {
    setError(null);
    setOk(null);
    if (!nombre || !email || !password) {
      setError('Completa nombre, correo y contraseña');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { nombre: nombre.trim() } },
    });
    setLoading(false);
    if (error) return setError(error.message);
    if (!data.session) {
      setOk('Cuenta creada. Confirma tu correo (o pide al administrador que la active) para entrar.');
    }
  }

  return (
    <AuthShell>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.avatar}>
            <Ionicons name="person-add-outline" size={24} color={colors.primaryBright} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.title}>Crear cuenta</Text>
            <Text style={styles.subtitle}>Regístrate para empezar</Text>
          </View>
        </View>

        <Text style={styles.label}>Nombre</Text>
        <IconField icon="person-outline" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />

        <Text style={[styles.label, { marginTop: 16 }]}>Correo</Text>
        <IconField
          icon="mail-outline"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="correo@valmak.com"
        />

        <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
        <IconField
          icon="lock-closed-outline"
          value={password}
          onChangeText={setPassword}
          secureTextEntry={!show}
          placeholder="mínimo 6 caracteres"
          rightIcon={show ? 'eye-off-outline' : 'eye-outline'}
          onRightPress={() => setShow((s) => !s)}
        />

        {error && <Text style={styles.error}>{error}</Text>}
        {ok && <Text style={styles.ok}>{ok}</Text>}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onSignup}
          disabled={loading}
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
        >
          <Ionicons name="person-add-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>{loading ? 'Creando…' : 'Crear cuenta'}</Text>
        </TouchableOpacity>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>¿Ya tienes cuenta? </Text>
          <Link href="/(auth)/login" style={styles.signupLink}>
            Inicia sesión
          </Link>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.xl, padding: 24, ...shadow.float },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 22, fontFamily: font.bold, color: colors.text },
  subtitle: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 14, fontFamily: font.semibold, color: colors.text, marginBottom: 8 },
  error: { color: colors.danger, fontFamily: font.semibold, marginTop: 12 },
  ok: { color: colors.success, fontFamily: font.semibold, marginTop: 12 },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: colors.primaryBright,
    height: 54,
    borderRadius: radius.md,
    marginTop: 22,
    ...shadow.blue,
  },
  btnText: { color: '#fff', fontSize: 17, fontFamily: font.bold },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  signupText: { color: colors.textMuted, fontFamily: font.semibold },
  signupLink: { color: colors.primaryBright, fontFamily: font.bold },
});
