import assert from 'node:assert/strict';
import {test} from 'node:test';
import {couponReward,readProgress} from '../components/invitation/karnaval/types';
test('coupons match arcade score thresholds',()=>{
 for(const [game,score,reward] of [['ring',0,1],['ring',59,1],['ring',60,2],['ring',119,2],['ring',120,3],['duck',149,1],['duck',150,2],['duck',299,2],['duck',300,3]] as const)assert.equal(couponReward(game,score),reward);
});
test('invalid saved progress cannot crash the invitation or equip unowned prizes',()=>{
 for(const raw of [null,'broken','null','{}'])assert.deepEqual(readProgress(raw),{coupons:0,owned:[],wearing:null,visited:[],bests:{ring:0,duck:0}});
 const state=readProgress(JSON.stringify({coupons:1e12,owned:['mahkota','mahkota','unknown'],wearing:'kincir',visited:['gift','gift','invalid'],bests:{ring:-10,duck:2000}}));
 assert.deepEqual(state,{coupons:999,owned:['mahkota'],wearing:null,visited:['gift'],bests:{ring:0,duck:2000}});
});

test('origin check accepts the actual request host and rejects foreign origins',async()=>{
 const {NextRequest}=await import('next/server');
 const {sameOrigin}=await import('./carnival-api');
 const make=(origin:string,host='127.0.0.1:3127')=>new NextRequest('http://localhost:3127/api/carnival/chat',{headers:{origin,host}});
 assert.equal(sameOrigin(make('http://127.0.0.1:3127')),true);
 assert.equal(sameOrigin(make('https://example.invalid')),false);
 assert.equal(sameOrigin(make('null')),false);
 assert.equal(sameOrigin(make('http://127.0.0.1:3127/not-an-origin')),false);
});

test('sticker identifiers are restricted to the shipped catalog',async()=>{
 const {carnivalStickers,validSticker,stickerImage}=await import('./carnival-stickers');
 assert.equal(carnivalStickers.length,25);
 assert.equal(validSticker(carnivalStickers[4].id),true);
 assert.ok(stickerImage(carnivalStickers[4].id)?.endsWith('.gif'));
 assert.equal(validSticker('https://example.invalid/tracker.gif'),false);
 assert.equal(validSticker('<script>'),false);
});
