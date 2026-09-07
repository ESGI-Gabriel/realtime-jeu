# Tranche 6 (s6-convergence) - Convergence et concurrence

## Ce qu'elle montre

Les **4 stratégies** de convergence, chacune dans son fichier, rejouées sur un scénario
concurrent par `demo.ts` :

| Fichier | Stratégie | Type de projet où elle est naturelle |
|---|---|---|
| `crdt-sequence.ts` | CRDT de séquence (positions denses stables) | éditeur collaboratif |
| `snapshot-delta.ts` | snapshot + delta numéroté, resync par n° de séquence | flux de cotations, suivi de positions |
| `dedup-seq.ts` | numéro de séquence + déduplication à la reconnexion | messagerie |
| `tick-authoritative.ts` | boucle serveur autoritaire à tick fixe | jeu temps réel |

Un projet donné en utilise **une seule** ; les autres sont là pour la comparaison (voir
`convergence.exemple.ts` de votre template pour celle qui s'applique à votre sujet).

## Lancer

```bash
npm run s6
```

Sortie attendue : 4 lignes `OK`, puis « Toutes les stratégies convergent. » Code de sortie 0.

## À observer

Dans `demo.ts`, chaque bloc reproduit d'abord la **divergence** possible (ordre de réception
différent, updates manquées, doublon, deux inputs simultanés) puis vérifie que la stratégie
fait **converger** les deux répliques.
