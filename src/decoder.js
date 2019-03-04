// @flow strict

import type { Crypto, CryptoKey } from "./data.js"

class BlockDecoder {
  /*::
  crypto: Crypto
  key: CryptoKey
  */
  constructor(crypto /*: Crypto*/, key /*: CryptoKey*/) {
    this.crypto = crypto
    this.key = key
  }
  decode(data /*:Uint8Array*/) {}
}

export const block = (crypto /*:Crypto*/, key /*:CryptoKey*/) =>
  new BlockDecoder(crypto, key)
