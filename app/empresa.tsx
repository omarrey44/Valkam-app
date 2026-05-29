import { Ionicons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Button, Field } from '../components/ui';
import { invalidateEmpresaCache } from '../lib/empresaConfig';
import { supabase } from '../lib/supabase';
import { pickAndUpload } from '../lib/upload';
import { font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

const CONFIG_ID = '00000000-0000-0000-0000-000000000001';

export default function EmpresaScreen() {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [f, setF] = useState({
    nombre: '', slogan: '', rfc: '', direccion: '', telefono: '', correo: '', logo_url: '',
  });

  useEffect(() => {
    supabase.from('empresa_config').select('*').single().then(({ data }) => {
      if (data) {
        setF({
          nombre: data.nombre ?? '',
          slogan: data.slogan ?? '',
          rfc: data.rfc ?? '',
          direccion: data.direccion ?? '',
          telefono: data.telefono ?? '',
          correo: data.correo ?? '',
          logo_url: data.logo_url ?? '',
        });
      }
      setLoading(false);
    });
  }, []);

  function set<K extends keyof typeof f>(k: K, v: string) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function pickLogo() {
    setUploadingLogo(true);
    try {
      const url = await pickAndUpload('logos', 'empresa_logo');
      if (url) set('logo_url', url);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setUploadingLogo(false);
    }
  }

  async function save() {
    if (!f.nombre.trim()) return Alert.alert('Falta nombre', 'El nombre de la empresa es obligatorio.');
    setSaving(true);
    const { error } = await supabase.from('empresa_config').update({
      nombre: f.nombre.trim(),
      slogan: f.slogan || null,
      rfc: f.rfc || null,
      direccion: f.direccion || null,
      telefono: f.telefono || null,
      correo: f.correo || null,
      logo_url: f.logo_url || null,
      actualizado_en: new Date().toISOString(),
    }).eq('id', CONFIG_ID);
    setSaving(false);
    if (error) return Alert.alert('Error', error.message);
    invalidateEmpresaCache();
    Alert.alert('Guardado', 'Configuración de empresa actualizada.');
  }

  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <>
      <Stack.Screen options={{ title: 'Configuración de empresa' }} />
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>

        {/* Logo */}
        <TouchableOpacity style={[styles.logoWrap, { backgroundColor: colors.card }]} onPress={pickLogo} disabled={uploadingLogo} activeOpacity={0.8}>
          {f.logo_url ? (
            <Image source={{ uri: f.logo_url }} style={styles.logoImg} resizeMode="contain" />
          ) : (
            <View style={styles.logoPlaceholder}>
              <Ionicons name="business-outline" size={40} color={colors.textFaint} />
              <Text style={[styles.logoHint, { color: colors.textMuted }]}>Sin logo</Text>
            </View>
          )}
          <View style={[styles.cameraBtn, { backgroundColor: colors.card }]}>
            <Ionicons name={uploadingLogo ? 'hourglass-outline' : 'camera'} size={16} color={colors.primaryBright} />
          </View>
          <Text style={[styles.uploadHint, { color: colors.textMuted }]}>{uploadingLogo ? 'Subiendo…' : 'Toca para cambiar logo'}</Text>
        </TouchableOpacity>

        <Field label="Nombre de empresa *" value={f.nombre} onChangeText={(v) => set('nombre', v)} />
        <Field label="Slogan" value={f.slogan} onChangeText={(v) => set('slogan', v)} placeholder="Ingeniería en Diseño y Automatización" />
        <Field label="RFC" value={f.rfc} onChangeText={(v) => set('rfc', v)} autoCapitalize="characters" placeholder="VABC123456XYZ" />
        <Field label="Dirección" value={f.direccion} onChangeText={(v) => set('direccion', v)} multiline placeholder="Calle, ciudad, estado..." />
        <Field label="Teléfono" value={f.telefono} onChangeText={(v) => set('telefono', v)} keyboardType="phone-pad" />
        <Field label="Correo" value={f.correo} onChangeText={(v) => set('correo', v)} autoCapitalize="none" keyboardType="email-address" />

        <Button title="Guardar configuración" onPress={save} loading={saving} />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  logoWrap: { alignItems: 'center', borderRadius: radius.lg, padding: 20, marginBottom: 20, ...shadow.card },
  logoImg: { width: 120, height: 80 },
  logoPlaceholder: { alignItems: 'center', gap: 8 },
  logoHint: { fontFamily: font.medium, fontSize: 14 },
  cameraBtn: { position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', ...shadow.card },
  uploadHint: { fontFamily: font.regular, fontSize: 12, marginTop: 8 },
});
