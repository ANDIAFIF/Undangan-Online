import {isAdmin} from '@/lib/auth';
import {prisma} from '@/lib/prisma';
import {context,fail} from '@/lib/carnival-api';
export async function GET(_req:Request,{params}:{params:Promise<{id:string}>}){const {id}=await params;const c=await context();if(!c)return fail('Tidak ditemukan',404);const wish=await prisma.wish.findFirst({where:{invitationId:c.inv.id,voiceId:id,isVisible:true}});if(!wish && !await isAdmin())return fail('Tidak ditemukan',404);const v=await prisma.uploadedVoice.findFirst({where:{id,invitationId:c.inv.id}});if(!v)return fail('Tidak ditemukan',404);return new Response(new Uint8Array(v.data),{headers:{'Content-Type':v.mimeType,'Content-Length':String(v.data.length),'X-Content-Type-Options':'nosniff','Cache-Control':'private, no-cache'}});}
