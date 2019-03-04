// @flow strict

export type CID<a> = {
  decode(): Promise<a>
}

type CryptoKey = Uint8Array
type SecretPublicKey = Uint8Array
type SecretPrivateKey = Uint8Array
type BodyKey = Uint8Array
type Signature = Uint8Array

export type Encoded<data, codec> = {
  decode(codec): data
}

type ReplicatorKey = CryptoKey
type FollowerKey = CryptoKey
type RecepientKey = CryptoKey
type AuthorPublicKey = CryptoKey
type AuthorPrivateKey = CryptoKey

type SecretKey<authorPrivateKey, recepientPublicKey> = CryptoKey

export type Head<a> = {
  author: AuthorPublicKey,
  signature: Signature,
  block: Encoded<Block<a>, ReplicatorKey>
}

export type Block<a> = {
  links: CID<Head<a>>[],
  message: Encoded<Message<a>, FollowerKey>
}

export type Message<a> = {
  previous: CID<Head<a>>,
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
