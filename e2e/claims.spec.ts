import {test,expect} from '@playwright/test';
const A=0x5deece66dn,M=(1n<<48n)-1n;
const next=(s:bigint)=>(s*A+11n)&M;
const signed=(v:bigint)=>{const n=Number(v>>16n);return n>=2**31?n-2**32:n};
test('rendered Java state reproduces observed outputs and ten predictions',async({page})=>{
 await page.goto('./');const first=Number(await page.locator('#java-first').inputValue()),second=Number(await page.locator('#java-second').inputValue());
 await page.getByRole('button',{name:'Try all hidden bits'}).click();
 await expect(page.locator('#java-out')).toContainText('state recovered',{timeout:30000});
 const claim=await page.locator('#java-out').innerText(),state=BigInt('0x'+claim.match(/State after output 2: 0x([\da-f]+)/)![1]);
 expect(signed(state)).toBe(second);
 const inv=(()=>{let x=1n;for(let i=0;i<6;i++)x=x*(2n-A*x)&M;return x})();
 const previous=((state-11n)*inv)&M;expect(signed(previous)).toBe(first);
 let s=state;const future=Array.from({length:10},()=>{s=next(s);return signed(s)});
 expect(claim.match(/Predicted next ten: ([\d,\- ]+)/)![1].split(',').map(Number)).toEqual(future);
 await page.locator('#java-first').fill('1');await expect(page.locator('#java-out')).toContainText('Retired');
 await page.locator('#game-kind').selectOption('chacha');await page.getByRole('button',{name:'Play the game'}).click();
 await expect(page.locator('#game-out')).toContainText('Wilson 95%',{timeout:60000});
 const game=await page.locator('#game-out').innerText(),matched=game.match(/(\d+)\/(\d+) next bits guessed.*advantage \|wins\/N − ½\| = ([0-9]+(?:\.[0-9]+)?)/);
 expect(matched).not.toBeNull();
 expect(Number(matched![3])).toBeCloseTo(Math.abs(Number(matched![1])/Number(matched![2])-.5),2);
 expect(await page.locator('#frequency-out').innerText()).toContain('LOOKS RANDOM — AND PREDICTED');
});
test('512-bit lattice predictions reproduce the rendered independent continuation',async({page})=>{
 await page.goto('./');
 const result=page.locator('#lattice-sample');
 for(let i=0;i<6;i++){
  await page.getByRole('button',{name:'Run a 512-bit instance'}).click();
  if((await result.innerText()).includes('ALARM'))break;
 }
 await expect(result).toContainText('unique 512-bit state recovered');
 const text=await result.innerText();
 const m=text.match(/a = (\d+), b = (\d+), w = 2\^251\nr₀ = (\d+)\nr₁ = (\d+)\nRecovered s = (\d+)\nPredicted r₂…r₆ = ([\d, ]+)/);
 expect(m).not.toBeNull();
 const [a,b,r0,r1,s]=m!.slice(1,6).map(BigInt),q=1n<<512n,w=1n<<251n;
 expect(s/w).toBe(r0);
 let state=(a*s+b)%q;expect(state/w).toBe(r1);
 const future=Array.from({length:5},()=>{state=(a*state+b)%q;return state/w});
 expect(m![6].split(', ').map(BigInt)).toEqual(future);
});
