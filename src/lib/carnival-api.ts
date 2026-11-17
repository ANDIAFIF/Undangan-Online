import {NextRequest,NextResponse} from 'next/server';
import {getInvitation} from './invitation';
import {prisma} from './prisma';
const buckets=new Map<string,{n:number;until:number}>();
export function limit(req:NextRequest,scope:string,max:number,windowMs=60000){
 const key=scope+':'+(req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()||'local');const now=Date.now(),old=buckets.get(key);
 if(old&&old.until>now){old.n++;return old.n>max;}
 if(buckets.size>5000)for(const [k,v]of buckets)if(v.until<now)buckets.delete(k);
 buckets.set(key,{n:1,until:now+windowMs});return false;
}
export function sameOrigin(req:NextRequest){
 const origin=req.headers.get('origin');
 if(!origin)return true;
 try {
  const parsed=new URL(origin);
  if(!['http:','https:'].includes(parsed.protocol)||parsed.origin!==origin)return false;
  // Next's internal URL can normalize 127.0.0.1 to localhost; the browser's
  // request Host still identifies the actual origin that received this request.
  const host=req.headers.get('host');
  return origin===req.nextUrl.origin || origin===process.env.NEXT_PUBLIC_SITE_URL ||
    (host!==null && parsed.host===host && parsed.protocol===req.nextUrl.protocol);
 }catch{return false;}
}
export const fail=(error:string,status=400)=>NextResponse.json({error},{status});
export async function context(token?:string|null){const inv=await getInvitation();if(!inv?.isPublished)return null;const guest=token?await prisma.guest.findFirst({where:{invitationId:inv.id,slug:token}}):null;if(token&&!guest)return null;return {inv,guest};}
