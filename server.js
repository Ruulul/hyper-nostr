import fastify from "fastify";
import fastifyWebsocket from "@fastify/websocket";
import { readFile } from "fs/promises";
import Hyperswarm from "hyperswarm";
import goodbye from 'graceful-goodbye';
import { handleEvent, queryEvents, filterEvents } from "./db.js";


const swarm = new Hyperswarm()
goodbye(async _ => {
    await swarm.destroy()
    console.log('swarm destroyed!')
})
const conns = new Set
const users = new Set
const subs = new Map
swarm.on('connection', stream => {
    console.log('swarm connection')
    conns.add(stream)
    stream.once('close', conns.delete(stream))
    stream.on('data', data => {
        subs.forEach(({filters, socket}) => 
            filterEvents([data], filters)
            .map(event => socket.send(event))
        )
        handleEvent(data)
    })
})
let topic

const fastify_instance = fastify()
const f_i = fastify_instance
const port = 3000


f_i.register(fastifyWebsocket)
f_i.register(async function (fastify) {
    fastify.get('/:topic', { websocket: true }, async (con, req) => {
        const { socket } = con
        users.add(socket)
        console.log('ws connection')
        
        socket.on('message', message => {
            const [type, value, ...rest] = JSON.parse(message)
            switch (type) {
                case 'EVENT':
                    conns.forEach(stream => stream.send(JSON.stringify(value)))
                    handleEvent(value)
                    break;
                case 'REQ':
                    subs.set(value, { filters: rest, socket })
                    socket.send(queryEvents(rest))
                    break;
                case 'CLOSE':
                    subs.delete(value)
                    break;

                default:
                    socket.send(JSON.stringify(['NOTICE', 'Unrecognized event']))
                    console.log('Unrecognized event')
            }
        })
        socket.once('close', _ => {
            users.delete(socket)
            subs.forEach(({ socket: _socket }, key) => socket === _socket && subs.delete(key))
        })
        
        if (topic !== req.params.topic) {
            if (topic) await swarm.leave(topicBuffer(topic))
            joinTopic(req.params.topic, socket)
        } else {
            echoTopic(topic, socket)
        }
    })
})

f_i.listen({ port }, err => {
    if (err) throw err
    console.log(`listening on ${port}`)
})

function topicBuffer(topic) {
    return Buffer.from(topic, 0, 32)
}
function echoTopic(topic, socket) {
    const text = `Connected successfully to topic ${topic}!`
    socket.send(text)
}
function joinTopic(_topic, socket) {
    topic = _topic
    const discovery = swarm.join(topicBuffer(topic))
    discovery.flushed().then(echoTopic(topic, socket))
}