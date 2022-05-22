# REST library

[![npm](https://img.shields.io/npm/dt/rest-library.svg)](https://www.npmjs.com/package/rest-library) [![npm](https://img.shields.io/npm/v/rest-library.svg)](https://www.npmjs.com/package/rest-library)
[![npm](https://img.shields.io/bundlephobia/min/rest-library)](https://bundlephobia.com/result?p=rest-library) [![node-current](https://img.shields.io/node/v/rest-library)](https://www.npmjs.com/package/rest-library)

This is the small library for creating REST applications with express-like middleware.

## Installation

Library can be install via package manager like npm or yarn

```shell
yarn add rest-library
```

or

```shell
npm install rest-library
```

## Example

You can see full example in [example.mjs](https://github.com/PunGy/rest-library/blob/main/example.mjs) file

All available methods of RestLibrary you can see here <https://pungy.github.io/rest-library/classes/rest.RestLib.html>

Here's another one. Checking is there are a file on the server

```js
const rest = require('rest-library')
const { access } = require('node:fs/promises')

// Creating new instance of rest library
const app = new rest()

// Assigning middleware which would be called at every request
app.use((ctx, next) => { 
    console.log(`${ctx.request.method}: ${ctx.request.url}`)
    next()
})

// Assigning on method GET with url '/' listener, which is responds with hello world message
app.get('/', (ctx) => {
    ctx.response.send('Hello world')
})

/**
 * Assigning on method GET with url /file with parameter :file two listeners
 * First one is async and checks is there are a file on the server. Then writes it in the context
 * Second one is sending to the client a message is file exists or not, depends on parameter from the context
 */
app.get(
    '/file/:file', 
    async (ctx, next) => {
        ctx.fileExists = await (access(ctx.request.params.file).then(() => true).catch(() => false))
        next()
    },
    (ctx) => {
        ctx.response.send(`File ${ctx.request.params.file} is ${ctx.fileExists ? 'exists' : 'not exists'} on the server`)
    }
)

app.listen(3000, () => console.log('Server started on port 3000'))
```

## API

You can see full documentation on this page: <https://pungy.github.io/rest-library/>

## Utils

This library also contain `utils` module, from where you currently can pick the [body parser middleware](https://pungy.github.io/rest-library/modules/utils.html#parseBodyMiddleware). For now it's only works with such Content-Types as `application/json` and `plain/text`.

Here are the full list of functions and types <https://pungy.github.io/rest-library/modules/utils.html>

```js
const rest = require('rest-library')
const { parseBodyMiddleware } = require('rest-library/utils.js')
const app = new rest()

app.use(parseBodyMiddleware)

app.post('/post', (ctx) => {
    ctx.response.send(ctx.request.body)
})

app.listen(3000)
```

### Creating a listener

For creating a listener, you should use library instance, add call appropriate method for the desired HTTP method, or `all` (in this case listeners would be assigned on all methods). The first parameter is the path, and other parameters is the list of listeners.

Example:

```js
app.all('/')
app.get('/some/path', listener1, listener2)
app.post('/another/path', listener1, listener2)
```

### Path

The path could have a parameters and patterns. For example, if path of listener is `/post/:id` and the request url is `/post/10`, the **context.request,params** would be an object `{ id: '10' }`.

You may also use asterisk in the path for eager evaluation. Here's an example what would be matched in this case.

```js
/**
 * /file/1 - matched
 * /file/1/2 - matched
 * /file/1/2/3 - matched
 */
app.get('/file/*')

/**
 * When the last path entry is not the asterisk - it's working the same as with parameters, but skipping writing into request.params
 * /file/1/min - matched
 * /file/1/2/min - not matched
 * /file/1 - not matched
 * /file/1/min/max - not matched
 */
app.get('/file/*/min')

/**
 * /file/1/2/min - matched
 * /file/1/min - not matched
 * /file/1/2/3/min - not matched
 */
app.get('/file/*/*/min')

/**
 * You also can combine these parameters
 * /file/directory/1/2/min - matched (params: { file1: '1', file2: '2' })
 */
app.get('/file/*/:file1/:file2/min')
```

### Context

The [context](https://pungy.github.io/rest-library/modules/utils.html#Context) argument in the listener by default contains two parameters:

* request - is the base IncomingMessage with few   additional parameter
  * **query** - query(what is after `?` in the url) parameters string. By default is empty string
  * **queryParams** - parsed query parameters object. By default is empty object
  * **params** - parameters object from the url. By default is empty object
* response - is the base ServerResponse with one additional parameter
  * **send** - function, where first parameter is the response body, and the second is optional response state (by default is 200)

### Next

Next is the second parameter in the listener. If it was called, the next middleware in the queue would be called.

### Middleware order

Listeners would be called in the order as they was assigned, and the last one would be the middleware, which is not called the `next` function (or was just the last one)

### Special handlers

You also can set custom error and 404 handler via `app.error` and `app.notFound`

* [app.error](https://pungy.github.io/rest-library/classes/rest.RestLib.html#error) - sets error handler which is called when during the execution of listeners an unhandled error was occurred.
* [app.notFound](https://pungy.github.io/rest-library/classes/rest.RestLib.html#notFound) - sets 404 handler which is called when the request url path was not matched with any of registered listeners
