import { URL, URLSearchParams } from 'url'

export function mergeUrl(url: string, searchParams?: unknown): string {
  const urlInst = new URL(url)
  const params = new URLSearchParams(searchParams as URLSearchParams)
  params.forEach((val, key) => urlInst.searchParams.set(key, val))
  return urlInst.toString()
}
