// Snapshot + delta numerote. Le serveur fait autorite sur l'etat ; chaque changement porte un
// numero de sequence. A la reconnexion, le client envoie son dernier seq connu : petit trou =>
// rejeu des deltas ; grand trou (buffer depasse) => snapshot complet.
// Utilise pour les sujets 2 (cotations) et 5 (livraison).

export interface Delta {
  seq: number
  change: Record<string, number>
}

export class SnapshotDeltaServer {
  private seq = 0
  private state: Record<string, number> = {}
  private readonly recent: Delta[] = []
  private readonly MAX_RECENT = 50

  update(key: string, value: number): Delta {
    this.state[key] = value
    const delta: Delta = { seq: ++this.seq, change: { [key]: value } }
    this.recent.push(delta)
    if (this.recent.length > this.MAX_RECENT) this.recent.shift()
    return delta
  }

  sync(
    lastSeq: number,
  ):
    | { type: 'snapshot'; seq: number; state: Record<string, number> }
    | { type: 'deltas'; deltas: Delta[] } {
    const oldest = this.recent[0]?.seq ?? this.seq + 1
    if (lastSeq < oldest - 1) {
      return { type: 'snapshot', seq: this.seq, state: { ...this.state } }
    }
    return { type: 'deltas', deltas: this.recent.filter((d) => d.seq > lastSeq) }
  }

  get currentSeq() {
    return this.seq
  }
}

/** Cote client : applique soit un snapshot, soit une suite de deltas. */
export class SnapshotDeltaClient {
  state: Record<string, number> = {}
  lastSeq = 0

  applySync(sync: ReturnType<SnapshotDeltaServer['sync']>): void {
    if (sync.type === 'snapshot') {
      this.state = { ...sync.state }
      this.lastSeq = sync.seq
    } else {
      for (const d of sync.deltas) {
        Object.assign(this.state, d.change)
        this.lastSeq = d.seq
      }
    }
  }
}
