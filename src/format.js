// @flow strict

type CID<a> = {
  decode(): Promise<a>
}

type CryptoKey = Uint8Array
type SecretPublicKey = Uint8Array
type SecretPrivateKey = Uint8Array
type BodyKey = Uint8Array
type Signature = Uint8Array
type Encrypted<data, key> = data
type ReplicatorKey = CryptoKey
type FollowerKey = CryptoKey
type RecepientKey = CryptoKey
type AuthorPublicKey = CryptoKey
type AuthorPrivateKey = CryptoKey

type SecretKey<authorPrivateKey, recepientPublicKey> = CryptoKey

type Feed<a> = {
  author: AuthorPublicKey,
  signature: Signature,
  block: Encrypted<Block<a>, ReplicatorKey>
}

type Block<a> = {
  links: CID<Feed<a>>[],
  message: Encrypted<FollowerKey, Message<a>>
}

type Message<a> = {
  previous: CID<Feed<a>>,
  content: a
}

type PrivateMessage<a> = {
  type: "private",
  head: SecretPublicKey,
  body: [
    Encrypted<BodyKey, SecretKey<SecretPrivateKey, RecepientKey>>[],
    Encrypted<a, BodyKey>
  ]
}

type PublicMessage<a> = {
  type: "public",
  body: a
}

type SSBLikeFeed<a> = Feed<PrivateMessage<a> | PublicMessage<a>>
