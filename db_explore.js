#!/usr/bin/env node

import createBee from './bee.js'
import * as SDK from 'hyper-sdk'
import goodbye from './goodbye.js'
import { DB } from 'hyperdeebee'
import { createInterface } from 'readline'
const int = createInterface(process.stdin, process.stdout)

const prefix = 'gnostr-lfs-'

const sdk = await SDK.create({
  storage: '.gnostr/lfs',
  autoJoin: true
})
goodbye(_ => sdk.close())

const topic = prefix + process.argv[2]
const db = new DB(await createBee(sdk, topic))

let input
while (true) {
  input = await question('Enter your query: ')
  if (input === 'q') {
    int.close()
    process.exit(0)
  }
  try {
    input = JSON.parse(input)
  } catch {
    console.log('Invalid query, try again (it has to follow JSON format)')
    continue
  }
  for await (const event of db.collection('events').find(input)) console.log(event)
}

function question (prompt) {
  let res
  const promise = new Promise(resolve => (res = resolve))
  int.question(prompt, res)
  return promise
}
