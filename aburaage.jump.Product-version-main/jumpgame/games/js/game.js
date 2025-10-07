const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

let W, H;
function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  W = rect.width;
  H = rect.height;
  canvas.width = W;
  canvas.height = H;
}
window.addEventListener('resize', resizeCanvas);
resizeCanvas();

let cameraY = 0;
const player = {
  startX: W/2, startY: H-120,
  x: W/2, y: H-120,
  w: 32, h: 40,
  vx: 0, vy: 0,
  speed: 3.2,
  jumpPower: -10.5,
  onGround: false,
  maxSpeed: 5
};

function resetPlayer() {
  player.x = player.startX;
  player.y = player.startY;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
}
resetPlayer();

const gravity = 0.45
const friction = 0.98;

let platforms = [];
const PLATFORM_WIDTH = 80;
const PLATFORM_HEIGHT = 12;

let running = false;
let paused = false;
let lastTimestamp = 0;
let score = 0;
let maxHeight = player.y;

const keys = {};
window.addEventListener('keydown', e => { 
  keys[e.code] = true; 
  if(e.code === 'KeyR'){ init(); start(); hideGameOver(); } 
});
window.addEventListener('keyup', e => keys[e.code] = false);

canvas.addEventListener('touchstart', e => handleTouch(e.touches[0].clientX));
canvas.addEventListener('touchmove', e => handleTouch(e.touches[0].clientX));
canvas.addEventListener('touchend', e => { keys['ArrowLeft']=keys['ArrowRight']=false; });

function handleTouch(x){
  const rect = canvas.getBoundingClientRect();
  const cx = x - rect.left;
  if(cx < rect.width*0.4){ keys['ArrowLeft']=true; keys['ArrowRight']=false; }
  else if(cx > rect.width*0.6){ keys['ArrowRight']=true; keys['ArrowLeft']=false; }
  else { keys['ArrowLeft']=keys['ArrowRight']=false; keys['Space']=true; }
}

document.getElementById('startBtn').addEventListener('click', ()=>{ if(!running){start(); hideGameOver();} else {init(); start(); hideGameOver();} });
document.getElementById('pauseBtn').addEventListener('click', ()=>{ paused=!paused; document.getElementById('pauseBtn').textContent = paused?'再開':'一時停止'; });
document.getElementById('resetBtn').addEventListener('click', ()=>{ init(); start(); hideGameOver(); });

const sounds = {
  jump: new Audio('sound_effects/jump.wav'),
  land: new Audio('sound_effects/land.mp3'),
  spring: new Audio('sound_effects/spring.mp3'),
  milestone: new Audio('sound_effects/milestone.mp3'),
  score: new Audio('sound_effects/score.mp3')
};

function playSound(name) {
  if (sounds[name]) {
    try { sounds[name].play(); } 
    catch(e){}
  }
}

let wasOnGround = false;

function init(){
  resizeCanvas();
  cameraY = 0;
  platforms = [];
  resetPlayer();
  maxHeight = player.y;
  score = 0;
  paused=false;
  document.getElementById('pauseBtn').textContent='一時停止';
  hideGameOver();
  generateInitialPlatforms();
}

function generateInitialPlatforms(){
  const gap = 90;
  for(let i=0;i<20;i++){
    const x=Math.random()*(W-PLATFORM_WIDTH);
    const y=H - i*gap - 40;
    platforms.push({x,y,w:PLATFORM_WIDTH,h:PLATFORM_HEIGHT,type:'normal',vx:0});
  }
  platforms[0].x = W/2 - 60;
  // プレイヤーを最初のプラットフォームに乗せる
  player.x = platforms[0].x + PLATFORM_WIDTH/2;
  player.y = platforms[0].y - player.h/2;
  player.onGround = true;
}

function spawnPlatform(y){
  const x=Math.random()*(W-PLATFORM_WIDTH);
  let type='normal', vx=0;
  if(Math.random()<0.12){ type='moving'; vx=(Math.random()<0.5?-1:1)*(1+Math.random()*1.2);}
  if(Math.random()<0.06) type='spring';
  platforms.push({x,y,w:PLATFORM_WIDTH,h:PLATFORM_HEIGHT,type,vx});
}

