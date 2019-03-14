// @flow strict

/*::
import type { CID } from "./data.js"

type CryptoKey = Uint8Array
type SecretPublicKey = Uint8Array
type SecretPrivateKey = Uint8Array
type BodyKey = Uint8Array
type Signature<data, privateKey> = Uint8Array

export opaque type Encoded<data, codec>:Uint8Array = Uint8Array

export type ReplicatorKey = CryptoKey
export type SubscriberKey = CryptoKey
export type RecepientKey = CryptoKey
export type AuthorPublicKey = CryptoKey
export type AuthorPrivateKey = CryptoKey
export type NamePublicKey = CryptoKey

export type SecretKey<authorPrivateKey, recepientPublicKey> = CryptoKey


export type Head<a> = {
  signature: Signature<Encoded<Block<a>, ReplicatorKey>, AuthorPrivateKey>,
  block: Encoded<Block<a>, ReplicatorKey>
}

export type Root<a> = {
  head:CID<Head<a>>,
  author:AuthorPublicKey,
  signature:Signature<NamePublicKey, AuthorPrivateKey>
}

export type Block<a> = {
  links: CID<Head<a>>[],
  message: Encoded<Message<a>, SubscriberKey>
}

export type Message<a> = {
  previous: CID<Head<a>>,
  size: number,
  content: a
}

type PrivateMessage<a> = {
  type: "private",
  head: SecretPublicKey,
  // scalar multiplication is used to derive a shared secret for each recipient
  // which is then used as to encrypt a `BodyKey` for each recepient.
  // Each recepient will attempt to decode `BodyKey` by dervining shared secret
  // using `SercetPublicKey` (in head attribute) and own private key. If
  // successuful, recepient can decrypt content with it.
  // -----
  // Unlike SSB this doesn't actually attempts to conceal number of recepients
  // which is not impossible just easier to do with raw buffers than with DAGs.
  secrets: Encoded<BodyKey, SecretKey<SecretPrivateKey, RecepientKey>>[],
  content: Encoded<a, BodyKey>
}

type PublicMessage<a> = {
  type: "public",
  body: a
}

type SSBLikeFeed<a> = Head<PrivateMessage<a> | PublicMessage<a>>
*/

export const root = /*::<a>*/ (
  head /*:CID<Head<a>>*/,
  author /*:AuthorPublicKey*/,
  signature /*:Signature<NamePublicKey, AuthorPrivateKey>*/
) /*:Root<a>*/ => ({ head, author, signature })

export const head = /*::<a>*/ (
  block /*:Encoded<Block<a>, ReplicatorKey>*/,
  signature /*:Signature<Encoded<Block<a>, ReplicatorKey>, AuthorPrivateKey>*/
) /*:Head<a>*/ => {
  return { block, signature }
}

export const block = /*::<a>*/ (
  message /*:Encoded<Message<a>, SubscriberKey>*/,
  head /*:?CID<Head<a>>*/
) /*:Block<a>*/ => {
  return {
    links: head ? [head] : [],
    message
  }
}

export const message = /*::<a>*/ (
  content /*:a*/,
  size /*:number*/,
  previous /*:CID<Head<a>>*/
) /*:Message<a>*/ => {
  return {
    previous,
    size,
    content
  }
}
