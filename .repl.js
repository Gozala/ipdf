// @flow strict

import IPFS from "ipfs"
import Crypto from "./src/crypto.js"
import * as Feed from "./src/feed.js"
import { Dag } from "./src/ipfs.js"

export const ipfs = new IPFS({
  EXPERIMENTAL: { pubsub: true, dht: true, ipnsPubsub: true }
})

export const service = { ipfs, crypto: Crypto(ipfs.util.crypto) }

export const wait = promise => {
  promise.then(
    value => {
      console.log((wait.result = promise.result = { ok: true, value }))
    },
    error => {
      console.log((wait.result = promise.result = { ok: false, error }))
    }
  )
  return promise
}

export const callback = (error, value) => {
  if (error) {
    console.log((callback.result = { ok: false, error }))
  } else {
    console.log((callback.result = { ok: true, value }))
  }
}

const main = async () => {
  Object.assign(global, {
    wait,
    callback,
    ipfs,
    service,
    IPFS,
    Crypto,
    Feed,
    Dag
  })
  global.feed = await Feed.feed(service)
  global.agent = feed.agent
  console.log("Feed started", feed)
}

main()
