// docs: https://nodejs.org/dist/latest-v10.x/docs/api/https.html#https_https_request_url_options_callback
import qs from 'querystring'
import https from 'https'
import http from 'http'
import fs from 'fs'
import { cleanObject, mergeUrl, deepmerge } from './lib/index.js'
const pkg = JSON.parse(fs.readFileSync('./package.json'))
const nativeRequestKeys = ['protocol', 'host', 'hostname', 'family', 'port', 'localAddres', 'socketPath', 'method', 'path', 'auth', 'agent', 'createConnection', 'timeout']

export default function smolrequest (url, options = {}, formData) {
  const [data, dataIsObject] = Object.prototype.toString.call(formData) === '[object Object]' ? [qs.stringify(formData), true] : [formData, false]
  const mergedOptions = [
    {
      method: 'GET',
      responseType: 'text',
      headers: { 'User-Agent': `smol-request/${pkg.version}` }
    }
  ]
  if (dataIsObject && data) {
    mergedOptions.push(
      { headers: { 'Content-Length': Buffer.byteLength(data) } }
    )
  }
  mergedOptions.push(options)
  if (options.responseType && options.responseType === 'buffer') {
    mergedOptions.push(
      { headers: { 'Content-Type': 'application/octet-stream' } }
    )
  }
  const requestOptions = deepmerge(mergedOptions)
  if (requestOptions.params && typeof requestOptions.params === 'object') {
    url = mergeUrl(url, requestOptions.params)
  }
  return new Promise((resolve, reject) => {
    function resHandler (res) {
      const result = {
        data: null,
        headers: res.headers,
        status: res.statusCode,
        statusText: res.statusMessage
      }
      if (requestOptions.responseType === 'headers') {
        return resolve(result)
      }
      if (requestOptions.responseType === 'stream') {
        result.data = res
        return resolve(result)
      }
      res.setEncoding('utf8')
      const reponseData = []
      const onData = chunk => {
        reponseData.push(chunk)
      }
      const onError = err => {
        res.removeListener('error', onError)
        res.removeListener('data', onData)
        reject(err)
      }
      const onClose = () => {
        res.removeListener('error', onError)
        res.removeListener('data', onData)
        res.removeListener('close', onClose)
        if (requestOptions.responseType === 'buffer') {
          result.data = Buffer.concat(reponseData)
        } else if (requestOptions.responseType === 'json') {
          try {
            result.data = JSON.parse(reponseData)
          } catch (e) {
            return reject(new Error(`JSON parsing error: ${e.message}: ${reponseData}`))
          }
        } else {
          result.data = reponseData.join('')
        }
        resolve(result)
      }
      res.on('data', onData)
      res.on('error', onError)
      res.on('close', onClose)
    }
    const client = url.startsWith('https') ? https : http
    const req = client.request(
      url,
      cleanObject(requestOptions, nativeRequestKeys),
      resHandler
    )
    if (requestOptions.headers) {
      Object.entries(requestOptions.headers)
        .forEach(([name, value]) => req.setHeader(name, value))
    }
    const onError = err => {
      req.removeListener('error', onError)
      reject(err)
    }
    req.on('error', onError)
    if (data) { req.write(data) }
    req.end()
  })
}
