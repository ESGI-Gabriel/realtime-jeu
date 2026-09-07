// Domaine : parties multijoueurs legeres, etat autoritaire serveur. Pur, sans I/O.

export interface Joueur {
  id: string
  pseudo: string
  pret: boolean
}

export interface EtatJeu {
  /** position 1D de chaque joueur, bornee a [-10, 10] cote serveur autoritaire. */
  positions: Record<string, number>
  scores: Record<string, number>
  tick: number
}

export interface Partie {
  id: string
  nom: string
  statut: 'lobby' | 'en-cours' | 'terminee'
  joueurs: Joueur[]
  etat: EtatJeu
}

export interface Input {
  joueurId: string
  dx: number
}

export function creerPartie(id: string, nom: string): Partie {
  return {
    id,
    nom,
    statut: 'lobby',
    joueurs: [],
    etat: { positions: {}, scores: {}, tick: 0 },
  }
}

const LIMITE = 10

/**
 * Reducteur autoritaire : applique une file d'inputs pour UN tick.
 * Borne chaque deplacement (|dx| <= 1) et la position ([-10, 10]). Ne fait jamais
 * confiance a la valeur envoyee par le client.
 */
export function appliquerTick(etat: EtatJeu, inputs: Input[]): EtatJeu {
  const positions = { ...etat.positions }
  for (const input of inputs) {
    const dx = Math.max(-1, Math.min(1, input.dx))
    const cur = positions[input.joueurId] ?? 0
    positions[input.joueurId] = Math.max(-LIMITE, Math.min(LIMITE, cur + dx))
  }
  return { ...etat, positions, tick: etat.tick + 1 }
}
