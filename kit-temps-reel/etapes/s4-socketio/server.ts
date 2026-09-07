import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { verifyJwtPayload, SECRET } from '../s3-ws/security-helpers.ts'

// Socket.IO automatise ce qui devient repetitif : rooms, acks, reconnexion, heartbeat.
// Ici le canal neutre s'appelle "canal:<id>" ; dans votre template ce sera doc: / instrument: /
// salon: / partie: / commande:|zone:.

const httpServer = createServer()
const io = new Server(httpServer, {
  pingInterval: 25_000,
  pingTimeout: 20_000,
  cors: { origin: true },
})

// Autorisation au handshake : reutilise la verification JWT de la tranche `s3`.
io.use((socket, next) => {
  const token = (socket.handshake.auth?.token as string | undefined) ?? null
  const payload = verifyJwtPayload(token, SECRET)
  if (!payload) return next(new Error('unauthorized'))
  socket.data.userId = payload.sub
  next()
})

/** Politique d'autorisation par room : ici, chacun ne rejoint que "canal:<son userId>" ou "public". */
function isAllowedRoom(userId: string, room: string): boolean {
  return room === `canal:${userId}` || room === 'public'
}

io.on('connection', (socket) => {
  console.log('connecte :', socket.data.userId, socket.id)

  socket.on('join', (room: string, ack: (ok: boolean, error?: string) => void) => {
    if (!isAllowedRoom(socket.data.userId, room)) {
      ack(false, 'room non autorisee') // la decision est portee par l'ack
      return
    }
    socket.join(room)
    ack(true)
    socket.to(room).emit('member-joined', socket.data.userId)
  })

  // Evenement metier confirme par ack.
  socket.on('item', (payload: unknown, ack: (received: true) => void) => {
    const room = [...socket.rooms].find((r) => r !== socket.id)
    if (room) io.to(room).emit('item', { from: socket.data.userId, payload })
    ack(true)
  })
})

httpServer.listen(9010, () => console.log('kit s4 - Socket.IO sur http://localhost:9010'))
