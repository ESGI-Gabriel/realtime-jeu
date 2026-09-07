#!/usr/bin/env bash
set -euo pipefail

# Injecte latence puis coupure devant un serveur temps reel, via l'API toxiproxy.
# Prerequis : `docker compose -f etapes/s9-webrtc/docker-compose.yml up` et un serveur
# temps reel joignable a l'UPSTREAM ci-dessous. Pointez ensuite vos clients sur :19001.

API=${API:-http://localhost:8474}
UPSTREAM=${UPSTREAM:-host.docker.internal:9001}   # votre serveur temps reel

echo "== creation du proxy 'realtime' -> ${UPSTREAM}"
curl -sf -XPOST "${API}/proxies" \
  -d "{\"name\":\"realtime\",\"listen\":\"0.0.0.0:19001\",\"upstream\":\"${UPSTREAM}\"}" >/dev/null \
  || echo "(deja cree)"

echo "== +200 ms de latence"
curl -sf -XPOST "${API}/proxies/realtime/toxics" \
  -d '{"type":"latency","attributes":{"latency":200}}' >/dev/null

echo "== coupure 5 s"
curl -sf -XPOST "${API}/proxies/realtime" -d '{"enabled":false}' >/dev/null
sleep 5
curl -sf -XPOST "${API}/proxies/realtime" -d '{"enabled":true}' >/dev/null

echo "== retabli. Observez la reconnexion et le temps de resync cote client."
