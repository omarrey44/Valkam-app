import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { valmakLogo } from './logo';
import { getEmpresaConfig } from './empresaConfig';
import { Cotizacion, CotizacionItem } from './types';

function money(moneda: string, n: number) {
  return `${moneda} ${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

export async function buildCotizacionHtmlAsync(
  c: Cotizacion,
  items: CotizacionItem[],
  empresa: string
): Promise<string> {
  const cfg = await getEmpresaConfig();
  return buildCotizacionHtml(c, items, empresa, cfg.nombre, cfg.slogan ?? '');
}

export function buildCotizacionHtml(
  c: Cotizacion,
  items: CotizacionItem[],
  empresa: string,
  empNombre = 'VALMAK',
  empSlogan = 'Ingeniería en Diseño y Automatización'
): string {
  const total = items.length
    ? items.reduce((s, i) => s + Number(i.cantidad) * Number(i.precio_unitario), 0)
    : Number(c.monto);

  const filas = items.length
    ? items
        .map(
          (i) => `<tr>
            <td style="padding:10px;border-bottom:1px solid #EAEEF3">${i.descripcion}</td>
            <td style="padding:10px;border-bottom:1px solid #EAEEF3;text-align:center">${i.cantidad}</td>
            <td style="padding:10px;border-bottom:1px solid #EAEEF3;text-align:right">${money(c.moneda, i.precio_unitario)}</td>
            <td style="padding:10px;border-bottom:1px solid #EAEEF3;text-align:right;font-weight:bold">${money(c.moneda, Number(i.cantidad) * Number(i.precio_unitario))}</td>
          </tr>`
        )
        .join('')
    : `<tr><td colspan="4" style="padding:10px;text-align:center;color:#64748B">Monto único: ${money(c.moneda, c.monto)}</td></tr>`;

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>body{font-family:Arial,Helvetica,sans-serif;color:#0F172A;margin:0;padding:0}</style></head>
  <body>
    <div style="background:#1D4ED8;padding:28px 32px;display:flex;align-items:center;gap:16px">
      <div style="width:70px">${valmakLogo}</div>
    </div>
    <div style="padding:32px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start">
        <div>
          <h1 style="margin:0;font-size:24px">${c.titulo}</h1>
          <p style="margin:4px 0;color:#64748B">Rev. ${c.revision_current} · ${c.fecha_cotizacion}</p>
        </div>
        <div style="text-align:right">
          <p style="margin:0;color:#64748B;font-size:13px">CLIENTE</p>
          <p style="margin:2px 0;font-weight:bold;font-size:16px">${empresa}</p>
        </div>
      </div>

      <p style="line-height:1.5;white-space:pre-wrap;margin:18px 0">${c.descripcion ?? ''}</p>

      <table style="width:100%;border-collapse:collapse;margin-top:12px">
        <thead>
          <tr style="background:#F5F7FA">
            <th style="padding:10px;text-align:left;font-size:13px;color:#64748B">DESCRIPCIÓN</th>
            <th style="padding:10px;text-align:center;font-size:13px;color:#64748B">CANT.</th>
            <th style="padding:10px;text-align:right;font-size:13px;color:#64748B">P. UNITARIO</th>
            <th style="padding:10px;text-align:right;font-size:13px;color:#64748B">SUBTOTAL</th>
          </tr>
        </thead>
        <tbody>${filas}</tbody>
      </table>

      <div style="display:flex;justify-content:flex-end;margin-top:16px">
        <div style="background:#EAF1FE;border-radius:10px;padding:14px 24px">
          <span style="color:#64748B;font-size:14px">TOTAL&nbsp;&nbsp;</span>
          <span style="font-size:22px;font-weight:bold;color:#1D4ED8">${money(c.moneda, total)}</span>
        </div>
      </div>

      ${c.terminos_pago ? `<p style="margin-top:24px"><b>Términos de pago:</b> ${c.terminos_pago}</p>` : ''}
      ${c.tiempo_entrega ? `<p><b>Tiempo de entrega:</b> ${c.tiempo_entrega}</p>` : ''}
      ${c.detalles_tecnicos ? `<h3 style="margin-top:18px">Detalles técnicos</h3><p style="white-space:pre-wrap;line-height:1.5">${c.detalles_tecnicos}</p>` : ''}

      <p style="margin-top:40px;color:#94A3B8;font-size:12px;border-top:1px solid #EAEEF3;padding-top:12px">
        ${empNombre}${empSlogan ? ` · ${empSlogan}` : ''}
      </p>
    </div>
  </body></html>`;
}

export async function compartirCotizacionPdf(html: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
