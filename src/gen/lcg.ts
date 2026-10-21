export type Lcg={q:bigint;a:bigint;b:bigint;w:bigint};
export const Q=1n<<512n, W=1n<<251n;
export function advance(s:bigint,p:Lcg):bigint{return (p.a*s+p.b)%p.q}
export function output(s:bigint,p:Lcg):bigint{return s/p.w}
export function randomBelow(q:bigint):bigint {
  const bytes=new Uint8Array(Math.ceil(q.toString(2).length/8));
  crypto.getRandomValues(bytes);
  let n=0n;for(const byte of bytes)n=(n<<8n)|BigInt(byte);
  return n%q;
}

