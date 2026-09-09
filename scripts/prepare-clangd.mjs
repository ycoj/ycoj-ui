import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile, rename } from 'node:fs/promises';

const directory = new URL('../public/clangd/v1/', import.meta.url);
const files = {
  'clangd.js':
    'a7ff1c588eb5374783bbda84d949b92b8027c2381c786072448b96eba90c7027',
  'clangd.wasm':
    '0d71e7a7f8e6dd369cb2a0b22cc4016d649f370e5b905adb6092536deb0ee019',
};
const poolOriginal =
  'var pthreadPoolSize=Math.max(navigator.hardwareConcurrency,8);';
const poolLimited = 'var pthreadPoolSize=4;';
const hash = (bytes) => createHash('sha256').update(bytes).digest('hex');

await mkdir(directory, { recursive: true });
for (const [name, checksum] of Object.entries(files)) {
  const destination = new URL(name, directory);
  let bytes;
  try {
    bytes = await readFile(destination);
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw new Error(
        `Missing local Clangd asset ${name}; check out Git LFS files before building.`
      );
    }
    throw error;
  }
  if (name.endsWith('.js')) {
    bytes = Buffer.from(bytes.toString().replace(poolLimited, poolOriginal));
  }
  if (hash(bytes) !== checksum) {
    throw new Error(
      `Checksum mismatch for ${name}; refusing an unpinned runtime.`
    );
  }
  if (name.endsWith('.js')) {
    const source = bytes.toString();
    if (!source.includes(poolOriginal))
      throw new Error('Unexpected clangd worker pool.');
    bytes = Buffer.from(source.replace(poolOriginal, poolLimited));
  }
  const temporary = new URL(`${name}.tmp`, directory);
  await writeFile(temporary, bytes);
  await rename(temporary, destination);
  console.log(`Verified ${name}`);
}
