#!/usr/bin/env node

import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import Hyperswarm from "hyperswarm";
import goodbye from 'graceful-goodbye';
import { createHash } from "crypto";
import createDB from "./db.js";

const topics = new Map
async function createSwarm(topic) {
    const { filterEvents, handleEvent, queryEvents } = await createDB(topic)
    const swarm = new Hyperswarm()
    goodbye(async _ => {
        swarm.connections.forEach(conn => conn.end())
        await swarm.destroy()
        console.log(`swarm ${topic} destroyed!`)
    })
    const conns = new Set
    const subs = new Map
    await swarm.join(topicBuffer(topic)).flushed()
    swarm.on('connection', stream => {
        console.log('swarm connection on', topic)
        conns.add(stream)
        stream.once('close', _ => conns.delete(stream))
        stream.on('error', err => console.log(`got error ${err.name}`))
        stream.on('data', data => {
            console.log(`data on ${topic}:`, data)
            subs.forEach(({ filters, socket }, key) =>
                filterEvents([data], filters)
                    .map(event => socket.send(["EVENT", key, event]))
            )
            handleEvent(data)
        })
    })
    console.log(`swarm ${topic} created!`)
    return { conns, subs, handleEvent, queryEvents }
}

const fastify_instance = fastify()
const f_i = fastify_instance
const port = process.argv[2] || 3000


f_i.register(fastifyWebsocket)
f_i.register(async function (fastify) {
    fastify.get('/:topic', { websocket: true }, async (con, req) => {
        const { topic } = req.params
        if (!topic) return
        if (!topics.has(topic)) {
            topics.set(topic, await createSwarm(topic))
        }
        const { conns, subs, handleEvent, queryEvents } = topics.get(topic)
        const { socket } = con
        console.log('ws connection')

        socket.on('message', message => {
            const [type, value, ...rest] = JSON.parse(message)
            switch (type) {
                case 'EVENT':
                    conns.forEach(stream => stream.send(value))
                    handleEvent(value)
                    socket.send(["OK", value.id, true, ""])
                    break;
                case 'REQ':
                    subs.set(value, { filters: rest, socket })
                    queryEvents(rest).map(event => ["EVENT", value, event]).forEach(event => socket.send(event))
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
    return createHash('sha256').update('hyper-nostr-' + topic).digest()
}