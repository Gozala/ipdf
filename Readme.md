# IPDF - Content content-addressable data feed

IPDF is the data model of content-addressable data feeds. It provides a way to
distribute an immutable list of data posted & signed by a single identity.

### Status: Genesis

At the moment project is in it's genesis, there are some code sketches, but in
practice it's an outline of established requirements.

If you care to provide feedabck [data format](https://github.com/gozala/ipdf/blob/master/src/format.js) is what you want to look at.

## Goals

- Versioning for the data identifier (a.k.a mutable data).
- Feed is signed and it's intergrity can be verified. (Each data block + link to the prior blocks is signed by an author allowing integrity checks)
  > There is a chance feed will be forked deliberetely or by an accident (e.g. bad migration to new device). Instead of treating such feed as corrupt we would allow user to choose between that or simply choosing a longer feed.
- Feed id should be decoupled from the feed. That would allow an author to share both:
  - Live feed that others can subscribe to.
  - Specific version of the feed without permission to subscribe to updates.
- Key rotation. It should be possible to swap keys.
  > Perhaps this is unecessary one could always just start a new feed instead, however that would require ID change.
- Feed id should be bound to a specific feed. It should be possible to update it to reference new head of the feed but impossible to point to a different feed.
- Multiple layers of privacy
  - Author should be able to publish ID of the feed without revealing anything at all.
  - Author should be able to share a tarversal key + feed ID with a _replicator_ that would allow it to replicate all the data in the feed without having access to actual data.
  - Author should be able to share a secret key + feed ID with with a _recepients_ allowing them to read all the data in the feed.
    > Perhaps case could be made to share access to just subset of the feed. Which would imply that different keys can be used for different data blocks.
- Decouple feed from the data. Feed should be decoupled from storage, format, protocol. [IPLD][] provides a way to create links across protocol & format boundries which is a perfect fit.

## Prior Art

### [SSB Feeds][]

A [Scuttlebutt feed][ssb feeds] is a primary source of inspiration. It is however tied to the [SSB Protocol][]. We would like to leverage [IPLD][], which provides content-addressable linked data model, and would allow us to work across multiple formats and protocols.

### [Hypercore][]

[hypercore][] is a secure, distributed append-only log. It is decoupled from the transport but is coupled with a data storage model of [random-access-storage][] that uses byte rangens for addressing. On the upsite it is extremely fast, but on the downside it makes data deduplication more tricky. We do however want to take advantage of content-addressible model provided by [IPLD][] which addresses deduplication out of the box. Additionally unified read / write interface across multiple storage models provides additional flexibility e.g. one could implement [IPLD Resolver][] that reads / writes data into [random-access-storage][].

We also would like to have more granular access-rights in which you can have **replicator** participants that can make all the data available to the network but have no 0 knowledge of the data a hand. Another kind of participants **subscribers** could subscribe to the feed, verify it's integrity & access public data all without access to some private messages. Finally there can be specific **recepient** participants who can do all the above + access private messages addressed to them.

### [Textile Threads][]

[Textile threads][] do leverage [IPLD][] and have very similar goals, however in the current iteration (v1) they additionally deal with managing messages from multiple parcticipants of the thread. Here we are modeling a feed with a single author, which reduces complexity & provides better scalability and defer multi-user participation to the next layer (e.g. [hypermerge][]).

There are active discussions on [v2 threads](https://github.com/textileio/go-textile/issues/566) that could end up being very similar to approach here or we might even converge. Right now primary goal is to use this as an alternative backend for [hypermerge][] to enable collaborative use cases in [lunet][]. Starting with a blank page seems more effective way to pursue this goal that attempts to port textile threads from to JS while at the same time changing it's model.

We do hope however that over time we'll be able to converge.

### [IPFS Log][]

[IPFS Log](https://github.com/orbitdb/ipfs-log) from [Orbit DB][] also makes many of the same choices. However it also doen sot have granular access-rights (as described under [hypercore](#hypercore)). It also deals with joining forks as under the hood it's operation-based conflict-free replicated data structure ([CRDT][]) which is great but we prefer that to be done by the next layer - [hypermerge][] under the hood is also happens to be operation-based [CRDT][] and layering two would result doing more or less same kind of work twice.

[ipld]: https://ipld.io/
[ipfs]: https://ipfs.io/
[ssb feeds]: https://ssbc.github.io/scuttlebutt-protocol-guide/#feeds
[ssb protocol]: https://ssbc.github.io/scuttlebutt-protocol-guide/
[hypercore]: https://github.com/mafintosh/hypercore
[dat]: http://datproject.org/
[dat protocol]: https://datprotocol.github.io/how-dat-works/#wire-protocol
[textile threads]: https://medium.com/textileio/wip-textile-threads-whitepaper-just-kidding-6ce3a6624338
[ipfs log]: https://github.com/orbitdb/ipfs-log
[random-access-storage]: https://github.com/random-access-storage/
[ipld resolver]: https://github.com/ipld/interface-ipld-format
[hypermerge]: https://github.com/automerge/hypermerge
[lunet]: http://github.com/gozala/lunet
[orbit db]: https://github.com/orbitdb/welcome
[crdt]: https://en.wikipedia.org/wiki/Conflict-free_replicated_data_type
