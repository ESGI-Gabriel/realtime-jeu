import { createServer, type Socket } from 'node:net'
import { frame, extractFrames } from './framing.ts'

// TCP livre un flux d'octets, pas des messages. On encadre chaque message (voir framing.ts).

const server = createServer((socket: Socket) => {
  let pending: Buffer = Buffer.alloc(0)

  socket.on('data', (chunk: Buffer) => {
    pending = Buffer.concat([pending, chunk])
    pending = extractFrames(pending, (payload) => {
      console.log('recu :', payload.toString())
      socket.write(frame(Buffer.from(`echo: ${payload}`)))
    })
  })

  socket.on('error', (err) => console.error('socket error:', err.message))
})

server.listen(9000, () => console.log('kit s1 - serveur TCP frame sur le port 9000'))
