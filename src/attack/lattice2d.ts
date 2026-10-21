import type {Lcg} from '../gen/lcg';
type V={x:bigint;y:bigint};
const dot=(a:V,b:V)=>a.x*b.x+a.y*b.y;
const sub=(a:V,b:V):V=>({x:a.x-b.x,y:a.y-b.y});
const mul=(a:V,n:bigint):V=>({x:a.x*n,y:a.y*n});
export function round(n:bigint,d:bigint):bigint {
 if(d<0n)return round(-n,-d);
 return n<0n?-(((-n)+d/2n)/d):(n+d/2n)/d;
}
/** Exact Lagrange–Gauss reduction; no Number conversion during prediction. */
export function reduce(a:V,b:V):[V,V] {
 for(let i=0;i<4096;i++) {
   if(dot(a,a)>dot(b,b))[a,b]=[b,a];
   const t=round(dot(a,b),dot(a,a));
   if(t===0n)return [a,b];
   b=sub(b,mul(a,t));
 }
 throw new Error('Lattice basis did not reduce');
}
export type Recovery={candidates:bigint[];reason?:string;basis:[V,V]};
export function recoverLcg(r0:bigint,r1:bigint,p:Lcg):Recovery {
 if(p.q<=0n||p.w<=0n||p.a<=0n||p.a>=p.q||(p.a&1n)===0n)throw new RangeError('Need an odd multiplier in (0,q) and positive w');
 const g={x:r0*p.w,y:r1*p.w-p.b};
 const [u,v]=reduce({x:1n,y:p.a},{x:0n,y:p.q});
 const target={x:g.x+p.w/2n,y:g.y+p.w/2n};
 const det=u.x*v.y-u.y*v.x;
 const c0=round(target.x*v.y-target.y*v.x,det);
 const c1=round(u.x*target.y-u.y*target.x,det);
 const matches:bigint[]=[];
 for(let dx=-2n;dx<=2n;dx++)for(let dy=-2n;dy<=2n;dy++) {
  const point={x:u.x*(c0+dx)+v.x*(c1+dy),y:u.y*(c0+dx)+v.y*(c1+dy)};
  const ex=point.x-g.x,ey=point.y-g.y;
  if(ex>=0n&&ey>=0n&&ex<p.w&&ey<p.w&&point.x>=0n&&point.x<p.q)matches.push(point.x);
 }
 const unique=[...new Set(matches.map(String))].map(BigInt);
 return {candidates:unique,reason:unique.length===1?undefined:`Uniqueness failed: ${unique.length} states fit both outputs.`,basis:[u,v]};
}
// [extension] point: more dimensions require a general LLL reduction and more observations.

