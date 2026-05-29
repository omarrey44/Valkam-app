import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { supabase } from './supabase';

/**
 * Registra el token de push del dispositivo y lo guarda en profiles.push_token.
 * - No-op en web y en entornos sin soporte.
 * - Requiere un EAS projectId (development build); en Expo Go remoto puede no aplicar.
 * - Silencioso ante errores: las notificaciones push son opcionales.
 */
export async function registerPushToken(userId: string): Promise<void> {
  if (Platform.OS === 'web') return;
  try {
    const Device = await import('expo-device');
    const Notifications = await import('expo-notifications');

    if (!Device.isDevice) return;

    const { status: existing } = await Notifications.getPermissionsAsync();
    let status = existing;
    if (existing !== 'granted') {
      const req = await Notifications.requestPermissionsAsync();
      status = req.status;
    }
    if (status !== 'granted') return;

    const projectId =
      (Constants.expoConfig as any)?.extra?.eas?.projectId ??
      (Constants as any)?.easConfig?.projectId;
    if (!projectId) return; // sin EAS projectId no se puede emitir token remoto

    const token = (await Notifications.getExpoPushTokenAsync({ projectId })).data;
    if (token) {
      await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
    }
  } catch {
    // push opcional: nunca romper la app por esto
  }
}
