import { Ionicons } from '@expo/vector-icons';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, TouchableOpacity, View } from 'react-native';
import InventarioForm from '../../components/InventarioForm';
import { supabase } from '../../lib/supabase';
import { colors } from '../../lib/theme';
import { useTheme } from '../../lib/themeContext';
import { InventarioItem } from '../../lib/types';

export default function InventarioDetalle() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [item, setItem] = useState<InventarioItem | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('inventario')
      .select('*')
      .eq('id', id)
      .single()
      .then(({ data }) => {
        setItem((data as InventarioItem) ?? null);
        setLoading(false);
      });
  }, [id]);

  function confirmarEliminar() {
    Alert.alert('Eliminar artículo', '¿Seguro?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          const { error } = await supabase.from('inventario').delete().eq('id', id);
          if (error) return Alert.alert('Error', error.message);
          router.back();
        },
      },
    ]);
  }

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  if (!item) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <>
      <Stack.Screen
        options={{
          title: item.nombre,
          headerRight: () => (
            <TouchableOpacity onPress={confirmarEliminar}>
              <Ionicons name="trash-outline" size={22} color={colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <InventarioForm initial={item} itemId={id} onSaved={() => router.back()} />
    </>
  );
}
