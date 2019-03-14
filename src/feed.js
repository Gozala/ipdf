// @flow strict

import { Dag } from "./ipfs.js"
import { addPrefix, rmPrefix, getCodec } from "./package/multicodec.js"
import * as Format from "./format.js"
import { passback } from "./util.js"

/*::
import type { SecretKey, PrivateKey, PublicKey, IPFS, Crypto, CID, IPFSPubSubMessage } from "./data.js"
import type { Root, Head, Block, Message, Encoded, ReplicatorKey, SubscriberKey } from "./format.js"

interface FeedOptions<a> {
  id:string;
  author:PrivateKey;
  subscriptionKey:Uint8Array;
  replicationKey:Uint8Array;
  size: number;
  head:CID<Head<a>>;
  ipfs:IPFS;
  crypto:Crypto;
}
*/

/*::

interface FeedID {
  id:string;
}
interface Auditor {
  id:string;
  authorKey:PublicKey;
}

interface Publisher {
  id: string;
  feed: PrivateKey;
  author: PrivateKey;
  authorKey: PublicKey;
  subscriptionKey:Uint8Array;
  replicationKey:Uint8Array;
}

interface Subscriber {
  id:string;
  authorKey: PublicKey;
  subscriptionKey:Uint8Array;
  replicationKey:Uint8Array;
}

interface Replicator {
  id:string;
  replicationKey:Uint8Array;
  authorKey: PublicKey;
}

interface Service {
  ipfs:IPFS;
  crypto:Crypto;
}
*/

const HEAD_FORMAT = "dag-cbor"
const BLOCK_FORMAT = "dag-cbor"
const MESSAGE_FORMAT = "dag-cbor"
const PUBLISH_FORMAT = "dag-cbor"

/*::
type Cursor <a> = {
  size:number;
  head:CID<Head<a>>
}
*/

class FeedReader /*::<a>*/ {
  /*::
  service:Service;
  +agent:Subscriber;
  cursor:Cursor<a>;
  */
  async last() /*:Promise<?a>*/ {
    const { service, agent, cursor } = this
    if (cursor.size === 0) {
      return null
    } else {
      const head = await decodeHead(service, agent, cursor.head)
      const block = await decodeBlock(service, agent, head.block)
      const message = await decodeMessage(service, agent, block.message)
      return message.content
    }
  }
}

class FeedPublisher /*::<a>*/ extends FeedReader /*::<a>*/ {
  /*::
  service:Service;
  agent:Publisher;
  cursor:Cursor<a>;
  */
  constructor(
    cursor /*:Cursor<a>*/,
    service /*:Service*/,
    agent /*:Publisher*/
  ) {
    super()
    this.service = service
    this.agent = agent
    this.cursor = cursor
  }
  async publish(message /*:a*/) {
    const cursor = await publish(this, message)
    this.cursor = cursor
    return this
  }
  get size() {
    return this.cursor.size
  }
  toJSON() {
    const {
      cursor: { size, head },
      agent: { id, feed, author, subscriptionKey, replicationKey }
    } = this
    return {
      agent: {
        id,
        feed: feed.bytes,
        author: author.bytes,
        subscriptionKey,
        replicationKey
      },
      cursor: {
        head: head.toBaseEncodedString(),
        size
      }
    }
  }
}

