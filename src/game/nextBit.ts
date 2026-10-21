import {JavaRandom} from '../gen/javaRandom';
import {toyNext} from '../gen/toyDecimal';
import {Q,W,advance,output,randomBelow} from '../gen/lcg';
import {recoverLcg} from '../attack/lattice2d';
import {search} from '../attack/javaSearch';
import {chachaBytes} from '../gen/chacha';

export type Kind='toy'|'java'|'lattice'|'chacha';
export type GameResult={wins:number;trials:number;low:number;high:number;advantage:number;unresolved:number};
export function wilson(wins:number,n:number):[number,number] {
 const z=1.96,p=wins/n,denom=1+z*z/n,mid=(p+z*z/(2*n))/denom;
 const radius=z*Math.sqrt((p*(1-p)+z*z/(4*n))/n)/denom;
 return [Math.max(0,mid-radius),Math.min(1,mid+radius)];
}
const coin=()=>crypto.getRandomValues(new Uint8Array(1))[0]&1;
/** One adversary interface: two prior outputs in, next low-bit guess out. No hidden challenger state. */
export function guess(kind:Kind,previous:readonly bigint[],params?:{q:bigint;a:bigint;b:bigint;w:bigint}):number|null {
 if(kind==='toy')return toyNext(Number(previous[1]))&1;
 if(kind==='java'||kind==='chacha'){
  const candidate=search(previous.map(Number));
  return candidate.length===1?candidate[0].next[0]&1:null;
 }
 if(!params)throw new Error('Lattice parameters required');
 const result=recoverLcg(previous[0],previous[1],params);
 return result.candidates.length===1?Number(output(advance(advance(result.candidates[0],params),params),params)&1n):null;
}
export function runGame(kind:Kind,n:number,onProgress?:(done:number)=>void):GameResult {
 if(!Number.isInteger(n)||n<20||n>2000)throw new RangeError('Choose 20 to 2000 trials');
 let wins=0,unresolved=0;
 for(let i=0;i<n;i++){
  let prior:bigint[],actual:number,parameters:{q:bigint;a:bigint;b:bigint;w:bigint}|undefined;
  if(kind==='toy'){
   let s=Number(randomBelow(10000n));const first=s;s=toyNext(s);prior=[BigInt(first),BigInt(s)];actual=toyNext(s)&1;
  } else if(kind==='java'){
   const seed=randomBelow(1n<<48n),g=new JavaRandom(seed);
   prior=[BigInt(g.nextInt()),BigInt(g.nextInt())];actual=g.nextInt()&1;
  } else if(kind==='lattice'){
   parameters={q:Q,w:W,a:randomBelow(Q/2n)*2n+1n,b:randomBelow(Q)};
   let s=randomBelow(Q);prior=[output(s,parameters)];s=advance(s,parameters);prior.push(output(s,parameters));actual=Number(output(advance(s,parameters),parameters)&1n);
  } else {
   const key=crypto.getRandomValues(new Uint8Array(32)),nonce=crypto.getRandomValues(new Uint8Array(12));
   const stream=new DataView(chachaBytes(key,nonce,12).buffer);
   prior=[BigInt(stream.getInt32(0,true)),BigInt(stream.getInt32(4,true))];actual=stream.getInt32(8,true)&1;
  }
  let predicted=guess(kind,prior,parameters);
  if(predicted===null){unresolved++;predicted=coin()}
  wins+=Number(predicted===actual);
  if((i+1)%10===0)onProgress?.(i+1);
 }
 const [low,high]=wilson(wins,n);
 return {wins,trials:n,low,high,advantage:Math.abs(wins/n-.5),unresolved};
}
// [extension] point: Theorem 3.6's reverse direction converts an efficient statistical test to a predictor.

