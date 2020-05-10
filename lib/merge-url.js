module.exports = function mergeUrl (url, searchParams) {
  const urlInst = new URL(url)
  const params = new URLSearchParams(searchParams)
  params.forEach((val, key) => urlInst.searchParams.set(key, val))
  return urlInst.toString()
}
