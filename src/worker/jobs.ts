import {search} from '../attack/javaSearch';
import {Q,W,advance,output,randomBelow} from '../gen/lcg';
import {recoverLcg} from '../attack/lattice2d';
import {runGame,type Kind} from '../game/nextBit';

type Job={type:'java';values:number[];bits:26|32;secondBits?:26|27|32}|{type:'lattice';trials:number}|{type:'game';kind:Kind;trials:number};
self.onmessage=(event:MessageEvent<Job>)=>{
 try {
  const job=event.data;
  if(job.type==='java'){
   const candidates=search(job.values,job.bits,n=>{if(n%65536===0)self.postMessage({progress:n})},job.secondBits);
   self.postMessage({candidates:candidates.map(c=>({state:c.state.toString(),next:c.next}))});
  } else if(job.type==='game'){
   const result=runGame(job.kind,job.trials,n=>self.postMessage({progress:n}));self.postMessage({result});
  } else {
   let wins=0,ambiguous=0;
   for(let j=0;j<job.trials;j++){
    const p={q:Q,w:W,a:randomBelow(Q/2n)*2n+1n,b:randomBelow(Q)};
    const s=randomBelow(Q),r=[output(s,p),output(advance(s,p),p)];
    const found=recoverLcg(r[0],r[1],p);
    if(found.candidates.length!==1)ambiguous++;else if(found.candidates[0]===s)wins++;
    if(j%10===9)self.postMessage({progress:j+1});
   }
   self.postMessage({result:{wins,ambiguous,trials:job.trials}});
  }
 }catch(error){self.postMessage({error:String(error)})}
};
