import createDB from './db.js'
import createBee from './bee.js'
import { createHash } from 'crypto'
import { validateEvent as nostrValidate, verifySignature as nostrVerify } from 'nostr-tools'

const prefix = 'hyper-nostr-'
const persistentKinds = Object.freeze(['regular', 'replaceable'])

export default async function createSwarm (sdk, _topic) {
  const topic = prefix + _topic
  const subscriptions = new Map()

  const bee = await createBee(sdk, topic)
  const { handleEvent, queryEvents } = await createDB(bee)

  const knownDBs = new Set()
  knownDBs.add(bee.autobase.localInput.url)

  const discovery = await sdk.get(createTopicBuffer(topic))
  const events = discovery.registerExtension(topic, {
    encoding: 'json',
    onmessage: streamEvent
  })
  const DBBroadcast = discovery.registerExtension(topic + '-sync', {
    encoding: 'json',
    onmessage: async (message) => {
      let sawNew = false
      for (const url of message) {
        if (knownDBs.has(url)) continue
        sawNew = true
        await handleNewDB(url)
      }
      if (sawNew) broadcastDBs()
    }
  })
  discovery.on('peer-add', _ => {
    logPeers()
    broadcastDBs()
  })
  discovery.on('peer-remove', logPeers)
  logPeers()
  broadcastDBs()

  console.log(`swarm ${topic} created with hyper!`)
  return { subscriptions, sendEvent, queryEvents, sendQueryToSubscription }

  function logPeers () {
    console.log(`${discovery.peers.length} peers on ${_topic}!`)
  }

  function streamEvent (event, sender) {
    subscriptions.forEach(({ filters, socket, receivedEvents }, key) => {
      if (sender !== socket &&
        !receivedEvents.has(event.id) &&
        nostrValidate(event) &&
        nostrVerify(event) &&
        validateEvent(event, filters)
      ) sendEventTo(event, socket, key, receivedEvents)
    })
  }

  function sendEvent (event, type, sender) {
    events.broadcast(event)
    streamEvent(event, sender)
    if (persistentKinds.includes(type)) return handleEvent(event, type)
  }

  function broadcastDBs () {
    DBBroadcast.broadcast(Array.from(knownDBs))
  }

  async function handleNewDB (url) {
    knownDBs.add(url)
    await bee.autobase.addInput(await sdk.get(url))
    subscriptions.forEach((sub, key) => sendQueryToSubscription(sub, key, { hasLimit: false }))
  }

  async function sendQueryToSubscription ({ filters, socket, receivedEvents }, key, { hasLimit } = { hasLimit: true }) {
    return queryEvents(filters, { hasLimit }).then(events =>
      events.forEach(event => {
        if (!receivedEvents.has(event.id)) sendEventTo(event, socket, key, receivedEvents)
      })
    )
  }
}

function sendEventTo (event, socket, id, receivedEvents) {
  receivedEvents.add(event.id)
  socket.send(`["EVENT", "${id}", ${JSON.stringify((delete event._id, event))}]`)
}

function createTopicBuffer (topic) {
  return createHash('sha256').update(topic).digest()
}

const validateHandlers = {
  ids: (event, filter) => filter.some(id => event.id.startsWith(id)),
  kinds: (event, filter) => filter.includes(event.kind),
  authors: (event, filter) => filter.some(author => event.pubkey.startsWith(author)),
  hastag: (event, filter, tag) => event.tags.some(([_tag, key]) => _tag === tag.slice(1) && filter.includes(key)),
  since: (event, filter) => event.created_at > filter,
  until: (event, filter) => event.created_at < filter
}
function validateEvent (event, filters) {
  return filters
    .map(filter =>
      Object.entries(filter)
        .filter(([key]) => key.startsWith('#') || (key in validateEvent && key !== 'limit'))
        .map(([key, value]) =>
          key.startsWith('#')
            ? validateHandlers.hastag(event, value, key)
            : validateHandlers[key](event, value)
        )
        .every(Boolean)
    )
    .some(Boolean)
}
