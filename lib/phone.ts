/** Formatea número mexicano: 6140001234 → (614) 000-1234 */
export function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 10);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `(${digits.slice(0, 3)}) ${digits.slice(3)}`;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}

/** Devuelve solo dígitos del string formateado */
export function unformatPhone(formatted: string): string {
  return formatted.replace(/\D/g, '');
}
