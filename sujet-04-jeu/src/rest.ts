import type { FastifyInstance } from "fastify";
import { creerPartie, record, send, type Partie } from "./domain.ts";
import type { Store } from "./store.ts";

export function registerRoutes(app: FastifyInstance, store: Store): void {
  app.get("/api/parties", async () =>
    [...store.parties.values()].map((p) => ({
      id: p.id,
      nom: p.nom,
      statut: p.statut,
      joueurs: p.joueurs.length,
    })),
  );

  app.get("/api/parties/:id", async (req, reply) => {
    const partie = store.parties.get((req.params as { id: string }).id);
    if (!partie) return reply.code(404).send({ error: "partie inconnue" });
    return partie;
  });

  app.post("/api/parties", async (req, reply) => {
    const body = (req.body ?? {}) as { nom?: string };
    if (!body.nom) return reply.code(400).send({ error: "nom requis" });
    const partie: Partie = creerPartie(
      `p-${Date.now().toString(36)}`,
      body.nom,
    );
    store.parties.set(partie.id, partie);
    return reply.code(201).send({ id: partie.id, nom: partie.nom });
  });

  app.get("/api/stream", async (req, reply) => {
    reply.raw.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    });

    const lastEventId = Number(req.headers["last-event-id"] ?? 0);
    const oldestBuffered = store.events[0]?.id ?? Infinity;
    if (lastEventId > 0 && lastEventId < oldestBuffered - 1) {
      reply.raw.write(
        "event: resync-needed\ndata: buffer depasse, rechargez un instantane complet\n\n",
      );
    }
    for (const event of store.events) {
      if (event.id > lastEventId) send(reply.raw, event);
    }

    send(reply.raw, record(`item ${store.nextEventId}`));
  });
}
