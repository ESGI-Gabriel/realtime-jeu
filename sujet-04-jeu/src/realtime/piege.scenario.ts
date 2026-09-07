import type { EtatJeu, Input } from '../domain.ts'
import { BoucleAutoritaire } from './convergence.exemple.ts'

// LE PIEGE de ce sujet : deux joueurs agissent "en meme temps".
//
//   npm run scenario                     -> STUB : input non borne applique tel quel (triche, sortie != 0)
//   npm run scenario -- --avec-strategie  -> boucle a tick fixe : borne + deterministe (sortie 0)

const avecStrategie = process.argv.includes('--avec-strategie')
const base: EtatJeu = { positions: { alice: 0, bob: 0 }, scores: {}, tick: 0 }
const inputs: Input[] = [
  { joueurId: 'alice', dx: 1 },
  { joueurId: 'bob', dx: 1 },
  { joueurId: 'alice', dx: 999 }, // triche
]

if (!avecStrategie) {
  const pos = { ...base.positions }
  for (const i of inputs) pos[i.joueurId] = (pos[i.joueurId] ?? 0) + i.dx // application immediate
  console.log('positions du stub :', JSON.stringify(pos))
  const triche = Math.abs(pos.alice) > 2
  console.log(triche ? '\nTRICHE ACCEPTEE  <- le stub applique dx=999 tel quel' : '\nOK')
  process.exit(triche ? 1 : 0)
} else {
  const b1 = new BoucleAutoritaire({ ...base, positions: { ...base.positions } })
  for (const i of inputs) b1.enqueue(i)
  const e1 = b1.tick()

  const b2 = new BoucleAutoritaire({ ...base, positions: { ...base.positions } })
  for (const i of inputs) b2.enqueue({ ...i })
  const e2 = b2.tick() // rejeu

  console.log('positions apres tick :', JSON.stringify(e1.positions))
  const ok = e1.positions.alice === 2 && JSON.stringify(e1.positions) === JSON.stringify(e2.positions)
  console.log(ok ? '\nCONVERGE  (tick autoritaire : borne + deterministe)' : '\nDIVERGE')
  process.exit(ok ? 0 : 1)
}
