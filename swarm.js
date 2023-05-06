import createDB from './db.js'
import createBee from './bee.js'
import { createHash } from 'crypto'
import { validateEvent as nostrValidate, verifySignature as nostrVerify } from 'nostr-tools'

const prefix = 'hyper-nostr-'
const persistentKinds = Object.freeze(['regular', 'replaceable'])

export default async function createSwarm (sdk, _topic) {
  const topic = prefix + _topic
  const subs = new Map()

  const bee = await createBee(sdk, topic)
  const { validateEvent, handleEvent, queryEvents } = await createDB(bee)

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
  discovery.on('peer-remove', _ => {
    logPeers()
    console.log(`${discovery.peers.length} peers on ${_topic}`)
  })
  logPeers()
  broadcastDBs()

  console.log(`swarm ${topic} created with hyper!`)
  return { subs, sendEvent, queryEvents, update }

  function logPeers () {
    console.log(`${discovery.peers.length} peers on ${_topic}!`)
  }

  async function update () {
    await bee.bee.update()
  }

  function streamEvent (event, sender) {
    subs.forEach(({ filters, socket }, key) => {
      if (sender !== socket &&
        nostrValidate(event) &&
        nostrVerify(event) &&
        validateEvent(event, filters)
      ) socket.send(`["EVENT", "${key}", ${JSON.stringify((delete event._id, event))}]`)
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
    return bee.autobase.addInput(await sdk.get(url))
  }
}

function createTopicBuffer (topic) {
  return createHash('sha256').update(topic).digest()
}
