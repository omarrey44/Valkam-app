import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';
import { valmakLogo } from './logo';
import { Factura } from './types';

function money(moneda: string, n: number) {
  return `${moneda} ${Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2 })}`;
}

function fila(label: string, value: string) {
  return `<tr>
    <td style="padding:10px 0;color:#64748B;font-size:13px;border-bottom:1px solid #EAEEF3;width:40%">${label}</td>
    <td style="padding:10px 0;font-size:14px;font-weight:600;border-bottom:1px solid #EAEEF3">${value}</td>
  </tr>`;
}

const estadoColor: Record<string, string> = {
  pendiente: '#F59E0B',
  pagada:    '#10B981',
  vencida:   '#EF4444',
  cancelada: '#6B7280',
};

export function buildFacturaHtml(f: Factura, empresa: string, proyecto: string): string {
  const color = estadoColor[f.estado] ?? '#64748B';

  return `<!DOCTYPE html><html><head><meta charset="utf-8"/>
  <style>body{font-family:Arial,Helvetica,sans-serif;color:#0F172A;margin:0;padding:0}</style></head>
  <body>
    <div style="background:#059669;padding:28px 32px;display:flex;align-items:center;gap:16px">
      <div style="width:70px">${valmakLogo}</div>
    </div>

    <div style="padding:32px">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
        <div>
          <h1 style="margin:0;font-size:26px">${f.numero_factura ?? 'Factura'}</h1>
          <span style="display:inline-block;margin-top:8px;padding:4px 14px;border-radius:20px;
            background:${color}1A;color:${color};font-weight:700;font-size:12px;letter-spacing:0.5px">
            ${f.estado.toUpperCase()}
          </span>
        </div>
        <div style="text-align:right">
          <p style="margin:0;color:#64748B;font-size:12px">CLIENTE</p>
          <p style="margin:2px 0;font-weight:700;font-size:16px">${empresa}</p>
          <p style="margin:2px 0;color:#64748B;font-size:13px">${proyecto}</p>
        </div>
      </div>

      <div style="background:#F0FDF4;border-radius:12px;padding:20px;text-align:center;margin-bottom:28px">
        <p style="margin:0;color:#64748B;font-size:13px">MONTO TOTAL</p>
        <p style="margin:6px 0 0;font-size:32px;font-weight:900;color:#059669">${money(f.moneda, f.monto)}</p>
      </div>

      <table style="width:100%;border-collapse:collapse">
        ${fila('Fecha de emisión', f.fecha_emision)}
        ${f.fecha_vencimiento ? fila('Fecha de vencimiento', f.fecha_vencimiento) : ''}
        ${f.fecha_pago ? fila('Fecha de pago', f.fecha_pago) : ''}
        ${f.terminos_pago ? fila('Términos de pago', f.terminos_pago) : ''}
      </table>

      <p style="margin-top:40px;color:#94A3B8;font-size:12px;border-top:1px solid #EAEEF3;padding-top:12px">
        VALMAK · Ingeniería en Diseño y Automatización
      </p>
    </div>
  </body></html>`;
}

export async function compartirFacturaPdf(html: string) {
  if (Platform.OS === 'web') {
    await Print.printAsync({ html });
    return;
  }
  const { uri } = await Print.printToFileAsync({ html });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' });
  }
}
