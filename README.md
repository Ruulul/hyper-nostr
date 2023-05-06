# Hyper-Nostr Relay
## Support me!
- Sats: https://getalby.com/p/v_142857
- Ko-fi: https://ko-fi.com/v142857
## Usage
The goal of this tool is to behave as a public relay; think of the chosen topic as a public relay, where you can send and receive notes from your peers!
1. Install: `npm -g hyper-nostr`
2. Run: `hyper-nostr [port [...starting topics]]` (default 3000)
3. Add your relay as `ws://localhost:[port]/[topic]` in your Nostr client (I am using `nostr` as a topic to make some kind of generic swarm)
4. Setup done!
## How it works
Hyper-Nostr is a distributed nostr relay that syncs your relay storage and real time events through the [Hyperswarm](https://github.com/holepunchto/hyperswarm), linearizes the databases with [Autobase](https://github.com/holepunchto/autobase), and uses a [Hyperbeedee](https://github.com/Telios-org/hyperdeebee) database (loosely based on MongoDB).

The hyperswarm and cores management was highly abstracted thanks to [Hyper SDK](https://github.com/rangermauve/hyper-sdk).
## NIPs implemented
- [x] NIP-01 (mandatory nostr implementation)
- [x] NIP-02 (contact lists)
- [ ] NIP-04 (direct messages)
- [ ] NIP-09 (event deletion)
- [x] NIP-11 (relay information)
- [x] NIP-12 (generic tag queries)
- [x] NIP-16 (event treatment)
- [x] NIP-20 (command results)
- [ ] NIP-33 (parametrized replaceable events)
- [x] NIP-45 (event counts)
- [ ] NIP-50 (search)

## Code API
```js
import * as SDK from 'hyper-sdk'
import createSwarm from 'hyper-nostr'
import goodbye from 'graceful-goodbye'

const yourStorageFolder = '.hyper-nostr-relay' // set to false to not persist
cosnt theTopic = 'nostr'

const sdk = SDK.create({
    storage: yourStorageFolder
})
goodbye(_ => sdk.close())

const { 
    subs, // a Map<subscriptionId: string, { filters: Filter[], socket: WebSocket }> object
    sendEvent, // (event: Event, kind: 'regular' | 'replaceable' | 'ephemeral', socket?: WebSocket) => document: Object | Error; to send an Nostr Event to the peers and the local database. Optionally pass in the socket of the sender to filter them out in the broadcast
    queryEvents, // (filters: Filter[]) => Promise<Event[]>; to query the database for the events that match the list of filters 
    update, // () => Promise<void>; to await the database to update, syncing with the connected peers
} = await createSwarm(sdk, theTopic)
```
## Server API
The client can send the following events through the websocket:
- REQ: Request and subscription event
    - Format: `["REQ", <subscription id>, <filters JSON>...]`
    - The server then adds the socket and the filters to the `subs` map
    - The server will send all the events that are on the database that matches the query, followed by a `["EOSE", <subscription id>]` event, signalling that all events from now on will be on real time
- EVENT: Send an event to the relay
    - Format: `["EVENT", <event JSON>]`
    - The server will use `sendEvent` to broadcast the event, and received events through this broadcast are internally validated and sent through the `subs` Map
    - The server confirms that the message was sent with an `["OK", <event id>, true, ""]` (NIP-20)
- CLOSE: Cancel a subscription
    - Format: `["CLOSE", <subscription id>]`
    - Cancels a subscription, removing it from the `subs` map
- COUNT: Counts the number of events that match a query (NIP-45)
    - Format: `["COUNT", <subscription id>, <filters JSON>...]`
    - Query and count events that match the filters sent in the same event

The server sends the following events:
- EOSE and OK specified above;
- EVENT: Sending an event that matches the filters of a subscription
    - Format: `["EVENT", <subscription id>, <event JSON>]`
- NOTICE: Reporting errors
    - Format: `["NOTICE", <message>]`
    - The only Notice this server implements is `"Unrecognized event"`, for when there is no match for the event kind sent.
## Troubleshooting
- `Batch is out-of-date. Did you commit another batch in parallel?`
    - This is corrupted data. I am still trying to narrow the source of that. Quick fix: `rm .hyper-nostr-relay -R` (on the same place you ran `hyper-nostr`)
## License
MIT