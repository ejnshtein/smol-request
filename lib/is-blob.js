/**
 * Check if `obj` is a W3C `Blob` object (which `File` inherits from)
 * @param  {*} obj
 * @return {boolean}
 */
module.exports = function isBlob (obj) {
  return typeof obj === 'object' &&
      typeof obj.arrayBuffer === 'function' &&
      typeof obj.type === 'string' &&
      typeof obj.stream === 'function' &&
      typeof obj.constructor === 'function' &&
      typeof obj.constructor.name === 'string' &&
      /^(Blob|File)$/.test(obj.constructor.name) &&
      /^(Blob|File)$/.test(obj[Symbol.toStringTag])
}
