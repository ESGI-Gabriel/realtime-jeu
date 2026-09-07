// Numero de sequence par room + deduplication a la reconnexion.
// Chaque message recoit un seq croissant. Le client garde l'ensemble des seq deja affiches ;
// a la reconnexion il redemande depuis lastSeq et IGNORE tout seq deja vu.
// Utilise pour le sujet 3 (chat) : ordre + pas de doublon apres un renvoi.

export interface Msg {
  seq: number
  body: string
}

export class DedupRoom {
  private seq = 0
  private readonly history: Msg[] = []
  private readonly MAX = 200

  publish(body: string): Msg {
    const msg: Msg = { seq: ++this.seq, body }
    this.history.push(msg)
    if (this.history.length > this.MAX) this.history.shift()
    return msg
  }

  since(lastSeq: number): Msg[] {
    return this.history.filter((m) => m.seq > lastSeq)
  }
}

export class DedupClient {
  private seen = new Set<number>()
  readonly displayed: Msg[] = []
  lastSeq = 0

  receive(msg: Msg): boolean {
    if (this.seen.has(msg.seq)) return false // doublon : ignore
    this.seen.add(msg.seq)
    this.displayed.push(msg)
    this.displayed.sort((a, b) => a.seq - b.seq) // ordre stable
    this.lastSeq = Math.max(this.lastSeq, msg.seq)
    return true
  }
}
