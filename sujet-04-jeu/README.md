# Jeu multijoueur temps reel leger

De petites parties (quiz-buzzer, `.io` minimal, Skribbl-like) : etat de partie autoritaire cote
serveur, score en direct, lobby, resistance a la triche.

## Demarrer

```bash
npm install
npm start          # http://localhost:3000
# ou : docker compose up --build
```

## API REST

| Methode | Route              | Description                          |
| ------- | ------------------ | ------------------------------------ |
| GET     | `/api/parties`     | liste des parties                    |
| GET     | `/api/parties/:id` | detail d'une partie (joueurs, etat)  |
| POST    | `/api/parties`     | cree une partie (`{ "nom": "..." }`) |

Donnees de demonstration : `npm run seed` (1 partie ouverte, 2 joueurs).

## Etat de la couche temps reel

Stub volontairement naif (`src/realtime/naive-stub.ts`) : pas de boucle a tick, les inputs sont
appliques des leur arrivee et la valeur du client est utilisee telle quelle (triche possible),
pas de room par partie. `TRANSPOSITION.md` liste ce qui est a corriger. Le cas de deux actions
"dans le meme tick" : `npm run scenario`.

Le reducteur autoritaire correct (`appliquerTick`) est **deja ecrit** dans `src/domain.ts` : en
l'etape 6 vous le branchez dans une boucle `setInterval`, vous ne le reecrivez pas.

## Structure

```
src/domain.ts              partie, joueur, reducteur autoritaire appliquerTick (pur)
src/store.ts               etat en memoire
src/rest.ts                routes Fastify
src/server.ts              point d'entree
src/seed.ts                donnees de demonstration
src/realtime/naive-stub.ts       LE stub a remplacer
src/realtime/security-helpers.ts   verification JWT + Origin + RateLimiter (fourni)
src/realtime/convergence.exemple.ts  strategie de convergence adaptee (fourni, a brancher)
src/realtime/piege.scenario.ts   deux actions dans le meme tick
public/index.html          front de demonstration (2 onglets = 2 joueurs)
docs/adr/                  vos Architecture Decision Records
```

## Sujet

Sujet n° : 4

## Choix de communication (ADR-1, amorce)

- Sens du flux principal : bidirectionnel
- Technique envisagée : WebSockets
- Pourquoi : Le serveur et les clients doivent pouvoir échanger des informations en temps réel afin que tous les joueurs aient un état du jeu à jour
- Pourquoi pas WebRTC : Le serveur doit gérer les ticks, effectuer les calculs et appliquer les règles du jeu