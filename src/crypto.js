// @flow strict

/*::
import type {
  LibP2P$Crypto,
  Crypto,
  PrivateKey,
  PublicKey,
  KeyType,
  Callback
} from "./data.js"
*/

export default (libp2p$crypto /*:LibP2P$Crypto*/) /*:Crypto*/ =>
  new Libp2pCrypto(libp2p$crypto)

class Libp2pCrypto /*::implements Crypto*/ {
  /*::
  provider:LibP2P$Crypto;
  */
  constructor(provider) {
    this.provider = provider
  }
  randomBytes(size /*:number*/) {
    return this.provider.randomBytes(size)
  }
  generateKeyPair(
    type /*: KeyType*/,
    size /*: number*/
  ) /*: Promise<PrivateKey>*/ {
    return passback(callback =>
      this.provider.keys.generateKeyPair(type, size, callback)
    )
  }
  generateKeyPairFromSeed(
    type /*: KeyType*/,
    seed /*: ArrayBuffer*/,
    size /*: number*/
  ) /*: Promise<PrivateKey>*/ {
    return passback(callback =>
      this.provider.keys.generateKeyPairFromSeed(type, seed, size, callback)
    )
  }
  encodePrivateKey(key /*:PrivateKey*/) /*:Uint8Array*/ {
    return this.provider.keys.marshalPrivateKey(key)
  }
  encodePublicKey(key /*:PublicKey*/) /*:Uint8Array*/ {
    return this.provider.keys.marshalPublicKey(key)
  }
  decodePrivateKey(encodedKey /*:Uint8Array*/) /*:Promise<PrivateKey>*/ {
    return passback(out =>
      this.provider.keys.unmarshalPrivateKey(encodedKey, out)
    )
  }
  decodePublicKey(encodedKey /*:Uint8Array*/) /*:Promise<PublicKey>*/ {
    return passback(callback =>
      this.provider.keys.unmarshalPublicKey(encodedKey, callback)
    )
  }
  verify(
    publicKey /*:PublicKey*/,
    data /*:Uint8Array*/,
    signature /*:Uint8Array*/
  ) /*:Promise<boolean>*/ {
    return passback(callback => publicKey.verify(data, signature, callback))
  }
  sign(
    privateKey /*:PrivateKey*/,
    data /*:Uint8Array*/
  ) /*:Promise<Uint8Array>*/ {
    return passback(callback => privateKey.sign(data, callback))
  }
}

const passback = /*::<x, a>*/ (
  call /*:(Callback<x, a>) => mixed*/
) /*:Promise<a>*/ =>
  new Promise((resolve, reject) => {
    call((error, ok) => {
      if (error) {
        reject(error)
      } else {
        resolve(ok)
      }
    })
  })
