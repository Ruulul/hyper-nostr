import goodbye from 'graceful-goodbye'
import { Low } from 'lowdb'
import { JSONFile } from 'lowdb/node'
const adapter = new JSONFile('db.json')
const default_data = []
const db = new Low(adapter, default_data)
await db.read()
goodbye(async _ => await db.write())
const events = db.data

export function handleEvent(data) {
    const event = JSON.parse(data)
    console.log({ event })
    events.push(event)
}

const filtersHandlers = {
    ids: (data, filter) => data.filter(event => filter.ids.any(id => event.id.startsWith(id))),
    kinds: (data, filter) => data.filter(event => filter.kinds.any(kind => event.kind === kind)),
    authors: (data, filter) => data.filter(event => filter.authors.any(author => event.pubkey.startsWith(author))),
    since: (data, filter) => data.filter(event => event.created_at >= filter.since),
    until: (data, filter) => data.filter(event => event.created_at <= filter.until),
    limit: (data, filter) => data.sort((a, b) => b.created_at - a.created_at).slice(0, filter.limit),
}

export function queryEvents(filters) {
    return filterOrQueryEvents(events, filters)
}

export function filterEvents(events, filters) {
    return filterOrQueryEvents(events, filters, { no_limit: true })
}

function filterOrQueryEvents(initial_data, filters, { no_limit }) {
    let merged_data = []
    for (const filter of filters) {
        let data = [...initial_data]
        for (const [key, value] of Object.entries(filter)) {
            if (no_limit && key === 'limit') continue
            data = filtersHandlers[key]?.call(data, value) || console.log('unsupported filter'), data
        }
        merged_data = [...merged_data, ...data]
    }
    return merged_data

}