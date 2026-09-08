import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";
import { RateLimiter, verifyJwt } from "./security-helpers.ts";

const HEARTBEAT_MS = 30_000;
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ?? "http://localhost:8080"
).split(",");
const SECRET = process.env.SECRET ?? "test";

export function startWebSocketServer(httpServer: Server) {
  const wss = new WebSocketServer({
    server: httpServer,
    verifyClient: (info, done) => {
      if (info.origin && !ALLOWED_ORIGINS.includes(info.origin)) {
        return done(false, 403, "Forbidden");
      }

      const token = new URL(info.req.url ?? '', 'http://localhost').searchParams.get('token')
      if (!verifyJwt(token, SECRET)) return done(false, 401, 'Unauthorized')

      done(true);
    },
  });
  const alive = new WeakMap<WebSocket, boolean>();

  wss.on("connection", (socket) => {
    const limiter = new RateLimiter(20);
    alive.set(socket, true);
    socket.on("pong", () => alive.set(socket, true));
    socket.on("close", () => limiter.stop());
    socket.on("message", (data) => {
      if (!limiter.hit()) return socket.close(1008, "rate limit exceeded");
      socket.send(data);
    });
  });

  const heartbeat = setInterval(() => {
    for (const socket of wss.clients) {
      if (alive.get(socket) === false) {
        socket.terminate();
        continue;
      }
      alive.set(socket, false);
      socket.ping();
    }
  }, HEARTBEAT_MS);

  wss.on("close", () => clearInterval(heartbeat));
  return wss;
}
