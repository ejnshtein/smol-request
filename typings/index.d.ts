import { Readable } from 'stream'
import http from 'http'
import qs from 'querystring'

export interface RequestOptions extends http.RequestOptions {
  params?: URLSearchParams
  responseType?: 'stream' | 'text' | 'buffer' | 'json' | 'headers'
}

export interface RequestResult {
  data: Readable | Object | String | Buffer | Null
  headers: Headers
  status: Number
  statusText: String
}

type Request = (
  url: string,
  options: RequestOptions,
  formData: qs.ParsedUrlQueryInput
) => Promise<RequestResult>

const request: Request

export default request