// Formatea un string numérico crudo a miles con coma para mostrar en inputs.
// "10000.5" -> "10,000.5"   ""-> ""
export function formatMoney(raw: string): string {
  if (raw == null || raw === '') return '';
  const [int, dec] = raw.split('.');
  const intF = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec !== undefined ? `${intF}.${dec}` : intF;
}

// Limpia lo tecleado dejando solo dígitos y un punto decimal (sin comas).
// "10,000.5" -> "10000.5"
export function parseMoney(text: string): string {
  let t = text.replace(/[^0-9.]/g, '');
  const parts = t.split('.');
  if (parts.length > 2) t = parts[0] + '.' + parts.slice(1).join('');
  return t;
}
