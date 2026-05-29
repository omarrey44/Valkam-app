// =====================================================================
// VALMAK · Edge Function: notify-tarea
// Notifica al usuario cuando se le asigna una tarea en un proyecto.
//
// Deploy:
//   supabase functions deploy notify-tarea --no-verify-jwt
//
// Webhook (Supabase > Database > Webhooks):
//   - Tabla: tareas
//   - Eventos: INSERT, UPDATE
//   - Tipo: Supabase Edge Functions -> notify-tarea
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: { id: string; titulo: string; proyecto_id: string; asignado_a: string | null } | null;
  old_record: { asignado_a: string | null } | null;
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const rec = payload.record;

    // Solo notificar cuando se asigna (o reasigna) un usuario
    const asignacionCambio =
      rec?.asignado_a &&
      rec.asignado_a !== payload.old_record?.asignado_a;

    if (!rec || !asignacionCambio) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: profile } = await supabase
      .from('profiles')
      .select('push_token')
      .eq('id', rec.asignado_a)
      .single();

    if (!profile?.push_token) {
      return new Response(JSON.stringify({ skipped: 'no token' }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: profile.push_token,
        sound: 'default',
        title: 'Nueva tarea asignada',
        body: rec.titulo,
        data: { tareaId: rec.id, proyectoId: rec.proyecto_id },
      }),
    });

    return new Response(JSON.stringify({ sent: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
