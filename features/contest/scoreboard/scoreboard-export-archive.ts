import JSZip from 'jszip';
import { Writable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import 'server-only';

export async function finalizeScoreboardArchive(
  zip: JSZip,
  signal: AbortSignal
): Promise<Buffer> {
  signal.throwIfAborted();
  const chunks: Buffer[] = [];
  const sink = new Writable({
    write(chunk: Buffer, _encoding, callback) {
      chunks.push(chunk);
      callback();
    },
  });
  await pipeline(
    zip.generateNodeStream({ type: 'nodebuffer', streamFiles: true }),
    sink,
    { signal }
  );
  return Buffer.concat(chunks);
}
