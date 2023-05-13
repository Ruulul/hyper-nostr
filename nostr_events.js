import { validateEvent as nostrValidate, verifySignature as nostrVerify } from 'nostr-tools'

export const persistentKinds = Object.freeze(['regular', 'delete', 'replaceable', 'parameterized replaceable'])
const replaceableKinds = Object.freeze([0, 3])
export function getEventType (kind) {
  if (kind === 5) return 'delete'
  if (replaceableKinds.includes(kind)) return 'replaceable'
  if (kind < 10000) return 'regular'
  if (kind < 20000) return 'replaceable'
  if (kind < 30000) return 'ephemeral'
  if (kind < 40000) return 'parameterized replaceable'
}
export function isPersistent (event) {
  return persistentKinds.includes(getEventType(event.kind))
}

const validateHandlers = {
  ids: (event, filter) => filter.some(id => event.id.startsWith(id)),
  kinds: (event, filter) => filter.includes(event.kind),
  authors: (event, filter) => filter.some(author => event.pubkey.startsWith(author)),
  hastag: (event, filter, tag) => event.tags.some(([_tag, key]) => _tag === tag.slice(1) && filter.includes(key)),
  since: (event, filter) => event.created_at > filter,
  until: (event, filter) => event.created_at < filter
}
export function validateEvent (event, filters) {
  return nostrValidate(event) &&
  nostrVerify(event) &&
  filters
    ? filters.map(filter =>
      Object.entries(filter)
        .filter(([key]) => key.startsWith('#') || (key in validateEvent && key !== 'limit'))
        .map(([key, value]) =>
          key.startsWith('#')
            ? validateHandlers.hastag(event, value, key)
            : validateHandlers[key](event, value)
        )
        .every(Boolean)
    ).some(Boolean)
    : true
}
