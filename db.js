import { DB } from 'hyperdeebee'

const defaultLimit = Infinity

const filtersHandlers = {
  ids: filter => ['id', { $in: filter }],
  kinds: filter => ['kind', { $in: filter }],
  authors: filter => ['pubkey', { $gte: { $in: filter } }],
  hastag: (filter, tag) => ['tags', { $all: [tag.slice(1), ...filter] }],
  since: filter => ['created_at', { $gt: filter }],
  until: filter => ['created_at', { $lt: filter }]
}
const validateHandlers = {
  ids: (event, filter) => filter.some(id => event.id.startsWith(id)),
  kinds: (event, filter) => filter.includes(event.kind),
  authors: (event, filter) => filter.some(author => event.pubkey.startsWith(author)),
  hastag: (event, filter, tag) => event.tags.some(([_tag, key]) => _tag === tag.slice(1) && filter.includes(key)),
  since: (event, filter) => event.created_at > filter,
  until: (event, filter) => event.created_at < filter
}
export default async function createDB (bee) {
  const db = new DB(bee)

  const events = db.collection('events')

  await events.createIndex(['kind'])
  await events.createIndex(['pubkey'])
  await events.createIndex(['created_at'])
  await events.createIndex(['id'])
  await events.createIndex(['pubkey', 'kind'])
  await events.createIndex(['pubkey', 'created_at'])
  await events.createIndex(['kind', 'pubkey'])
  await events.createIndex(['kind', 'created_at'])

  return { handleEvent, queryEvents, validateEvent }

  function handleEvent (event, type) {
    if (type === 'regular') events.insert(event)
    else if (type === 'replaceable') {
      events.update({
        pubkey: event.pubkey,
        kind: event.kind
      }, event)
    } else throw new Error('Unrecognized event kind: ' + type)
  }
  async function queryEvents (filters) {
    if (!filters ||
      filters
        .filter(filter => Object.keys(filter).length)
        .length === 0) return await events.find({})
    const queries = buildQueries(filters)

    const limit = Math.max(filters.map(filter => filter.limit || 0))
    const queryResult = new Map()
    for (const query of queries) {
      for await (const doc of events.find(query).sort('created_at', -1)) {
        queryResult.set(doc.id, doc)
      }
    }
    return Array.from(queryResult.values()).slice(0, limit > 0 ? limit : defaultLimit)
  }
}

function validateEvent (event, filters) {
  return filters
    .map(filter =>
      Object.entries(filter)
        .filter(([key]) => key.startsWith('#') || (key in filtersHandlers && key !== 'limit'))
        .map(([key, value]) =>
          key.startsWith('#')
            ? validateHandlers.hastag(event, value, key)
            : validateHandlers[key](event, value)
        )
        .every(Boolean)
    )
    .some(Boolean)
}

function buildQueries (filters) {
  return filters.map(filter =>
    Object.fromEntries(
      Object.entries(filter)
        .filter(([key]) => key.startsWith('#') || key in filtersHandlers)
        .reduce((entries, [key, filter]) => {
          key.startsWith('#')
            ? entries
              .find(([key]) => key === 'tags')
              ?.[1].$all.push(
                ...filtersHandlers.hastag(filter, key)[1].$all
              ) || entries.push(filtersHandlers.hastag(filter, key))
            : entries.push(filtersHandlers[key](filter))
          return entries
        },
        [])
    )
  )
}
