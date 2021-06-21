import request from '../'
import fs from 'fs'
import path from 'path'

request('https://picsum.photos/200/300', { responseType: 'headers' })
  .then(({ headers }) => request(headers.location, { responseType: 'buffer' }))
  .then(({ data, headers }) => {
    const [_, fileName] =
      headers['content-disposition'].match(/filename="(\S+)"/i)
    const destinationPath = path.resolve(process.cwd(), fileName)
    fs.writeFile(destinationPath, data, (err) => {
      console.log(err || 'file saved!')
    })
  })
