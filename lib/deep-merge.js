// Formated copy of https://github.com/TehShrike/deepmerge
// Doesn't assume to be read
import defaultIsMergeableObject from './is-mergeable.js'
const emptyTarget = val => Array.isArray(val) ? [] : {}
const cloneUnlessOtherwiseSpecified = (value, options) => (options.clone !== false && options.isMergeableObject(value))
  ? deepmerge(emptyTarget(value), value, options)
  : value
const defaultArrayMerge = (target, source, options) => target.concat(source).map(element => cloneUnlessOtherwiseSpecified(element, options))
const getMergeFunction = (key, options) => {
  if (!options.customMerge) {
    return deepmerge
  }
  const customMerge = options.customMerge(key)
  return typeof customMerge === 'function' ? customMerge : deepmerge
}
function getEnumerableOwnPropertySymbols (target) {
  return Object.getOwnPropertySymbols
    ? Object.getOwnPropertySymbols(target).filter(symbol => target.propertyIsEnumerable(symbol))
    : []
}
const getKeys = target => Object.keys(target).concat(getEnumerableOwnPropertySymbols(target))
function propertyIsOnObject (object, property) {
  try {
    return property in object
  } catch (_) {
    return false
  }
}
const propertyIsUnsafe = (target, key) => propertyIsOnObject(target, key) && !(Object.hasOwnProperty.call(target, key) && Object.propertyIsEnumerable.call(target, key))
const mergeObject = (target, source, options) => {
  const destination = {}
  if (options.isMergeableObject(target)) {
    getKeys(target).forEach(key => {
      destination[key] = cloneUnlessOtherwiseSpecified(target[key], options)
    })
  }
  getKeys(source).forEach(key => {
    if (propertyIsUnsafe(target, key)) {
      return
    }
    if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
      destination[key] = getMergeFunction(key, options)(target[key], source[key], options)
    } else {
      destination[key] = cloneUnlessOtherwiseSpecified(source[key], options)
    }
  })
  return destination
}

function deepmerge (target, source, options = {}) {
  options.arrayMerge = options.arrayMerge || defaultArrayMerge
  options.isMergeableObject = options.isMergeableObject || defaultIsMergeableObject
  options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified

  const sourceIsArray = Array.isArray(source)
  const targetIsArray = Array.isArray(target)
  const sourceAndTargetTypesMatch = sourceIsArray === targetIsArray

  if (!sourceAndTargetTypesMatch) {
    return cloneUnlessOtherwiseSpecified(source, options)
  } else if (sourceIsArray) {
    return options.arrayMerge(target, source, options)
  } else {
    return mergeObject(target, source, options)
  }
}
export default function deepmergeAll (array, options) {
  if (!Array.isArray(array)) {
    throw new Error('first argument should be an array')
  }

  return array.reduce((prev, next) => deepmerge(prev, next, options), {})
}
