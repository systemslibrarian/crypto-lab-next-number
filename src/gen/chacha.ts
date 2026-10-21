import {chacha20} from '@noble/ciphers/chacha.js';
/** RFC 8439 32-bit counter and 96-bit nonce; returns the keystream by encrypting zeros. */
export function chachaBytes(key:Uint8Array,nonce:Uint8Array,count:number):Uint8Array {
 if(key.length!==32||nonce.length!==12||!Number.isInteger(count)||count<0||count>65536)throw new RangeError('ChaCha20 requires a 32-byte key and 12-byte nonce');
 return chacha20(key,nonce,new Uint8Array(count),undefined,0);
}

