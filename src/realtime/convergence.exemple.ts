// STRATEGIE DE CONVERGENCE (exemple fourni, adapte a ce projet).
//
// Boucle serveur autoritaire a tick fixe. Les inputs clients sont mis en FILE ; a chaque tick
// (20 Hz), le serveur les applique DANS L'ORDRE via `appliquerTick` (deja dans src/domain.ts),
// borne chaque deplacement, puis diffuse l'etat. Deux inputs "dans le meme tick" sont tranches
// de facon deterministe et reproductible ; la valeur envoyee par le client ne peut pas tricher.
//
// Pour l'activer (etape 6) : dans src/server.ts, au lieu d'`applyNaive` sur chaque message,
// faites `boucle.enqueue(input)` et demarrez `boucle.demarrer(etat => io.to(room).emit('state', etat))`.
// Vous NE reecrivez pas ce fichier.

import { appliquerTick, type EtatJeu, type Input } from '../domain.ts'

const HZ = 20

export class BoucleAutoritaire {
  private file: Input[] = []
  private timer: ReturnType<typeof setInterval> | null = null

  constructor(private etat: EtatJeu) {}

  enqueue(input: Input): void {
    this.file.push(input)
  }

  /** Applique la file pour un tick et renvoie le nouvel etat (utilise aussi par le scenario). */
  tick(): EtatJeu {
    this.etat = appliquerTick(this.etat, this.file)
    this.file = []
    return this.etat
  }

  demarrer(onTick: (etat: EtatJeu) => void): void {
    this.timer = setInterval(() => onTick(this.tick()), 1000 / HZ)
  }

  arreter(): void {
    if (this.timer) clearInterval(this.timer)
  }

  get etatCourant(): EtatJeu {
    return this.etat
  }
}
