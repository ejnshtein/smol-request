# Smol Request

[![npm version](https://img.shields.io/npm/v/smol-request.svg?style=flat-square)](https://www.npmjs.org/package/smol-request)
[![npm downloads](https://img.shields.io/npm/smol-request.svg?style=flat-square)](http://npm-stat.com/charts.html?package=smol-request)
[![install size](https://packagephobia.now.sh/badge?p=smol-request)](https://packagephobia.now.sh/result?p=smol-request)

Small async request client for Node.js 10+ and newer with 0 dependencies.  

# Install

>npm i smol-request

## Usage

### JSON

```js
import { request }  from 'smol-request'

request('https://ghibliapi.herokuapp.com/films', { responseType: 'json' })
  .then(({ data }) => {
    console.log(`Studio Ghibli has ${response.data.length} movies out there!`)
  })
```

### Text

```js
request('https://bbc.com')
  .then(({ data }) => {
    //  bbc page is too big to log it to console, but we can save it to the drive!
    fs.promises.writeFile('./bbc.html', data)
      .then(() => {
        console.log('bbc page saved!')
      })
  })
```

### Buffer

```js
request('https://i.picsum.photos/id/1025/200/300.jpg', { responseType: 'buffer' })
  .then(({ data }) => {
    fs.promises.writeFile('./picture.jpg', data)
      .then(() => {
        console.log('picture saved!')
      })
  })
```

### Stream

```js
request('https://i.picsum.photos/id/1025/200/300.jpg', { responseType: 'stream' })
  .then(({ data }) => {
    const stream = fs.createWriteStream('./picture.jpg')

    data.pipe(stream)

    data.once('finish', () => {
      console.log('picture saved!')
    })
  })
```

### Headers

You can get only headers without parsing body from request using `responseType: 'headers'`

```js
request('https://picsum.photos/200/300', { responseType: 'headers' })
  .then(({ headers }) => {
    console.log('Picture location - ', headers.location)
  })
```

# Example

There are a few examples in `example` folder in the [repo](https://github.com/ejnshtein/smol-request/tree/master/example).

# API

`request(url[, `[options](#RequestOptions)`[, `[formData](#formData)`]]): Promise<`[Response](#RequestResult)`>`


# Types

### RequestOptions

This client uses base http/https Node.js request client, so it inherits all options from it. ([Description](https://nodejs.org/api/http.html#http_http_request_url_options_callback))

|Name|Type|Default|Description|
|-|-|-|-|
|params|`Object`|{}|URLSearchParams of request url.(Example: `{ q: 'my search query' }` becomes -> `http://myurl?q=my+search+query`)|
|responseType|`String`|`text`|One of these values: `text`, `buffer`, `json`, `stream`, `headers` |

### RequestResult

|Name|Type|Description|
|-|-|-|
|data|`ReadableStream` \| `Object` \| `String` \| `Buffer` \| `Null` | Response data with choosen type from `responseType` .|
|headers|Object| Response headers. |
|status|Number| Reponse status. |
|statusText|String| Response status text. |

### formData

If you are sending form data note that you can send form from [FormData](https://npmjs.com/package/form-data) using it's method `form.submit(path, err => {})`.
This option can be Object(then it will become string) or your custom property that will be written to request body with req.write(). ( ‾ʖ̫‾)