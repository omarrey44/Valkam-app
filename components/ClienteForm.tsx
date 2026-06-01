import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import { Alert, BackHandler, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { FieldIcon } from './FieldIcon';
import SegmentSelect from './SegmentSelect';
import { supabase } from '../lib/supabase';
import { pickAndUpload } from '../lib/upload';
import { logActividad } from '../lib/actividad';
import { formatPhone } from '../lib/phone';
import { validateEmail, validateRequired } from '../lib/validation';
import { Cliente } from '../lib/types';
import { colors, estadoClienteColor, font, gradients, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

export type ClienteInput = Omit<Cliente, 'id' | 'creado_por' | 'creado_en' | 'actualizado_en'>;

const empty: ClienteInput = {
  empresa: '',
  ingeniero: '',
  solicitante: '',
  nombre_proyecto: '',
  descripcion_proyecto: '',
  correo_principal: '',
  correos_adicionales: '',
  telefono: '',
  direccion: '',
  estado: 'activo',
  logo_url: null,
};

export default function ClienteForm({
  initial,
  clienteId,
  onSaved,
}: {
  initial?: Partial<ClienteInput>;
  clienteId?: string;
  onSaved: (id: string) => void;
}) {
  const { colors } = useTheme();
  const [f, setF] = useState<ClienteInput>({ ...empty, ...initial });
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [errors, setErrors] = useState<{ empresa?: string; correo?: string }>({});

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        if (!dirty) return false;
        Alert.alert('¿Descartar cambios?', 'Tienes cambios sin guardar.', [
          { text: 'Seguir editando', style: 'cancel' },
          { text: 'Descartar', style: 'destructive', onPress: () => BackHandler.exitApp() },
        ]);
        return true;
      });
      return () => sub.remove();
    }, [dirty])
  );

  function set<K extends keyof ClienteInput>(k: K, v: ClienteInput[K]) {
    setDirty(true);
    setF((prev) => ({ ...prev, [k]: v }));
  }

  function validateFields() {
    const e: typeof errors = {};
    const reqEmpresa = validateRequired(f.empresa, 'Empresa');
    if (reqEmpresa) e.empresa = reqEmpresa;
    const emailErr = validateEmail(f.correo_principal);
    if (emailErr) e.correo = emailErr;
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function pickLogo() {
    try {
      setUploading(true);
      const id = clienteId ?? `tmp_${Date.now()}`;
      const url = await pickAndUpload('logos', `cliente_${id}`);
      if (url) set('logo_url', url);
    } catch (e: any) {
      Alert.alert('Error', e.message ?? 'No se pudo subir el logo.');
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    if (!validateFields()) return;
    setLoading(true);
    if (clienteId) {
      const { error } = await supabase.from('clientes').update(f).eq('id', clienteId);
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      logActividad('editó', 'cliente', clienteId, `Cliente: ${f.empresa}`);
      onSaved(clienteId);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('clientes')
        .insert({ ...f, creado_por: u.user?.id })
        .select('id')
        .single();
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
      const newId = (data as { id: string }).id;
      logActividad('creó', 'cliente', newId, `Cliente: ${f.empresa}`);
      onSaved(newId);
    }
  }

  const inicial = f.empresa.trim().charAt(0).toUpperCase() || '?';

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      {/* Logo picker */}
      <TouchableOpacity style={styles.logoWrap} onPress={pickLogo} disabled={uploading} activeOpacity={0.8}>
        {f.logo_url ? (
          <Image source={{ uri: f.logo_url }} style={styles.logoImg} />
        ) : (
          <View style={[styles.logoPlaceholder, { backgroundColor: colors.card }]}>
            <Text style={styles.logoInitial}>{inicial}</Text>
          </View>
        )}
        <View style={[styles.cameraBtn, { backgroundColor: colors.card }]}>
          <Ionicons name={uploading ? 'hourglass-outline' : 'camera'} size={16} color={colors.primaryBright} />
        </View>
        <Text style={[styles.logoHint, { color: colors.textMuted }]}>{uploading ? 'Subiendo…' : 'Toca para subir logo'}</Text>
      </TouchableOpacity>

      <FieldIcon label="Empresa *" icon="business-outline" iconTint={colors.primaryBright} iconBg="#EAF1FE" value={f.empresa} onChangeText={(v) => set('empresa', v)} placeholder="Nombre de la empresa" error={errors.empresa} onBlur={() => setErrors(e => ({ ...e, empresa: validateRequired(f.empresa, 'Empresa') ?? undefined }))} />
      <FieldIcon label="Ingeniero (contacto)" icon="construct-outline" value={f.ingeniero ?? ''} onChangeText={(v) => set('ingeniero', v)} placeholder="Ingeniero a cargo" />
      <FieldIcon label="Solicitante" icon="person-outline" value={f.solicitante ?? ''} onChangeText={(v) => set('solicitante', v)} placeholder="Quien solicita" />
      <FieldIcon label="Nombre del proyecto" icon="briefcase-outline" value={f.nombre_proyecto ?? ''} onChangeText={(v) => set('nombre_proyecto', v)} placeholder="Proyecto" />
      <FieldIcon label="Descripción del proyecto" icon="create-outline" value={f.descripcion_proyecto ?? ''} onChangeText={(v) => set('descripcion_proyecto', v)} placeholder="Detalles del proyecto..." multiline />
      <FieldIcon label="Correo principal *" icon="mail-outline" iconTint={colors.success} iconBg="#DCFCE7" value={f.correo_principal} onChangeText={(v) => set('correo_principal', v)} autoCapitalize="none" keyboardType="email-address" placeholder="correo@empresa.com" error={errors.correo} onBlur={() => setErrors(e => ({ ...e, correo: validateEmail(f.correo_principal) ?? undefined }))} />
      <FieldIcon label="Correos adicionales" icon="mail-open-outline" value={f.correos_adicionales ?? ''} onChangeText={(v) => set('correos_adicionales', v)} autoCapitalize="none" placeholder="separados por coma" />
      <FieldIcon label="Teléfono" icon="call-outline" value={f.telefono ?? ''} onChangeText={(v) => set('telefono', formatPhone(v))} keyboardType="phone-pad" placeholder="(614) 000-0000" />
      <FieldIcon label="Dirección" icon="location-outline" value={f.direccion ?? ''} onChangeText={(v) => set('direccion', v)} placeholder="Calle, ciudad..." multiline />

      <SegmentSelect
        label="Estado"
        options={[
          { value: 'prospecto', label: 'Prospecto' },
          { value: 'activo', label: 'Activo' },
          { value: 'inactivo', label: 'Inactivo' },
        ]}
        value={f.estado}
        onChange={(v) => set('estado', v as ClienteInput['estado'])}
        colorMap={estadoClienteColor}
      />

      <TouchableOpacity activeOpacity={0.9} onPress={save} disabled={loading || uploading} style={{ marginTop: 6 }}>
        <LinearGradient colors={gradients.blue} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={[styles.submit, { opacity: loading ? 0.7 : 1 }]}>
          <Ionicons name={clienteId ? 'save-outline' : 'business-outline'} size={20} color="#fff" />
          <Text style={styles.submitText}>{loading ? 'Guardando…' : clienteId ? 'Guardar cambios' : 'Crear cliente'}</Text>
        </LinearGradient>
      </TouchableOpacity>

      <View style={styles.footer}>
        <Ionicons name="shield-checkmark-outline" size={15} color={colors.textMuted} />
        <Text style={styles.footerText}>La información que ingreses está protegida</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  logoWrap: { alignItems: 'center', marginBottom: 20 },
  logoImg: { width: 100, height: 100, borderRadius: radius.lg, backgroundColor: colors.card },
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: radius.lg,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoInitial: { fontSize: 40, fontFamily: font.black, color: colors.primaryBright },
  cameraBtn: {
    position: 'absolute',
    bottom: 22,
    right: '31%',
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  logoHint: { marginTop: 6, fontSize: 12, fontFamily: font.medium, color: colors.textMuted },
  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: radius.lg, ...shadow.blue },
  submitText: { color: '#fff', fontFamily: font.bold, fontSize: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerText: { color: colors.textMuted, fontFamily: font.medium, fontSize: 13 },
});
