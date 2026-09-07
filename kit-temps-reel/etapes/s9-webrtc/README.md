# Tranche 9 (s9-webrtc) - WebRTC et chaos réseau

## Ce qu'elle montre

- **signaling via WebSocket** : le serveur relaie `offer` / `answer` / `ice-candidate`, sans
  jamais toucher au flux P2P.
- **`RTCDataChannel`** : une fois le canal ouvert, les données passent directement entre
  navigateurs (le serveur ne les voit plus).
- **candidats ICE** : lisibles dans la console (`ICE local: ... typ host` / `srflx`).
- **chaos réseau** : `chaos.sh` injecte 200 ms de latence puis une coupure de 5 s via toxiproxy
  (conteneur, aucun privilège root).

## Lancer

```bash
npm run s9
# ouvrir http://localhost:9050/webrtc.html dans 2 fenetres
```

Chaos (sur un serveur temps réel type tranche `s7`) :

```bash
docker compose -f etapes/s9-webrtc/docker-compose.yml up -d
bash etapes/s9-webrtc/chaos.sh          # pointez vos clients sur :19001
```

## À observer

`canal P2P ouvert` dans les 2 fenêtres, au moins une ligne `ICE local:`. Sous chaos : ce qui
casse, ce qui se rétablit seul, le temps de resynchronisation (le rapport de chaos de votre
template).
