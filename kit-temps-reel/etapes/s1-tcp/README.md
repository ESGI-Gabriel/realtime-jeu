# Tranche 1 (s1-tcp) - TCP et framing applicatif

## Ce qu'elle montre

TCP est un flux d'octets : deux `socket.write()` peuvent arriver en un seul `data`, ou un
`write` peut arriver en plusieurs `data`. Pour retrouver des **messages**, on ajoute un cadre
applicatif. Ici : 4 octets de longueur, puis le contenu.

`extractFrames` accumule les octets reçus et n'émet un message que lorsqu'il est complet. C'est
exactement ce qu'une bibliothèque WebSocket fait pour vous (tranche `s3`).

## Lancer

```bash
npm run s1          # terminal 1 : le serveur
npm run s1:client   # terminal 2 : envoie 2 messages, affiche les 2 echos, quitte
```

## À observer

Les deux lignes `recu du serveur : echo: ...` sont propres, sans octet parasite devant `echo:`.
Si vous affichiez `chunk.toString()` directement (sans `extractFrames`), les 4 octets de longueur
s'afficheraient comme des caractères illisibles collés au message.
