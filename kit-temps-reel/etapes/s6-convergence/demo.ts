// Rejoue, pour chaque strategie, un scenario concurrent et verifie que les deux repliques
// convergent. `npm run s6` : sortie 0 si tout converge, 1 sinon.

import { applyChar, genBetween, readText, type Char } from './crdt-sequence.ts'
import { SnapshotDeltaServer, SnapshotDeltaClient } from './snapshot-delta.ts'
import { DedupRoom, DedupClient } from './dedup-seq.ts'
import { TickServer } from './tick-authoritative.ts'

let failures = 0
function check(name: string, ok: boolean, detail = '') {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${name}${detail ? ' - ' + detail : ''}`)
  if (!ok) failures++
}

// --- 1. CRDT de sequence : 2 insertions concurrentes au meme offset ---
{
  // Etat de depart partage : "AB"
  const seed: Char[] = []
  applyChar(seed, { pos: genBetween(null, null, 'seed'), value: 'A' })
  applyChar(seed, { pos: genBetween(seed[0].pos, null, 'seed'), value: 'B' })

  const replicaA: Char[] = seed.map((c) => ({ ...c }))
  const replicaB: Char[] = seed.map((c) => ({ ...c }))

  // A insere 'X' entre A et B ; B insere 'Y' entre A et B, sans voir l'op de l'autre
  const opX: Char = { pos: genBetween(seed[0].pos, seed[1].pos, 'siteA'), value: 'X' }
  const opY: Char = { pos: genBetween(seed[0].pos, seed[1].pos, 'siteB'), value: 'Y' }

  applyChar(replicaA, opX)
  applyChar(replicaA, opY) // recoit l'op distante
  applyChar(replicaB, opY)
  applyChar(replicaB, opX) // recoit l'op distante, dans l'autre ordre

  check(
    'CRDT sequence converge malgre l\'ordre de reception',
    readText(replicaA) === readText(replicaB),
    `A="${readText(replicaA)}" B="${readText(replicaB)}"`,
  )
}

// --- 2. Snapshot + delta : client deconnecte, updates manquees, resync ---
{
  const server = new SnapshotDeltaServer()
  const client = new SnapshotDeltaClient()
  client.applySync(server.sync(0)) // snapshot initial (vide)

  server.update('prix', 100)
  client.applySync(server.sync(client.lastSeq)) // client a jour : seq 1

  // coupure : 3 updates manquees
  server.update('prix', 101)
  server.update('volume', 5)
  server.update('prix', 102)

  client.applySync(server.sync(client.lastSeq)) // petit trou => deltas

  check(
    'snapshot+delta : resync par petit trou',
    client.state.prix === 102 && client.state.volume === 5 && client.lastSeq === server.currentSeq,
    JSON.stringify(client.state),
  )
}

// --- 3. Dedup par seq : 2 messages simultanes + renvoi apres reconnexion ---
{
  const room = new DedupRoom()
  const client = new DedupClient()

  const m1 = room.publish('bonjour') // 2 clients "simultanes" -> le serveur ordonne
  const m2 = room.publish('salut')
  client.receive(m1)
  client.receive(m2)

  // reconnexion : le serveur renvoie tout depuis lastSeq-2 (chevauchement)
  for (const m of room.since(client.lastSeq - 2)) client.receive(m)

  check(
    'dedup : pas de doublon apres renvoi, ordre stable',
    client.displayed.length === 2 &&
      client.displayed.map((m) => m.body).join(',') === 'bonjour,salut',
    client.displayed.map((m) => `${m.seq}:${m.body}`).join(' '),
  )
}

// --- 4. Tick autoritaire : 2 inputs dans le meme tick ---
{
  const game = new TickServer()
  game.enqueue({ playerId: 'p1', dx: 1 })
  game.enqueue({ playerId: 'p2', dx: 1 })
  game.enqueue({ playerId: 'p1', dx: 5 }) // triche : borne a +1
  const state1 = game.tick()

  // rejoue a l'identique -> meme resultat (deterministe)
  const game2 = new TickServer()
  game2.enqueue({ playerId: 'p1', dx: 1 })
  game2.enqueue({ playerId: 'p2', dx: 1 })
  game2.enqueue({ playerId: 'p1', dx: 5 })
  const state2 = game2.tick()

  check(
    'tick autoritaire : deterministe + input borne',
    state1.p1 === 2 && state1.p2 === 1 && JSON.stringify(state1) === JSON.stringify(state2),
    JSON.stringify(state1),
  )
}

console.log(failures === 0 ? '\nToutes les strategies convergent.' : `\n${failures} echec(s).`)
process.exit(failures === 0 ? 0 : 1)
