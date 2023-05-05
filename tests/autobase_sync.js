import createSwarm from '../swarm.js'
import * as SDK from 'hyper-sdk'
import goodbye from 'graceful-goodbye'
import test from 'tape'

const topic = 'example'
const timeout = 200

async function createPeer () {
  const sdk = await SDK.create({
    storage: false,
    autoJoin: true
  })
  goodbye(_ => sdk.close())
  return await createSwarm(sdk, topic)
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

  const doc1 = await peer1.sendEvent(eventPeer1)
  const doc2 = await peer2.sendEvent(eventPeer2)

  await new Promise(resolve => setTimeout(resolve, timeout))

  await Promise.all([
    peer1.update(),
    peer2.update()
  ])

  const peer1Query = await peer1.queryEvents()
  const peer2Query = await peer2.queryEvents()
  console.log('queries:', { peer1Query, peer2Query })

  t.deepEqual(doc1, peer2Query.find(event => event.id === doc1.id))
  t.deepEqual(doc2, peer1Query.find(event => event.id === eventPeer2.id))

  t.isEqual(peer1Query.length, 2)
  t.isEqual(peer2Query.length, 2)
})
