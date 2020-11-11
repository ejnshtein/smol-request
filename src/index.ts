// docs: https://nodejs.org/dist/latest-v10.x/docs/api/https.html#https_https_request_url_options_callback

import fs from 'fs'
import http from 'http'
import https from 'https'
import qs from 'querystring'
import { createUnzip } from 'zlib'
import { cleanObject } from './lib/clean-object'
import { deepmerge } from './lib/deepmerge'
import { nativeClientKeys } from './lib/native-client-keys'
import { mergeUrl } from './lib/merge-url'

const pkg = JSON.parse(fs.readFileSync('./package.json', 'utf-8'))

export interface RequestOptions<
  T = 'stream' | 'text' | 'buffer' | 'json' | 'headers'
> extends http.RequestOptions {
  params?: {
    [x: string]: unknown
  }
  responseType?: T
}

export interface RequestResult<T = string> {
  data: T
  headers: {
    [x: string]: unknown
  }
  status: number
  statusText: string
}

export interface ResponseTypeMap<T = Record<string, unknown>> {
  stream: fs.ReadStream
  text: string
  buffer: Buffer
  json: T
  headers: null
}

export type ResponseType = keyof ResponseTypeMap

export function request<K, T extends ResponseType = 'text'>(
  url: string,
  options: http.RequestOptions & {
    params?: { [x: string]: unknown }
    responseType?: T
  } = {},
  formData: Record<string, unknown> | string | fs.ReadStream = null
): Promise<RequestResult<NonNullable<ResponseTypeMap<K>[T]>>> {
  const [body, dataIsObject] =
    Object.prototype.toString.call(formData) === '[object Object]'
      ? [qs.stringify(formData as qs.ParsedUrlQueryInput), true]
      : [formData, false]
  const mergedOptions: {
    [K in keyof RequestOptions]: NonNullable<RequestOptions[K]>
  }[] = [
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
    mergedOptions.push({
      headers: { 'Content-Length': Buffer.byteLength(body as string) }
    })
  }
  if (dataIsObject && typeof body === 'string') {
    mergedOptions.push({
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    })
  }
  mergedOptions.push(options)
  if (options.responseType && options.responseType === 'buffer') {
    mergedOptions.push({
      headers: { 'Content-Type': 'application/octet-stream' }
    })
  }
  const requestOptions = deepmerge(mergedOptions[0], ...mergedOptions.slice(1))
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
    const cleanRequestOptions = cleanObject(requestOptions, nativeClientKeys)
    const req = client.request(url, cleanRequestOptions)
    req.on('error', onError)
    req.on('response', onResponse)
    req.on('close', onClose)
    if (requestOptions.headers) {
      Object.entries(requestOptions.headers).forEach(([name, value]) =>
        req.setHeader(name, value)
      )
    }
    function onClose() {
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
            return reject(
              new Error(`JSON parsing error: ${e.message}: ${result.data}`)
            )
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
    function onError(err: Error) {
      req.removeListener('error', onError)
      reject(err)
    }
    function onResponse(res: http.IncomingMessage) {
      result.headers = res.headers
      result.status = res.statusCode
      result.statusText = res.statusMessage
      if (requestOptions.responseType === 'headers') {
        resolved = true
        return resolve(result)
      }
      const stream =
        ['gzip', 'compress', 'deflate'].includes(
          res.headers['content-encoding']
        ) && res.statusCode === 204
          ? res.pipe(createUnzip())
          : res
      if (requestOptions.responseType === 'stream') {
        result.data = stream
        resolved = true
        return resolve(result)
      }
      // stream.setEncoding('utf8')
      const responseData = []
      const onData = (chunk: string) => {
        responseData.push(
          requestOptions.responseType === 'buffer' ? Buffer.from(chunk) : chunk
        )
      }
      const onError = (err: Error) => {
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
    } else if (Buffer.isBuffer(body) || typeof body === 'string') {
      req.write(body)
      req.end()
    } else {
      ;(body as fs.ReadStream).pipe(req)
    }
  })
}
