export default (object, filterKeys) => Object.keys(object)
  .reduce(
    (acc, key) => filterKeys.includes(key)
      ? { ...acc, [key]: object[key] }
      : acc,
      {}
    )