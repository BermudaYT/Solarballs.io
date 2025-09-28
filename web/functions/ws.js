const express = require("express");
const http = require("http");
const WebSocket = require("ws");
const path = require("path");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// === serve static files ===
app.use(express.static(path.join(__dirname)));

// === game logic ===
let nextId = 1;
const clients = new Map();

function broadcast(buf, except = null) {
  for (let [id, ws] of clients) {
    if (ws.readyState === WebSocket.OPEN && id !== except) {
      ws.send(buf);
    }
  }
}

wss.on("connection", (ws) => {
  const id = nextId++;
  clients.set(id, ws);

  // Send INIT packet
  sendInit(ws, { id, x: 2000, y: 2000, planet: "earth", name: "Unnamed" });

  ws.on("message", (msg) => {
  let arrayBuffer;
  if (msg instanceof ArrayBuffer) {
    arrayBuffer = msg;
  } else if (Buffer.isBuffer(msg)) {
    arrayBuffer = msg.buffer.slice(msg.byteOffset, msg.byteOffset + msg.byteLength);
  }
  const view = new DataView(arrayBuffer);
  const type = view.getUint8(0);

  if (type === 1 || type === 2) broadcast(arrayBuffer, id); // init / move
  if (type === 6) broadcast(arrayBuffer); // chat
});


  ws.on("close", () => {
    const buf = new ArrayBuffer(4);
    const v = new DataView(buf);
    v.setUint8(0, 3); // disconnect
    v.setUint16(1, id, true);
    v.setUint8(3, 0); // cause
    broadcast(buf, id);
    clients.delete(id);
  });
});

function sendInit(ws, player) {
  const enc = new TextEncoder();
  const a = enc.encode(player.planet);
  const n = enc.encode(player.name);
  const buf = new ArrayBuffer(1 + 2 + 2 + 2 + 1 + a.length + 1 + n.length);
  const v = new DataView(buf);
  let o = 0;
  v.setUint8(o++, 1);
  v.setUint16(o, player.id, true); o += 2;
  v.setUint16(o, player.x, true); o += 2;
  v.setUint16(o, player.y, true); o += 2;
  v.setUint8(o++, a.length); a.forEach((b,i)=>v.setUint8(o+i,b)); o += a.length;
  v.setUint8(o++, n.length); n.forEach((b,i)=>v.setUint8(o+i,b));
  ws.send(buf);
}

server.listen(8080, () => {
  console.log("🌍 Solarballs.io server running on http://localhost:8080");
});
