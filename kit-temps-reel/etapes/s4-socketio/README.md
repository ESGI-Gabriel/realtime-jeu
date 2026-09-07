# Tranche 4 (s4-socketio) - Socket.IO : rooms, acks, autorisation

## Ce qu'elle montre

- **rooms** : `socket.join(room)` + `io.to(room).emit(...)`. Une room est juste une chaîne ;
  la convention de nommage est à vous (`canal:<id>` ici).
- **acks** : le callback confirme que le serveur a traité le message. Avec `socket.timeout(ms)`,
  l'ack rejette si le serveur ne répond pas.
- **autorisation par room** : `isAllowedRoom` ; la décision est renvoyée dans l'ack du `join`.
- **reconnexion automatique** : `socket.io.on('reconnect', ...)`.

## Lancer

```bash
npm run s4          # terminal 1
npm run s4:client   # terminal 2
```

## À observer

```
join canal:demo-user -> autorise
join canal:quelquun-dautre -> refuse (room non autorisee)
item confirme : true
reconnecte
```
