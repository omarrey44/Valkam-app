// =====================================================================
// VALMAK · Edge Function: notify-pendiente
// Envía push (Expo) a administradores/aprobadores cuando entra una
// cotización en estado "pendiente".
//
// OPCIONAL — requiere desplegar y configurar un Database Webhook.
// Funciona con un development build (no Expo Go) que ya registró push_token.
//
// Deploy:
//   1) npm i -g supabase   (o usar npx)
//   2) supabase login
//   3) supabase link --project-ref nvyjbmwuvsgwenplpjov
//   4) supabase functions deploy notify-pendiente --no-verify-jwt
//
// Webhook (Supabase > Database > Webhooks):
//   - Tabla: cotizaciones
//   - Eventos: INSERT, UPDATE
//   - Tipo: Supabase Edge Functions -> notify-pendiente
//
// La función usa SUPABASE_SERVICE_ROLE_KEY (inyectada por Supabase) para
// leer los push_token saltando RLS.
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  record: { id: string; titulo: string; estado: string } | null;
  old_record: { estado: string } | null;
}

Deno.serve(async (req: Request) => {
  try {
    const payload = (await req.json()) as WebhookPayload;
    const rec = payload.record;

    // Solo notificar cuando la cotización queda "pendiente"
    const llegaPendiente =
      rec?.estado === 'pendiente' &&
      (payload.type === 'INSERT' || payload.old_record?.estado !== 'pendiente');

    if (!rec || !llegaPendiente) {
      return new Response(JSON.stringify({ skipped: true }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: admins } = await supabase
      .from('profiles')
      .select('push_token')
      .in('rol', ['administrador', 'aprobador'])
      .not('push_token', 'is', null);

    const messages = (admins ?? [])
      .filter((a: { push_token: string | null }) => !!a.push_token)
      .map((a: { push_token: string }) => ({
        to: a.push_token,
        sound: 'default',
        title: 'Nueva cotización pendiente',
        body: rec.titulo,
        data: { cotizacionId: rec.id },
      }));

    if (messages.length > 0) {
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(messages),
      });
    }

    return new Response(JSON.stringify({ sent: messages.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