function checkPlatformCollision(p){
  if(player.vy>0){
    const px1=player.x-player.w/2, px2=player.x+player.w/2, py=player.y+player.h/2;
    const platX1=p.x, platX2=p.x+p.w, platY=p.y;
    if(py<=platY+6 && py+player.vy>=platY && px2>platX1 && px1<platX2) return true;
  }
  return false;
}

function start(){ if(running) return; running=true; lastTimestamp=performance.now(); requestAnimationFrame(loop); }

function loop(ts){
  if(!running) return;
  const dt=Math.min(34, ts-lastTimestamp);
  lastTimestamp=ts;
  if(!paused) update(dt/16);
  render();
  requestAnimationFrame(loop);
}

function update(delta){
  let move=0;
  if(keys['ArrowLeft']||keys['KeyA']) move-=1;
  if(keys['ArrowRight']||keys['KeyD']) move+=1;
  player.vx += move*0.6*player.speed*delta;
  player.vx *= friction;
  if(player.vx>player.maxSpeed) player.vx=player.maxSpeed;
  if(player.vx<-player.maxSpeed) player.vx=-player.maxSpeed;

  const jumpPressed = keys['Space']||keys['KeyZ']||keys['ArrowUp'];
  if(jumpPressed && player.onGround){ 
    player.vy=player.jumpPower; 
    player.onGround=false; 
    playSound('jump');
  }
  if(keys['Space'] && !navigator.maxTouchPoints) keys['Space']=false;

  player.vy += gravity*delta;
  player.x += player.vx*delta;
  player.y += player.vy*delta;

  if(player.x<-player.w) player.x=W+player.w;
  if(player.x>W+player.w) player.x=-player.w;

  player.onGround=false;
  for(let p of platforms){
    if(checkPlatformCollision(p)){
      player.y=p.y-player.h/2;
      player.vy=0;
      player.onGround=true;
      if(p.type==='spring'){ player.vy=player.jumpPower*1.6; playSound('spring'); }
      if(p.type==='moving') player.x += p.vx*2;
    }
  }

  if(player.onGround && !wasOnGround) playSound('land');
  wasOnGround = player.onGround;

  for(let p of platforms){
    if(p.type==='moving'){
      p.x += p.vx*delta;
      if(p.x<0 || p.x+p.w>W) p.vx*=-1;
    }
  }

  const topThreshold=H*0.35;
  const targetCameraY=player.y-topThreshold;
  cameraY += (targetCameraY-cameraY)*0.08;

  platforms=platforms.filter(p=>p.y-cameraY<H+400 && p.y-cameraY>-200);

  if(player.y-cameraY>H+60){ running=false; showGameOver(); }

  if(player.y<maxHeight) maxHeight=player.y;
  let newScore=Math.max(0, Math.floor(H-maxHeight));
  if(Math.floor(newScore/10000)>Math.floor(score/10000)) playSound('milestone');
  if(Math.floor(newScore/1000)>Math.floor(score/1000)) playSound('score');
  score=newScore;
  document.getElementById('score').textContent='スコア: '+score;

  const topVisibleY=cameraY-100;
  let minY=Math.min(...platforms.map(p=>p.y), player.y);
  if(player.vy<0){ 
    while(minY>topVisibleY){
      const gap=80+Math.random()*20;
      spawnPlatform(minY-gap);
      minY-=gap;
    }
  }
}