class FeedSubscriber /*::<a>*/ extends FeedReader /*::<a>*/ {
  /*::
  service:Service;
  subject:string;
  agent:Subscriber;
  cursor:Cursor<a>;
  onpublish:(IPFSPubSubMessage) => void
  inbox:IPFSPubSubMessage[]
  notify:a[] => mixed
  isParked:boolean
  */
  constructor(
    cursor /*:Cursor<a>*/,
    service /*:Service*/,
    agent /*:Subscriber*/
  ) {
    super()
    this.service = service
    this.agent = agent
    this.cursor = cursor
    this.onpublish = this.onpublish.bind(this)
    this.isParked = true
    this.inbox = []
  }
  get subject() {
    return `/ipdf/${this.agent.id}/`
  }
  get size() {
    return this.cursor.size
  }
  onpublish(message /*:IPFSPubSubMessage*/) {
    this.inbox.push(message)
    this.unpark()
  }
  async unpark() {
    if (this.isParked) {
      this.isParked = false
      while (this.inbox.length) {
        await this.receive(this.inbox.shift())
      }
      this.isParked = true
    }
  }
  async receive(payload) {
    const { service, agent, cursor } = this
    const id = await decodePublish(service, agent, payload.data)
    const root = await decodeRoot(service, agent, id)
    if (!cursor.head.equals(root.head)) {
      await this.reset(root.head)
    }
  }
  async reset(head /*:CID<Head<a>>*/) {
    const { service, agent, cursor } = this
    const messages = []
    for await (const message of iterate(service, agent, head)) {
      messages.unshift(message.content)
      // Found current head
      if (message.previous.equals(cursor.head)) {
        this.cursor = { head, size: cursor.size + messages.length }
        break
      }
      // If we encounter message that is older than current head that implies
      // that feed was forked, in which case we panic.
      else if (cursor.size > message.size) {
        throw Error("Encountered fork in the message feed, panic!")
      }
    }
    return this.notify(messages)
  }
  subscribe(notify /*:a[] => mixed*/) {
    if (this.notify != null) {
      throw Error("Already subscribed")
    } else {
      this.notify = notify
      this.service.ipfs.pubsub.subscribe(this.subject, this.onpublish)
    }
  }
  unsubscribe(notify /*:a[] => mixed*/) {
    if (this.notify === notify) {
      this.service.ipfs.pubsub.unsubscribe(this.subject, this.onpublish)
      delete this.notify
    } else {
      throw Error("Invalid subscriber")
    }
  }
}

class FeedReplicator {}

export const iterate = async function* iterate /*::<a>*/(
  service /*:Service*/,
  agent /*:Subscriber*/,
  top /*:CID<Head<a>>*/
) /*:AsyncIterable<Message<a>>*/ {
  let id = top
  while (id) {
    const head = await decodeHead(service, agent, id)
    const block = await decodeBlock(service, agent, head.block)
    const message = await decodeMessage(service, agent, block.message)
    yield message
    id = message.previous
  }
}

export const encode = async function encode /*::<a, k>*/(
  { ipfs, crypto } /*:Service*/,
  data /*:a*/,
  nonce /*:Uint8Array*/,
  secretKey /*:Uint8Array*/,
  format /*:string*/
) /*:Promise<Encoded<a, k>>*/ {
  const buffer = await Dag.encode(ipfs, data, format)
  const out /*:any*/ = await crypto.encrypt(
    addPrefix(format, buffer),
    nonce,
    secretKey
  )
  return out
}

export const decode = async (
  { ipfs, crypto } /*:Service*/,
  buffer /*:Uint8Array*/,
  nonce /*:Uint8Array*/,
  secretKey /*:Uint8Array*/
) => {
  const data = await crypto.decrypt(buffer, nonce, secretKey)
  return await Dag.decode(ipfs, rmPrefix(data), getCodec(data))
}

export const decodeBlock = /*::<a>*/ (
  service /*:Service*/,
  agent /*:Replicator*/,
  block /*:Encoded<Block<a>, ReplicatorKey>*/
) /*:Promise<Block<a>>*/ => {
  return decode(service, block, REPLICATION_NONCE, agent.replicationKey)
}

export const encodeBlock = /*::<a>*/ (
  service /*:Service*/,
  agent /*:Publisher*/,
  block /*:Block<a>*/
) /*:Promise<Encoded<Block<a>, ReplicatorKey>>*/ =>
  encode(service, block, REPLICATION_NONCE, agent.replicationKey, BLOCK_FORMAT)

export const encodeMessage = /*::<a>*/ (
  service /*:Service*/,
  agent /*:Publisher*/,
  message /*:Message<a>*/
) /*:Promise<Encoded<Message<a>, SubscriberKey>>*/ =>
  encode(
    service,
    message,
    SUBSCRIBTION_NONCE,
    agent.subscriptionKey,
    MESSAGE_FORMAT
  )

export const decodeMessage = /*::<a>*/ (
  service /*:Service*/,
  agent /*:Subscriber*/,
  message /*:Encoded<Message<a>, SubscriberKey>*/
) /*:Promise<Message<a>>*/ =>
  decode(service, message, SUBSCRIBTION_NONCE, agent.subscriptionKey)

