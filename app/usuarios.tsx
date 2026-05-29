import { Redirect, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Card } from '../components/ui';
import SegmentSelect from '../components/SegmentSelect';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';
import { useTheme } from '../lib/themeContext';
import { Profile, Rol } from '../lib/types';

const ROLES = [
  { value: 'vendedor', label: 'Vendedor' },
  { value: 'aprobador', label: 'Aprobador' },
  { value: 'administrador', label: 'Admin' },
];

export default function Usuarios() {
  const { colors } = useTheme();
  const { profile, session } = useAuth();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data } = await supabase.from('profiles').select('*').order('creado_en');
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  // Solo administrador entra
  if (profile && profile.rol !== 'administrador') return <Redirect href="/(tabs)/perfil" />;

  async function cambiarRol(u: Profile, rol: Rol) {
    if (u.rol === rol) return;
    setSaving(u.id);
    const { error } = await supabase.from('profiles').update({ rol }).eq('id', u.id);
    setSaving(null);
    if (error) return Alert.alert('Error', error.message);
    setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, rol } : x)));
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <FlatList
      style={{ backgroundColor: colors.bg }}
      contentContainerStyle={{ padding: 16 }}
      data={users}
      keyExtractor={(u) => u.id}
      ListHeaderComponent={
        <Text style={styles.intro}>Asigna roles. Solo el administrador puede cambiarlos.</Text>
      }
      renderItem={({ item }) => (
        <Card>
          <Text style={[styles.nombre, { color: colors.text }]}>
            {item.nombre ?? item.email}
            {item.id === session?.user?.id ? '  (tú)' : ''}
          </Text>
          <Text style={styles.email}>{item.email}</Text>
          <View style={{ marginTop: 10, opacity: saving === item.id ? 0.5 : 1 }}>
            <SegmentSelect
              options={ROLES}
              value={item.rol}
              onChange={(v) => cambiarRol(item, v as Rol)}
            />
          </View>
        </Card>
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  intro: { color: colors.textMuted, marginBottom: 12 },
  nombre: { fontSize: 16, fontWeight: '800', color: colors.text },
  email: { color: colors.textMuted, marginTop: 2 },
});
