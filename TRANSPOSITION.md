# Transposition temps reel - jeu multijoueur

Ce projet part d'un **stub temps reel naif** (`src/realtime/naive-stub.ts`). A chaque etape,
vous en remplacez une tranche par la technique vue sur le kit de reference.

| Étape | Defaut du stub a corriger | Ce que vous branchez | Cible dans ce projet |
|---|---|---|---|
| 1 | (constat) | rien : vous listez par ecrit ce qui ne va pas | 2 onglets : le pion saute hors de l'arene (aucun bornage), pas de lobby, etat perdu a la reconnexion |
| 2 | diffusion "push tout a tout le monde" | canal **SSE** + buffer borne + `Last-Event-ID` | flux des scores / mode spectateur |
| 3 | `WebSocketServer` nu, aucune securite | serveur **`ws`** + handshake JWT + `Origin` + rate-limit | le point d'entree des inputs |
| 4 | pas de room : toutes les parties melangees | **Socket.IO** + room `partie:<id>` + lobby + ack + autorisation par partie | une room par partie |
| 5 | pas de presence, pret / pas pret invisible | presence par partie + `player-ready` (signal ephemere) + snapshot a la connexion | qui est connecte, qui est pret |
| 6 | inputs appliques immediatement, non bornes, non deterministes | **boucle serveur autoritaire a tick fixe** (20 Hz) : file d'inputs + `appliquerTick` + diff d'etat | `src/realtime/piege.scenario.ts` : rejeu identique, triche bornee |
| 7 | instance unique | `@socket.io/redis-adapter` + 2 instances + proxy | fan-out par partie |
| 8 | (stub deja remplace) | **WebRTC** : data channel P2P (echange direct d'etat entre 2 joueurs) + chaos reseau | exercice data channel impose |

Les ADR correspondants : `docs/adr/0001` (etape 2, acceptee etape 4), `docs/adr/0002` (etape 6), `docs/adr/0003`
(etape 7, acceptee etape 8).

## Code fourni pour vous aider

- `src/realtime/security-helpers.ts` : verification JWT + `Origin` + `RateLimiter` (etape 3), a brancher.
- `src/realtime/convergence.exemple.ts` : la strategie de convergence deja adaptee a ce projet
  (etape 6). Vous la branchez, vous ne la reecrivez pas.
- `src/realtime/piege.scenario.ts` : le cas de concurrence.
  `npm run scenario` echoue (stub) ; `npm run scenario -- --avec-strategie` reussit (strategie branchee).

## Constat initial (a remplir a l'etape 1)

Il n'est pas possible de choisir une partie, tous les joueurs se retrouvent dans la même room
Les déplacements ne sont pas limités, ce qui permet aux pions de sortir de l'arène
Les joueurs peuvent également se traverser, car aucune collision n'est gérée entre les pions.
