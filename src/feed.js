// @flow strict

/*::
import type { Feed as DataFeed, IPFS, CID, FeedBlock, SignedFeedBlock, Author } from "./data.js"
*/

class Feed /*::<a> implements DataFeed<a>*/ {
  /*::
  id: CID
  previous: null | CID
  size: number
  ipfs: IPFS
  author: Author
  base: string
  */
  constructor(
    id: CID,
    previous: null | CID,
    size: number,
    author: Author,
    ipfs: IPFS,
    base = "base58btc"
  ) {
    this.id = id
    this.previous = previous
    this.size = size
    this.author = author
    this.ipfs = ipfs
    this.base = base
  }
  async open(id) {}
  async sign(block /*:FeedBlock*/) /*:Promise<SignedFeedBlock>*/ {
    const { base, author } = this
    const encoder = new TextEncoder()
    const payload = encoder.encode(
      JSON.stringify({
        author: block.author,
        content: block.content.toBaseEncodedString(base),
        previous: block.previous
          ? block.previous.toBaseEncodedString(base)
          : null,
        size: block.size
      })
    )

    const signature = await author.sign(payload)
    return { ...block, signature }
  }
  async publish(message /*:a*/) /*:Promise<DataFeed<a>>*/ {
    const { previous, ipfs, author, base, id } = this
    const content = await this.ipfs.dag.put(message)
    const size = this.size + 1
    const block = {
      author: author.id(),
      size,
      content,
      previous
    }

    const signed = await this.sign(block)
    const next = await this.ipfs.dag.put(signed)
    return new Feed(next, id, size, author, ipfs, base)
  }
  async nth(n /*:number*/) /*:Promise<a>*/ {
    const path = "/previous".repeat(n)
    return this.ipfs.dag.get(this.id, `${path}/content`)
  }
  async slice(start, end) /*:Promise<a[]>*/ {
    let index = start
    const items = []
    while (index < end) {
      items.push(this.nth(index))
      index += 1
    }
    const values = await Promise.all(items)
    return values
  }
  first() /*:Promise<a>*/ {
    return this.nth(0)
  }
}