export const encodeHead = async function encodeHead /*::<a>*/(
  service /*:Service*/,
  agent /*:Publisher*/,
  encodedBlock /*:Encoded<Block<a>, ReplicatorKey>*/
) /*:Promise<CID<Head<a>>>*/ {
  const signature = await service.crypto.sign(agent.author, encodedBlock)
  const head = Format.head(encodedBlock, signature)

  return await service.ipfs.dag.put(head)
}

export const decodeHead = async function decodeHead /*::<a>*/(
  service /*:Service*/,
  agent /*:Auditor*/,
  id /*:CID<Head<a>>*/
) /*:Promise<Head<a>>*/ {
  const head = await Dag.get(service.ipfs, id)
  const verified = await verifyHead(service, agent, head)
  if (verified) {
    return head
  } else {
    throw Error("Author of the feed has not signed this block")
  }
}

export const encodeRoot = async function encodeRoot /*::<a>*/(
  service /*:Service*/,
  agent /*:Publisher*/,
  head /*:CID<Head<a>>*/
) /*:Promise<CID<Root<a>>>*/ {
  const id = Buffer.from(agent.id)
  const signature = await service.crypto.sign(agent.author, id)
  const root = Format.root(head, agent.authorKey.bytes, signature)
  return await service.ipfs.dag.put(root)
}

export const decodeRoot = async function decodeRoot /*::<a>*/(
  service /*:Service*/,
  agent /*:Subscriber*/,
  id /*:CID<Root<a>>*/
) /*:Promise<Root<a>>*/ {
  const root = await Dag.get(service.ipfs, id)
  const isAuthorized = await verifyRoot(service, agent, root)
  if (isAuthorized) {
    return root
  } else {
    throw Error(
      "Author of the feed has not authorized publishing under given name"
    )
  }
}

export const encodePublish = async function encodePublish /*::<a>*/(
  service /*:Service*/,
  agent /*:Publisher*/,
  id /*:CID<Root<a>>*/
) /*:Promise<Uint8Array>*/ {
  const signature = await service.crypto.sign(agent.feed, id.buffer)
  return await Dag.encode(service.ipfs, { id, signature }, PUBLISH_FORMAT)
}

export const decodePublish = async function decodePublish /*::<a>*/(
  service /*:Service*/,
  agent /*:Subscriber*/,
  data /*:Uint8Array*/
) /*:Promise<CID<Root<a>>>*/ {
  const { root, signature } = await Dag.decode(
    service.ipfs,
    data,
    PUBLISH_FORMAT
  )
  // TODO: Verify signature of the feed
  return root
}

export const verifyRoot = /*::<a>*/ (
  service /*:Service*/,
  agent /*:Auditor*/,
  root /*:Root<a>*/
) /*:Promise<boolean>*/ =>
  service.crypto.verify(agent.authorKey, Buffer.from(agent.id), root.signature)

export const verifyHead = /*::<a>*/ (
  service /*:Service*/,
  auditor /*:Auditor*/,
  head /*:Head<a>*/
) => service.crypto.verify(auditor.authorKey, head.block, head.signature)

export const resolveHead = async function resolveHead /*::<a>*/(
  service /*:Service*/,
  agent /*:Subscriber*/
) /*:Promise<CID<Head<a>>>*/ {
  const address = await service.ipfs.name.resolve(`/ipns/${agent.id}`, {
    recursive: !true
  })
  const [_, protocol, key] = address.path.split("/")
  const root = await decodeRoot(service, agent, new service.ipfs.types.CID(key))
  return root.head
}

const LIFETIME = 24 * 60 * 60 * 1000 // 24h
const publishHead = async function publishHead /*::<a>*/(
  service /*:Service*/,
  agent /*:Publisher*/,
  head /*:CID<Head<a>>*/
) /*:Promise<CID<Root<a>>>*/ {
  const root = await encodeRoot(service, agent, head)
  await passback(callback =>
    service.ipfs._ipns.publish(
      agent.feed,
      `/ipdf/${root.toBaseEncodedString()}`,
      LIFETIME,
      callback
    )
  )
  const signature = await service.crypto.sign(agent.feed, root.buffer)
  const buffer = await Dag.encode(
    service.ipfs,
    { root, signature },
    PUBLISH_FORMAT
  )
  await service.ipfs.pubsub.publish(`/ipdf/${agent.id}/`, buffer)
  return root
}

