import createDB from './db.js'
import * as SDK from 'hyper-sdk'
import Autobase from 'autobase'
import Autodeebee from 'hyperdeebee/autodeebee.js'
import goodbye from 'graceful-goodbye'
import { createHash } from 'crypto'

const prefix = 'hyper-nostr-'
const beeOpts = { keyEncoding: 'binary', valueEncoding: 'binary' }

const sdk = await SDK.create({
  storage: '.hyper-nostr-relay',
  autoJoin: true
})
console.log('your key is', sdk.publicKey.toString('hex'))
goodbye(_ => sdk.close())

export default async function createSwarm (_topic) {
  const topic = prefix + _topic
  const subs = new Map()

  const IOCores = await sdk.namespace(topic)
  const localInput = IOCores.get({ name: 'local-input' })
  const localOutput = IOCores.get({ name: 'local-output' })
  const autobase = new Autobase({ localInput, localOutput })
  const bee = new Autodeebee(autobase, beeOpts)

  const knownDBs = new Set()
  knownDBs.add(localInput.url)
  const { validateEvent, handleEvent, queryEvents } = await createDB(bee)

  const discovery = await sdk.get(createTopicBuffer(topic))
  const events = discovery.registerExtension(topic, {
    encoding: 'json',
    onmessage: event => {
      handleEvent(event)
      subs.forEach(({ filters, socket }, key) => {
        if (validateEvent(event, filters)) socket.send(['EVENT', key, event])
      })
    }
  })
  const DBBroadcast = discovery.registerExtension(topic + '-autobase', {
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
  discovery.on('peer-add', broadcastDBs)

  console.log(`swarm ${topic} created with hyper!`)
  return { subs, sendEvent, queryEvents }

  function sendEvent (event) {
    handleEvent(event)
    events.broadcast(event)
  }

  function broadcastDBs () {
    DBBroadcast.broadcast([...knownDBs])
  }

  async function handleNewDB (url) {
    await autobase.addInput(await sdk.get(url))
  }
}

function createTopicBuffer (topic) {
  return createHash('sha256').update(topic).digest()
}
