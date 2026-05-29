import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ClienteForm from '../../components/ClienteForm';
import { supabase } from '../../lib/supabase';
import {
  colors,
  estadoClienteColor,
  estadoColor,
  font,
  radius,
  shadow,
  whatsappUrl,
} from '../../lib/theme';
import { Cliente, Cotizacion } from '../../lib/types';

export default function ClienteDetalle() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [nProyectos, setNProyectos] = useState(0);
  const [ganado, setGanado] = useState(0);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.from('clientes').select('*').eq('id', id).single();
    setCliente((data as Cliente) ?? null);

    const { data: cot } = await supabase
      .from('cotizaciones')
      .select('*')
      .eq('cliente_id', id)
      .order('creado_en', { ascending: false });
    setCotizaciones((cot as Cotizacion[]) ?? []);

    const { count: np } = await supabase
      .from('proyectos')
      .select('id', { count: 'exact', head: true })
      .eq('cliente_id', id);
    setNProyectos(np ?? 0);

    const { data: fac } = await supabase
      .from('facturas')
      .select('monto, estado, proyectos!inner(cliente_id)')
      .eq('proyectos.cliente_id', id)
      .eq('estado', 'pagada');
    setGanado(((fac as { monto: number }[]) ?? []).reduce((s, f) => s + Number(f.monto), 0));

    setLoading(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  function confirmarEliminar() {
    Alert.alert('Eliminar cliente', '¿Seguro? No se puede deshacer.', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('clientes').delete().eq('id', id);
          if (error) return Alert.alert('Error', error.message);
          router.back();
        },
      },
    ]);
  }

  if (loading)
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!cliente) return <View style={styles.center} />;

  if (editing)
    return (
      <>
        <Stack.Screen options={{ title: cliente.empresa }} />
        <ClienteForm
          initial={cliente}
          clienteId={id}
          onSaved={() => {
            setEditing(false);
            load();
          }}
        />
      </>
    );

  const totalCotizado = cotizaciones.reduce((s, c) => s + Number(c.monto), 0);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
      <Stack.Screen
        options={{
          title: cliente.empresa,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: 16 }}>
              <TouchableOpacity onPress={() => setEditing(true)}>
                <Ionicons name="create-outline" size={22} color={colors.text} />
              </TouchableOpacity>
              <TouchableOpacity onPress={confirmarEliminar}>
                <Ionicons name="trash-outline" size={22} color={colors.danger} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      {/* Cabecera */}
      <View style={styles.headCard}>
        <View style={styles.headTop}>
          {cliente.logo_url ? (
            <Image source={{ uri: cliente.logo_url }} style={styles.avatar} />
          ) : (
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{cliente.empresa.charAt(0).toUpperCase()}</Text>
            </View>
          )}
          <View style={{ flex: 1, marginLeft: 14 }}>
            <Text style={styles.empresa}>{cliente.empresa}</Text>
            {!!cliente.ingeniero && <Text style={styles.sub}>Ing. {cliente.ingeniero}</Text>}
            <View style={[styles.estadoPill, { backgroundColor: estadoClienteColor[cliente.estado] + '1A' }]}>
              <Text style={[styles.estadoText, { color: estadoClienteColor[cliente.estado] }]}>
                {cliente.estado.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>

        {/* Contacto */}
        <View style={styles.contactRow}>
          {!!cliente.telefono && (
            <Contacto icon="call-outline" tint={colors.success} label="Llamar" onPress={() => Linking.openURL(`tel:${cliente.telefono}`)} />
          )}
          {!!cliente.telefono && (
            <Contacto icon="logo-whatsapp" tint="#25D366" label="WhatsApp" onPress={() => Linking.openURL(whatsappUrl(cliente.telefono!))} />
          )}
          <Contacto icon="mail-outline" tint={colors.primaryBright} label="Correo" onPress={() => Linking.openURL(`mailto:${cliente.correo_principal}`)} />
          {!!cliente.direccion && (
            <Contacto
              icon="location-outline"
              tint={colors.danger}
              label="Mapa"
              onPress={() =>
                Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(cliente.direccion!)}`)
              }
            />
          )}
        </View>
      </View>

      {/* Totales */}
      <View style={styles.statsRow}>
        <Stat value={`$${(totalCotizado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`} label="Cotizado" />
        <Stat value={`$${(ganado / 1000).toLocaleString('es-MX', { maximumFractionDigits: 0 })}k`} label="Ganado" tint={colors.success} />
      </View>
      <View style={styles.statsRow}>
        <Stat value={String(cotizaciones.length)} label="Cotizaciones" />
        <Stat value={String(nProyectos)} label="Proyectos" />
      </View>

      {/* Historial cotizaciones */}
      <Text style={styles.sectionTitle}>Cotizaciones</Text>
      {cotizaciones.length === 0 ? (
        <Text style={styles.empty}>Sin cotizaciones para este cliente.</Text>
      ) : (
        cotizaciones.slice(0, 8).map((c) => (
          <TouchableOpacity key={c.id} style={styles.cotCard} onPress={() => router.push(`/cotizacion/${c.id}`)}>
            <View style={{ flex: 1 }}>
              <Text style={styles.cotTitulo} numberOfLines={1}>{c.titulo}</Text>
              <Text style={styles.cotMonto}>
                {c.moneda} {c.monto.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={[styles.estadoPill, { backgroundColor: (estadoColor[c.estado] ?? colors.textMuted) + '1A' }]}>
              <Text style={[styles.estadoText, { color: estadoColor[c.estado] ?? colors.textMuted }]}>
                {c.estado.toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        ))
      )}
    </ScrollView>
  );
}

function Contacto({
  icon,
  tint,
  label,
  onPress,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  tint: string;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.contacto} onPress={onPress}>
      <View style={[styles.contactoIcon, { backgroundColor: tint + '15' }]}>
        <Ionicons name={icon} size={20} color={tint} />
      </View>
      <Text style={styles.contactoLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function Stat({ value, label, tint }: { value: string; label: string; tint?: string }) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statValue, tint && { color: tint }]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bg },
  headCard: { backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, marginBottom: 12, ...shadow.card },
  headTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: '#EAF1FE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { fontSize: 24, fontFamily: font.black, color: colors.primaryBright },
  empresa: { fontSize: 18, fontFamily: font.bold, color: colors.text },
  sub: { fontSize: 13, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  estadoPill: { alignSelf: 'flex-start', marginTop: 6, paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  estadoText: { fontSize: 10, fontFamily: font.bold, letterSpacing: 0.3 },
  contactRow: { flexDirection: 'row', justifyContent: 'space-around', marginTop: 18 },
  contacto: { alignItems: 'center', gap: 6 },
  contactoIcon: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  contactoLabel: { fontSize: 12, fontFamily: font.semibold, color: colors.textMuted },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  stat: { flex: 1, backgroundColor: colors.card, borderRadius: radius.lg, padding: 16, alignItems: 'center', ...shadow.card },
  statValue: { fontSize: 20, fontFamily: font.black, color: colors.primaryBright },
  statLabel: { fontSize: 12, fontFamily: font.medium, color: colors.textMuted, marginTop: 2 },
  sectionTitle: { fontSize: 17, fontFamily: font.bold, color: colors.text, marginTop: 8, marginBottom: 10 },
  cotCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
    ...shadow.card,
  },
  cotTitulo: { fontSize: 15, fontFamily: font.bold, color: colors.text },
  cotMonto: { fontSize: 14, fontFamily: font.semibold, color: colors.primaryBright, marginTop: 2 },
  empty: { color: colors.textMuted, fontFamily: font.regular },
});
