import { Redirect, Tabs } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import FloatingTabBar from '../../components/FloatingTabBar';
import { useAuth } from '../../lib/auth';
import { registerPushToken } from '../../lib/notifications';
import { supabase } from '../../lib/supabase';
import { colors, font } from '../../lib/theme';

export default function TabsLayout() {
  const { session, loading } = useAuth();
  const [pendientes, setPendientes] = useState(0);

  async function refreshCount() {
    const { count } = await supabase
      .from('cotizaciones')
      .select('id', { count: 'exact', head: true })
      .eq('estado', 'pendiente');
    setPendientes(count ?? 0);
  }

  useEffect(() => {
    if (!session?.user) return;
    refreshCount();
    registerPushToken(session.user.id);

    // Realtime: recalcula el contador ante cualquier cambio en cotizaciones
    const channel = supabase
      .channel('cotizaciones-pendientes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cotizaciones' },
        () => refreshCount()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [session?.user?.id]);

  if (loading)
    return (
      <View style={{ flex: 1, justifyContent: 'center', backgroundColor: colors.bg }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );

  if (!session) return <Redirect href="/(auth)/login" />;

  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...(props as any)} />}
      screenOptions={{
        headerStyle: { backgroundColor: colors.card },
        headerTintColor: colors.text,
        headerTitleStyle: { fontFamily: font.bold, color: colors.text },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Cotizaciones' }} />
      <Tabs.Screen name="clientes" options={{ title: 'Clientes' }} />
      <Tabs.Screen name="proyectos" options={{ title: 'Proyectos', headerShown: false }} />
      <Tabs.Screen
        name="pendientes"
        options={{ title: 'Pendientes', tabBarBadge: pendientes > 0 ? pendientes : undefined }}
      />
      <Tabs.Screen name="perfil" options={{ title: 'Perfil', headerShown: false }} />
    </Tabs>
  );
}
