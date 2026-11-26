// Node drafts are JSON wire data. Serialization also unwraps nested Vue proxies
// and omits undefined fields, which structuredClone cannot do for these drafts.
export function clone<T>(value: T): T {
  const serialized = JSON.stringify(value)
  return JSON.parse(serialized)
}
