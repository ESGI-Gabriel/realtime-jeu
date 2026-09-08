import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { registerRoutes } from './rest.ts'
import { createStore, parseClientInput, applyNaive, type ClientInput } from './store.ts'
import { startNaiveStub } from './realtime/naive-stub.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 3000)

export const store = createStore()
const app = Fastify({ logger: false })

await app.register(fastifyStatic, { root: join(HERE, '..', 'public') })
registerRoutes(app, store)

await app.listen({ port: PORT, host: '0.0.0.0' })
console.log(`jeu-multijoueur : http://localhost:${PORT}`)

// --- couche temps reel : stub naif (a remplacer, voir TRANSPOSITION.md) ---
// Defaut : pas de boucle a tick, inputs appliques immediatement, positions du client non bornees.
startNaiveStub<ClientInput>(app.server, {
  fullState: () => store.active.etat, // meme partie pour tout le monde (defaut : etape 4)
  parseInput: parseClientInput,
  applyInput: (input) => applyNaive(store, input),
})
console.log('couche temps reel : stub naif (voir src/realtime/naive-stub.ts)')
