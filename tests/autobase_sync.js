import createSwarm from '../swarm.js'
import * as SDK from 'hyper-sdk'
import goodbye from 'graceful-goodbye'
import test from 'tape'

async function createPeer () {
  const sdk = await SDK.create({
    storage: false,
    autoJoin: true
  })
  sdk.prefix = 'hyper-nostr-'
  goodbye(_ => sdk.close())
  return await createSwarm(sdk, 'example')
}

test.onFinish(_ => process.exit(0))
test('syncing events', async t => {
  const peer1 = await createPeer()
  const peer2 = await createPeer()

  const eventPeer1 = {
    id: 0,
    kind: 1,
    pubkey: 'peer1',
    content: 'hello'
  }
  const eventPeer2 = {
    id: 1,
    kind: 1,
    pubkey: 'peer2',
    content: 'world'
  }

  peer1.sendEvent(eventPeer1)
  peer2.sendEvent(eventPeer2)

  const peer1Query = await peer1.queryEvents([])
  const peer2Query = await peer2.queryEvents([])

  t.deepEqual(eventPeer1, peer2Query.find(event => event.id === eventPeer1.id))
  t.deepEqual(eventPeer2, peer1Query.find(event => event.id === eventPeer2.id))
})
