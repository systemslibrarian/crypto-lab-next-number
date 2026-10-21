/** Java SE 21 java.util.Random exact 48-bit recurrence. */
export const MOD=1n<<48n, MASK=MOD-1n, MULT=0x5deece66dn, ADD=0xBn;
export const step=(state:bigint)=>(state*MULT+ADD)&MASK;
export function signed32(bits:bigint):number { const n=Number(bits & 0xffffffffn);return n>=2**31?n-2**32:n; }
export class JavaRandom {
  state:bigint;
  constructor(seed:bigint){this.state=(seed^MULT)&MASK}
  next(bits:number):bigint {
    if(!Number.isInteger(bits)||bits<1||bits>32)throw new RangeError('next(bits) requires 1–32 bits');
    this.state=step(this.state);return this.state>>BigInt(48-bits);
  }
  nextInt():number{return signed32(this.next(32))}
  nextDouble():number{return Number((this.next(26)<<27n)+this.next(27))/2**53}
}
// [extension] point: V8 xorshift128+ and Mersenne Twister need their own recurrences and cited sources.

