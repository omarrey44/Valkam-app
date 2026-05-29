import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { FieldIcon } from './FieldIcon';
import SegmentSelect from './SegmentSelect';
import { supabase } from '../lib/supabase';
import { Cliente } from '../lib/types';
import { colors, estadoClienteColor, font, gradients, radius, shadow } from '../lib/theme';

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
  const [f, setF] = useState<ClienteInput>({ ...empty, ...initial });
  const [loading, setLoading] = useState(false);

  function set<K extends keyof ClienteInput>(k: K, v: ClienteInput[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!f.empresa.trim() || !f.correo_principal.trim()) {
      Alert.alert('Faltan datos', 'Empresa y correo principal son obligatorios.');
      return;
    }
    setLoading(true);
    if (clienteId) {
      const { error } = await supabase.from('clientes').update(f).eq('id', clienteId);
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
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
      onSaved((data as { id: string }).id);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <FieldIcon label="Empresa *" icon="business-outline" iconTint={colors.primaryBright} iconBg="#EAF1FE" value={f.empresa} onChangeText={(v) => set('empresa', v)} placeholder="Nombre de la empresa" />
      <FieldIcon label="Ingeniero (contacto)" icon="construct-outline" value={f.ingeniero ?? ''} onChangeText={(v) => set('ingeniero', v)} placeholder="Ingeniero a cargo" />
      <FieldIcon label="Solicitante" icon="person-outline" value={f.solicitante ?? ''} onChangeText={(v) => set('solicitante', v)} placeholder="Quien solicita" />
      <FieldIcon label="Nombre del proyecto" icon="briefcase-outline" value={f.nombre_proyecto ?? ''} onChangeText={(v) => set('nombre_proyecto', v)} placeholder="Proyecto" />
      <FieldIcon label="Descripción del proyecto" icon="create-outline" value={f.descripcion_proyecto ?? ''} onChangeText={(v) => set('descripcion_proyecto', v)} placeholder="Detalles del proyecto..." multiline />
      <FieldIcon label="Correo principal *" icon="mail-outline" iconTint={colors.success} iconBg="#DCFCE7" value={f.correo_principal} onChangeText={(v) => set('correo_principal', v)} autoCapitalize="none" keyboardType="email-address" placeholder="correo@empresa.com" />
      <FieldIcon label="Correos adicionales" icon="mail-open-outline" value={f.correos_adicionales ?? ''} onChangeText={(v) => set('correos_adicionales', v)} autoCapitalize="none" placeholder="separados por coma" />
      <FieldIcon label="Teléfono" icon="call-outline" value={f.telefono ?? ''} onChangeText={(v) => set('telefono', v)} keyboardType="phone-pad" placeholder="614-000-0000" />
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

      <TouchableOpacity activeOpacity={0.9} onPress={save} disabled={loading} style={{ marginTop: 6 }}>
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
  submit: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, height: 56, borderRadius: radius.lg, ...shadow.blue },
  submitText: { color: '#fff', fontFamily: font.bold, fontSize: 17 },
  footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 16 },
  footerText: { color: colors.textMuted, fontFamily: font.medium, fontSize: 13 },
});
