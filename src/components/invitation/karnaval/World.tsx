'use client';
import {useEffect,useRef,useState} from 'react';
import {assets as A} from './assets';
import type {Destination} from './types';
export type Peer={id:string;name:string;x:number;y:number;avatar:string;wearing:string|null;message?:string};
type Spot={id:Destination;label:string;asset:keyof typeof A;x:number;y:number;w?:number;h?:number};
export const spots:Spot[]=[
 {id:'couple',label:'MEMPELAI',asset:'panggungOrkes',x:172,y:250,w:220},
 {id:'story',label:'KISAH KAMI',asset:'bianglala',x:548,y:300,h:250},
 {id:'gallery',label:'GALERI',asset:'studioFoto',x:172,y:388,h:116},
 {id:'wishes',label:'UCAPAN & RSVP',asset:'lampionStand',x:180,y:838,w:150},
 {id:'event',label:'ACARA',asset:'loketTiket',x:120,y:1075,h:132},
 {id:'gift',label:'HADIAH',asset:'posAmplop',x:245,y:1165,h:124},
 {id:'photobooth',label:'PHOTOBOX',asset:'photobox',x:478,y:1165,h:140},
 {id:'ring',label:'LEMPAR GELANG',asset:'lapakGelang',x:180,y:660,w:168},
 {id:'duck',label:'PANCING BEBEK',asset:'lapakBebek',x:540,y:660,w:168},
 {id:'prizes',label:'STAND HADIAH',asset:'standHadiah',x:540,y:845,w:160},
 {id:'vendor',label:'ARUM MANIS',asset:'gerobakArumManis',x:600,y:1075,h:120},
];
export default function World({avatar,wearing,paused,musicPlaying,onOpen,onPosition,peers,wishes}:{avatar:'male'|'female';wearing:string|null;paused:boolean;musicPlaying:boolean;onOpen:(id:Destination)=>void;onPosition:(x:number,y:number)=>void;peers:Peer[];wishes:{name:string;message:string}[]}){
 const [bubble,setBubble]=useState<{name:string;message:string}|null>(null);
 const sceneView=useRef({x:0,y:0,scale:1}),lanternHits=useRef<{x:number;y:number;name:string;message:string}[]>([]),npcNear=useRef<{name:string;message:string}|null>(null);
 const canvas=useRef<HTMLCanvasElement>(null),stick=useRef<HTMLDivElement>(null),input=useRef({x:0,y:0});
 const runtime=useRef({paused,onOpen,onPosition,avatar,wearing,peers,wishes,musicPlaying});runtime.current={paused:paused||!!bubble,onOpen,onPosition,avatar,wearing,peers,wishes,musicPlaying};
 const keys=useRef(new Set<string>()),nearest=useRef<Spot|null>(null),pos=useRef({x:360,y:1330});
 const [near,setNear]=useState(''),[knob,setKnob]=useState({x:0,y:0}),[ready,setReady]=useState(false),[error,setError]=useState(false);
 useEffect(()=>{
  const el=canvas.current;if(!el)return;const ctx=el.getContext('2d');if(!ctx){setError(true);return;}
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;let alive=true,frame=0,last=0,lastSync=0;const imgs:Record<string,HTMLImageElement>={};
  Promise.all(Object.entries(A).map(([k,url])=>new Promise<void>(resolve=>{const im=new Image();im.onload=()=>{imgs[k]=im;resolve();};im.onerror=()=>resolve();im.src=url;}))).then(()=>{if(alive){setReady(true);if(!imgs.zoneGerbang)setError(true);}});
  const resize=()=>{const d=Math.min(devicePixelRatio||1,2);el.width=el.clientWidth*d;el.height=el.clientHeight*d;};resize();window.addEventListener('resize',resize);
  const down=(e:KeyboardEvent)=>{if(runtime.current.paused)return;if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d','W','A','S','D',' ','Enter','e','E'].includes(e.key)){e.preventDefault();keys.current.add(e.key.toLowerCase());if(!e.repeat&&[' ','Enter','e','E'].includes(e.key)){if(npcNear.current)setBubble(npcNear.current);else if(nearest.current)runtime.current.onOpen(nearest.current.id);}}};
  const up=(e:KeyboardEvent)=>keys.current.delete(e.key.toLowerCase());const clear=()=>{keys.current.clear();input.current={x:0,y:0};setKnob({x:0,y:0});};
  window.addEventListener('keydown',down);window.addEventListener('keyup',up);window.addEventListener('blur',clear);
  function draw(t:number){if(!alive||!ctx||!el)return;const dt=Math.min(.04,(t-last)/1000||0);last=t;const r=runtime.current,p=pos.current;
   const vw=el.clientWidth,vh=el.clientHeight,dpr=el.width/vw,scale=1;
   let dx=input.current.x+(keys.current.has('d')||keys.current.has('arrowright')?1:0)-(keys.current.has('a')||keys.current.has('arrowleft')?1:0);
   let dy=input.current.y+(keys.current.has('s')||keys.current.has('arrowdown')?1:0)-(keys.current.has('w')||keys.current.has('arrowup')?1:0);
   if(r.paused){dx=0;dy=0;}const len=Math.hypot(dx,dy);if(len>1){dx/=len;dy/=len;}
   const blocked=(x:number,y:number)=>x<24||x>696||y<40||y>1410||(x>448&&x<648&&y<280)||spots.some(s=>Math.abs(x-s.x)<(s.w||90)*.43&&y>s.y-34&&y<s.y+7)||(Math.abs(y-980)<10||Math.abs(y-500)<10)&&Math.abs(x-360)>54;
   const nx=p.x+dx*155*dt,ny=p.y+dy*155*dt;if(!blocked(nx,p.y))p.x=nx;if(!blocked(p.x,ny))p.y=ny;
   if(t-lastSync>1600&&!r.paused){lastSync=t;r.onPosition(Math.round(p.x),Math.round(p.y));}
   const viewW=vw/scale,viewH=vh/scale;
   const camX=viewW>=720?(720-viewW)/2:Math.max(0,Math.min(720-viewW,p.x-viewW/2));
   const motionT=reduced?0:t;
   const camY=viewH>=1440?(1440-viewH)/2:Math.max(0,Math.min(1440-viewH,p.y-viewH*.68));
   sceneView.current={x:camX,y:camY,scale};
   ctx.setTransform(dpr,0,0,dpr,0,0);ctx.fillStyle='#101723';ctx.fillRect(0,0,vw,vh);ctx.scale(scale,scale);ctx.translate(-camX,-camY);ctx.imageSmoothingEnabled=false;
   ['zoneLapangan','zoneLapak','zoneGerbang'].forEach((k,i)=>{if(imgs[k])ctx.drawImage(imgs[k],0,i*480,720,480);});
   const img=(key:string,x:number,y:number,w?:number,h?:number)=>{const im=imgs[key];if(!im)return;const width=w??(h||100)*im.naturalWidth/im.naturalHeight,height=h??width*im.naturalHeight/im.naturalWidth;ctx.drawImage(im,Math.round(x-width/2),Math.round(y-height),width,height);};
   img('pagarLampuUtara',360,500,560);img('pagarLampuSelatan',360,982,560);
   for(const y of [120,590,790,1060,1250])for(const x of [306,414])img('tiangLampu',x,y,undefined,84);
   for(const y of [470,1420])for(const x of [52,668])img('pohonMalam',x,y,104);
   let close:Spot|null=null;let distance=90;for(const s of spots){const dist=Math.hypot(s.x-p.x,s.y+22-p.y);if(dist<distance){close=s;distance=dist;}}
   nearest.current=close;
   npcNear.current=Math.hypot(p.x-300,p.y-1230)<48?{name:'Kacang',message:'Meong! Gerobak arum manis di sebelah kanan bagi-bagi kupon pertama.'}:Math.hypot(p.x-420,p.y-760)<48?{name:'Gula',message:'Lempar Gelang dan Pancing Bebek ada di tengah. Kupon bisa ditukar di stand hadiah.'}:null;
   const nearLabel=npcNear.current?.name||close?.label||'';setNear(old=>old===nearLabel?old:nearLabel);
   const label=(text:string,x:number,y:number)=>{ctx.font='16px "Jersey 20",monospace';ctx.textAlign='center';const w=ctx.measureText(text).width+18;ctx.fillStyle='#30221d';ctx.fillRect(x-w/2-2,y-16,w+4,25);ctx.fillStyle='#fff0cc';ctx.fillRect(x-w/2,y-14,w,21);ctx.fillStyle='#33261e';ctx.fillText(text,x,y+2);};
   function player(x:number,y:number,sex:string,acc:string|null,moving:boolean,name?:string){if(!ctx)return;const im=imgs[sex==='female'?'playerFemaleKebaya':'playerMaleBatik'];if(im){const cols=Math.floor(im.naturalWidth/192),row=moving?(Math.abs(dx)>Math.abs(dy)?dx<0?1:2:dy<0?3:0):0,col=moving?Math.floor(t/110)%Math.min(cols,4):0;ctx.fillStyle='#0005';ctx.beginPath();ctx.ellipse(x,y,13,5,0,0,7);ctx.fill();ctx.drawImage(im,col*192,row*192,192,192,x-31,y-62,62,62);}if(acc)img(acc,x+(acc==='balonMerah'?20:0),y-(acc==='kacamataBintang'?43:58),22);if(name)label(name,x,y-70);}
   const objects=[...spots.map(s=>({y:s.y,paint:()=>{if(s.id==='story'){
     img('bianglalaRangka',s.x,s.y,undefined,212);const wheel=imgs.bianglalaRoda;const cy=103;
     if(wheel){ctx.save();ctx.translate(s.x,cy);ctx.rotate(motionT/26000*Math.PI*2);ctx.drawImage(wheel,-98,-98,196,196);ctx.restore();for(let i=0;i<8;i++){const angle=motionT/26000*Math.PI*2+i*Math.PI/4;img(['kabinMerahMuda','kabinMint','kabinKuning','kabinMerah'][i%4],s.x+Math.cos(angle)*93,cy+Math.sin(angle)*93+26,36);}}
    }else img(s.asset,s.x,s.y,s.w,s.h);if(s.id==='couple')img('couple',s.x,s.y-32,65);label(s.label,s.x,s.id==='gift'||s.id==='photobooth'?s.y-(s.h||100)-14:s.y+20);
    if(close?.id===s.id){ctx.strokeStyle='#ffe6a0';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(s.x,s.y+20,38+Math.sin(t/200)*3,10,0,0,7);ctx.stroke();}
   }})),{y:p.y,paint:()=>player(p.x,p.y,r.avatar,r.wearing,len>0&&!r.paused)},...r.peers.map(peer=>({y:peer.y,paint:()=>{player(peer.x,peer.y,peer.avatar,peer.wearing,false,peer.name);if(peer.message)label(peer.message.slice(0,32),peer.x,peer.y-100);}}))];
   objects.sort((a,b)=>a.y-b.y).forEach(o=>o.paint());
   const musician=imgs.pemainOrkes;if(musician)ctx.drawImage(musician,(reduced?0:Math.floor(t/(r.musicPlaying?250:500))%2+(r.musicPlaying?2:0))*256,0,256,256,270,200,70,70);
   lanternHits.current=[];r.wishes.slice(0,8).forEach((w,i)=>{const x=60+i*84,y=500-((motionT/40+i*80)%480);lanternHits.current.push({x,y,name:w.name,message:w.message});ctx.globalAlpha=.75;img(['lantern','lanternPink','lanternMint'][i%3],x,y,22);ctx.globalAlpha=1;});
   // Small guiding companions and a warm moving light along the path.
   function cat(x:number,y:number){if(!ctx)return;ctx.save();ctx.translate(Math.round(x),Math.round(y));ctx.fillStyle='#442b20';ctx.fillRect(-9,-17,18,16);ctx.fillStyle='#d88a46';ctx.fillRect(-7,-15,14,12);ctx.fillRect(-6,-21,4,6);ctx.fillRect(3,-21,4,6);ctx.fillRect(-5,-4,4,5);ctx.fillRect(3,-4,4,5);ctx.fillRect(7,-9,6,3);ctx.fillRect(11,-14,3,7);ctx.fillStyle='#f6df9e';ctx.fillRect(-5,-13,9,5);ctx.fillStyle='#231b18';ctx.fillRect(-4,-13,2,2);ctx.fillRect(2,-13,2,2);ctx.fillRect(-1,-9,2,2);ctx.restore();}
   cat(300+Math.sin(motionT/1400)*8,1230);cat(420+Math.sin(motionT/1800)*8,760);
   frame=requestAnimationFrame(draw);
  }frame=requestAnimationFrame(draw);
  return()=>{alive=false;cancelAnimationFrame(frame);window.removeEventListener('resize',resize);window.removeEventListener('keydown',down);window.removeEventListener('keyup',up);window.removeEventListener('blur',clear);};
 },[]);
 function joystick(e:React.PointerEvent){if(paused)return;const el=stick.current;if(!el)return;const rect=el.getBoundingClientRect(),x=(e.clientX-rect.left-rect.width/2)/36,y=(e.clientY-rect.top-rect.height/2)/36,l=Math.max(1,Math.hypot(x,y));input.current={x:x/l,y:y/l};setKnob({x:x/l*28,y:y/l*28});}
 return <><canvas ref={canvas} className="kk-world" onPointerDown={e=>{if(paused)return;const r=e.currentTarget.getBoundingClientRect(),v=sceneView.current,x=(e.clientX-r.left)/v.scale+v.x,y=(e.clientY-r.top)/v.scale+v.y;const hit=lanternHits.current.find(h=>Math.abs(h.x-x)<24&&Math.abs(h.y-20-y)<32);if(hit)setBubble({name:`Ucapan dari ${hit.name}`,message:hit.message});else if(Math.hypot(x-300,y-1230)<30)setBubble({name:'Kacang',message:'Meong! Gerobak arum manis di sebelah kanan bagi-bagi kupon pertama.'});else if(Math.hypot(x-420,y-760)<30)setBubble({name:'Gula',message:'Lempar Gelang dan Pancing Bebek ada di tengah. Kupon bisa ditukar di stand hadiah.'});}} aria-label="Peta Wedding. Gunakan WASD atau panah untuk berjalan, Enter untuk membuka stan. Semua tempat juga tersedia di menu bawah."/>{!ready&&<div className="kk-loading" role="status">Menyalakan lampu Wedding…</div>}{error&&<p className="kk-map-error">Peta belum termuat. Gunakan menu undangan di bawah.</p>}
 <div ref={stick} className="kk-joystick" aria-label="Joystick gerak" onPointerDown={e=>{e.currentTarget.setPointerCapture(e.pointerId);joystick(e);}} onPointerMove={e=>{if(e.currentTarget.hasPointerCapture(e.pointerId))joystick(e);}} onPointerUp={()=>{input.current={x:0,y:0};setKnob({x:0,y:0});}} onPointerCancel={()=>{input.current={x:0,y:0};setKnob({x:0,y:0});}}><span>GERAK</span><i>▲</i><i>◀</i><i>▶</i><i>▼</i><b style={{transform:`translate(${knob.x}px,${knob.y}px)`}}>●</b></div>
 <button className="kk-action" disabled={!near||paused} onClick={()=>{if(npcNear.current)setBubble(npcNear.current);else if(nearest.current)onOpen(nearest.current.id);}} aria-label={near?`Buka ${near}`:'Dekati stan untuk membuka'}>A</button>{near&&!paused&&<div className="kk-near">{near} · Tekan A / Enter</div>}{bubble&&<div className="kk-world-bubble" role="status"><strong>{bubble.name}</strong><button onClick={()=>setBubble(null)} aria-label="Tutup percakapan">×</button><p>{bubble.message}</p></div>}</>;
}
