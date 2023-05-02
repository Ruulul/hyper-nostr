#!/usr/bin/env node

import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import goodbye from 'graceful-goodbye';
import { createHash } from "crypto";
import createDB from "./db.js";
import * as SDK from 'hyper-sdk'

const prefix = 'hyper-nostr-'

const sdk = await SDK.create({
    storage: '.hyper-nostr-relay',
    autoJoin: true,
})
console.log('your key is', sdk.publicKey.toString('hex'))
goodbye(_ => sdk.close())

const topics = new Map
async function createSwarm(topic) {    
    const subs = new Map
    sdk.join(topicBuffer(topic)).flushed()

    const { validateEvent, handleEvent, queryEvents } = await createDB(await sdk.getBee(topic))
    
    const events = await sdk.registerExtension(prefix + topic, {
        encoding: 'json',
        onmessage: event => {
            handleEvent(event)
            subs.forEach(({ filters, socket }, key) =>
                validateEvent(event, filters) &&
                    socket.send(["EVENT", key, event])
            )
        },
    })
    

    console.log(`swarm ${topic} created with hyper!`)
    return { subs, sendEvent, handleEvent, queryEvents }

    function sendEvent(event) {
        events.broadcast(event)
    }
}

const fastify_instance = fastify()
const f_i = fastify_instance
const port = process.argv[2] || 3000


f_i.register(fastifyWebsocket)
f_i.register(async function (fastify) {
    fastify.get('/:topic', { websocket: true }, async (con, req) => {
        const { topic } = req.params
        console.log('ws connection started')
        if (!topic) return
        if (!topics.has(topic)) {
            topics.set(topic, await createSwarm(topic))
        }
        const { sendEvent, subs, handleEvent, queryEvents } = topics.get(topic)
        const { socket } = con
        console.log('ws connection stablished')

        socket.on('message', async message => {
            const [type, value, ...rest] = JSON.parse(message)
            switch (type) {
                case 'EVENT':
                    sendEvent(value)
                    handleEvent(value)
                    socket.send(["OK", value.id, true, ""])
                    break;
                case 'REQ':
                    subs.set(value, { filters: rest, socket });
                    (await queryEvents(rest)).map(event => ["EVENT", value, event]).forEach(event => socket.send(event))
                    socket.send(["EOSE", value])
                    break;
                case 'CLOSE':
                    subs.delete(value)
                    break;
                case 'COUNT':
                    subs.get(value).socket.send(["COUNT", value, { count: queryEvents(rest).length }])
                    break;
                default:
                    socket.send(['NOTICE', 'Unrecognized event'])
                    console.log('Unrecognized event')
            }
        })
        socket.once('close', _ => {
            subs.forEach(({ socket: _socket }, key) => socket === _socket && subs.delete(key))
        })
    })
})

f_i.listen({ port }, err => {
    if (err) throw err
    console.log(`listening on ${port}`)
})

function topicBuffer(topic) {
    return createHash('sha256').update(prefix + topic).digest()
}