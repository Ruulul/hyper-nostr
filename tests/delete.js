import createSwarm from '../swarm.js'
import { generatePrivateKey, getPublicKey, getEventHash, signEvent } from 'nostr-tools'
import goodbye from 'graceful-goodbye'
import * as SDK from 'hyper-sdk'
import test from 'tape'

async function createPeer () {
  const sdk = await SDK.create({
    storage: false,
    autoJoin: false
  })
  goodbye(_ => sdk.close())
  return await createSwarm(sdk, 'example')
}
const createdAt = _ => Math.floor(Date.now() / 1000)

test('delete', async t => {
  const peer = await createPeer()
  const userPrivK = generatePrivateKey()
  const userPubK = getPublicKey(userPrivK)
  const event = {
    kind: 1,
    created_at: createdAt(),
    content: 'some text',
    tags: [],
    pubkey: userPubK
  }
  event.id = getEventHash(event)
  event.sign = signEvent(event, userPrivK)

  await peer.sendEvent(event)

  const deleteEvent = {
    kind: 5,
    content: '',
    created_at: createdAt(),
    pubkey: userPubK,
    tags: [['e', event.id]]
  }
  deleteEvent.id = getEventHash(deleteEvent)
  deleteEvent.sign = signEvent(deleteEvent, userPrivK)

  await peer.sendEvent(deleteEvent)

  const foundEvent = (await peer.queryEvents()).find(_event => _event.id === event.id)
  t.assert(!foundEvent)
})
