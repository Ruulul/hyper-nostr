#!/usr/bin/env node

import * as SDK from 'hyper-sdk'
import goodbye from "graceful-goodbye";
import { DB } from "hyperbeedeebee";
import { createInterface } from 'readline'
const int = createInterface(process.stdin, process.stdout)

const prefix = 'hyper-nostr-'

const sdk = await SDK.create({
    storage: '.hyper-nostr-relay',
    autoJoin: true,
})
goodbye(_ => sdk.close())

const topic = prefix + process.argv[2]
const db = new DB(await sdk.getBee(topic))

let input
while (true) {
    input = await question("Enter your query: ")
    if (!input) break
    input = JSON.parse(input)
    for await (const event of db.collection('events').find(input)) console.log(event)
}

function question(prompt) {
    let res
    const promise = new Promise(_res => res = _res)
    int.question(prompt, res)
    return promise
}