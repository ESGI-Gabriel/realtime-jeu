import { creerPartie, type Partie } from './domain.ts'

export function buildSeed(): Map<string, Partie> {
  const parties = new Map<string, Partie>()

  const ouverte = creerPartie('p-demo', 'Partie de demonstration')
  ouverte.joueurs = [
    { id: 'j-alice', pseudo: 'alice', pret: true },
    { id: 'j-bob', pseudo: 'bob', pret: false },
  ]
  ouverte.etat.positions = { 'j-alice': 0, 'j-bob': 0 }
  ouverte.etat.scores = { 'j-alice': 0, 'j-bob': 0 }
  parties.set(ouverte.id, ouverte)

  parties.set('p-libre', creerPartie('p-libre', 'Salon libre'))
  return parties
}

if (process.argv.includes('--print')) {
  for (const p of buildSeed().values()) {
    console.log(`# ${p.nom} (${p.id}) - ${p.statut}, ${p.joueurs.length} joueurs`)
  }
}
