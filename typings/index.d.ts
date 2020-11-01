import { Readable } from 'stream'
import http from 'http'
import qs from 'querystring'

export interface RequestOptions extends http.RequestOptions {
  params?: {
    [x: string]: string
  }
  responseType?: 'stream' | 'text' | 'buffer' | 'json' | 'headers'
}

export interface RequestResult {
  data: Readable | Object | String | Buffer | null
  headers: Headers
  status: Number
  statusText: String
}

type Request = (
  url: string,
  options?: RequestOptions,
  formData?: qs.ParsedUrlQueryInput | string
) => Promise<RequestResult>

export const request: Request

export default request