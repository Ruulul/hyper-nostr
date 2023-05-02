import createDB from './db.js'
import * as SDK from 'hyper-sdk'
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

  const { validateEvent, handleEvent, queryEvents } = await createDB(await sdk.getBee(topic, beeOpts))

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

  console.log(`swarm ${topic} created with hyper!`)
  return { subs, sendEvent, queryEvents }

  function sendEvent (event) {
    handleEvent(event)
    events.broadcast(event)
  }
}

function createTopicBuffer (topic) {
  return createHash('sha256').update(topic).digest()
}
