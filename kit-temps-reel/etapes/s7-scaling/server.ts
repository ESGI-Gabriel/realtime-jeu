import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { createAdapter } from '@socket.io/redis-adapter'
import { createClient } from 'redis'
import { Registry, Gauge, Counter, collectDefaultMetrics } from 'prom-client'

// Serveur temps reel scale horizontalement : plusieurs instances derriere un proxy sticky,
// le fan-out entre instances passe par Redis pub/sub (l'adapter). Le code applicatif
// (io.to(room).emit) ne change pas.

const INSTANCE = process.env.INSTANCE ?? 'solo'
const REDIS_URL = process.env.REDIS_URL ?? 'redis://localhost:6379'
const PORT = Number(process.env.PORT ?? 9001)

const httpServer = createServer()
const io = new Server(httpServer, { cors: { origin: true } })

try {
  // reconnectStrategy: false => connect() echoue vite si Redis est absent (pas de boucle infinie)
  const pub = createClient({ url: REDIS_URL, socket: { reconnectStrategy: false, connectTimeout: 1000 } })
  const sub = pub.duplicate()
  pub.on('error', () => {})
  sub.on('error', () => {})
  await Promise.all([pub.connect(), sub.connect()])
  io.adapter(createAdapter(pub, sub))
  console.log(`[${INSTANCE}] redis-adapter branche sur ${REDIS_URL}`)
} catch {
  console.warn(`[${INSTANCE}] Redis injoignable : demarrage en instance unique (fan-out local seulement)`)
}

// --- metriques ---
const registry = new Registry()
collectDefaultMetrics({ register: registry })
const activeConnections = new Gauge({
  name: 'ws_active_connections',
  help: 'connexions actives',
  registers: [registry],
})
const connectsTotal = new Counter({
  name: 'ws_connects_total',
  help: 'connexions etablies (cumul)',
  registers: [registry],
})
const disconnectsTotal = new Counter({
  name: 'ws_disconnects_total',
  help: 'deconnexions (cumul)',
  registers: [registry],
})

io.on('connection', (socket) => {
  activeConnections.inc()
  connectsTotal.inc()

  socket.on('join', (room: string) => socket.join(room))
  socket.on('item', (payload: unknown) => {
    const room = [...socket.rooms].find((r) => r !== socket.id) ?? 'public'
    io.to(room).emit('item', { instance: INSTANCE, payload }) // fan-out transparent via l'adapter
  })

  socket.on('disconnect', () => {
    activeConnections.dec()
    disconnectsTotal.inc()
  })
})

// endpoint /metrics sur un port dedie
createServer(async (_req, res) => {
  res.setHeader('Content-Type', registry.contentType)
  res.end(await registry.metrics())
}).listen(PORT + 1)

httpServer.listen(PORT, () =>
  console.log(`[${INSTANCE}] Socket.IO :${PORT}  /metrics :${PORT + 1}`),
)
