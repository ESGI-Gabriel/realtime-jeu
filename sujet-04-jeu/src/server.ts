import Fastify from 'fastify'
import fastifyStatic from '@fastify/static'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import { registerRoutes } from './rest.ts'
import { createStore } from './store.ts'
import { startWebSocketServer } from './realtime/ws-server.ts'

const HERE = dirname(fileURLToPath(import.meta.url))
const PORT = Number(process.env.PORT ?? 8080)

export const store = createStore()
const app = Fastify({ logger: false })

await app.register(fastifyStatic, { root: join(HERE, '..', 'public') })
registerRoutes(app, store)
startWebSocketServer(app.server)

await app.listen({ port: PORT, host: '0.0.0.0' })
console.log(`jeu-multijoueur : http://localhost:${PORT}`)
console.log('couche temps reel : WebSocket echo + ping/pong')
