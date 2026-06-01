export function validateRequired(v: string, label: string): string | null {
  return v.trim() ? null : `${label} es requerido`;
}

export function validateEmail(email: string): string | null {
  if (!email.trim()) return 'Correo es requerido';
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim()) ? null : 'Formato de correo inválido';
}

export function validateRFC(rfc: string): string | null {
  if (!rfc.trim()) return null;
  const re = /^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$/i;
  return re.test(rfc.trim()) ? null : 'RFC inválido (ej: VABC123456XY0)';
}

export function validatePhone(phone: string): string | null {
  if (!phone.trim()) return null;
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 10 ? null : 'Teléfono debe tener al menos 10 dígitos';
}
