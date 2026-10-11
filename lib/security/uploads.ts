// MIME supplied by the browser is untrusted. Check the container before decoding.
export function matchesFileSignature(bytes: Uint8Array, mime: string): boolean {
  const starts = (...values: number[]) => values.every((value, index) => bytes[index] === value);
  const text = (offset: number, length: number) =>
    String.fromCharCode(...bytes.slice(offset, offset + length));
  if (mime === "image/jpeg") return starts(0xff, 0xd8, 0xff);
  if (mime === "image/png") return starts(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a);
  if (mime === "image/gif") return ["GIF87a", "GIF89a"].includes(text(0, 6));
  if (mime === "image/webp") return text(0, 4) === "RIFF" && text(8, 4) === "WEBP";
  if (mime === "image/avif") {
    return text(4, 4) === "ftyp" && ["avif", "avis"].includes(text(8, 4));
  }
  if (["video/mp4", "video/quicktime"].includes(mime)) return text(4, 4) === "ftyp";
  if (["video/webm", "video/x-matroska"].includes(mime)) return starts(0x1a, 0x45, 0xdf, 0xa3);
  return false;
}
