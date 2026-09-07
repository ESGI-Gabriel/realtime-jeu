# Tranche 2 (s2-sse) - SSE robuste

## Ce qu'elle montre

Un canal serveur vers client sur HTTP simple (`text/event-stream`). Trois points :

- **numérotation** : chaque item porte un `id:`.
- **buffer borné** : le serveur garde les 100 derniers items (`MAX_BUFFER`), pas plus.
- **rattrapage** : à la reconnexion, le navigateur renvoie `Last-Event-ID` ; le serveur rejoue
  ce qui a été manqué. Si le trou dépasse le buffer, il émet `resync-needed`.

## Lancer

```bash
npm run s2
# ouvrir http://localhost:9001
```

## À observer

DevTools &gt; Network &gt; Offline pendant 5 s, puis en ligne : la reconnexion est automatique et
les items manqués apparaissent, sans trou dans la numérotation. Regardez l'en-tête `Last-Event-ID`
sur la requête `/stream` rejouée.
