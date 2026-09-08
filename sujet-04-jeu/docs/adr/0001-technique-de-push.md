# ADR-1 : technique de push

## Statut
Proposé

## Contexte
Le flux principal est bidirectionnel : les joueurs envoient leurs actions au serveur, qui calcule les ticks et diffuse l'état du jeu. Certains flux sont uniquement descendants, comme le score et les informations destinées aux spectateurs.

## Options envisagées
- Long-polling
- Server-Sent Events (SSE)
- WebSocket
- WebRTC

## Décision
WebSocket est retenu pour le flux principal, car le serveur et les joueurs doivent échanger des informations en temps réel dans les deux sens
SSE est utilisé en complément pour diffuser le score et l'état de la partie aux spectateurs, qui n'ont pas besoin d'envoyer d'actions au serveur.

## Pourquoi pas WebRTC pour le flux principal
Le serveur doit rester autoritaire : il gère les ticks, effectue les calculs, valide les actions et applique les règles du jeu. Une communication directe entre les clients compliquerait ce contrôle sans apporter d'avantage utile

## Conséquences
La logique du jeu reste centralisée sur le serveur et appliquée de la même manière à tous les joueurs, ce qui limite les possibilités de triche WebSocket permet les échanges bidirectionnels du jeu
Pour le flux SSE, le navigateur gère automatiquement la reconnexion et renvoie le dernier identifiant reçu avec `Last-Event-ID`
Le serveur doit conserver un buffer borné pour pouvoir rejouer les événements manqués
L'utilisation de deux techniques impose de maintenir deux types de connexion, chacun réservé à un besoin précis
