'use client';
import {useEffect,useRef,useState} from 'react';
import {assets as A} from './assets';
import {couponReward} from './types';
export default function Arcade({game,onFinish,best,guestToken,guestName}:{game:'ring'|'duck';onFinish:(score:number)=>void;best:number;guestToken:string|null;guestName:string|null}){
 const [playing,setPlaying]=useState(false),[score,setScore]=useState<number|null>(null),[round,setRound]=useState(0),[muted,setMuted]=useState(false),[board,setBoard]=useState<{name:string;score:number}[]>([]),[status,setStatus]=useState(''),[name,setName]=useState((guestName||'').slice(0,24));
 const run=useRef<string|null>(null);
 useEffect(()=>{fetch(`/api/carnival/arcade?game=${game}`).then(r=>{if(!r.ok)throw Error();return r.json();}).then(d=>setBoard(d.scores||[])).catch(()=>setStatus('Papan skor belum bisa dimuat.'));},[game,score]);
 async function start(){setStatus('');run.current=null;try{const r=await fetch('/api/carnival/arcade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'start',game,token:guestToken})});if(r.ok)run.current=(await r.json()).run;}catch{}setRound(v=>v+1);setPlaying(true);}
 async function save(value:number){if(!run.current){setStatus('Skor tersimpan di perangkat ini. Papan skor belum tersambung.');return;}if(!name.trim()){setStatus('Isi nama untuk menyimpan skor ke papan skor.');return;}try{const r=await fetch('/api/carnival/arcade',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'finish',run:run.current,game,score:value,name,token:guestToken})});const d=await r.json();if(!r.ok)throw Error(d.error);run.current=null;setStatus('Skor berhasil disimpan.');setBoard(d.scores||[]);}catch(e){setStatus(e instanceof Error?e.message:'Skor belum terkirim.');}}
 return <div className="kk-arcade">{playing?<Game key={round} game={game} muted={muted} finish={value=>{setScore(value);setPlaying(false);onFinish(value);void save(value);}}/>:<>
 <p>{game==='ring'?'Ketuk sekali untuk membidik, ketuk lagi untuk mengatur tenaga. Gelang yang masuk leher botol dapat poin, botol bening paling mahal.':'Ketuk air untuk mencelupkan kail di situ. Bebek emas paling mahal. Waktunya 30 detik.'}</p>
 {score!==null&&<div className="kk-result" role="status">Skor {score}, dapat {couponReward(game,score)} kupon{score>best&&<strong>Rekor baru!</strong>}</div>}
 <div className="kk-row"><button className="kk-button" onClick={start}>{score===null?'Main':'Main lagi'}</button><button className="kk-button secondary" aria-pressed={!muted} onClick={()=>setMuted(v=>!v)}>{muted?'Suara mati':'Suara nyala'}</button></div>
 <label className="kk-label">Nama di papan skor<input maxLength={24} value={name} onChange={e=>setName(e.target.value)}/></label>{score!==null&&run.current&&<button className="kk-button secondary" onClick={()=>save(score)}>Simpan skor</button>}
 <p role="status">{status}</p><h3>Papan skor</h3>{board.length?<ol className="kk-board">{board.map((r,i)=><li key={i}>{r.name}<b>{r.score}</b></li>)}</ol>:<p>Belum ada skor. Jadi yang pertama!</p>}<p>Rekor perangkat: {best}</p>
 </>}</div>;
}
function Game({game,muted,finish}:{game:'ring'|'duck';muted:boolean;finish:(score:number)=>void}){
 const finishRef=useRef(finish);finishRef.current=finish;
 const canvas=useRef<HTMLCanvasElement>(null),action=useRef<(x?:number,y?:number)=>void>(()=>{}),move=useRef({x:160,y:232});const [hint,setHint]=useState(game==='ring'?'Ketuk / Spasi untuk membidik':'Ketuk bebek untuk memancing');
 useEffect(()=>{const el=canvas.current,ctx=el?.getContext('2d');if(!el||!ctx)return;let stopped=false,frame=0,last=0,elapsed=0,phase='aim',phaseTime=0,score=0,left=6,aim=160,power=0,flight:{x:number;y:number;hit:number|null}|null=null,flash='',flashTime=0,cooldown=0;const imgs:Record<string,HTMLImageElement>={};
 const ac=muted?null:new AudioContext();const tone=(hit:boolean)=>{if(!ac)return;void ac.resume();const o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.setValueAtTime(hit?880:150,ac.currentTime);o.frequency.exponentialRampToValueAtTime(hit?1760:70,ac.currentTime+.15);g.gain.setValueAtTime(.09,ac.currentTime);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.2);o.connect(g).connect(ac.destination);o.start();o.stop(ac.currentTime+.22);};
 const needed=game==='ring'?['gelangArena','botolHijau','botolCokelat','botolBening','gelang','gelangSamping']:['bebekArena','bebekKuning','bebekMerahMuda','bebekMint','bebekEmas','kail'];needed.forEach(k=>{const im=new Image();im.onload=()=>imgs[k]=im;im.src=A[k as keyof typeof A];});
 const bottles=[{y:104,h:40,x:[80,120,160,200,240],p:30},{y:150,h:46,x:[56,98,140,182,224,266],p:20},{y:200,h:52,x:[40,88,136,184,232,280],p:10}].flatMap((r,row)=>r.x.map((x,i)=>({x,y:r.y,h:r.h,row,points:row===0&&i===2?50:r.p,hit:false})));
 const ducks=Array.from({length:7},(_,i)=>({kind:i===6?3:i%3,angle:i*Math.PI/3,speed:i%2?.42:-.62,lane:i%2?.72:.42,respawn:0}));
 const duckPos=(d:typeof ducks[number])=>({x:160+Math.cos(d.angle)*132*d.lane,y:232+Math.sin(d.angle)*116*d.lane});
 action.current=(x,y)=>{if(stopped)return;if(game==='ring'){
  if(phase==='aim'){phase='power';phaseTime=0;setHint('Ketuk / Spasi untuk melempar');tone(true);}
  else if(phase==='power'){const row=power>=.22&&power<.46?2:power>=.46&&power<.7?1:power>=.7&&power<.9?0:-1;const idx=bottles.findIndex(b=>b.row===row&&!b.hit&&Math.abs(b.x-aim)<11);flight={x:idx>=0?bottles[idx].x:aim,y:idx>=0?bottles[idx].y-bottles[idx].h*.94:250-power*180,hit:idx>=0?idx:null};left--;phase='flight';phaseTime=0;setHint('Gelang melayang…');}
 }else if(cooldown<=0){if(x!==undefined&&y!==undefined)move.current={x,y};cooldown=.6;const d=ducks.find(d=>d.respawn<=0&&Math.hypot(duckPos(d).x-move.current.x,duckPos(d).y-move.current.y)<22);if(d){score+=[10,20,30,50][d.kind];d.respawn=1.2;flash=`+${[10,20,30,50][d.kind]}`;tone(true);}else{flash='Coba lagi';tone(false);}flashTime=.6;}};
 const image=(key:string,x:number,y:number,w:number,h?:number)=>{const im=imgs[key];if(im)ctx.drawImage(im,x-w/2,y-(h??w*im.naturalHeight/im.naturalWidth)/2,w,h??w*im.naturalHeight/im.naturalWidth);};
 function tick(t:number){if(stopped||!ctx)return;const dt=Math.min(.05,(t-last)/1000||0);last=t;elapsed+=dt;phaseTime+=dt;cooldown-=dt;flashTime-=dt;ctx.imageSmoothingEnabled=false;ctx.fillStyle='#38243a';ctx.fillRect(0,0,320,480);image(game==='ring'?'gelangArena':'bebekArena',160,240,320,480);
 if(game==='ring'){
  if(phase==='aim')aim=160+Math.sin(phaseTime*1.5*(1+(6-left)*.08)*Math.PI)*128;
  if(phase==='power'){const n=phaseTime*.9%2;power=n<=1?n:2-n;}
  if(phase==='flight'&&phaseTime>.7){const b=flight?.hit!=null?bottles[flight.hit]:null;if(b){b.hit=true;score+=b.points;}flash=b?`Masuk! +${b.points}`:'Meleset';flashTime=.7;tone(!!b);phase='result';phaseTime=0;}
  if(phase==='result'&&phaseTime>.7){if(left===0){stopped=true;finishRef.current(score);return;}phase='aim';phaseTime=0;flight=null;setHint('Ketuk / Spasi untuk membidik');}
  bottles.forEach(b=>{image(b.points===50?'botolBening':b.x%3?'botolHijau':'botolCokelat',b.x,b.y-b.h/2,b.h*.422,b.h);if(b.hit)image('gelangSamping',b.x,b.y-b.h*.8,b.h*.62);});
  if(phase==='aim'||phase==='power'){ctx.strokeStyle='#fff4d4';ctx.setLineDash([6,6]);ctx.beginPath();ctx.moveTo(aim,70);ctx.lineTo(aim,240);ctx.stroke();ctx.setLineDash([]);image('gelang',160,440,48);}
  if(phase==='power'){for(const [a,b,c] of [[0,.22,'#3b2f4a'],[.22,.46,'#5fae9a'],[.46,.7,'#e7b84a'],[.7,.9,'#e0566a'],[.9,1,'#3b2f4a']] as [number,number,string][]){ctx.fillStyle=c;ctx.fillRect(290,440-b*170,16,(b-a)*170);}ctx.fillStyle='white';ctx.fillRect(284,440-power*170,28,3);}
  if(phase==='flight'&&flight){const a=Math.min(1,phaseTime/.7);image('gelang',160+(flight.x-160)*a,440+(flight.y-440)*a-Math.sin(a*Math.PI)*90,48*(1-a*.45));}
 }else{
  ducks.forEach(d=>{d.angle+=d.speed*dt;d.respawn-=dt;if(d.respawn>0||d.kind===3&&elapsed<8)return;const p=duckPos(d);image(['bebekKuning','bebekMerahMuda','bebekMint','bebekEmas'][d.kind],p.x,p.y+Math.sin(elapsed*3+d.angle)*2,d.kind===3?42:38);});ctx.strokeStyle='#fff4d4';ctx.beginPath();ctx.moveTo(move.current.x,0);ctx.lineTo(move.current.x,move.current.y-20);ctx.stroke();image('kail',move.current.x,move.current.y-12,16);if(elapsed>=30){stopped=true;finishRef.current(score);return;}
 }
 ctx.font='22px VT323,monospace';ctx.fillStyle='#201629';ctx.fillRect(6,6,308,29);ctx.fillStyle='#fff3d4';ctx.textAlign='left';ctx.fillText(String(score),14,28);ctx.textAlign='right';ctx.fillText(game==='ring'?`Gelang ${left}`:`${Math.max(0,Math.ceil(30-elapsed))} detik`,306,28);if(flashTime>0){ctx.textAlign='center';ctx.fillText(flash,160,300);}frame=requestAnimationFrame(tick);
 }frame=requestAnimationFrame(tick);el.focus();return()=>{stopped=true;cancelAnimationFrame(frame);void ac?.close();};
 },[game,muted]);
 return <><p className="kk-game-hint" aria-live="polite">{hint}</p><canvas ref={canvas} width={320} height={480} className="kk-game-canvas" tabIndex={0} aria-label={game==='ring'?'Lempar Gelang. Spasi untuk membidik lalu melempar.':'Pancing Bebek. Panah menggerakkan kail, Spasi memancing.'} onPointerDown={e=>{const r=e.currentTarget.getBoundingClientRect();action.current((e.clientX-r.left)*320/r.width,(e.clientY-r.top)*480/r.height);}} onKeyDown={e=>{if(e.key===' '||e.key==='Enter'){e.preventDefault();if(!e.repeat)action.current();}const v=({ArrowUp:[0,-8],ArrowDown:[0,8],ArrowLeft:[-8,0],ArrowRight:[8,0]} as Record<string,number[]>)[e.key];if(v){e.preventDefault();move.current={x:Math.max(40,Math.min(280,move.current.x+v[0])),y:Math.max(120,Math.min(340,move.current.y+v[1]))};}}}/></>;
}
