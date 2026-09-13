import avatarUrl from '@/features/user/lib/avatar-url';
import 'server-only';

const AVATAR_HOSTS = new Set([
  'gravatar.loli.net',
  'gravatar.com',
  'secure.gravatar.com',
  'github.com',
  'avatars.githubusercontent.com',
  'q1.qlogo.cn',
]);

const AVATAR_MIME_TYPES = ['image/png', 'image/jpeg', 'image/gif'] as const;
type AvatarMime = (typeof AVATAR_MIME_TYPES)[number];

export const MAX_AVATAR_DATA_URI_PREFIX = Math.max(
  ...AVATAR_MIME_TYPES.map((mime) => `data:${mime};base64,`.length)
);

const PNG_SIGNATURE = Buffer.from([
  0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a,
]);

/** Raw response bytes accepted per avatar. */
export const MAX_EXPORT_AVATAR_BYTES = 2 * 1024 * 1024;
/** Embedded data-URI bytes retained per export. */
export const MAX_EXPORT_AVATAR_TOTAL_BYTES = 32 * 1024 * 1024;
export const MAX_EXPORT_AVATAR_DIMENSION = 2048;
export const MAX_EXPORT_AVATAR_PIXELS = 1_000_000;
export const MAX_EXPORT_AVATAR_TOTAL_PIXELS = 8_000_000;

type ImageDimensions = { width: number; height: number };
type ExportAvatar = { dataUri: string; pixels: number };

function isAvatarMime(mime: string | undefined): mime is AvatarMime {
  return AVATAR_MIME_TYPES.some((type) => type === mime);
}

function pngDimensions(body: Buffer): ImageDimensions | null {
  if (body.length < 24 || !body.subarray(0, 8).equals(PNG_SIGNATURE))
    return null;
  if (body.toString('ascii', 12, 16) !== 'IHDR') return null;
  return { width: body.readUInt32BE(16), height: body.readUInt32BE(20) };
}

function gifDimensions(body: Buffer): ImageDimensions | null {
  if (body.length < 13) return null;
  const signature = body.toString('ascii', 0, 6);
  if (signature !== 'GIF87a' && signature !== 'GIF89a') return null;
  let offset = 13;
  const packed = body[10];
  if (packed & 0x80) offset += 3 * 2 ** ((packed & 0x07) + 1);
  while (offset < body.length) {
    const block = body[offset];
    if (block === 0x21) {
      offset += 2;
      while (offset < body.length && body[offset] !== 0)
        offset += body[offset] + 1;
      if (offset >= body.length) return null;
      offset += 1;
      continue;
    }
    if (block === 0x2c) {
      if (offset + 10 > body.length) return null;
      return {
        width: body.readUInt16LE(offset + 5),
        height: body.readUInt16LE(offset + 7),
      };
    }
    return null;
  }
  return null;
}

function isSofMarker(marker: number) {
  return (
    marker >= 0xc0 &&
    marker <= 0xcf &&
    marker !== 0xc4 &&
    marker !== 0xc8 &&
    marker !== 0xcc
  );
}

function jpegDimensions(body: Buffer): ImageDimensions | null {
  if (body.length < 4 || body[0] !== 0xff || body[1] !== 0xd8) return null;
  let offset = 2;
  while (offset + 1 < body.length) {
    if (body[offset] !== 0xff) return null;
    let marker = body[offset + 1];
    offset += 2;
    while (marker === 0xff && offset < body.length) marker = body[offset++];
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd9)) continue;
    if (offset + 2 > body.length) return null;
    const length = body.readUInt16BE(offset);
    if (isSofMarker(marker)) {
      if (length < 7 || offset + length > body.length) return null;
      return {
        height: body.readUInt16BE(offset + 3),
        width: body.readUInt16BE(offset + 5),
      };
    }
    if (length < 2 || offset + length > body.length) return null;
    offset += length;
  }
  return null;
}

function imageDimensions(
  mime: AvatarMime,
  body: Buffer
): ImageDimensions | null {
  switch (mime) {
    case 'image/png':
      return pngDimensions(body);
    case 'image/jpeg':
      return jpegDimensions(body);
    case 'image/gif':
      return gifDimensions(body);
  }
}

function hasAllowedSize(dimensions: ImageDimensions, maxPixels: number) {
  const { width, height } = dimensions;
  return (
    width > 0 &&
    height > 0 &&
    width <= MAX_EXPORT_AVATAR_DIMENSION &&
    height <= MAX_EXPORT_AVATAR_DIMENSION &&
    width * height <= maxPixels
  );
}

async function readAvatarBody(
  body: ReadableStream<Uint8Array> | null,
  maxBytes: number
) {
  if (!body) return null;
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      total += value.byteLength;
      if (total > maxBytes) {
        reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  return Buffer.concat(chunks);
}

export async function loadExportAvatar(
  avatar: string,
  signal: AbortSignal,
  maxBytes: number,
  maxPixels: number
): Promise<ExportAvatar | ''> {
  const source = avatarUrl(avatar);
  if (!source) return '';
  try {
    let url = new URL(source.startsWith('//') ? `https:${source}` : source);
    const timeout = AbortSignal.any([signal, AbortSignal.timeout(5000)]);
    for (let redirects = 0; redirects < 4; redirects++) {
      if (url.protocol !== 'https:' || !AVATAR_HOSTS.has(url.hostname))
        return '';
      const response = await fetch(url, {
        signal: timeout,
        redirect: 'manual',
      });
      if (response.status >= 300 && response.status < 400) {
        const location = response.headers.get('location');
        await response.body?.cancel();
        if (!location) return '';
        url = new URL(location, url);
        continue;
      }
      if (!response.ok) {
        await response.body?.cancel();
        return '';
      }
      const mime = response.headers.get('content-type')?.split(';')[0];
      if (!isAvatarMime(mime)) {
        await response.body?.cancel();
        return '';
      }
      const body = await readAvatarBody(response.body, maxBytes);
      if (!body) return '';
      const dimensions = imageDimensions(mime, body);
      if (!dimensions || !hasAllowedSize(dimensions, maxPixels)) return '';
      return {
        dataUri: `data:${mime};base64,${body.toString('base64')}`,
        pixels: dimensions.width * dimensions.height,
      };
    }
  } catch {
    signal.throwIfAborted();
  }
  return '';
}
