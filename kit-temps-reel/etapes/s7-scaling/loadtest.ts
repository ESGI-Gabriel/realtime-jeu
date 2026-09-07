import { io as ioClient } from 'socket.io-client'

// Test de charge modeste : N connexions WebSocket simultanees. Restez sous ~2000 en salle.
const N = Number(process.env.N ?? 500)
const URL = process.env.URL ?? 'http://localhost:9001'

const start = Date.now()
let connected = 0

await Promise.all(
  Array.from(
    { length: N },
    () =>
      new Promise<void>((resolve) => {
        const c = ioClient(URL, { transports: ['websocket'], reconnection: false })
        c.on('connect', () => {
          connected++
          resolve()
        })
        c.on('connect_error', () => resolve())
      }),
  ),
)

console.log(`${connected}/${N} connexions en ${Date.now() - start} ms`)
console.log('regardez /metrics sur chaque instance (ws_active_connections) pendant ce temps')
process.exit(0)
