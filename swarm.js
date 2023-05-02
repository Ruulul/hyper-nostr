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
    const subs = new Map
    sdk.join(topic)

    const { validateEvent, handleEvent, queryEvents } = await createDB(await sdk.getBee(topic))
    const core = await sdk.get(topic)
    sdk.on('peer-add', peerInfo => {
        if (peerInfo.topics.includes(topic)) {
            console.log('TODO: Discover what to do')
        }
    })
    core.on('peer-add', peerInfo => {
        console.log(`got a peer on ${_topic}, and they are${peerInfo.topics.includes(topic) ? '' : "n't"} in the same topic`)
    })
    const events = await core.registerExtension(topic, {
        encoding: 'json',
        onmessage: event => {
            console.log(`got event from ${_topic}: `, topic)
            handleEvent(event)
            subs.forEach(({ filters, socket }, key) =>
                validateEvent(event, filters) &&
                    socket.send(["EVENT", key, event])
            )
        },
    })
    

    console.log(`swarm ${topic} created with hyper!`)
    return { subs, sendEvent, queryEvents }

    function sendEvent(event) {
        handleEvent(event)
        events.broadcast(event)
    }
}
