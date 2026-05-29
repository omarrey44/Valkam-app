// =====================================================================
// VALMAK · Edge Function: enviar-cotizacion
// Envía una cotización por correo al cliente vía Resend.
//
// Deploy:
//   1) supabase login
//   2) supabase link --project-ref nvyjbmwuvsgwenplpjov
//   3) supabase secrets set RESEND_API_KEY=re_xxxxx
//      (saca la API key en https://resend.com → API Keys)
//   4) supabase functions deploy enviar-cotizacion
//
// Remitente: usa onboarding@resend.dev para pruebas (solo envía a tu
// propio correo verificado). Para producción verifica tu dominio en
// Resend y cambia FROM por algo como "VALMAK <cotizaciones@valmak.com>".
//
// La app la llama con: supabase.functions.invoke('enviar-cotizacion',
//   { body: { cotizacion_id } })
// =====================================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const FROM = 'VALMAK <onboarding@resend.dev>';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function fmt(moneda: string, monto: number) {
  return `${moneda} ${Number(monto).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });

  try {
    const { cotizacion_id } = await req.json();
    if (!cotizacion_id) throw new Error('Falta cotizacion_id');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: c, error } = await supabase
      .from('cotizaciones')
      .select('*, clientes(empresa, correo_principal, correos_adicionales)')
      .eq('id', cotizacion_id)
      .single();
    if (error || !c) throw new Error('Cotización no encontrada');

    const { data: items } = await supabase
      .from('cotizacion_items')
      .select('*')
      .eq('cotizacion_id', cotizacion_id)
      .order('orden');

    const to: string[] = [c.clientes.correo_principal];
    if (c.clientes.correos_adicionales) {
      for (const e of String(c.clientes.correos_adicionales).split(',')) {
        const t = e.trim();
        if (t) to.push(t);
      }
    }

    const lista = (items ?? []) as { descripcion: string; cantidad: number; precio_unitario: number }[];
    const partidasHtml = lista.length
      ? `<table style="width:100%;border-collapse:collapse;margin:16px 0">
          <thead><tr style="background:#F5F7FA">
            <th style="padding:8px;text-align:left;font-size:12px;color:#64748B">DESCRIPCIÓN</th>
            <th style="padding:8px;text-align:center;font-size:12px;color:#64748B">CANT.</th>
            <th style="padding:8px;text-align:right;font-size:12px;color:#64748B">P. UNIT.</th>
            <th style="padding:8px;text-align:right;font-size:12px;color:#64748B">SUBTOTAL</th>
          </tr></thead>
          <tbody>
          ${lista
            .map(
              (i) =>
                `<tr>
                  <td style="padding:8px;border-bottom:1px solid #EAEEF3">${i.descripcion}</td>
                  <td style="padding:8px;border-bottom:1px solid #EAEEF3;text-align:center">${i.cantidad}</td>
                  <td style="padding:8px;border-bottom:1px solid #EAEEF3;text-align:right">${fmt(c.moneda, i.precio_unitario)}</td>
                  <td style="padding:8px;border-bottom:1px solid #EAEEF3;text-align:right;font-weight:bold">${fmt(c.moneda, i.cantidad * i.precio_unitario)}</td>
                </tr>`
            )
            .join('')}
          </tbody>
         </table>`
      : '';

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;color:#0F172A">
        <div style="background:#1D4ED8;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="color:#fff;margin:0;font-size:24px;letter-spacing:2px">VALMAK</h1>
          <p style="color:#cfe3f5;margin:4px 0 0">Ingeniería en Diseño y Automatización</p>
        </div>
        <div style="border:1px solid #EAEEF3;border-top:0;border-radius:0 0 12px 12px;padding:24px">
          <h2 style="margin:0 0 4px">${c.titulo}</h2>
          <p style="color:#64748B;margin:0 0 16px">Cliente: ${c.clientes.empresa} · Rev. ${c.revision_current}</p>
          <p style="white-space:pre-wrap;line-height:1.5">${c.descripcion ?? ''}</p>
          ${partidasHtml}
          <div style="text-align:right;margin:16px 0">
            <span style="color:#64748B">TOTAL&nbsp;</span>
            <span style="font-weight:bold;font-size:20px;color:#1D4ED8">${fmt(c.moneda, c.monto)}</span>
          </div>
          ${c.terminos_pago ? `<p style="margin:4px 0"><b>Términos de pago:</b> ${c.terminos_pago}</p>` : ''}
          ${c.tiempo_entrega ? `<p style="margin:4px 0"><b>Tiempo de entrega:</b> ${c.tiempo_entrega}</p>` : ''}
          ${c.detalles_tecnicos ? `<h3>Detalles técnicos</h3><p style="white-space:pre-wrap;line-height:1.5">${c.detalles_tecnicos}</p>` : ''}
          <p style="color:#94A3B8;font-size:12px;margin-top:24px">Cotización generada el ${c.fecha_cotizacion}. Gracias por su preferencia.</p>
        </div>
      </div>`;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM,
        to,
        subject: `Cotización VALMAK — ${c.titulo} (Rev. ${c.revision_current})`,
        html,
      }),
    });

    if (!resp.ok) {
      const detail = await resp.text();
      throw new Error(`Resend ${resp.status}: ${detail}`);
    }

    return new Response(JSON.stringify({ sent: true, to }), {
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e instanceof Error ? e.message : e) }), {
      status: 400,
      headers: { ...cors, 'Content-Type': 'application/json' },
    });
  }
});
