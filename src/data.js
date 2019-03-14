// @flow strict

export interface Feed<a> {
  publish(data: a): Promise<Feed<a>>;
  nth(index: number): Promise<a>;
  first(): Promise<a>;
  slice(start: number, end: number): Promise<a[]>;
}

export interface CID<a> {
  constructor<a>(string): void;
  toString(): string;
  toBaseEncodedString(base?: string): string;
  buffer: Uint8Array;
  equals(mixed): boolean;
}

export interface IPFS$DAG {
  put<a>(content: a, options?: { onlyHash: boolean }): Promise<CID<a>>;
  get<a, b>(
    CID<a>,
    path: string
  ): Promise<{ cid: CID<a>, remainderPath: string, value: b }>;
  get<a>(CID<a>): Promise<{ cid: CID<a>, remainderPath: string, value: a }>;
}

export interface IPFSBlock {
  data: Buffer;
  cid: CID<Buffer>;
}

export interface IPLD {
  _getFormat<a>(string, Callback<Error, IPLD$Codec<a>>): void;
}

export interface IPLD$Codec<a> {
  util: IPLD$Codec$Util<a>;
}

export interface IPLD$Codec$Util<a> {
  serialize(a, Callback<Error, Buffer>): void;
  deserialize(Uint8Array, Callback<Error, a>): void;
}

type PeerIDJSON = {
  id: string,
  pubKey: ?string,
  privKey: ?string
}

export interface PeerID {
  toHexString(): string;
  toBytes(): Uint8Array;
  toB58String(): string;
  toJSON(): PeerIDJSON;
  toPrint(): string;
  isEqual(mixed): boolean;
}

export interface PeerIDAPI {
  create(options?: { bits: number }, Callback<Error, PeerID>): void;
  createFromHexString(string): PeerID;
  createFromBytes(string): PeerID;
  createFromB58String(string): PeerID;
  createFromPubKey(Uint8Array, Callback<Error, PeerID>): void;
  createFromJSON(PeerIDJSON): PeerID;
}

export type IPFS$Types = {
  CID: Class<CID<*>>,
  PeerId: PeerIDAPI
}

export type IPFS$Block$Put = {
  format?: "string",
  mhtype?: "string",
  mhlen?: number,
  version?: number
}

export type IPFS$Block$Stat = {
  key: string,
  size: number
}

export interface IPFS$Block {
  get<a>(
    CID<a>,
    option: ?{ cid: CID<a> | Buffer | string }
  ): Promise<IPFSBlock>;
  put<a>(
    Buffer,
    options: { cid: CID<a> | Buffer | string } & IPFS$Block$Put
  ): Promise<IPFS$Block>;
  put(IPFS$Block, options?: IPFS$Block$Put): Promise<IPFS$Block>;
  stat<a>(cid: CID<a> | Buffer | string): Promise<IPFS$Block$Stat>;
}

export interface IPFS$Name {
  resolve(
    string,
    options?: { recursive?: boolean, nocache?: boolean }
  ): Promise<{ path: string }>;
  publish(
    string,
    options?: {
      resolve?: boolean,
      lifetime?: string,
      ttl?: string,
      key?: string
    }
  ): Promise<{ name: string, value: string }>;
}

export interface IPNS {
  publish(
    PrivateKey,
    string,
    lifetime: number,
    Callback<Error, { id: string, name: string }>
  ): void;
}

export interface IPFS$PubSub {
  publish(topic: string, data: Uint8Array): Promise<void>;
  ls(): Promise<string[]>;
  subscribe(
    topic: string,
    handler: IPFS$PubSub$Handler,
    options?: { discover?: boolean }
  ): Promise<void>;
  unsubscribe(topic: string, handler: IPFS$PubSub$Handler): Promise<void>;
}

export type IPFSPubSubMessage = {
  from: string,
  seqno: number,
  data: Buffer,
  topicIDs: string[]
}
type IPFS$PubSub$Handler = IPFSPubSubMessage => void
export interface IPFS {
  types: IPFS$Types;
  dag: IPFS$DAG;
  block: IPFS$Block;
  name: IPFS$Name;
  pubsub: IPFS$PubSub;

  _ipld: IPLD;
  _ipns: IPNS;
}

export type FeedBlock<a> = {
  +author: Uint8Array,
  +size: number,
  +content: CID<a>,
  +previous: CID<a>
}

export type SignedFeedBlock<a> = FeedBlock<a> & { +signature: Uint8Array }

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
  public: PublicKey;
  id(Callback<Error, string>): void;
  sign(data: Uint8Array, Callback<Error, Uint8Array>): void;
}

export interface CryptoKey {
  bytes: Uint8Array;
}

export interface SecretKey extends CryptoKey {
  encrypt(data: Uint8Array, Callback<Error, Uint8Array>): void;
  decrypt(data: Uint8Array, Callback<Error, Uint8Array>): void;
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
    seed: Uint8Array,
    size: number
  ): Promise<PrivateKey>;

  encrypt(
    data: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array
  ): Promise<Uint8Array>;
  decrypt(
    data: Uint8Array,
    nonce: Uint8Array,
    key: Uint8Array
  ): Promise<Uint8Array>;
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
    seed: Uint8Array,
    size: number,
    Callback<Error, PrivateKey>
  ): void;
  unmarshalPrivateKey(Uint8Array, Callback<Error, PrivateKey>): void;
  unmarshalPublicKey(Uint8Array, Callback<Error, PublicKey>): void;
  marshalPrivateKey(PrivateKey): Uint8Array;
  marshalPublicKey(PublicKey): Uint8Array;
}

interface LibP2P$Crypto$AES {
  create(key: Uint8Array, iv: Uint8Array, Callback<Error, SecretKey>): void;
}

export interface Callback<x, a> {
  ($NonMaybeType<x>, empty): void;
  (void, a): void;
}

export interface LibP2P$Crypto {
  keys: LibP2P$Crypto$Keys;
  aes: LibP2P$Crypto$AES;
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

type Link<a> = {
  cid: CID<a>
}

type Block<message, messageKey, authorKey, recepientKey> = {
  nonce: Link<Buffer>,
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
  links: Link<Uint8Array>[]
}
