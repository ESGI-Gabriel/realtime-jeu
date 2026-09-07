#!/usr/bin/env bash
# Verifie que chaque tranche du kit demarre (hors Docker) + tsc --noEmit.
set -uo pipefail
cd "$(dirname "$0")"
TSX=./node_modules/.bin/tsx
FAIL=0

cleanup() {
  pkill -9 -f "kit-reference/node_modules/tsx" 2>/dev/null || true
  for p in 9000 9001 9002 9010 9020 9050 8081; do fuser -k -9 "$p"/tcp 2>/dev/null || true; done
  sleep 1.5
}
trap cleanup EXIT
cleanup

banner() { echo; echo "=== $1 ==="; }
run_bg() { setsid "$TSX" "$1" >/tmp/kit-out.log 2>&1 & echo $!; }
stop()   { pkill -9 -f "kit-reference/node_modules/tsx" 2>/dev/null || true; sleep 0.5; }
waitfor(){ for _ in $(seq 1 40); do grep -q "$1" /tmp/kit-out.log 2>/dev/null && return 0; sleep 0.25; done; echo "  (timeout: $1)"; sed 's/^/  | /' /tmp/kit-out.log; return 1; }

banner "s1 TCP"
: > /tmp/kit-out.log; run_bg etapes/s1-tcp/server.ts >/dev/null; waitfor "port 9000"
"$TSX" etapes/s1-tcp/client-demo.ts | sed 's/^/  /' && echo "-> s1 OK" || { echo "-> s1 FAIL"; FAIL=1; }
stop

banner "s2 SSE"
: > /tmp/kit-out.log; run_bg etapes/s2-sse/server.ts >/dev/null; waitfor "9001"
curl -sN -H "Last-Event-ID: 0" http://localhost:9001/stream --max-time 2 | sed 's/^/  /' | head -2
curl -s http://localhost:9001/ | grep -q "Canal SSE" && echo "-> s2 OK" || { echo "-> s2 FAIL"; FAIL=1; }
stop

banner "s3 ws"
: > /tmp/kit-out.log; run_bg etapes/s3-ws/server.ts >/dev/null; waitfor "8081"
TOKEN=$("$TSX" etapes/s3-ws/make-token.ts)
node --input-type=module -e "
import {WebSocket} from 'ws';
const ok=new WebSocket('ws://localhost:8081?token=${TOKEN}');
ok.on('open',()=>ok.send('hi'));
ok.on('message',m=>{console.log('  with token:',m.toString());ok.close();
  const bad=new WebSocket('ws://localhost:8081');
  bad.on('open',()=>{console.log('  NO-TOKEN ACCEPTED (BUG)');process.exit(1)});
  bad.on('error',()=>{console.log('  no token: rejected');process.exit(0)});});
ok.on('error',e=>{console.log('  token err',e.message);process.exit(1)});
" && echo "-> s3 OK" || { echo "-> s3 FAIL"; FAIL=1; }
stop

banner "s4 socket.io"
: > /tmp/kit-out.log; run_bg etapes/s4-socketio/server.ts >/dev/null; waitfor "9010"
OUT=$("$TSX" etapes/s4-socketio/client-demo.ts 2>&1)
echo "$OUT" | sed 's/^/  /'
{ echo "$OUT" | grep -q "refuse (room non autorisee)" \
  && echo "$OUT" | grep -q "item confirme : true" \
  && echo "$OUT" | grep -q "reconnecte"; } && echo "-> s4 OK" || { echo "-> s4 FAIL"; FAIL=1; }
stop

banner "s5 presence"
: > /tmp/kit-out.log; run_bg etapes/s5-presence/server.ts >/dev/null; waitfor "9020"
curl -s http://localhost:9020/ | grep -q "Presence" && echo "  front OK" || { echo "  front FAIL"; FAIL=1; }
node --input-type=module -e "
import {io} from 'socket.io-client';
const a=io('http://localhost:9020');
a.on('connect',()=>a.emit('join','canal:demo','ua',()=>{
  const b=io('http://localhost:9020');
  b.on('connect',()=>b.emit('join','canal:demo','ub',(snap)=>{
    console.log('  B voit:',snap.map(m=>m.userId).join(','));
    process.exit(snap.some(m=>m.userId==='ua')?0:1);})); }));
" && echo "-> s5 OK" || { echo "-> s5 FAIL"; FAIL=1; }
stop

banner "s6 convergence"
"$TSX" etapes/s6-convergence/demo.ts | sed 's/^/  /' && echo "-> s6 OK" || { echo "-> s6 FAIL"; FAIL=1; }

banner "s7 solo start + metrics"
: > /tmp/kit-out.log; run_bg etapes/s7-scaling/server.ts >/dev/null; waitfor "Socket.IO :9001"
curl -s http://localhost:9002/metrics | grep -q "ws_active_connections" && echo "-> s7 OK" || { echo "-> s7 FAIL"; FAIL=1; }
stop

banner "s9 signaling start"
: > /tmp/kit-out.log; run_bg etapes/s9-webrtc/signaling.ts >/dev/null; waitfor "9050"
curl -s http://localhost:9050/webrtc.html | grep -q "data channel" && echo "-> s9 OK" || { echo "-> s9 FAIL"; FAIL=1; }
stop

banner "tsc --noEmit"
./node_modules/.bin/tsc --noEmit && echo "-> tsc OK" || { echo "-> tsc FAIL"; FAIL=1; }

echo; echo "RESULT: $([ $FAIL -eq 0 ] && echo ALL-GREEN || echo FAILURES)"
exit $FAIL
