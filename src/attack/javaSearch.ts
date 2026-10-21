import {ADD,MASK,MULT,MOD,signed32,step} from '../gen/javaRandom';

export type Candidate={state:bigint;next:number[]};
export function search(observed:readonly number[],bits:26|32=32,progress?:(n:number)=>void,secondBits:26|27|32=bits):Candidate[] {
  if(observed.length<2||observed.some((x,i)=>!Number.isInteger(x)||x<((i===0?bits:secondBits)===32?-2147483648:0)||x>((i===0?bits:secondBits)===32?2147483647:2**(i===0?bits:secondBits)-1)))throw new RangeError('Need two consecutive valid outputs');
  const hidden=48-bits, top=bits===32?BigInt(observed[0]>>>0):BigInt(observed[0]);
  const expected=bits===32?BigInt(observed[1]>>>0):BigInt(observed[1]);
  const matches:Candidate[]=[];
  for(let low=0;low<2**hidden;low++) {
    if((low&16383)===0)progress?.(low);
    const first=(top<<BigInt(hidden))|BigInt(low);
    const second=step(first);
    if((second>>BigInt(48-secondBits))!==expected)continue;
    let state=second;
    const next:number[]=[];
    for(let i=0;i<10;i++){state=step(state);next.push(bits===32?signed32(state>>16n):Number(state>>22n))}
    if(observed.slice(2).every((v,i)=>next[i]===v))matches.push({state:second,next});
  }
  progress?.(2**hidden);
  return matches;
}

/** Given a post-nextInt internal state, invert the Java recurrence for a demonstration. */
export function precedingState(state:bigint):bigint {
  // MULT is odd and has an inverse modulo 2^48.
  let inverse=1n;for(let i=0;i<6;i++)inverse=(inverse*(2n-MULT*inverse))&MASK;
  return ((state-ADD)*inverse)%MOD & MASK;
}

