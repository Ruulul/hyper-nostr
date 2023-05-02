#!/usr/bin/env node

import fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import createSwarm from './swarm.js'

const fi = fastify()
const port = process.argv[2] || 3000

const topics = new Map()

fi.register(fastifyWebsocket)
fi.register(async function (fastify) {
  fastify.get('/:topic', { websocket: true }, async (con, req) => {
    const { topic } = req.params
    console.log('ws connection started')
    if (!topic) return
    if (!topics.has(topic)) {
      topics.set(topic, await createSwarm(topic))
    }
    const { sendEvent, subs, queryEvents } = topics.get(topic)
    const { socket } = con
    console.log('ws connection stablished')

    socket.on('message', async message => {
      const [type, value, ...rest] = JSON.parse(message)
      switch (type) {
        case 'EVENT':
          sendEvent(value)
          socket.send(['OK', value.id, true, ''])
          break
        case 'REQ':
          subs.set(value, { filters: rest, socket });
          (await queryEvents(rest)).map(event => ['EVENT', value, event]).forEach(event => socket.send(event))
          socket.send(['EOSE', value])
          break
        case 'CLOSE':
          subs.delete(value)
          break
        case 'COUNT':
          subs.get(value).socket.send(['COUNT', value, { count: queryEvents(rest).length }])
          break
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

fi.listen({ port }, err => {
  if (err) throw err
  console.log(`listening on ${port}`)
})
