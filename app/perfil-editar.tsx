import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Field } from '../components/ui';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { colors } from '../lib/theme';

export default function PerfilEditar() {
  const { profile, session, refreshProfile } = useAuth();
  const [nombre, setNombre] = useState(profile?.nombre ?? '');
  const [loading, setLoading] = useState(false);

  async function save() {
    if (!session?.user) return;
    if (!nombre.trim()) return Alert.alert('Falta nombre', 'Escribe tu nombre.');
    setLoading(true);
    const { error } = await supabase
      .from('profiles')
      .update({ nombre: nombre.trim() })
      .eq('id', session.user.id);
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    await refreshProfile();
    router.back();
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16 }}>
      <Field label="Nombre" value={nombre} onChangeText={setNombre} placeholder="Tu nombre" />
      <Field label="Correo" value={profile?.email ?? ''} editable={false} />
      <Button title="Guardar" onPress={save} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
