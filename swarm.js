import createDB from "./db.js";
import * as SDK from 'hyper-sdk'
import goodbye from "graceful-goodbye";

const prefix = 'hyper-nostr-'

const sdk = await SDK.create({
    storage: '.hyper-nostr-relay',
    autoJoin: true,
})
console.log('your key is', sdk.publicKey.toString('hex'))
goodbye(_ => sdk.close())

export default async function createSwarm(_topic) {
    const topic = prefix + _topic
    const topic_hash = createTopicBuffer(topic)
    const subs = new Map
    const cons = new Set
    sdk.join(topic_hash)

    const { validateEvent, handleEvent, queryEvents } = await createDB(await sdk.getBee(topic))
    sdk.on('peer-add', peerInfo => {
        if (peerInfo.topics.includes(topic_hash)) {
            const socket = sdk.connections.get(peerInfo.publicKey)
            socket.on('data', _handleEvent)
            cons.add(socket)
        }
    })
    sdk.once('peer-remove', peerInfo => {
        if (peerInfo.topics.includes(topic_hash)) {
            const socket = sdk.connections.get(peerInfo.publicKey)
            cons.delete(socket)
        }
    })


    console.log(`swarm ${topic} created with hyper!`)
    return { subs, sendEvent, queryEvents }

    function sendEvent(event) {
        handleEvent(event)
        cons.forEach(socket => socket.write(JSON.stringify(event)))
    }

    function _handleEvent(event) {
        console.log(`got event from ${_topic}: `, topic)
        console.log(event.toString())
        handleEvent(JSON.parse(event))
        subs.forEach(({ filters, socket }, key) =>
            validateEvent(event, filters) &&
            socket.send(["EVENT", key, event])
        )
    }
}

function createTopicBuffer(topic) {
    return require('crypto').createHash('sha256').update(topic).digest()
}