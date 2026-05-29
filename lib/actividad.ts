import { supabase } from './supabase';

export type Accion = 'creó' | 'editó' | 'eliminó';

export async function logActividad(
  accion: Accion,
  modulo: string,
  registroId: string,
  descripcion: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('actividad_log').insert({
      usuario_id: user.id,
      accion,
      modulo,
      registro_id: registroId,
      descripcion,
    });
  } catch {
    // logging nunca rompe el flujo
  }
}
