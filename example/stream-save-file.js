import { request } from '../'
import fs from 'fs'
import path from 'path'

request('https://picsum.photos/200/300', { responseType: 'headers' })
  .then(({ headers }) => request(headers.location, { responseType: 'stream' }))
  .then(({ data, headers }) => {
    const [_, fileName] =
      headers['content-disposition'].match(/filename="(\S+)"/i)
    const destination = fs.createWriteStream(
      path.resolve(process.cwd(), fileName)
    )
    data.pipe(destination)
    data.once('finish', () => {
      console.log('file saved!')
    })
  })
