export const CABIN_IMAGE_MAX_BYTES = 10 * 1024 * 1024;
export const CABIN_IMAGE_TYPES: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

export function validateCabinImage(file: Pick<File, 'type' | 'size'>): string | null {
  if (!(file.type in CABIN_IMAGE_TYPES)) return 'Bilden måste vara JPG, PNG eller WebP.';
  if (file.size > CABIN_IMAGE_MAX_BYTES) return 'Bilden får vara högst 10 MB.';
  if (file.size === 0) return 'Bilden är tom.';
  return null;
}