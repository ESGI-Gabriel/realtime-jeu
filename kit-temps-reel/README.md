# Kit temps réel de référence

Application de démonstration **neutre** : un serveur qui gère un ou plusieurs **canaux**, chaque
canal portant des **items** numérotés (`{ id, value }`). Aucun métier : le kit sert uniquement à
montrer, isolément, la technique temps réel de chaque étape. Vous transposez ensuite cette
technique dans le template de votre sujet (les items deviennent des opérations d'édition, des
ticks de prix, des messages, des inputs de jeu, des positions GPS…).

## Installation

```bash
npm install
```

Node.js 20+ requis. Aucune base de données pour les six premières tranches (`s1` à `s6`) ;
Redis et toxiproxy (via `docker compose`) pour `s7` et `s9`.

> Les tranches sont numérotées `s1` … `s7` puis `s9` (il n'y a pas de `s8`). Dans le
> `TRANSPOSITION.md` de votre template, la tranche `s9` correspond à l'étape 8.

## Une étape par tranche

| Tranche | Commande | Ce qu'elle montre |
|---|---|---|
| `etapes/s1-tcp` | `npm run s1` (+ `npm run s1:client`) | socket TCP `net`, framing par longueur préfixée |
| `etapes/s2-sse` | `npm run s2` | `text/event-stream`, buffer borné, `Last-Event-ID`, rattrapage |
| `etapes/s3-ws` | `npm run s3` (token : `npm run s3:token`) | serveur `ws`, handshake, `ping`/`pong`, JWT + `Origin` + rate-limit |
| `etapes/s4-socketio` | `npm run s4` (+ `npm run s4:client`) | rooms, `to(room).emit`, acks + timeout, reconnexion, autorisation |
| `etapes/s5-presence` | `npm run s5` | présence par room, délai de grâce, signal éphémère, snapshot |
| `etapes/s6-convergence` | `npm run s6` | les 4 stratégies de convergence rejouées sur un scénario concurrent |
| `etapes/s7-scaling` | `docker compose -f etapes/s7-scaling/docker-compose.yml up --build` | `@socket.io/redis-adapter`, sticky sessions, jauges `prom-client` |
| `etapes/s9-webrtc` | `npm run s9` puis `docker compose -f etapes/s9-webrtc/docker-compose.yml up` | signaling relayé, `RTCDataChannel`, chaos réseau (toxiproxy) |

Chaque dossier `etapes/sNN-*/` a son propre `README.md` : ce que la tranche montre, comment la
lancer, quoi observer.

## Ce que le kit n'est pas

- Pas un projet à rendre. Votre rendu, c'est le template de votre sujet.
- Pas exhaustif : il montre le mécanisme, pas tous les cas. La robustesse complète se construit
  dans votre template.
