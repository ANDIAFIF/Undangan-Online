import type { WishItem } from '../Guestbook';
export type Destination = 'couple'|'event'|'gallery'|'wishes'|'gift'|'story'|'photobooth'|'ring'|'duck'|'prizes'|'vendor'|'quick'|'guide'|'chat'|'qr'|'note';
export type Person = { nick:string; full:string; parents:string; ig:string|null; photo:string|null };
export type CarnivalData = {
 id:string; slug:string; guestName:string|null; guestToken:string|null; note:string|null;
 first:Person; second:Person; date:string; dateISO:string|null; music:string|null;
 opening:string|null; introduction:string|null; quote:string|null; quoteSource:string|null; closing:string|null;
 events:{name:string;date:string;time:string}[]; venue:string|null; address:string|null; maps:string|null;
 gallery:string[]; stories:{title:string;date:string;text:string}[];
 gifts:{bank:string;number:string;holder:string}[]; giftText:string|null; giftAddress:string|null; invitedBy:string[]; wishes:WishItem[];
};
export type Progress = { coupons:number; visited:string[]; owned:string[]; wearing:string|null; bests:{ring:number;duck:number} };
export const emptyProgress:Progress={coupons:0,visited:[],owned:[],wearing:null,bests:{ring:0,duck:0}};
export const prizes=[{id:'topiKerucut',name:'Topi pesta',cost:2},{id:'balonMerah',name:'Balon merah',cost:2},{id:'kincir',name:'Kincir angin',cost:3},{id:'arumManis',name:'Arum manis',cost:3},{id:'kacamataBintang',name:'Kacamata bintang',cost:4},{id:'mahkota',name:'Mahkota',cost:6}] as const;
export function readProgress(raw:string|null):Progress {
 try { const p=JSON.parse(raw||'null');if(!p)return {...emptyProgress};const count=(n:unknown,max=999)=>typeof n==='number'&&Number.isFinite(n)?Math.max(0,Math.min(max,Math.floor(n))):0;
 const owned:string[]=Array.isArray(p.owned)?[...new Set<string>(p.owned.filter((v:unknown)=>prizes.some(x=>x.id===v)))]:[];
 return {coupons:count(p.coupons),owned,wearing:owned.includes(p.wearing)?p.wearing:null,visited:Array.isArray(p.visited)?[...new Set<string>(p.visited.filter((v:unknown)=>['couple','event','gallery','wishes','gift','story','photobooth','vendor'].includes(String(v))))]:[],bests:{ring:count(p.bests?.ring,190),duck:count(p.bests?.duck,2500)}};
 }catch{return {...emptyProgress};}
}
export function couponReward(game:'ring'|'duck',score:number){return 1+(game==='ring'?[60,120]:[150,300]).filter(n=>score>=n).length;}