// const create = /*::<a>*/ (options /* :FeedOptions<a> */) => new Feed(options)

/*::
type PublisherOptions = {
  feed:PrivateKey;
  author:PrivateKey;
  authorKey:PublicKey;
  subscriptionKey:Uint8Array;
  replicationKey:Uint8Array;
  ipfs:IPFS;
  crypto:Crypto;
}
*/

const feedID = async (
  ipfs /*:IPFS*/,
  key /*:PublicKey*/
) /*:Promise<string>*/ => {
  const { PeerId } = ipfs.types
  const id = await passback($ => PeerId.createFromPubKey(key.bytes, $))
  return id.toB58String()
}

export const publisher = async function publisher /*::<a>*/(
  options /*:PublisherOptions*/
) /*:Promise<FeedPublisher<a>>*/ {
  const {
    ipfs,
    crypto,
    replicationKey,
    subscriptionKey,
    author,
    authorKey,
    feed
  } = options
  const service = { ipfs, crypto }

  const id = await feedID(ipfs, feed.public)
  const agent = {
    id,
    replicationKey,
    subscriptionKey,
    authorKey,
    author,
    feed
  }
  const headID = await resolveHead(service, agent)
  const head = await decodeHead(service, agent, headID)

  const block = await decodeBlock(service, agent, head.block)
  const message = await decodeMessage(service, agent, block.message)
  const cursor = { head: headID, size: message.size }
  return new FeedPublisher(cursor, service, agent)
}

const SUBSCRIBTION_NONCE = Buffer.from("The Subscribtion")
const REPLICATION_NONCE = Buffer.from("Feed Replication")

const END = "zdpuAxKCBsAKQpEw456S49oVDkWJ9PZa44KGRfVBWHiXN3UH8"

export const feed = async function newFeed /*::<a>*/(
  options /*:Service*/
) /*:Promise<FeedPublisher<a>>*/ {
  const { ipfs, crypto } = options
  const author = await crypto.generateKeyPair("ed25519", 256)
  const feed = await crypto.generateKeyPair("ed25519", 256)
  const authorKey = author.public
  const replicationKey = await crypto.randomBytes(32)
  const subscriptionKey = await crypto.randomBytes(32)
  const id = await feedID(ipfs, feed.public)
  const agent = {
    id,
    replicationKey,
    subscriptionKey,
    authorKey,
    author,
    feed
  }
  const cursor = { head: new ipfs.types.CID(END), size: 0 }
  return new FeedPublisher(cursor, options, agent)
}

/*::
type SubscriberOptions = {
  id:string;
  authorKey:PublicKey;
  subscriptionKey:Uint8Array;
  replicationKey:Uint8Array;

  ipfs:IPFS;
  crypto:Crypto;
}
*/
export const subscriber = async function subscriber /*::<a>*/(
  options /*:SubscriberOptions*/
) /*:Promise<FeedSubscriber<a>>*/ {
  const {
    ipfs,
    crypto,
    replicationKey,
    subscriptionKey,
    authorKey,
    id
  } = options
  const service = { ipfs, crypto }
  const agent = { id, replicationKey, subscriptionKey, authorKey }
  const headID = await resolveHead(service, agent)
  const head = await decodeHead(service, agent, headID)
  const block = await decodeBlock(service, agent, head.block)
  const message = await decodeMessage(service, agent, block.message)
  const cursor = { head: headID, size: message.size }

  return new FeedSubscriber(cursor, service, agent)
}

export const publish = async function publish /*::<a>*/(
  feed /*:FeedPublisher<a>*/,
  content /*:a*/
) /*:Promise<Cursor<a>>*/ {
  const { service, agent, cursor } = feed
  const previous = cursor.head
  const size = cursor.size + 1
  const message = await encodeMessage(
    service,
    agent,
    Format.message(content, size, previous)
  )

  const block = await encodeBlock(
    service,
    agent,
    Format.block(message, previous)
  )

  const head = await encodeHead(service, agent, block)
  void publishHead(service, agent, head)

  return { head, size }
}
