import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Button, Field } from './ui';
import DateField from './DateField';
import SegmentSelect from './SegmentSelect';
import UserPicker from './UserPicker';
import { supabase } from '../lib/supabase';
import { colors, prioridadColor, estadoTareaColor } from '../lib/theme';
import { Tarea } from '../lib/types';

const PRIORIDADES = [
  { value: 'baja', label: 'Baja' },
  { value: 'media', label: 'Media' },
  { value: 'alta', label: 'Alta' },
  { value: 'urgente', label: 'Urgente' },
];
const ESTADOS = [
  { value: 'pendiente', label: 'Pendiente' },
  { value: 'en_progreso', label: 'En progreso' },
  { value: 'completada', label: 'Completada' },
  { value: 'cancelada', label: 'Cancelada' },
];

const emptyState = {
  titulo: '',
  descripcion: '',
  prioridad: 'media',
  estado: 'pendiente',
  asignado_a: null as string | null,
  fecha_vencimiento: '',
};

export default function TareaModal({
  visible,
  proyectoId,
  tarea,
  onClose,
  onSaved,
}: {
  visible: boolean;
  proyectoId: string;
  tarea?: Tarea | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [f, setF] = useState(emptyState);

  useEffect(() => {
    if (tarea)
      setF({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion ?? '',
        prioridad: tarea.prioridad,
        estado: tarea.estado,
        asignado_a: tarea.asignado_a,
        fecha_vencimiento: tarea.fecha_vencimiento ?? '',
      });
    else setF(emptyState);
  }, [tarea, visible]);

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function save() {
    if (!f.titulo.trim()) return Alert.alert('Falta título', 'La tarea necesita un título.');
    const completada = f.estado === 'completada';
    const base = {
      titulo: f.titulo,
      descripcion: f.descripcion || null,
      prioridad: f.prioridad,
      estado: f.estado,
      asignado_a: f.asignado_a,
      fecha_vencimiento: f.fecha_vencimiento || null,
      fecha_completada: completada ? new Date().toISOString().slice(0, 10) : null,
    };
    setLoading(true);
    if (tarea) {
      const { error } = await supabase.from('tareas').update(base).eq('id', tarea.id);
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
    } else {
      const { data: u } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('tareas')
        .insert({ ...base, proyecto_id: proyectoId, creado_por: u.user?.id });
      setLoading(false);
      if (error) return Alert.alert('Error', error.message);
    }
    onSaved();
  }

  async function eliminar() {
    if (!tarea) return;
    const { error } = await supabase.from('tareas').delete().eq('id', tarea.id);
    if (error) return Alert.alert('Error', error.message);
    onSaved();
  }

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{tarea ? 'Editar tarea' : 'Nueva tarea'}</Text>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.close}>Cerrar</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
        <Field label="Título *" value={f.titulo} onChangeText={(v) => set('titulo', v)} />
        <Field label="Descripción" value={f.descripcion} onChangeText={(v) => set('descripcion', v)} multiline />
        <SegmentSelect label="Prioridad" options={PRIORIDADES} value={f.prioridad} onChange={(v) => set('prioridad', v)} colorMap={prioridadColor} />
        <SegmentSelect label="Estado" options={ESTADOS} value={f.estado} onChange={(v) => set('estado', v)} colorMap={estadoTareaColor} />
        <UserPicker label="Asignado a" value={f.asignado_a} onChange={(v) => set('asignado_a', v)} />
        <DateField label="Vence" value={f.fecha_vencimiento} onChange={(v) => set('fecha_vencimiento', v)} clearable />
        <Button title={tarea ? 'Guardar' : 'Crear tarea'} onPress={save} loading={loading} />
        {tarea && (
          <View style={{ marginTop: 10 }}>
            <Button title="Eliminar tarea" variant="danger" onPress={eliminar} />
          </View>
        )}
      </ScrollView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 56,
    backgroundColor: colors.primary,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  close: { color: '#fff', fontWeight: '600' },
});
