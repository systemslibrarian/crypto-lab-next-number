export function toyNext(state:number):number {
  if(!Number.isInteger(state)||state<0||state>9999)throw new RangeError('State must be four decimal digits');
  return (21*state+7)%10000;
}

