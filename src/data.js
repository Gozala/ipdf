// @flow strict

export interface Feed<a> {
  publish(data: a): Promise<Feed<a>>;
  nth(index: number): Promise<a>;
  first(): Promise<a>;
  slice(start: number, end: number): Promise<a[]>;
}

export interface CID {
  toString(): string;
  toBaseEncodedString(base: string): string;
}

export interface IPFS$DAG {
  put<a>(content: a): Promise<CID>;
  get<a>(CID, path: string): Promise<a>;
  get<a>(CID): Promise<a>;
}

export interface IPFS {
  dag: IPFS$DAG;
}

export type FeedBlock = {
  +author: Uint8Array,
  +size: number,
  +content: CID,
  +previous: null | CID
}

export type SignedFeedBlock = FeedBlock & { +signature: Uint8Array }

export interface Author {
  id(): Uint8Array;
  sign(bytes: Uint8Array): Promise<Uint8Array>;
}

export interface PublicKey {
  bytes: Uint8Array;
  verify(
    data: Uint8Array,
    signature: Uint8Array,
    Callback<Error, boolean>
  ): void;
}

export interface PrivateKey {
  bytes: Uint8Array;
  publicKey: PrivateKey;
  sign(data: Uint8Array, Callback<Error, Uint8Array>): void;
}

export interface Crypto {
  sign(key: PrivateKey, message: Uint8Array): Promise<Uint8Array>;
  verify(
    key: PublicKey,
    data: Uint8Array,
    signature: Uint8Array
  ): Promise<boolean>;
  decodePrivateKey(Uint8Array): Promise<PrivateKey>;
  decodePublicKey(Uint8Array): Promise<PublicKey>;

  randomBytes(size: number): Uint8Array;
  generateKeyPair(type: KeyType, size: number): Promise<PrivateKey>;
  generateKeyPairFromSeed(
    type: KeyType,
    seed: ArrayBuffer,
    size: number
  ): Promise<PrivateKey>;
}

export type KeyType = "ed25519" | "RSA"

interface LibP2P$Crypto$Keys {
  generateKeyPair(
    type: KeyType,
    size: number,
    Callback<Error, PrivateKey>
  ): void;
  generateKeyPairFromSeed(
    type: KeyType,
    seed: ArrayBuffer,
    size: number,
    Callback<Error, PrivateKey>
  ): void;
  unmarshalPrivateKey(Uint8Array, Callback<Error, PrivateKey>): void;
  unmarshalPublicKey(Uint8Array, Callback<Error, PublicKey>): void;
  marshalPrivateKey(PrivateKey): Uint8Array;
  marshalPublicKey(PublicKey): Uint8Array;
}

export interface Callback<x, a> {
  ($NonMaybeType<x>, empty): void;
  (void, a): void;
}

export interface LibP2P$Crypto {
  keys: LibP2P$Crypto$Keys;
  randomBytes(size: number): Uint8Array;
}

type AuthorKey = Uint8Array
type MessageKey = Uint8Array
type Message = { bytes: Uint8Array }
type SecretBox = { key: MessageKey }
type SharedKey<authorKey, recepientKey> = Uint8Array

type Encoded<data, codec> = {
  decode(codec): data
}

type EncodedMessage = Encoded<Message, MessageKey>
type ReceipentMessageKey<messageKey, authorKey, recepientKey> = Encoded<
  messageKey,
  SharedKey<authorKey, recepientKey>
>

type Link = {
  cid: CID
}

type Block<message, messageKey, authorKey, recepientKey> = {
  nonce: Link,
  publicKey: PublicKey,
  access: ReceipentMessageKey<messageKey, authorKey, recepientKey>[],
  message: Encoded<message, messageKey>
}

type Plain = {
  type: "plain/text"
}

type Encrypted = {
  type: "encrypted",
  alorithm: string
}

type Entry = {
  format: Plain | Encrypted,
  data: Uint8Array,
  links: Link[]
}
