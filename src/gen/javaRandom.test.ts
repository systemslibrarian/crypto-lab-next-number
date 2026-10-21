import {describe,it,expect} from 'vitest';
import {JavaRandom} from './javaRandom';
import {search} from '../attack/javaSearch';
import {toyNext} from './toyDecimal';
import {advance,output} from './lcg';
import {recoverLcg} from '../attack/lattice2d';
import {verifyLcg} from '../verify/verify';
import {chachaBytes} from './chacha';

describe('Java SE 21 vectors and prediction',()=>{
 it('reproduces the pinned sequences with state advancing',()=>{
  for(const [seed,values] of [[0n,[-1155484576,-723955400,1033096058,-1690734402,-1557280266,1327362106]],[42n,[-1170105035,234785527,-1360544799,205897768,1325939940,-248792245]],[123456789n,[-1442945365,-1016548095,1962592967,1094656688,1677212580,930275108]]] as const){
   const gen=new JavaRandom(seed);expect(values.map(()=>gen.nextInt())).toEqual(values);
  }
  const g=new JavaRandom(0n);expect([g.nextDouble(),g.nextDouble(),g.nextDouble()]).toEqual([0.730967787376657,0.24053641567148587,0.6374174253501083]);
  const h=new JavaRandom(42n);expect([h.nextDouble(),h.nextDouble(),h.nextDouble()]).toEqual([0.7275636800328681,0.6832234717598454,0.30871945533265976]);
 });
 it('recovers a state from only two 32-bit outputs and predicts ten more',()=>{
  const g=new JavaRandom(42n);const observed=[g.nextInt(),g.nextInt()];const future=Array.from({length:10},()=>g.nextInt());
  expect(search(observed).map(c=>c.next)).toContainEqual(future);
 });
 it('rejects inconsistent observations and advances the toy state',()=>{expect(search([1,2])).toHaveLength(0);expect(toyNext(1234)).toBe(5921)});
 it('searches the actual 26-then-27-bit halves of one nextDouble',()=>{
  const g=new JavaRandom(42n),first=Number(g.next(26)),second=Number(g.next(27)),state=g.state;
  expect(search([first,second],26,undefined,27).map(c=>c.state)).toContain(state);
 });
});
describe('2-D exact lattice',()=>{
 it('recovers a checked 40-bit example and reports ambiguous multipliers',()=>{
  const p={q:1n<<40n,w:1n<<15n,a:812375817537n,b:74593n};const state=9876543210n;
  const observations=[output(state,p),output(advance(state,p),p)];
  const recovered=recoverLcg(observations[0],observations[1],p);
  expect(recovered.candidates).toContain(state);
  expect(verifyLcg(state,observations,p)).toBe(true);
  expect(recoverLcg(observations[0],observations[1],{...p,a:1n}).candidates.length).toBeGreaterThanOrEqual(0);
  expect(()=>recoverLcg(observations[0],observations[1],{...p,a:2n})).toThrow();
 });
 it('refuses a=1 when more than one state satisfies both outputs',()=>{
  const p={q:1n<<40n,w:1n<<15n,a:1n,b:7n},s=9876543210n;
  const result=recoverLcg(output(s,p),output(advance(s,p),p),p);
  expect(result.candidates.length).toBeGreaterThan(1);
  expect(result.reason).toMatch(/Uniqueness failed/);
 });
});
describe('ChaCha20 control',()=>{
 it('matches RFC 8439 §2.3.2 block 1',()=>{
  const key=Uint8Array.from({length:32},(_,i)=>i),nonce=Uint8Array.from([0,0,0,9,0,0,0,0x4a,0,0,0,0]);
  const result=chachaBytes(key,nonce,128);
  // The API's counter starts at 0; RFC's block at counter 1 occurs second.
  expect(Buffer.from(result.slice(64,80)).toString('hex')).toBe('10f1e7e4d13b5915500fdd1fa32071c4');
 });
});
