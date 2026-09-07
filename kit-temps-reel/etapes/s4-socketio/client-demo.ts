import { io as ioClient } from 'socket.io-client'
import jwt from 'jsonwebtoken'
import { SECRET } from '../s3-ws/security-helpers.ts'

const token = jwt.sign({ sub: 'demo-user' }, SECRET, { expiresIn: '1h' })
const socket = ioClient('http://localhost:9010', { auth: { token } })

let done = false
socket.on('connect', () => {
  console.log('connecte', socket.id)
  if (done) return // le handler 'connect' refire a chaque reconnexion : on ne rejoue pas la demo
  done = true

  socket.emit('join', 'canal:demo-user', (ok: boolean, error?: string) => {
    console.log('join canal:demo-user ->', ok ? 'autorise' : `refuse (${error})`)
  })

  socket.emit('join', 'canal:quelquun-dautre', (ok: boolean, error?: string) => {
    console.log('join canal:quelquun-dautre ->', ok ? 'autorise (BUG)' : `refuse (${error})`)
  })

  // ack avec timeout : rejette si le serveur ne repond pas a temps.
  socket
    .timeout(5000)
    .emitWithAck('item', { value: 42 })
    .then((res) => console.log('item confirme :', res))
    .catch(() => console.log('item : timeout'))
    .finally(() => {
      // coupure puis reconnexion : le client Socket.IO retablit la connexion seul.
      socket.io.once('reconnect', () => {
        console.log('reconnecte')
        process.exit(0)
      })
      socket.io.engine.close() // simule une coupure de transport
      setTimeout(() => process.exit(0), 3000) // filet si l'evenement n'arrive pas
    })
})

socket.on('connect_error', (err) => {
  console.error('connect_error :', err.message)
  process.exit(1)
})
