// Boucle serveur autoritaire a tick fixe. Les inputs clients sont mis en file ; a chaque tick,
// le serveur les applique DANS L'ORDRE et borne les valeurs (ne jamais faire confiance au client),
// puis diffuse l'etat. Deux inputs "dans le meme tick" sont tranches de facon deterministe.
// Utilise pour le sujet 4 (jeu).

export interface Input {
  playerId: string
  dx: number
}

export class TickServer {
  private positions = new Map<string, number>()
  private queue: Input[] = []

  enqueue(input: Input): void {
    this.queue.push(input)
  }

  tick(): Record<string, number> {
    for (const input of this.queue) {
      const cur = this.positions.get(input.playerId) ?? 0
      const clamped = Math.max(-1, Math.min(1, input.dx)) // borne : anti-triche minimal
      this.positions.set(input.playerId, cur + clamped)
    }
    this.queue = []
    return Object.fromEntries(this.positions)
  }
}
