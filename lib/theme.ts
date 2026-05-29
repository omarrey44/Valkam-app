export const lightColors = {
  primary: '#0B5FA5',
  primaryDark: '#084A82',
  primaryBright: '#2563EB',
  accent: '#F2A007',
  accentSoft: '#FEF3E2',
  bg: '#F5F7FA',
  card: '#FFFFFF',
  border: '#EAEEF3',
  text: '#0F172A',
  textMuted: '#64748B',
  textFaint: '#94A3B8',
  danger: '#DC2626',
  success: '#16A34A',
  warning: '#D97706',
};

export const darkColors = {
  primary: '#1D4ED8',
  primaryDark: '#1E40AF',
  primaryBright: '#60A5FA',
  accent: '#F2A007',
  accentSoft: '#2D2000',
  bg: '#0F172A',
  card: '#1E293B',
  border: '#334155',
  text: '#F1F5F9',
  textMuted: '#94A3B8',
  textFaint: '#475569',
  danger: '#F87171',
  success: '#4ADE80',
  warning: '#FCD34D',
};

export const colors = lightColors;

// Degradados (usar con expo-linear-gradient, start top-left → end bottom-right)
export const gradients = {
  blue: ['#1D4ED8', '#3B82F6'] as const,
  green: ['#047857', '#10B981'] as const,
  amber: ['#D97706', '#F59E0B'] as const,
  slate: ['#1E293B', '#334155'] as const,
};

export const radius = {
  sm: 12,
  md: 16,
  lg: 20,
  xl: 28,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
};

// Tipografía — Sora (display) + Manrope (texto). Distintivas, no genéricas.
export const font = {
  black: 'Sora_800ExtraBold',
  bold: 'Sora_700Bold',
  display: 'Sora_600SemiBold',
  semibold: 'Manrope_600SemiBold',
  medium: 'Manrope_500Medium',
  regular: 'Manrope_400Regular',
};

// Sombras en capas (suaves, no harsh). Spread vía elevation en Android.
export const shadow = {
  card: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.06,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  float: {
    shadowColor: '#0F172A',
    shadowOpacity: 0.12,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 10 },
    elevation: 12,
  },
  // sombra de color para tarjetas con degradado
  blue: {
    shadowColor: '#2563EB',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
  green: {
    shadowColor: '#10B981',
    shadowOpacity: 0.35,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
};

export const estadoColor: Record<string, string> = {
  pendiente: '#D97706',
  borrador: '#64748B',
  enviada: '#0B5FA5',
  aprobada: '#16A34A',
  rechazada: '#DC2626',
  modificada: '#7C3AED',
};

export const estadoPOColor: Record<string, string> = {
  recibida: '#0B5FA5',
  en_proceso: '#D97706',
  completada: '#16A34A',
  cancelada: '#DC2626',
};

export const estadoProyectoColor: Record<string, string> = {
  programado: '#64748B',
  en_proceso: '#0B5FA5',
  validacion: '#7C3AED',
  completado: '#16A34A',
  cancelado: '#DC2626',
};

export const estadoTareaColor: Record<string, string> = {
  pendiente: '#64748B',
  en_progreso: '#0B5FA5',
  completada: '#16A34A',
  cancelada: '#DC2626',
};

export const prioridadColor: Record<string, string> = {
  baja: '#16A34A',
  media: '#0B5FA5',
  alta: '#D97706',
  urgente: '#DC2626',
};

export const estadoFacturaColor: Record<string, string> = {
  pendiente: '#D97706',
  pagada: '#16A34A',
  vencida: '#DC2626',
  cancelada: '#64748B',
};

export const estadoClienteColor: Record<string, string> = {
  prospecto: '#D97706',
  activo: '#16A34A',
  inactivo: '#64748B',
};

// Abre WhatsApp con número (limpia no-dígitos, asume MX +52 si 10 dígitos)
export function whatsappUrl(telefono: string, mensaje?: string): string {
  let digits = telefono.replace(/\D/g, '');
  if (digits.length === 10) digits = '52' + digits;
  const text = mensaje ? `?text=${encodeURIComponent(mensaje)}` : '';
  return `https://wa.me/${digits}${text}`;
}