function render(){
  ctx.clearRect(0,0,W,H);
  drawBackground();

  for(let p of platforms){
    const drawY=p.y-cameraY;
    if(p.type==='spring') ctx.fillStyle='#ffd7a6';
    else if(p.type==='moving') ctx.fillStyle='#a6f0df';
    else ctx.fillStyle='#8bd3c7';
    roundRect(ctx,p.x,drawY,p.w,p.h,4,true,false);
    if(p.type==='spring'){ ctx.fillStyle='#c46a00'; ctx.fillRect(p.x+p.w/2-6,drawY-6,12,6);}
  }

  const px=player.x, py=player.y-cameraY;
  ctx.beginPath();
  ctx.ellipse(px, py+player.h/2+8, player.w*0.6, 6, 0,0,Math.PI*2);
  ctx.fillStyle='rgba(0,0,0,0.25)';
  ctx.fill();

  ctx.fillStyle='#ffd166';
  roundRect(ctx, px-player.w/2, py-player.h/2, player.w, player.h,6,true,false);
  ctx.fillStyle='#1b2430';
  ctx.fillRect(px-6, py-6, 4,4);
  ctx.fillRect(px+2, py-6, 4,4);

  ctx.fillStyle='#e6f0ff';
  ctx.font='16px system-ui, sans-serif';
  ctx.fillText('スコア: '+score, 12,22);

  if(!running && document.getElementById('gameOverOverlay').style.display==='none'){
    ctx.fillStyle='rgba(0,0,0,0.55)';
    ctx.fillRect(0,H/2-36,W,72);
    ctx.fillStyle='#fff';
    ctx.textAlign='center';
    ctx.font='20px system-ui';
    ctx.fillText('ゲーム停止中 - 開始ボタンかRで再開', W/2,H/2+6);
    ctx.textAlign='left';
  }
}

function showGameOver(){
  const overlay=document.getElementById('gameOverOverlay');
  document.getElementById('finalScore').textContent='スコア: '+score;
  overlay.style.display='flex';
}

function hideGameOver(){ document.getElementById('gameOverOverlay').style.display='none'; }

function drawBackground(){
  let t = Math.min(1, maxHeight/5000);
  const topColor = `rgb(${7 + t*80},${16 + t*60},${33 + t*60})`;
  const bottomColor = `rgb(${6 + t*60},${32 + t*60},${50 + t*60})`;

  const grad=ctx.createLinearGradient(0,0,0,H);
  grad.addColorStop(0, topColor);
  grad.addColorStop(1, bottomColor);
  ctx.fillStyle=grad;
  ctx.fillRect(0,0,W,H);

  ctx.fillStyle='rgba(255,255,255,0.1)';
  for(let i=0;i<5;i++){
    const cloudY=(H/2 - (cameraY*0.02)%H)+i*120;
    ctx.beginPath();
    ctx.ellipse(W*0.2+i*150, cloudY, 60,20,0,0,Math.PI*2);
    ctx.ellipse(W*0.3+i*150, cloudY-10, 50,15,0,0,Math.PI*2);
    ctx.fill();
  }
}

function roundRect(ctx,x,y,width,height,radius,fill,stroke){
  if(typeof stroke==='undefined') stroke=true;
  if(typeof radius==='undefined') radius=5;
  if(typeof radius==='number') radius={tl:radius,tr:radius,br:radius,bl:radius};
  ctx.beginPath();
  ctx.moveTo(x+radius.tl,y);
  ctx.lineTo(x+width-radius.tr,y);
  ctx.quadraticCurveTo(x+width,y,x+width,y+radius.tr);
  ctx.lineTo(x+width,y+height-radius.br);
  ctx.quadraticCurveTo(x+width,y+height,x+width-radius.br,y+height);
  ctx.lineTo(x+radius.bl,y+height);
  ctx.quadraticCurveTo(x,y+height,x,y+height-radius.bl);
  ctx.lineTo(x,y+radius.tl);
  ctx.quadraticCurveTo(x,y,x+radius.tl,y);
  ctx.closePath();
  if(fill) ctx.fill();
  if(stroke) ctx.stroke();
}

init();
render();

// 画面ボタン
const leftBtn = document.getElementById('leftBtn');
const rightBtn = document.getElementById('rightBtn');
const jumpBtn = document.getElementById('jumpBtn');

leftBtn.addEventListener('touchstart', e=>{ keys['ArrowLeft']=true; e.preventDefault(); });
leftBtn.addEventListener('touchend', e=>{ keys['ArrowLeft']=false; e.preventDefault(); });
rightBtn.addEventListener('touchstart', e=>{ keys['ArrowRight']=true; e.preventDefault(); });
rightBtn.addEventListener('touchend', e=>{ keys['ArrowRight']=false; e.preventDefault(); });
jumpBtn.addEventListener('touchstart', e=>{ keys['Space']=true; e.preventDefault(); });
jumpBtn.addEventListener('touchend', e=>{ keys['Space']=false; e.preventDefault(); });
