// Framing par longueur prefixee : 4 octets d'en-tete (taille), puis le contenu.
// Partage entre le serveur et le client : les deux cotes cadrent et decadrent.

const HEADER_SIZE = 4

export function frame(payload: Buffer): Buffer {
  const header = Buffer.alloc(HEADER_SIZE)
  header.writeUInt32BE(payload.length)
  return Buffer.concat([header, payload])
}

export function extractFrames(buffer: Buffer, onFrame: (payload: Buffer) => void): Buffer {
  let offset = 0
  while (buffer.length - offset >= HEADER_SIZE) {
    const length = buffer.readUInt32BE(offset)
    if (buffer.length - offset < HEADER_SIZE + length) break // frame incomplete : on attend la suite
    onFrame(buffer.subarray(offset + HEADER_SIZE, offset + HEADER_SIZE + length))
    offset += HEADER_SIZE + length
  }
  return buffer.subarray(offset) // reste non consomme
}
