import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';
import { SIG_WIDTH, SIG_HEIGHT } from '../components/SignaturePad';

export async function pickAndUpload(bucket: string, path: string): Promise<string | null> {
  const ImagePicker = await import('expo-image-picker');

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.75,
    base64: true,
  });

  if (result.canceled || !result.assets[0]?.base64) return null;

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fullPath = `${path}.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, decode(asset.base64), { contentType: mime, upsert: true });

  if (error) throw error;

  return supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
}

export async function uploadDocument(
  bucket: string,
  storagePath: string
): Promise<{ url: string; nombre: string } | null> {
  const ImagePicker = await import('expo-image-picker');

  const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!perm.granted) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: 0.85,
    base64: true,
  });

  if (result.canceled || !result.assets[0]?.base64) return null;

  const asset = result.assets[0];
  const ext = asset.uri.split('.').pop()?.toLowerCase() ?? 'jpg';
  const mime = ext === 'png' ? 'image/png' : 'image/jpeg';
  const fullPath = `${storagePath}.${ext}`;
  const nombre = `adjunto.${ext}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fullPath, decode(asset.base64), { contentType: mime, upsert: true });

  if (error) throw error;

  const url = supabase.storage.from(bucket).getPublicUrl(fullPath).data.publicUrl;
  return { url, nombre };
}

export async function uploadSignature(paths: string[], storagePath: string): Promise<string> {
  const Print = await import('expo-print');
  const FileSystem = await import('expo-file-system');

  const pathsHtml = paths
    .map(
      (d) =>
        `<path d="${d}" stroke="#0F172A" stroke-width="2.5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('');

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
    <style>*{margin:0;padding:0}body{background:white}</style></head>
    <body>
      <svg width="${SIG_WIDTH}" height="${SIG_HEIGHT}" xmlns="http://www.w3.org/2000/svg"
           viewBox="0 0 ${SIG_WIDTH} ${SIG_HEIGHT}">
        <rect width="${SIG_WIDTH}" height="${SIG_HEIGHT}" fill="white"/>
        ${pathsHtml}
      </svg>
    </body></html>`;

  const { uri } = await Print.printToFileAsync({ html, width: SIG_WIDTH, height: SIG_HEIGHT });

  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  const { error } = await supabase.storage
    .from('firmas')
    .upload(storagePath, decode(base64), { contentType: 'application/pdf', upsert: true });

  if (error) throw error;

  return supabase.storage.from('firmas').getPublicUrl(storagePath).data.publicUrl;
}
