// Eleo Social: image storage abstraction.
// Today this talks to Supabase Storage. To move to another provider later
// (Cloudinary, S3, R2...) only THIS file changes: keep the same exports.
import { supabase } from '../supabase.js';

export const POST_BUCKET = 'post-images';
export const AVATAR_BUCKET = 'avatars';
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_RAW_BYTES = 20 * 1024 * 1024;     // reject absurd originals before decoding
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;   // matches bucket limit

export function validateImage(file) {
  if (!file) return 'Choose a photo to upload.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Use a JPG, PNG or WebP image.';
  if (file.size > MAX_RAW_BYTES) return 'That photo is over 20 MB. Choose a smaller one.';
  return null;
}

function toBlob(canvas, type, quality) {
  return new Promise((resolve) => canvas.toBlob(resolve, type, quality));
}

/** Resize + compress in the browser: saves mobile data and storage. */
export async function prepareImage(file, { maxDim = 1600 } = {}) {
  const problem = validateImage(file);
  if (problem) throw new Error(problem);

  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  canvas.getContext('2d').drawImage(bitmap, 0, 0, w, h);
  if (bitmap.close) bitmap.close();

  for (const quality of [0.85, 0.75, 0.65, 0.5]) {
    let blob = await toBlob(canvas, 'image/webp', quality);
    if (!blob || blob.type !== 'image/webp') blob = await toBlob(canvas, 'image/jpeg', quality);
    if (blob && blob.size <= MAX_UPLOAD_BYTES) return blob;
  }
  throw new Error('That photo is too large even after compression.');
}

function extFor(type) {
  return type === 'image/webp' ? 'webp' : type === 'image/png' ? 'png' : 'jpg';
}

async function upload(bucket, userId, blob) {
  const path = `${userId}/${crypto.randomUUID()}.${extFor(blob.type)}`;
  const { error } = await supabase.storage.from(bucket).upload(path, blob, {
    contentType: blob.type, cacheControl: '31536000', upsert: false,
  });
  if (error) throw error;
  return path;
}

export const uploadPostImage = (userId, blob) => upload(POST_BUCKET, userId, blob);
export const uploadAvatar = (userId, blob) => upload(AVATAR_BUCKET, userId, blob);

export async function removeFile(bucket, path) {
  if (!path || path.startsWith('seed:') || path.startsWith('http')) return;
  await supabase.storage.from(bucket).remove([path]);
}

/** Public URL for a stored path. Returns null for seed placeholders. */
export function publicUrl(bucket, path) {
  if (!path || path.startsWith('seed:')) return null;
  if (path.startsWith('http')) return path;
  return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
}
export const postImageUrl = (path) => publicUrl(POST_BUCKET, path);
export const avatarImageUrl = (path) => publicUrl(AVATAR_BUCKET, path);
