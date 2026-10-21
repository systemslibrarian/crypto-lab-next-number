import {advance,output,type Lcg} from '../gen/lcg';
export function verifyLcg(state:bigint,observed:readonly bigint[],params:Lcg):boolean {
 let s=state;
 return observed.every((v,i)=>{if(i)s=advance(s,params);return output(s,params)===v});
}

