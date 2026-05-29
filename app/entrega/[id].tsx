import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import DateField from '../../components/DateField';
import GradientHeader from '../../components/GradientHeader';
import { Button, Card, Field } from '../../components/ui';
import { supabase } from '../../lib/supabase';
import { colors, font, gradients } from '../../lib/theme';
import { Entrega, Proyecto } from '../../lib/types';

function hoy() {
  return new Date().toISOString().slice(0, 10);
}

export default function EntregaScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [previa, setPrevia] = useState<Entrega | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const [f, setF] = useState({ fecha_entrega: hoy(), recibido_por: '', notas: '', firma_url: '' });

  const load = useCallback(async () => {
    const { data: p } = await supabase.from('proyectos').select('*, clientes(empresa)').eq('id', id).single();
    setProyecto((p as Proyecto) ?? null);
    const { data: e } = await supabase.from('entregas').select('*').eq('proyecto_id', id).maybeSingle();
    if (e) {
      const en = e as Entrega;
      setPrevia(en);
      setF({
        fecha_entrega: en.fecha_entrega,
        recibido_por: en.recibido_por ?? '',
        notas: en.notas ?? '',
        firma_url: en.firma_url ?? '',
      });
    }
    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function set<K extends keyof typeof f>(k: K, v: (typeof f)[K]) {
    setF((prev) => ({ ...prev, [k]: v }));
  }

  async function registrar() {
    setBusy(true);
    const { data: u } = await supabase.auth.getUser();
    const payload = {
      proyecto_id: id,
      fecha_entrega: f.fecha_entrega,
      recibido_por: f.recibido_por || null,
      notas: f.notas || null,
      firma_url: f.firma_url || null,
    };
    let error;
    if (previa) {
      ({ error } = await supabase.from('entregas').update(payload).eq('id', previa.id));
    } else {
      ({ error } = await supabase.from('entregas').insert({ ...payload, creado_por: u.user?.id }));
    }
    if (!error) {
      await supabase
        .from('proyectos')
        .update({ estado: 'completado', fecha_fin_real: f.fecha_entrega })
        .eq('id', id);
    }
    setBusy(false);
    if (error) return Alert.alert('Error', error.message);
    Alert.alert('Entrega registrada', 'Proyecto marcado como completado.');
    router.back();
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 48 }}>
      <GradientHeader
        colors={gradients.green}
        icon="cube-outline"
        eyebrow={proyecto?.clientes?.empresa ?? undefined}
        title="Entrega del equipo"
        subtitle={proyecto?.nombre_proyecto ?? ''}
        badge={previa ? { label: 'registrada' } : undefined}
      />

      <Card>
        <DateField label="Fecha de entrega" value={f.fecha_entrega} onChange={(v) => set('fecha_entrega', v)} />
        <Field label="Recibido por" value={f.recibido_por} onChangeText={(v) => set('recibido_por', v)} placeholder="Nombre de quien recibe" />
        <Field label="Notas / observaciones" value={f.notas} onChangeText={(v) => set('notas', v)} multiline />
        <Field label="Firma / acuse (URL)" value={f.firma_url} onChangeText={(v) => set('firma_url', v)} autoCapitalize="none" placeholder="Liga a foto/PDF de acuse (opcional)" />
        <Text style={styles.hint}>Al registrar, el proyecto pasa a “Completado”.</Text>
      </Card>

      <Button title={previa ? 'Actualizar entrega' : '✔ Registrar entrega'} onPress={registrar} loading={busy} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  hint: { fontFamily: font.regular, color: colors.textMuted, fontSize: 13, marginTop: 4 },
});
