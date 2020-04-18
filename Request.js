// docs: https://nodejs.org/dist/latest-v10.x/docs/api/https.html#https_https_request_url_options_callback
import qs from 'querystring'
import https from 'https'
import http from 'http'
import fs from 'fs'
import { createUnzip } from 'zlib'
import { cleanObject, mergeUrl, deepmerge, isBlob } from './lib/index.js'
const pkg = JSON.parse(fs.readFileSync('./package.json'))
const nativeRequestKeys = ['agent', 'auth', 'createConnection', 'defaultPort', 'family', 'headers', 'host', 'hostname', 'insecureHTTPParser', 'localAddress', 'lookup', 'maxHeaderSize', 'method', 'path', 'port', 'protocol', 'setHost', 'socketPath', 'timeout']

export default function smolrequest (url, options = {}, formData = null) {
  const [body, dataIsObject] = Object.prototype.toString.call(formData) === '[object Object]' ? [qs.stringify(formData), true] : [formData, false]
  const mergedOptions = [
    {
      method: 'GET',
      responseType: 'text',
      headers: {
        'User-Agent': `smol-request/${pkg.version}`,
        Accept: '*/*'
      }
    }
  ]
  if (dataIsObject && body) {
    mergedOptions.push(
      { headers: { 'Content-Length': Buffer.byteLength(body) } }
    )
  }
  if (dataIsObject && typeof body === 'string') {
    mergedOptions.push({
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
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
    const client = url.startsWith('https') ? https : http
    const result = {
      data: null,
      headers: null,
      status: null,
      statusText: null
    }
    const cleanRequestOptions = cleanObject(requestOptions, nativeRequestKeys)
    const req = client.request(
      url,
      cleanRequestOptions
    )
    req.on('error', onError)
    req.on('response', onResponse)
    req.on('close', onClose)
    if (requestOptions.headers) {
      Object.entries(requestOptions.headers)
        .forEach(([name, value]) => req.setHeader(name, value))
    }
    function onClose () {
      switch (requestOptions.responseType) {
        case 'buffer': {
          result.data = Buffer.concat(result.data)
          break
        }
        case 'json': {
          try {
            result.data = JSON.parse(result.data.join(''))
          } catch (e) {
            return reject(new Error(`JSON parsing error: ${e.message}: ${result.data}`))
          }
          break
        }
        default: {
          result.data = result.data.join('')
          break
        }
      }
      resolve(result)
    }
    function onError (err) {
      req.removeListener('error', onError)
      reject(err)
    }
    function onResponse (res) {
      result.headers = res.headers
      result.status = res.statusCode
      result.statusText = res.statusMessage
      if (requestOptions.responseType === 'headers') {
        return resolve(result)
      }
      const stream = ['gzip', 'compress', 'deflate'].includes(res.headers['content-encoding']) && res.statusCode === 204
        ? res.pipe(createUnzip())
        : res
      if (requestOptions.responseType === 'stream') {
        result.data = stream
        return resolve(result)
      }
      // stream.setEncoding('utf8')
      const responseData = []
      const onData = chunk => { responseData.push(requestOptions.responseType === 'buffer' ? Buffer.from(chunk) : chunk) }
      const onError = err => {
        stream.removeListener('error', onError)
        stream.removeListener('data', onData)
        reject(err)
      }
      const onRequestEnd = () => {
        stream.removeListener('error', onError)
        stream.removeListener('data', onData)
        stream.removeListener('end', onRequestEnd)
        result.data = responseData
      }
      stream.on('data', onData)
      stream.on('error', onError)
      stream.on('end', onRequestEnd)
    }
    if (body === null) {
      // body is null
      req.end()
    } else if (isBlob(body)) {
      body.stream().pipe(req)
    } else if (Buffer.isBuffer(body) || typeof body === 'string') {
      // body is buffer
      req.write(body)
      req.end()
    } else {
      // body is stream
      body.pipe(req)
    }
  })
}
