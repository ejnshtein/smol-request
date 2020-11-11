const { request } = require('../dist/index')

describe('smolrequest', () => {
  it('should get json', async () => {
    const { data } = await request('https://ghibliapi.herokuapp.com/films', {
      responseType: 'json'
    })

    expect(typeof data).toEqual('object')
  })

  it('should get text', async () => {
    const { data } = await request('https://bbc.com')

    expect(typeof data).toEqual('string')
  })

  it('should get buffer', async () => {
    const { data } = await request(
      'https://i.picsum.photos/id/1025/200/300.jpg',
      {
        responseType: 'buffer'
      }
    )

    expect(Buffer.isBuffer(data)).toEqual(true)
  })

  it('should get stream', async () => {
    const { data } = await request(
      'https://i.picsum.photos/id/1025/200/300.jpg',
      {
        responseType: 'stream'
      }
    )

    expect(data.readable).toEqual(true)
  })

  it('should get only headers', async () => {
    const { data, headers } = await request('https://picsum.photos/200/300', {
      responseType: 'headers'
    })

    expect(data).toEqual(null)
  })
})
