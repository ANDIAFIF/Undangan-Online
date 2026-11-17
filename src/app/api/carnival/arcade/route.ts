import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {context,fail,limit,sameOrigin} from '@/lib/carnival-api';
const schema=z.discriminatedUnion('action',[
 z.object({action:z.literal('start'),game:z.enum(['ring','duck']),token:z.string().nullable().optional()}),
 z.object({action:z.literal('finish'),game:z.enum(['ring','duck']),token:z.string().nullable().optional(),run:z.string().uuid(),score:z.number().int().min(0).max(2500).multipleOf(10),name:z.string().trim().min(1).max(24)}),
]);
async function scores(invitationId:string,game:string){const rows=await prisma.carnivalRun.findMany({where:{invitationId,game,finishedAt:{not:null},score:{not:null}},orderBy:{score:'desc'},take:100,select:{name:true,score:true}});const seen=new Set<string>();return rows.filter(r=>{if(seen.has(r.name||''))return false;seen.add(r.name||'');return true;}).slice(0,10);}
export async function GET(req:NextRequest){const game=req.nextUrl.searchParams.get('game');if(game!=='ring'&&game!=='duck')return fail('Permainan tidak valid');const c=await context();if(!c)return fail('Undangan tidak ditemukan',404);return NextResponse.json({scores:await scores(c.inv.id,game)},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('Origin tidak valid',403);if(limit(req,'arcade',30))return fail('Terlalu banyak permainan. Tunggu sebentar.',429);
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return fail('Data permainan tidak valid');const d=p.data,c=await context(d.token);if(!c)return fail('Undangan tidak ditemukan',404);
 if(d.action==='start'){const run=await prisma.carnivalRun.create({data:{invitationId:c.inv.id,guestId:c.guest?.id,game:d.game}});return NextResponse.json({run:run.id});}
 const run=await prisma.carnivalRun.findUnique({where:{id:d.run}});if(!run||run.invitationId!==c.inv.id||run.game!==d.game||run.guestId!==(c.guest?.id??null)||run.finishedAt)return fail('Sesi permainan sudah berakhir atau tidak valid.',409);
 const elapsed=Date.now()-run.createdAt.getTime();if(elapsed<(d.game==='duck'?28000:7000)||elapsed>30*60*1000||d.game==='ring'&&d.score>190)return fail('Skor tidak sesuai sesi permainan.');
 const updated=await prisma.carnivalRun.updateMany({where:{id:run.id,finishedAt:null},data:{name:c.guest?.name||d.name,score:d.score,finishedAt:new Date()}});if(updated.count!==1)return fail('Skor sudah disimpan.',409);
 return NextResponse.json({scores:await scores(c.inv.id,d.game)});
}
