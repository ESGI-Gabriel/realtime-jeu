import { connect } from 'node:net'
import { frame, extractFrames } from './framing.ts'

// Le client parse lui aussi les frames en retour : la reponse du serveur est egalement framee.

const socket = connect({ port: 9000 }, () => {
  socket.write(frame(Buffer.from('hello')))
  socket.write(
    frame(
      Buffer.from(
        'un message plus long pour verifier que le framing marche meme quand un message ' +
          'est decoupe sur plusieurs paquets TCP',
      ),
    ),
  )
})

let pending: Buffer = Buffer.alloc(0)
let received = 0
socket.on('data', (chunk: Buffer) => {
  pending = Buffer.concat([pending, chunk])
  pending = extractFrames(pending, (payload) => {
    received++
    console.log('recu du serveur :', payload.toString())
    if (received >= 2) {
      socket.end()
      process.exit(0)
    }
  })
})

socket.on('error', (err) => {
  console.error('client error:', err.message)
  process.exit(1)
})
