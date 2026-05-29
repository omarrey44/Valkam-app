import {
  Manrope_400Regular,
  Manrope_500Medium,
  Manrope_600SemiBold,
} from '@expo-google-fonts/manrope';
import {
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
  useFonts,
} from '@expo-google-fonts/sora';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '../lib/auth';
import { colors, font } from '../lib/theme';

export default function RootLayout() {
  const [loaded] = useFonts({
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
    Manrope_400Regular,
    Manrope_500Medium,
    Manrope_600SemiBold,
  });

  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.card },
            headerTintColor: colors.text,
            headerTitleStyle: { fontFamily: font.bold, color: colors.text },
            headerShadowVisible: false,
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/signup" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen
            name="cliente/nuevo"
            options={{ title: 'Nuevo cliente', presentation: 'modal' }}
          />
          <Stack.Screen name="cliente/[id]" options={{ title: 'Cliente' }} />
          <Stack.Screen
            name="cotizacion/nueva"
            options={{ title: 'Nueva cotización', presentation: 'modal' }}
          />
          <Stack.Screen name="cotizacion/[id]" options={{ title: 'Cotización' }} />
          <Stack.Screen name="po/index" options={{ title: 'Órdenes de compra' }} />
          <Stack.Screen
            name="po/nueva"
            options={{ title: 'Nueva PO', presentation: 'modal' }}
          />
          <Stack.Screen name="po/[id]" options={{ title: 'Orden de compra' }} />
          <Stack.Screen name="proyecto/[id]" options={{ title: 'Proyecto' }} />
          <Stack.Screen name="factura/index" options={{ title: 'Facturas' }} />
          <Stack.Screen name="factura/[id]" options={{ title: 'Factura' }} />
          <Stack.Screen name="dashboard" options={{ title: 'Dashboard productividad' }} />
          <Stack.Screen name="perfil-editar" options={{ title: 'Editar perfil' }} />
          <Stack.Screen name="usuarios" options={{ title: 'Usuarios y roles' }} />
          <Stack.Screen name="inventario/index" options={{ title: 'Inventario' }} />
          <Stack.Screen name="inventario/nuevo" options={{ title: 'Nuevo artículo', presentation: 'modal' }} />
          <Stack.Screen name="inventario/[id]" options={{ title: 'Artículo' }} />
          <Stack.Screen name="validacion/[id]" options={{ title: 'Validación' }} />
          <Stack.Screen name="entrega/[id]" options={{ title: 'Entrega' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
