import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Link, Redirect } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AuthShell from '../../components/AuthShell';
import IconField from '../../components/IconField';
import { useAuth } from '../../lib/auth';
import { authenticateWithBiometric, isBiometricAvailable } from '../../lib/biometric';
import { colors, font, radius, shadow } from '../../lib/theme';

const BIOMETRIC_KEY = '@valmak_biometric_enabled';

export default function Login() {
  const { session, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvail, setBiometricAvail] = useState(false);

  useEffect(() => {
    if (session) return;
    isBiometricAvailable().then(async (avail) => {
      if (!avail) return;
      const enabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
      if (enabled === 'true') {
        setBiometricAvail(true);
        tryBiometric();
      } else {
        setBiometricAvail(true);
      }
    });
  }, [session]);

  if (session) return <Redirect href="/(tabs)" />;

  async function tryBiometric() {
    const ok = await authenticateWithBiometric();
    if (ok) {
      const savedEmail = await AsyncStorage.getItem('@valmak_email');
      const savedPass = await AsyncStorage.getItem('@valmak_pass');
      if (savedEmail && savedPass) {
        setLoading(true);
        await signIn(savedEmail, savedPass);
        setLoading(false);
      }
    }
  }

  async function onLogin() {
    setError(null);
    if (!email || !password) { setError('Ingresa correo y contraseña'); return; }
    setLoading(true);
    const { error } = await signIn(email.trim(), password);
    setLoading(false);
    if (error) { setError(error); return; }
    // Guardar credenciales para biometría futura
    if (biometricAvail) {
      await AsyncStorage.setItem('@valmak_email', email.trim());
      await AsyncStorage.setItem('@valmak_pass', password);
      await AsyncStorage.setItem(BIOMETRIC_KEY, 'true');
    }
  }

  return (
    <AuthShell>
      <View style={styles.card}>
        <View style={styles.cardHead}>
          <View style={styles.avatar}>
            <Ionicons name="person-outline" size={26} color={colors.primaryBright} />
          </View>
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.title}>Iniciar sesión</Text>
            <Text style={styles.subtitle}>Ingresa tus credenciales para continuar</Text>
          </View>
        </View>

        <Text style={styles.label}>Correo</Text>
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
          placeholder="••••••••"
          rightIcon={show ? 'eye-off-outline' : 'eye-outline'}
          onRightPress={() => setShow((s) => !s)}
        />

        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity
          activeOpacity={0.9}
          onPress={onLogin}
          disabled={loading}
          style={[styles.btn, { opacity: loading ? 0.7 : 1 }]}
        >
          <Ionicons name="log-in-outline" size={20} color="#fff" />
          <Text style={styles.btnText}>{loading ? 'Entrando…' : 'Entrar'}</Text>
        </TouchableOpacity>

        {biometricAvail && (
          <TouchableOpacity style={styles.bioBtn} onPress={tryBiometric}>
            <Ionicons name="finger-print-outline" size={26} color={colors.primaryBright} />
            <Text style={styles.bioText}>Entrar con huella / Face ID</Text>
          </TouchableOpacity>
        )}

        <View style={styles.divider}>
          <View style={styles.line} />
          <Text style={styles.or}>o</Text>
          <View style={styles.line} />
        </View>

        <View style={styles.signupRow}>
          <Text style={styles.signupText}>¿No tienes cuenta? </Text>
          <Link href="/(auth)/signup" style={styles.signupLink}>Regístrate</Link>
        </View>
      </View>
    </AuthShell>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: '#fff', borderRadius: radius.xl, padding: 24, ...shadow.float },
  cardHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#EAF1FE', alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 22, fontFamily: font.bold, color: colors.text },
  subtitle: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  label: { fontSize: 14, fontFamily: font.semibold, color: colors.text, marginBottom: 8 },
  error: { color: colors.danger, fontFamily: font.semibold, marginTop: 12 },
  btn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: colors.primaryBright, height: 54, borderRadius: radius.md, marginTop: 22, ...shadow.blue },
  btnText: { color: '#fff', fontSize: 17, fontFamily: font.bold },
  bioBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 14, paddingVertical: 12 },
  bioText: { color: colors.primaryBright, fontFamily: font.semibold, fontSize: 15 },
  divider: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 22 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
  or: { color: colors.textFaint, fontFamily: font.medium },
  signupRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 18 },
  signupText: { color: colors.textMuted, fontFamily: font.semibold },
  signupLink: { color: colors.primaryBright, fontFamily: font.bold },
});
