import jwt from 'jsonwebtoken'
import { SECRET } from './security-helpers.ts'

// Genere un token de test valable 4h. A coller dans wscat :
//   wscat -c "ws://localhost:8081?token=<TOKEN>"
console.log(jwt.sign({ sub: 'demo-user' }, SECRET, { expiresIn: '4h' }))
