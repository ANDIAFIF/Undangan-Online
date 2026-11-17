import {NextRequest,NextResponse} from 'next/server';
import {z} from 'zod';
import {prisma} from '@/lib/prisma';
import {context,fail,limit,sameOrigin} from '@/lib/carnival-api';
const schema=z.object({clientId:z.string().uuid(),token:z.string().nullable().optional(),name:z.string().trim().min(1).max(40),message:z.string().trim().min(1).max(200)});
async function messages(invitationId:string){return (await prisma.carnivalChat.findMany({where:{invitationId,createdAt:{gte:new Date(Date.now()-24*60*60*1000)}},orderBy:{createdAt:'desc'},take:60,select:{id:true,name:true,message:true}})).reverse();}
export async function GET(){const c=await context();if(!c)return fail('Undangan tidak ditemukan',404);return NextResponse.json({messages:await messages(c.inv.id)},{headers:{'Cache-Control':'no-store'}});}
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('Origin tidak valid',403);if(limit(req,'chat',15))return fail('Tunggu sebentar sebelum mengirim pesan lagi.',429);
 const p=schema.safeParse(await req.json().catch(()=>null));if(!p.success)return fail('Isi nama dan pesan, maksimal 200 karakter.');const c=await context(p.data.token);if(!c)return fail('Undangan tidak ditemukan',404);
 await prisma.carnivalChat.create({data:{invitationId:c.inv.id,clientId:p.data.clientId,name:c.guest?.name||p.data.name,message:p.data.message}});
 return NextResponse.json({messages:await messages(c.inv.id)});
}
