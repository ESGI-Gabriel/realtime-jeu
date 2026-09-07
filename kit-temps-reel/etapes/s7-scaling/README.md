# Tranche 7 (s7-scaling) - Scaling horizontal + observabilité

## Ce qu'elle montre

- **sticky sessions** : `ip_hash` sur nginx, un client garde son instance.
- **`@socket.io/redis-adapter`** : `io.to(room).emit(...)` atteint les clients des **autres**
  instances via Redis pub/sub. Le code applicatif ne change pas.
- **métriques** : `ws_active_connections` (jauge), `ws_connects_total` / `ws_disconnects_total`
  (compteurs), exposées sur `/metrics`.

## Lancer

En instance unique (sans Redis) pour lire le code :

```bash
npm run s7          # avertit "Redis injoignable", tourne quand meme sur :9001, /metrics :9002
```

En 2 instances + proxy + Redis :

```bash
docker compose -f etapes/s7-scaling/docker-compose.yml up --build
# proxy sur :9001 ; test de charge :
URL=http://localhost:9001 N=500 npm run s7:load
```

## À observer

Deux clients sur des instances différentes (logs `[A]` / `[B]`) : un `item` émis par l'un est
reçu par l'autre. Le relevé attendu dans votre template : 2-3 jauges + 2-3 phrases
d'interprétation (répartition A/B, temps d'établissement, déconnexion massive).
