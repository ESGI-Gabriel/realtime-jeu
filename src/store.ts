import { buildSeed } from './seed.ts'
import type { Partie } from './domain.ts'

// Le stub : pas de boucle a tick. Chaque input est applique IMMEDIATEMENT et la valeur
// envoyee par le client est utilisee TELLE QUELLE (triche possible : dx = 999).
// Pas de room par partie : tous les joueurs de toutes les parties sont dans le meme espace.

export interface Store {
  parties: Map<string, Partie>
  /** partie unique utilisee par le stub, quel que soit l'id demande. */
  active: Partie
}

export function createStore(): Store {
  const parties = buildSeed()
  return { parties, active: [...parties.values()][0] }
}

export interface ClientInput {
  kind: 'move'
  joueurId: string
  dx: number
}

export function parseClientInput(raw: unknown): ClientInput | null {
  if (!raw || typeof raw !== 'object') return null
  const o = raw as Record<string, unknown>
  if (o.kind !== 'move') return null
  if (typeof o.joueurId !== 'string' || typeof o.dx !== 'number') return null
  return { kind: 'move', joueurId: o.joueurId, dx: o.dx }
}

export function applyNaive(store: Store, input: ClientInput): void {
  const pos = store.active.etat.positions
  // AUCUN bornage : on ajoute directement le dx du client
  pos[input.joueurId] = (pos[input.joueurId] ?? 0) + input.dx
}
