import * as LocalAuthentication from 'expo-local-authentication';

export async function isBiometricAvailable(): Promise<boolean> {
  const compatible = await LocalAuthentication.hasHardwareAsync();
  if (!compatible) return false;
  const enrolled = await LocalAuthentication.isEnrolledAsync();
  return enrolled;
}

export async function authenticateWithBiometric(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: 'Confirma tu identidad para entrar a Valmak',
    cancelLabel: 'Usar contraseña',
    fallbackLabel: 'Usar contraseña',
    disableDeviceFallback: false,
  });
  return result.success;
}
