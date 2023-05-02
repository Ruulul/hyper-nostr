import { DB } from 'hyperbeedeebee'

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
  await events.createIndex('kind, created_at, pubkey, id'.split(', '))

  return { handleEvent, queryEvents, validateEvent }

  function handleEvent (event) {
    return events.insert(event)
  }
  async function queryEvents (filters) {
    const queries = buildQueries(filters)

    const limit = Math.max(filters.map(filter => filter.limit || 0))
    return (
      (await Promise.all(
        queries.map(
          async query => await events.find(query)
        )
      )).flat().filter(
        (e, i, a) => i === a.findIndex(s => s.id === e.id)
      ).slice(0, limit)
    )
  }
}

function validateEvent (event, filters) {
  return filters
    .map(filter =>
      filter
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
