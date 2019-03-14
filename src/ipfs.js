// @flow strict

/*::
import type { IPFS, CID } from "./data.js"
*/

import { passback } from "./util.js"

export class Dag {
  static async encode /*::<a>*/(
    ipfs /*:IPFS*/,
    node /*:a*/,
    format /*:string*/
  ) /*:Promise<Buffer>*/ {
    const codec = await passback(callback =>
      ipfs._ipld._getFormat(format, callback)
    )
    const buffer = await passback(callback =>
      codec.util.serialize(node, callback)
    )
    return buffer
  }
  static async decode /*::<a>*/(
    ipfs /*:IPFS*/,
    buffer /*:Uint8Array*/,
    format /*:string*/ = "dag-cbor"
  ) /*:Promise<a>*/ {
    const codec = await passback(callback =>
      ipfs._ipld._getFormat(format, callback)
    )
    const data = await passback(callback =>
      codec.util.deserialize(buffer, callback)
    )
    return data
  }
  static async get /*::<a>*/(ipfs /*:IPFS*/, id /*:CID<a>*/) /*:Promise<a>*/ {
    const { value } = await ipfs.dag.get(id)
    return value
  }
}
