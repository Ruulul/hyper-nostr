import createDB from './db.js'
import createBee from './bee.js'
import { createHash } from 'crypto'

const prefix = 'hyper-nostr-'

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
    onmessage: event => {
      subs.forEach(({ filters, socket }, key) => {
        if (validateEvent(event, filters)) socket.send(`["EVENT", "${key}", ${JSON.stringify((delete event._id, event))}]`)
      })
    }
  })
  const DBBroadcast = discovery.registerExtension(topic + '-sync', {
    encoding: 'json',
    onmessage: message => {
      let sawNew = false
      for (const url of message) {
        if (knownDBs.has(url)) continue
        sawNew = true
        knownDBs.add(url)
        handleNewDB(url)
      }
      if (sawNew) broadcastDBs()
    }
  })
  discovery.on('peer-add', _ => {
    console.log(`got a new peer on ${_topic}!`)
    broadcastDBs()
  })
  broadcastDBs()

  console.log(`swarm ${topic} created with hyper!`)
  return { subs, sendEvent, queryEvents, update }

  async function update () {
    await bee.bee.update()
  }

  function sendEvent (event) {
    events.broadcast(event)
    return handleEvent(event)
  }

  function broadcastDBs () {
    DBBroadcast.broadcast(Array.from(knownDBs))
  }

  async function handleNewDB (url) {
    await bee.addInput(await sdk.get(url))
  }
}

function createTopicBuffer (topic) {
  return createHash('sha256').update(topic).digest()
}
