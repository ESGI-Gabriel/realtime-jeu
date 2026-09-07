import { createServer, type ServerResponse } from 'node:http'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const HERE = dirname(fileURLToPath(import.meta.url))

// Un canal qui emet des "items" numerotes. Le client peut rater des items pendant une coupure ;
// on garde un buffer borne pour les lui rejouer a la reconnexion via Last-Event-ID.

interface Evt {
  id: number
  data: string
}

const MAX_BUFFER = 100
const events: Evt[] = []
let nextId = 1

function record(data: string): Evt {
  const event: Evt = { id: nextId++, data }
  events.push(event)
  if (events.length > MAX_BUFFER) events.shift() // buffer borne : pas d'historique infini
  return event
}

function send(res: ServerResponse, event: Evt) {
  res.write(`id: ${event.id}\n`)
  res.write(`data: ${event.data}\n\n`)
}

const server = createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html' })
    res.end(readFileSync(join(HERE, 'public', 'index.html')))
    return
  }
  if (req.url !== '/stream') {
    res.writeHead(404).end()
    return
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    Connection: 'keep-alive',
  })

  const lastEventId = Number(req.headers['last-event-id'] ?? 0)
  const oldestBuffered = events[0]?.id ?? Infinity
  if (lastEventId > 0 && lastEventId < oldestBuffered - 1) {
    res.write('event: resync-needed\ndata: buffer depasse, rechargez un instantane complet\n\n')
  }
  for (const event of events) {
    if (event.id > lastEventId) send(res, event) // rattrapage des items manques
  }

  const timer = setInterval(() => send(res, record(`item ${nextId}`)), 1000)
  req.on('close', () => clearInterval(timer))
})

server.listen(9001, () => console.log('kit s2 - SSE sur http://localhost:9001'))
