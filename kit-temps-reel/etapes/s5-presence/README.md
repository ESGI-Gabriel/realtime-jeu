# Tranche 5 (s5-presence) - Présence et état partagé

## Ce qu'elle montre

- **présence par room** : liste des membres, `presence-joined` / `presence-left`.
- **délai de grâce** : une micro-coupure (`disconnect` puis `connect` en moins de
  `GRACE_PERIOD_MS`) ne déclenche pas `presence-left`.
- **signal éphémère** : `cursor-move`, diffusé sans être persisté (juste gardé comme "dernière
  valeur connue" pour le snapshot).
- **snapshot à la connexion tardive** : l'ack du `join` renvoie l'état courant ; l'arrivant
  n'attend pas le prochain événement de chacun.

## Lancer

```bash
npm run s5
# ouvrir http://localhost:9020 dans 2 onglets
```

## À observer

Onglet A bouge son curseur ; onglet B (ouvert après) le voit immédiatement grâce au snapshot.
Fermez A 2 s puis rouvrez : B n'affiche jamais "parti". Fermez A plus de 5 s : "parti" arrive.
