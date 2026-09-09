import { Server } from "socket.io";
import { createServer } from "node:http";
import { verifyJwtPayload } from "./security-helpers";
import { canJoinRoom, type Input, type Partie } from "../domain";
import { store } from "../server";

const SECRET = process.env.SECRET ?? "test";

export const startSocketIO = (
  httpServer: ReturnType<typeof createServer>,
  publishLobbyUpdate: (partie: Partie) => void,
) => {
  const io = new Server(httpServer, {
    pingInterval: 25_000,
    pingTimeout: 20_000,
    cors: { origin: true },
  });

  io.use((socket, next) => {
    const token =
      typeof socket.handshake.auth.token === "string"
        ? socket.handshake.auth.token
        : null;
    const payload = verifyJwtPayload(token, SECRET);
    if (!payload) return next(new Error("Unauthorized"));
    socket.data.userId = payload.sub;
    next();
  });

  const broadcastPartie = (partieId: string) => {
    const partie = store.parties.get(partieId);
    if (partie) io.to(`partie:${partieId}`).emit("partie-updated", partie);
  };

  const broadcastPresence = (partieId: string) => {
    const partie = store.parties.get(partieId);
    if (!partie) return;
    publishLobbyUpdate(partie);
    broadcastPartie(partieId);
  };

  const removePlayer = (partieId: string, userId: string): boolean => {
    const partie = store.parties.get(partieId);
    if (!partie || !partie.joueurs.some((joueur) => joueur.id === userId)) {
      return false;
    }
    partie.joueurs = partie.joueurs.filter((joueur) => joueur.id !== userId);
    store.parties.set(partieId, partie);
    broadcastPresence(partieId);
    return true;
  };

  io.on("connection", (socket) => {
    console.log("a user connected");

    socket.on(
      "join",
      (partieId: string, ack?: (success: boolean, error?: string) => void) => {
        const room = `partie:${partieId}`;
        const currentPartie = [...store.parties.values()].find((partie) =>
          partie.joueurs.some((joueur) => joueur.id === socket.data.userId),
        );

        if (currentPartie) {
          return ack?.(false, "Quittez votre partie actuelle avant d'en rejoindre une autre");
        }

        if (!canJoinRoom(partieId)) {
          return ack?.(false, "Partie non autorisée");
        }

        try {
          socket.join(room);
          const partie = store.parties.get(partieId)!;

          partie.joueurs.push({
            id: socket.data.userId,
            pseudo: socket.data.userId,
            pret: false,
          });
          store.parties.set(partieId, partie);
          broadcastPresence(partieId);
          console.log(`User ${socket.data.userId} joined room ${room}`);

          ack?.(true);
        } catch (error) {
          return ack?.(false, "Failed to join room");
        }
        return ack?.(true);
      },
    );

    socket.on(
      "leave",
      (partieId: string, ack?: (success: boolean, error?: string) => void) => {
        const room = `partie:${partieId}`;

        try {
          if (!removePlayer(partieId, socket.data.userId)) {
            return ack?.(false, "Partie not found");
          }
          socket.leave(room);
          console.log(`User ${socket.data.userId} left room ${room}`);

          ack?.(true);
        } catch (error) {
          return ack?.(false, "Failed to leave room");
        }
        return ack?.(true);
      },
    );

    socket.on(
      "ready",
      (roomId: string, ack?: (success: boolean, error?: string) => void) => {
        const room = `partie:${roomId}`;
        const partie = store.parties.get(roomId);

        if (!partie) {
          return ack?.(false, "Partie not found");
        }

        const joueur = partie.joueurs.find((joueur) => joueur.id === socket.data.userId);
        if (!joueur) {
          return ack?.(false, "Player not found in this room");
        }

        if (joueur.pret) {
          return ack?.(false, "Player is already marked as ready");
        }

        joueur.pret = true;
        store.parties.set(roomId, partie);
        broadcastPartie(roomId);

        ack?.(true);
      },
    );

    socket.on(
      "not-ready",
      (roomId: string, ack?: (success: boolean, error?: string) => void) => {
        const room = `partie:${roomId}`;
        const partie = store.parties.get(roomId);

        if (!partie) {
          return ack?.(false, "Partie not found");
        }

        const joueur = partie.joueurs.find((joueur) => joueur.id === socket.data.userId);
        if (!joueur) {
          return ack?.(false, "Player not found in this room");
        }

        if (!joueur.pret) {
          return ack?.(false, "Player is already marked as not ready");
        }

        joueur.pret = false;
        store.parties.set(roomId, partie);
        broadcastPartie(roomId);

        ack?.(true);
      },
    );

    socket.on("disconnect", () => {
      for (const partie of store.parties.values()) {
        removePlayer(partie.id, socket.data.userId);
      }
      console.log("user disconnected");
    });
  });

  return io;
};
