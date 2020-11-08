export function cleanObject<T = Record<string, unknown>>(
  object: T & Record<string, unknown>,
  filterKeys: string[]
): T | Record<string, unknown> {
  return Object.keys(object).reduce(
    (acc, key) =>
      filterKeys.includes(key)
        ? Object.assign(acc, { [key]: object[key] })
        : acc,
    {}
  )
}
