import {NextRequest,NextResponse} from 'next/server';
import {prisma} from '@/lib/prisma';
import {context,fail,limit,sameOrigin} from '@/lib/carnival-api';
export async function POST(req:NextRequest){
 if(!sameOrigin(req))return fail('Origin tidak valid',403);if(limit(req,'voice',5,600000))return fail('Terlalu banyak rekaman. Coba lagi nanti.',429);
 const c=await context();if(!c)return fail('Undangan tidak ditemukan',404);
 const length=Number(req.headers.get('content-length'));if(length>3*1024*1024)return fail('Rekaman maksimal 3 MB',413);
 const type=(req.headers.get('content-type')||'').split(';')[0];if(!['audio/webm','audio/ogg','audio/mp4'].includes(type))return fail('Format audio tidak didukung');
 const reader=req.body?.getReader();if(!reader)return fail('Rekaman kosong');const chunks:Uint8Array[]=[];let total=0;
 for(;;){const {value,done}=await reader.read();if(done)break;total+=value.length;if(total>3*1024*1024){await reader.cancel();return fail('Rekaman maksimal 3 MB',413);}chunks.push(value);}
 const buffer=Buffer.concat(chunks);const valid=type==='audio/webm'?buffer.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])):type==='audio/ogg'?buffer.subarray(0,4).toString()==='OggS':buffer.subarray(4,8).toString()==='ftyp';if(!valid)return fail('Berkas audio tidak valid');
 const row=await prisma.uploadedVoice.create({data:{invitationId:c.inv.id,data:buffer,mimeType:type}});return NextResponse.json({id:row.id});
}
