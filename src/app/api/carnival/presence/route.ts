import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {context,fail,limit,sameOrigin} from '@/lib/carnival-api';
const schema=z.object({clientId:z.string().uuid(),token:z.string().nullable().optional(),name:z.string().trim().max(60),avatar:z.enum(['male','female']),wearing:z.enum(['topiKerucut','balonMerah','kincir','arumManis','kacamataBintang','mahkota']).nullable(),x:z.number().int().min(24).max(696),y:z.number().int().min(40).max(1410)});
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('Origin tidak valid',403);if(limit(req,'presence',120))return fail('Terlalu banyak permintaan',429);
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return fail('Data posisi tidak valid');
 const c=await context(p.data.token);if(!c)return fail('Undangan tidak ditemukan',404);
 const {clientId,x,y,avatar,wearing}=p.data;const id=`${c.inv.id}:${clientId}`;
 await prisma.carnivalPresence.upsert({where:{id},create:{id,invitationId:c.inv.id,name:c.guest?.name||p.data.name||'Tamu',x,y,avatar,wearing},update:{name:c.guest?.name||p.data.name||'Tamu',x,y,avatar,wearing}});
 const peers=await prisma.carnivalPresence.findMany({where:{invitationId:c.inv.id,id:{not:id},updatedAt:{gte:new Date(Date.now()-12000)}},take:30,select:{id:true,name:true,x:true,y:true,avatar:true,wearing:true}});
 const recent=await prisma.carnivalChat.findMany({where:{invitationId:c.inv.id,clientId:{in:peers.map(p=>p.id.slice(c.inv.id.length+1))},createdAt:{gte:new Date(Date.now()-8000)}},orderBy:{createdAt:'desc'},take:60,select:{clientId:true,message:true}});
 return NextResponse.json({peers:peers.map(p=>({...p,message:recent.find(m=>m.clientId===p.id.slice(c.inv.id.length+1))?.message}))},{headers:{'Cache-Control':'no-store'}});
}
