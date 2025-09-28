<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Solarballs.io Multiplayer</title>
  <style>
    body { margin:0; overflow:hidden; background:#000; color:#fff; font-family:sans-serif; }
    canvas { display:block; }

    .menu {
      position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);
      background:rgba(0,0,0,.6);padding:20px;border-radius:12px;text-align:center;z-index:20;
      backdrop-filter:blur(10px);
    }
    .menu img.logo { max-width:240px; margin-bottom:20px; filter:drop-shadow(0 0 12px #ff0); }
    .avatar-grid { display:grid; grid-template-columns:repeat(4,1fr); gap:10px; margin-top:10px; }
    .avatar-option { cursor:pointer; padding:5px; border-radius:8px; background:rgba(255,255,255,.1); }
    .avatar-option img { width:50px; height:50px; object-fit:contain; display:block; margin:0 auto; }
    .btn { margin-top:12px; padding:8px 16px; background:#222; border:1px solid #555; border-radius:8px; cursor:pointer; color:#fff; }

    #chatBox { position:absolute;bottom:50px;left:10px;width:300px;height:160px;
      background:rgba(0,0,0,.5);border-radius:8px;padding:6px;overflow-y:auto; }
    #chatInput { position:absolute;bottom:10px;left:10px;width:300px;padding:6px;
      border-radius:8px;border:none;background:rgba(255,255,255,.1);color:#fff; }
  </style>
</head>
<body>
  <div id="menu" class="menu">
    <img src="assets/logo.png" class="logo">
    <h2>Join Solarballs.io</h2>
    <input id="nickname" placeholder="Nickname"><br>
    <div class="avatar-grid" id="avatarGrid"></div>
    <button class="btn" onclick="startGame()">Start Game</button>
  </div>

  <canvas id="game"></canvas>
  <div id="chatBox"></div>
  <input id="chatInput" placeholder="Type...">

<script>
const canvas=document.getElementById("game"),ctx=canvas.getContext("2d");
canvas.width=innerWidth;canvas.height=innerHeight;onresize=()=>{canvas.width=innerWidth;canvas.height=innerHeight};

let socket,selfId=null,player,players={},camera={x:0,y:0},keys={},stars=[];
const planetImages={},planetSizes={
  sun:200, mercury:25, venus:35, earth:40, mars:30,
  jupiter:80, saturn:100, uranus:90, neptune:85,
  pluto:20, proteus:25, theia:40
};
const planetList=["sun","mercury","venus","earth","mars","jupiter","saturn","uranus","neptune","pluto","proteus","theia"];
planetList.forEach(p=>{planetImages[p]=new Image();planetImages[p].src="assets/"+p+".png";});

function genStars(n=300){stars=[];for(let i=0;i<n;i++)stars.push({x:Math.random()*4000,y:Math.random()*4000,s:Math.random()*2+1});}genStars();

document.addEventListener("keydown",e=>keys[e.key]=true);
document.addEventListener("keyup",e=>keys[e.key]=false);

function startGame(){
  player={x:2000,y:2000,speed:200,avatar:{planet:selectedPlanet||"earth",name:document.getElementById("nickname").value||"Unnamed"},alive:true};
  document.getElementById("menu").style.display="none";
  socket=new WebSocket("ws://localhost:8080");socket.binaryType="arraybuffer";
  socket.onopen=()=>sendInit();
  socket.onmessage=e=>parsePacket(new DataView(e.data));
}

function sendInit(){sendMove(1);}
function sendMove(type=2){
  if(type===2&&!selfId)return;
  const enc=new TextEncoder(),a=enc.encode(player.avatar.planet),n=enc.encode(player.avatar.name);
  const buf=new ArrayBuffer(1+2+2+2+1+a.length+1+n.length),v=new DataView(buf);let o=0;
  v.setUint8(o++,type);v.setUint16(o,selfId||0,true);o+=2;
  v.setUint16(o,player.x,true);o+=2;v.setUint16(o,player.y,true);o+=2;
  v.setUint8(o++,a.length);a.forEach((b,i)=>v.setUint8(o+i,b));o+=a.length;
  v.setUint8(o++,n.length);n.forEach((b,i)=>v.setUint8(o+i,b));
  socket.send(buf);
}
function sendChat(msg){
  if(!selfId)return;
  const enc=new TextEncoder(),a=enc.encode(player.avatar.planet),n=enc.encode(player.avatar.name),m=enc.encode(msg);
  const buf=new ArrayBuffer(1+2+1+a.length+1+n.length+2+m.length),v=new DataView(buf);let o=0;
  v.setUint8(o++,6);v.setUint16(o,selfId,true);o+=2;
  v.setUint8(o++,a.length);a.forEach((b,i)=>v.setUint8(o+i,b));o+=a.length;
  v.setUint8(o++,n.length);n.forEach((b,i)=>v.setUint8(o+i,b));o+=n.length;
  v.setUint16(o,m.length,true);o+=2;m.forEach((b,i)=>v.setUint8(o+i,b));
  socket.send(buf);
}
function parsePacket(v){
  const type=v.getUint8(0);
  if(type===1||type===2){
    let o=1,id=v.getUint16(o,true);o+=2;
    const x=v.getUint16(o,true);o+=2,y=v.getUint16(o,true);o+=2;
    const al=v.getUint8(o++);let avatar="";for(let i=0;i<al;i++)avatar+=String.fromCharCode(v.getUint8(o++));
    const nl=v.getUint8(o++);let nick="";for(let i=0;i<nl;i++)nick+=String.fromCharCode(v.getUint8(o++));
    if(!players[id])players[id]={id,x,y,avatar:{planet:avatar,name:nick},alive:true};
    else Object.assign(players[id],{x,y,avatar:{planet:avatar,name:nick}});
    if(type===1&&!selfId)selfId=id;
  }
  else if(type===3){delete players[v.getUint16(1,true)];}
  else if(type===6){
    let o=1,id=v.getUint16(o,true);o+=2;
    const al=v.getUint8(o++);let avatar="";for(let i=0;i<al;i++)avatar+=String.fromCharCode(v.getUint8(o++));
    const nl=v.getUint8(o++);let nick="";for(let i=0;i<nl;i++)nick+=String.fromCharCode(v.getUint8(o++));
    const ml=v.getUint16(o,true);o+=2;let msg="";for(let i=0;i<ml;i++)msg+=String.fromCharCode(v.getUint8(o++));
    if(players[id]){players[id].chat=msg;setTimeout(()=>players[id].chat=null,4000);addMessage(nick,msg);}
  }
}
function update(dt){
  if(!player||!selfId||!players[selfId])return;
  if(keys["w"])player.y-=player.speed*dt;if(keys["s"])player.y+=player.speed*dt;
  if(keys["a"])player.x-=player.speed*dt;if(keys["d"])player.x+=player.speed*dt;
  players[selfId].x=player.x;players[selfId].y=player.y;players[selfId].avatar=player.avatar;
  sendMove();
  camera.x=player.x-canvas.width/2;camera.y=player.y-canvas.height/2;
}
function scr(x,y){return{x:x-camera.x,y:y-camera.y};}
function drawStars(){ctx.fillStyle="white";for(const s of stars){const p=scr(s.x,s.y);ctx.beginPath();ctx.arc(p.x,p.y,s.s,0,Math.PI*2);ctx.fill();}}
function drawSun(){const sun=planetImages.sun,pos=scr(2000,2000);if(sun.complete)ctx.drawImage(sun,pos.x-100,pos.y-100,200,200);}
function drawPlayer(p){
  if(!p.alive)return;const pos=scr(p.x,p.y),img=planetImages[p.avatar.planet],size=planetSizes[p.avatar.planet]||40;
  if(img&&img.complete){const ar=img.width/img.height;ctx.drawImage(img,pos.x-size/2*ar,pos.y-size/2,size*ar,size);}
  else{ctx.fillStyle="#888";ctx.beginPath();ctx.arc(pos.x,pos.y,size/2,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle="#fff";ctx.font="12px sans-serif";ctx.textAlign="center";ctx.fillText(p.avatar.name,pos.x,pos.y-size/2-6);
  if(p.chat){ctx.fillStyle="rgba(255,255,255,.9)";const w=ctx.measureText(p.chat).width+12;ctx.fillRect(pos.x-w/2,pos.y-size/2-26,w,18);ctx.fillStyle="#000";ctx.fillText(p.chat,pos.x,pos.y-size/2-12);}
}
function draw(){ctx.clearRect(0,0,canvas.width,canvas.height);drawStars();drawSun();for(const id in players)drawPlayer(players[id]);}
let last=performance.now();function loop(t){const dt=(t-last)/1000;last=t;update(dt);draw();requestAnimationFrame(loop);}loop(performance.now());

// === Avatar selection grid ===
let selectedPlanet="earth";
const avatarGrid=document.getElementById("avatarGrid");
planetList.forEach(p=>{
  const div=document.createElement("div");div.className="avatar-option";
  const img=document.createElement("img");img.src="assets/"+p+".png";
  const lbl=document.createElement("div");lbl.textContent=p;
  div.appendChild(img);div.appendChild(lbl);
  div.onclick=()=>{selectedPlanet=p;document.querySelectorAll(".avatar-option").forEach(el=>el.style.border="none");div.style.border="2px solid #0ff";};
  avatarGrid.appendChild(div);
});

// === Chat ===
const chatBox=document.getElementById("chatBox"),chatInput=document.getElementById("chatInput");
function addMessage(f,m){const d=document.createElement("div");d.textContent=f+": "+m;chatBox.appendChild(d);chatBox.scrollTop=chatBox.scrollHeight;}
chatInput.onkeydown=e=>{if(e.key==="Enter"&&chatInput.value.trim()){sendChat(chatInput.value);addMessage("You",chatInput.value);chatInput.value="";}};
</script>
</body>
</html>
