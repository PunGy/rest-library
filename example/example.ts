import RestLib from '../src/rest.js'
import { parseBodyMiddleware, Context, NextFn, BodyJSONParameter } from '../src/utils.js'

type AppContext = Context<BodyJSONParameter>

const onlyAuthorizedMiddleware = (ctx: Context<{ user: string; }>, next: NextFn) => {
    if (ctx.user) {
        next()
    } else {
        ctx.response.send({ error: 'Unauthorized' }, 401)
    }
}

const ROOT_DIR = process.cwd()

const app = new RestLib()

app.use(parseBodyMiddleware)

app.use((ctx, next) => {
    const { queryParams } = ctx.request
    ctx.user = ctx.request.queryParams ? { name: queryParams.name } : null
    next()
})

app.use((ctx, next) => {
    const { method, url } = ctx.request
    console.log(`${method}: ${url}`)
    next()
})

// All POST requests should be authorized
app.post('/*', onlyAuthorizedMiddleware)

app.all('/list/*', (ctx, next) => {
    console.log(`Operation with the list was requested by ${ctx.user ? ctx.user.name : 'anonymous'}`)
    next()
})

app.get('/', (ctx) => {
    ctx.response.send({ message: 'Hello World' })
})

app.get('/file/:file', (ctx) => {
    const { file } = ctx.request.params
    ctx.response.sendFile(`${ROOT_DIR}/${file}`)
})

const list = []

// This two listeners is equal to app.get('/list', listener1, listener2)
app.get('/list', (ctx, next) => {
    ctx.list = list.map(item => item ** 2)
    next()
})
app.get('/list', (ctx) => {
    ctx.response.send({ data: ctx.list })
})

app.get('/list/:id', (ctx) => {
    ctx.response.send({ data: list[ctx.request.params.id] })
})

/**
 * Example of request:
 *
 * URL: http://localhost:3000/list?name="John"
 * BODY: { "data": 10 }
 */
app.post('/list', (ctx, next) => {
    list.push(ctx.request.body.data)
    ctx.response.send({ data: list })
    next()
}, (ctx) => {
    console.log(`The element ${ctx.request.body.data} was added to the list`)
})

app.put('/list', onlyAuthorizedMiddleware, (ctx, next) => {
    list.push(ctx.request.body.data)
    ctx.response.send({ data: list })
    next()
})

app.listen(3000, () => {
    console.log('Server started on port 3000')
})
