// CRDT de sequence (RGA / Logoot allege). Chaque caractere recoit une POSITION dense et stable ;
// deux insertions concurrentes au meme endroit obtiennent des positions differentes, donc un
// ordre deterministe. Utilise pour le sujet 1 (editeur).

export type Position = { path: number[]; site: string }

export function comparePos(a: Position, b: Position): number {
  const len = Math.max(a.path.length, b.path.length)
  for (let i = 0; i < len; i++) {
    const x = a.path[i] ?? 0
    const y = b.path[i] ?? 0
    if (x !== y) return x - y
  }
  return a.site < b.site ? -1 : a.site > b.site ? 1 : 0
}

const BASE = 1000

export function genBetween(
  before: Position | null,
  after: Position | null,
  site: string,
): Position {
  const lo = before?.path ?? []
  const hi = after?.path ?? []
  const path: number[] = []
  let depth = 0
  while (true) {
    const l = lo[depth] ?? 0
    const h = hi[depth] ?? BASE
    if (h - l > 1) {
      path.push(l + 1 + Math.floor(Math.random() * (h - l - 1)))
      return { path, site }
    }
    path.push(l)
    depth++
  }
}

export interface Char {
  pos: Position
  value: string
}

export function applyChar(chars: Char[], ch: Char): void {
  let i = 0
  while (i < chars.length && comparePos(chars[i].pos, ch.pos) < 0) i++
  if (chars[i] && comparePos(chars[i].pos, ch.pos) === 0) return // idempotent
  chars.splice(i, 0, ch)
}

export const readText = (chars: Char[]) => chars.map((c) => c.value).join('')
