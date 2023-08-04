#!/usr/bin/env node

import fastify from 'fastify'
import fastifyWebsocket from '@fastify/websocket'
import createSwarm from './swarm.js'
import * as SDK from 'hyper-sdk'
import goodbye from './goodbye.js'
import { validateEvent, getEventType } from './gnostr_events.js'
import { default as fsWithCallbacks } from 'fs'

import child_process from 'child_process'
const fs = fsWithCallbacks.promises
// const fs = require('fs').promises;

const port = process.argv[2] || 3000
const startingTopics = process.argv.slice(3)

const sdk = await SDK.create({
  storage: '.gnostr/lfs',
  autoJoin: true
})

//TODO:get git repo name
//     for content topic

const content = '#gnostr'
async function writekey () {
  try {
    //TODO: git config --add gnostr-lfs.pubkey
    await fs.appendFile('.gnostr/lfs/KEYS', sdk.publicKey.toString('hex'))
    //console.log('your key is', sdk.publicKey.toString('hex'))// we silence to only return EVENT body
  } catch (err) {
    console.log(err)
  }
}
writekey()
const exec = child_process.exec

const gnostr = ''

exec("type -P gnostr || echo ''", (error, stdout, stderr) => {
  if (error) {
    console.log(`gnostr-lfs error: ${error.message}`)
    return nil
  }
  if (stderr) {
    console.log(`gnostr-lfs stderr: ${stderr}`)
    return nil
  }
  //console.log(`gnostr-lfs stdout: ${stdout}`);// we silence so only the EVENT body is returned
})

exec("which gnostr || echo 'gnostr not found!!! && 1'", (error, stdout, stderr) => {
  if (error) {
    console.log(`gnostr-lfs error: ${error.message}`)
    return nil
  }
  if (stderr) {
    console.log(`gnostr-lfs stderr: ${stderr}`)
    return nil
  }
  const gnostr = stdout
})

exec(`gnostr --sec ${sdk.publicKey.toString('hex')} --tag "gnostr" "repo" --tag "weeble" "gnostr-weeble" --tag "wobble" "gnostr-wobble" --envelope --content "${content}" `, (error, stdout, stderr) => {
  if (error) {
    console.log(`gnostr-lfs error: ${error.message}`)
    return
  }
  if (stderr) {
    console.log(`gnostr-lfs stderr: ${stderr}`)
    return
  }
  console.log(`${stdout}`) //we silence so only EVENT body returned
})

goodbye(async _ => {
  console.log('exiting...')
  await sdk.close().catch(e => {
    console.error(e)
    throw e
  })
})

const fi = fastify()
goodbye(_ => fi.close())

const topics = new Map()
await Promise.all(
  startingTopics
    .filter(Boolean)
    .map(async topic => {
      const swarm = await createSwarm(sdk, topic)
      topics.set(topic, swarm)
      return swarm.update()
    })
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
          name: 'gnostr-lfs-' + (topic || 'hypercore'),
          description: 'gnostr large file service, powered by Hypercore',
          pubkey: sdk.publicKey.toString('hex'),
          'supported-nips': [1, 2, 9, 11, 12, 16, 20, 33, 45],
          software: 'https://github.com/gnostr-org/gnostr-lfs'
        })
      } else reply.send()
    },
    wsHandler: async (con, req) => {
      let { topic } = req.params
      if (!topic) topic = 'gnostr'
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

fi.listen({ port, host: '0.0.0.0' }, err => {
  if (err) throw err
  //console.log(`listening on ${port}`) //we silence so that only the EVENT body is returned
})
