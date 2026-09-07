import { WebSocketServer, WebSocket } from 'ws'
import type { IncomingMessage } from 'node:http'
import { verifyJwt, RateLimiter, SECRET } from './security-helpers.ts'

// Serveur ws bas niveau : la bibliotheque gere le handshake HTTP Upgrade et le framing des
// messages (ce qu'on faisait a la main dans la tranche `s1`). On ajoute : securite au handshake + keepalive.

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://localhost:9001']

const wss = new WebSocketServer({
  port: 8081,
  verifyClient: (
    info: { origin: string; req: IncomingMessage },
    done: (ok: boolean, code?: number, msg?: string) => void,
  ) => {
    // wscat n'envoie pas d'Origin : on ne rejette que si une Origin explicite est interdite.
    if (info.origin && !ALLOWED_ORIGINS.includes(info.origin)) {
      return done(false, 403, 'Origin non autorisee')
    }
    const token = new URL(info.req.url ?? '', 'http://x').searchParams.get('token')
    if (!verifyJwt(token, SECRET)) return done(false, 401, 'Token invalide')
    done(true)
  },
})

const limiters = new WeakMap<WebSocket, RateLimiter>()
const alive = new WeakMap<WebSocket, boolean>()

wss.on('connection', (socket) => {
  const limiter = new RateLimiter(20) // 20 messages/s max par connexion
  limiters.set(socket, limiter)
  alive.set(socket, true)

  socket.on('pong', () => alive.set(socket, true))
  socket.on('close', () => limiter.stop())

  socket.on('message', (data) => {
    if (!limiter.hit()) {
      socket.close(1008, 'rate limit exceeded')
      return
    }
    socket.send(`echo: ${data}`)
  })
})

// Keepalive : on ping toutes les 30 s, on termine les connexions qui ne repondent plus.
setInterval(() => {
  for (const socket of wss.clients) {
    if (alive.get(socket) === false) {
      socket.terminate()
      continue
    }
    alive.set(socket, false)
    socket.ping()
  }
}, 30_000)

console.log('kit s3 - serveur ws sur ws://localhost:8081 (token requis : npm run s3:token)')
