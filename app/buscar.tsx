import { Ionicons } from '@expo/vector-icons';
import { router, Stack } from 'expo-router';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import IconField from '../components/IconField';
import { supabase } from '../lib/supabase';
import { colors, font, radius, shadow } from '../lib/theme';
import { useTheme } from '../lib/themeContext';

type Resultado = {
  id: string;
  tipo: 'cliente' | 'cotizacion' | 'proyecto';
  titulo: string;
  subtitulo: string;
  ruta: string;
};

const TIPO_ICON: Record<string, keyof typeof Ionicons.glyphMap> = {
  cliente: 'business-outline',
  cotizacion: 'document-text-outline',
  proyecto: 'construct-outline',
};
const TIPO_COLOR: Record<string, string> = {
  cliente: colors.primaryBright,
  cotizacion: '#7C3AED',
  proyecto: colors.success,
};

export default function BuscarScreen() {
  const { colors } = useTheme();
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState<Resultado[]>([]);
  const [loading, setLoading] = useState(false);
  const [buscado, setBuscado] = useState(false);

  const buscar = useCallback(async (texto: string) => {
    if (texto.trim().length < 2) { setResultados([]); setBuscado(false); return; }
    setLoading(true);
    const t = texto.trim();

    const [{ data: cl }, { data: co }, { data: pr }] = await Promise.all([
      supabase.from('clientes').select('id, empresa, correo_principal').ilike('empresa', `%${t}%`).limit(5),
      supabase.from('cotizaciones').select('id, titulo, monto, moneda').ilike('titulo', `%${t}%`).limit(5),
      supabase.from('proyectos').select('id, nombre_proyecto, estado').ilike('nombre_proyecto', `%${t}%`).limit(5),
    ]);

    const res: Resultado[] = [
      ...((cl ?? []) as { id: string; empresa: string; correo_principal: string }[]).map((c) => ({
        id: c.id, tipo: 'cliente' as const,
        titulo: c.empresa, subtitulo: c.correo_principal,
        ruta: `/cliente/${c.id}`,
      })),
      ...((co ?? []) as { id: string; titulo: string; monto: number; moneda: string }[]).map((c) => ({
        id: c.id, tipo: 'cotizacion' as const,
        titulo: c.titulo, subtitulo: `${c.moneda} ${Number(c.monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`,
        ruta: `/cotizacion/${c.id}`,
      })),
      ...((pr ?? []) as { id: string; nombre_proyecto: string | null; estado: string }[]).map((p) => ({
        id: p.id, tipo: 'proyecto' as const,
        titulo: p.nombre_proyecto ?? 'Proyecto', subtitulo: p.estado,
        ruta: `/proyecto/${p.id}`,
      })),
    ];

    setResultados(res);
    setBuscado(true);
    setLoading(false);
  }, []);

  function onChange(text: string) {
    setQ(text);
    buscar(text);
  }

  return (
    <>
      <Stack.Screen options={{ title: 'Búsqueda global' }} />
      <View style={[styles.container, { backgroundColor: colors.bg }]}>
        <View style={styles.searchWrap}>
          <IconField
            icon="search-outline"
            placeholder="Buscar clientes, cotizaciones, proyectos..."
            value={q}
            onChangeText={onChange}
            autoFocus
            rightIcon={q ? 'close-circle' : undefined}
            onRightPress={() => { setQ(''); setResultados([]); setBuscado(false); }}
          />
        </View>

        {loading && <ActivityIndicator color={colors.primaryBright} style={{ marginTop: 24 }} />}

        {!loading && buscado && resultados.length === 0 && (
          <Text style={[styles.empty, { color: colors.textMuted }]}>Sin resultados para "{q}"</Text>
        )}

        {!loading && !buscado && (
          <View style={styles.hint}>
            <Ionicons name="search-circle-outline" size={56} color={colors.textFaint} />
            <Text style={[styles.hintText, { color: colors.textMuted }]}>Escribe al menos 2 caracteres</Text>
          </View>
        )}

        <FlatList
          data={resultados}
          keyExtractor={(r) => `${r.tipo}-${r.id}`}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          renderItem={({ item }) => {
            const tint = TIPO_COLOR[item.tipo] ?? colors.primaryBright;
            return (
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.card, { backgroundColor: colors.card }]}
                onPress={() => router.push(item.ruta as any)}
              >
                <View style={[styles.iconBox, { backgroundColor: tint + '18' }]}>
                  <Ionicons name={TIPO_ICON[item.tipo]} size={22} color={tint} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[styles.titulo, { color: colors.text }]} numberOfLines={1}>{item.titulo}</Text>
                  <Text style={[styles.sub, { color: colors.textMuted }]} numberOfLines={1}>{item.subtitulo}</Text>
                </View>
                <View style={[styles.tipoBadge, { backgroundColor: tint + '18' }]}>
                  <Text style={[styles.tipoText, { color: tint }]}>{item.tipo}</Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchWrap: { padding: 16, paddingBottom: 8 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: radius.lg, padding: 14, ...shadow.card },
  iconBox: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  titulo: { fontSize: 16, fontFamily: font.bold },
  sub: { fontSize: 13, fontFamily: font.medium, marginTop: 2 },
  tipoBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill },
  tipoText: { fontSize: 11, fontFamily: font.bold, textTransform: 'uppercase' },
  empty: { textAlign: 'center', fontFamily: font.medium, marginTop: 40 },
  hint: { alignItems: 'center', marginTop: 60, gap: 12 },
  hintText: { fontFamily: font.medium, fontSize: 15 },
});
