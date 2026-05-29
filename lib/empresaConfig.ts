import { supabase } from './supabase';

export interface EmpresaConfig {
  id: string;
  nombre: string;
  slogan: string | null;
  rfc: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  logo_url: string | null;
}

const FALLBACK: EmpresaConfig = {
  id: '00000000-0000-0000-0000-000000000001',
  nombre: 'VALMAK',
  slogan: 'Ingeniería en Diseño y Automatización',
  rfc: null,
  direccion: null,
  telefono: null,
  correo: null,
  logo_url: null,
};

let _cache: EmpresaConfig | null = null;

export async function getEmpresaConfig(): Promise<EmpresaConfig> {
  if (_cache) return _cache;
  const { data } = await supabase.from('empresa_config').select('*').single();
  _cache = (data as EmpresaConfig) ?? FALLBACK;
  return _cache;
}

export function invalidateEmpresaCache() {
  _cache = null;
}
