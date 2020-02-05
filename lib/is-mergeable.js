// Formated copy of https://github.com/TehShrike/is-mergeable-object
// Doesn't assume to be read
export default function isMergeableObject (value) {
  return isNonNullObject(value) && !isSpecial(value)
}
const isNonNullObject = value => !!value && typeof value === 'object'
const isSpecial = value => {
  const stringValue = Object.prototype.toString.call(value)
  return stringValue === '[object RegExp]' || stringValue === '[object Date]'
}
