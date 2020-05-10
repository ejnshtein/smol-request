// docs: https://nodejs.org/dist/latest-v10.x/docs/api/https.html#https_https_request_url_options_callback
const qs = require('querystring')
const https = require('https')
const http = require('http')
const fs = require('fs')
const { createUnzip } = require('zlib')
const { cleanObject, mergeUrl, isBlob, deepmerge } = require('./lib')
const pkg = JSON.parse(fs.readFileSync('./package.json'))
const nativeRequestKeys = ['agent', 'auth', 'createConnection', 'defaultPort', 'family', 'headers', 'host', 'hostname', 'insecureHTTPParser', 'localAddress', 'lookup', 'maxHeaderSize', 'method', 'path', 'port', 'protocol', 'setHost', 'socketPath', 'timeout']

module.exports = function smolrequest (url, options = {}, formData = null) {
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
  const requestOptions = deepmerge(...mergedOptions)
  if (requestOptions.params && typeof requestOptions.params === 'object') {
    url = mergeUrl(url, requestOptions.params)
  }
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http
    let resolved = false
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
      if (resolved) {
        return
      }
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
        resolved = true
        return resolve(result)
      }
      const stream = ['gzip', 'compress', 'deflate'].includes(res.headers['content-encoding']) && res.statusCode === 204
        ? res.pipe(createUnzip())
        : res
      if (requestOptions.responseType === 'stream') {
        result.data = stream
        resolved = true
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
    if (body === null || !body) {
      req.end()
    } else if (isBlob(body)) {
      body.stream().pipe(req)
    } else if (Buffer.isBuffer(body) || typeof body === 'string') {
      req.write(body)
      req.end()
    } else {
      body.pipe(req)
    }
  })
}
