import { Server } from 'socket.io'
import { createServer } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

// Le serveur de signaling RELAIE seulement (offer / answer / candidats ICE). Il ne voit jamais
// le flux P2P : une fois le canal etabli, les donnees passent directement entre navigateurs.

const httpServer = createServer((req, res) => {
  if (req.url === '/' || req.url === '/webrtc.html') {
    res.setHeader('Content-Type', 'text/html')
    res.end(readFileSync(join(HERE, 'public', 'webrtc.html')))
    return
  }
  res.writeHead(404).end()
})

const io = new Server(httpServer) // sert aussi /socket.io/socket.io.js
httpServer.listen(9050, () => console.log('kit s9 - signaling sur http://localhost:9050/webrtc.html'))

io.on('connection', (socket) => {
  socket.on('join', (room: string) => {
    const size = io.sockets.adapter.rooms.get(room)?.size ?? 0
    if (size >= 2) {
      socket.emit('room-full')
      return
    }
    socket.join(room)
    socket.data.room = room
    if (size === 1) socket.to(room).emit('peer-ready') // le 2e arrivant declenche l'offre du 1er
  })

  for (const type of ['offer', 'answer', 'ice-candidate'] as const) {
    socket.on(type, (payload: unknown) => socket.to(socket.data.room).emit(type, payload))
  }
})
