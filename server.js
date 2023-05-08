#!/usr/bin/env node

import fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import createSwarm from './swarm.js'
import * as SDK from 'hyper-sdk'
import goodbye from 'graceful-goodbye'
import { validateEvent, getEventType } from './nostr_events.js'

const port = process.argv[2] || 3000
const startingTopics = process.argv.slice(3)

const sdk = await SDK.create({
  storage: '.hyper-nostr-relay',
  autoJoin: true
})
console.log('your key is', sdk.publicKey.toString('hex'))
goodbye(async _ => {
  console.log('exiting...')
  await sdk.close()
})

const fi = fastify()

const topics = new Map()
await Promise.all(
  startingTopics
    .filter(Boolean)
    .map(async topic =>
      topics.set(topic, await createSwarm(sdk, topic))
    )
)

fi.register(fastifyWebsocket)
fi.register(async function (fastify) {
  fastify.route({
    method: 'GET',
    url: '/:topic',
    handler: (req, reply) => {
      const { topic } = req.params
      if (req.headers.accept === 'application/nostr+json') {
        reply.send({
          name: 'nostr-relay-' + (topic || 'nostr'),
          description: 'a decentralized nostr relay, powered by Hypercore',
          pubkey: 'd5b4107402ea8a23719f8c7fc57e7eaba6bc54e7c2da62b39300207c156978f1',
          'supported-nips': [1, 2, 11, 12, 16, 20, 33, 45],
          software: 'https://github.com/Ruulul/hyper-nostr'
        })
      } else reply.send()
    },
    wsHandler: async (con, req) => {
      let { topic } = req.params
      if (!topic) topic = 'nostr'
      if (!topics.has(topic)) {
        topics.set(topic, await createSwarm(sdk, topic))
      }
      const { sendEvent, subscriptions, queryEvents, sendQueryToSubscription } = topics.get(topic)
      const { socket } = con

      socket.on('message', async message => {
        const [type, value, ...rest] = JSON.parse(message)
        switch (type) {
          case 'EVENT': {
            if (!validateEvent(value)) {
              socket.send('["NOTICE", "Invalid event"]')
              break
            }
            const type = getEventType(value.kind)
            if (!type) {
              socket.send('["NOTICE", "Unrecognized event kind"]')
              break
            }
            sendEvent(value)
            socket.send(`["OK", ${value.id}, true, ""]`)
            break
          }
          case 'REQ':
            subscriptions.set(value, { filters: rest, socket, receivedEvents: new Set() })
            await sendQueryToSubscription(subscriptions.get(value), value)
            socket.send(`["EOSE", "${value}"]`)
            break
          case 'CLOSE':
            subscriptions.delete(value)
            break
          case 'COUNT':
            socket.send(`["COUNT", "${value}", ${JSON.stringify({ count: (await queryEvents(rest)).length })}]`)
            break
          default:
            socket.send('["NOTICE", "Unrecognized event"]')
        }
      })
      socket.once('close', _ => {
        subscriptions.forEach(({ socket: _socket }, key) => socket === _socket && subscriptions.delete(key))
      })
    }
  })
})

fi.listen({ port }, err => {
  if (err) throw err
  console.log(`listening on ${port}`)
})
