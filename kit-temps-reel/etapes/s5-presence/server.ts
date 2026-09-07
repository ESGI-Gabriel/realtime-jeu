import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

// Presence par room + signal ephemere + snapshot a la connexion tardive.
// Signal ephemere neutre ici : la "position d'un curseur" (un entier). Dans votre template :
// curseur d'edition, instrument regarde, "X tape", joueur pret, position d'un livreur.

const GRACE_PERIOD_MS = 5000

interface Member {
  userId: string
  cursor: number
}
interface RoomState {
  members: Map<string, Member> // socketId -> presence + dernier signal ephemere
  pendingLeave: Map<string, ReturnType<typeof setTimeout>> // userId -> minuteur de grace
}

const rooms = new Map<string, RoomState>()

function getRoom(room: string): RoomState {
  let state = rooms.get(room)
  if (!state) {
    state = { members: new Map(), pendingLeave: new Map() }
    rooms.set(room, state)
  }
  return state
}

const httpServer = createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(join(HERE, 'public', 'index.html')))
    return
  }
  res.writeHead(404).end()
})

const io = new Server(httpServer)

io.on('connection', (socket) => {
  socket.on('join', (room: string, userId: string, ack: (snapshot: Member[]) => void) => {
    socket.data.room = room
    socket.data.userId = userId
    socket.join(room)

    const state = getRoom(room)
    const pending = state.pendingLeave.get(userId)
    if (pending) {
      clearTimeout(pending) // l'utilisateur revient a temps : on annule le "left"
      state.pendingLeave.delete(userId)
    } else {
      socket.to(room).emit('presence-joined', userId)
    }

    state.members.set(socket.id, { userId, cursor: 0 })
    ack([...state.members.values()]) // snapshot : l'arrivant voit l'etat courant tout de suite
  })

  socket.on('cursor-move', (pos: number) => {
    const state = rooms.get(socket.data.room)
    const member = state?.members.get(socket.id)
    if (member) member.cursor = pos
    socket.to(socket.data.room).emit('cursor-move', { userId: socket.data.userId, pos })
  })

  socket.on('disconnect', () => {
    const { room, userId } = socket.data
    const state = rooms.get(room)
    if (!state) return
    state.members.delete(socket.id)

    const timer = setTimeout(() => {
      state.pendingLeave.delete(userId)
      io.to(room).emit('presence-left', userId) // "left" seulement apres le delai de grace
    }, GRACE_PERIOD_MS)
    state.pendingLeave.set(userId, timer)
  })
})

httpServer.listen(9020, () => console.log('kit s5 - presence sur http://localhost:9020'))
