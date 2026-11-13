/**
 * Hermes-safe stub for `file-type`.
 * Muze already passes MIME from the filename into music-metadata.parseBuffer,
 * so runtime sniffing via file-type is unnecessary and its modern ESM breaks Hermes.
 */

export async function fileTypeFromBuffer() {
  return undefined;
}

export async function fileTypeFromFile() {
  return undefined;
}

export async function fileTypeFromStream() {
  return undefined;
}

export async function fileTypeFromTokenizer() {
  return undefined;
}

export async function fileTypeFromBlob() {
  return undefined;
}

export const supportedExtensions = new Set();
export const supportedMimeTypes = new Set();
