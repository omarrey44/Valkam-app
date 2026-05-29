import { useState } from 'react';
import { Alert, ScrollView, StyleSheet } from 'react-native';
import { Button, Field } from './ui';
import DateField from './DateField';
import SegmentSelect from './SegmentSelect';
import UserPicker from './UserPicker';
import { supabase } from '../lib/supabase';
import { colors, estadoProyectoColor } from '../lib/theme';
import { useTheme } from '../lib/themeContext';
import { Proyecto } from '../lib/types';

const ESTADOS = [
  { value: 'programado', label: 'Programado' },
  { value: 'en_proceso', label: 'En proceso' },
  { value: 'validacion', label: 'Validación' },
  { value: 'completado', label: 'Completado' },
  { value: 'cancelado', label: 'Cancelado' },
];

export default function ProyectoForm({
  initial,
  proyectoId,
  onSaved,
}: {
  initial: Proyecto;
  proyectoId: string;
  onSaved: () => void;
}) {
  const { colors } = useTheme();
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState({
    nombre_proyecto: initial.nombre_proyecto ?? '',
    descripcion: initial.descripcion ?? '',
    fecha_inicio: initial.fecha_inicio ?? '',
    fecha_fin_estimada: initial.fecha_fin_estimada ?? '',
    fecha_fin_real: initial.fecha_fin_real ?? '',
    estado: initial.estado as string,
    responsable: initial.responsable as string | null,
  });

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    setLoading(true);
    const { error } = await supabase
      .from('proyectos')
      .update({
        nombre_proyecto: f.nombre_proyecto || null,
        descripcion: f.descripcion || null,
        fecha_inicio: f.fecha_inicio || null,
        fecha_fin_estimada: f.fecha_fin_estimada || null,
        fecha_fin_real: f.fecha_fin_real || null,
        estado: f.estado,
        responsable: f.responsable,
      })
      .eq('id', proyectoId);
    setLoading(false);
    if (error) return Alert.alert('Error', error.message);
    onSaved();
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.bg }]} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <Field label="Nombre del proyecto" value={f.nombre_proyecto} onChangeText={(v) => set('nombre_proyecto', v)} />
      <Field label="Descripción" value={f.descripcion} onChangeText={(v) => set('descripcion', v)} multiline />
      <DateField label="Fecha inicio" value={f.fecha_inicio} onChange={(v) => set('fecha_inicio', v)} clearable />
      <DateField label="Fecha fin estimada" value={f.fecha_fin_estimada} onChange={(v) => set('fecha_fin_estimada', v)} clearable />
      <DateField label="Fecha fin real" value={f.fecha_fin_real} onChange={(v) => set('fecha_fin_real', v)} clearable />
      <UserPicker label="Responsable" value={f.responsable} onChange={(v) => set('responsable', v)} />
      <SegmentSelect
        label="Estado"
        options={ESTADOS}
        value={f.estado}
        onChange={(v) => set('estado', v)}
        colorMap={estadoProyectoColor}
      />
      <Button title="Guardar cambios" onPress={save} loading={loading} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
});
