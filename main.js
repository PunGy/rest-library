const RestLib = require('./rest.js')
const utils = require('./utils.js')

const app = new RestLib()

app.use(utils.parseBodyMiddleware)

app.use((ctx, next) => {
    ctx.request.user = ctx.request.body?.user
    next()
})

app.get('/', (ctx, next) => {
    ctx.response.send({ message: 'Hello World' })
    next()
})

const list = []
app.get('/list', (ctx, next) => {
    ctx.response.list = list.map(item => item ** 2)
    next()
})
app.get('/list', (ctx, next) => {
    ctx.response.send({ data: ctx.response.list })
    next()
})
app.post('/list', utils.onlyAuthorizedMiddleware, (ctx, next) => {
    list.push(ctx.request.body.data)
    ctx.response.send({ data: list })
    next()
})

app.use((ctx, next) => {
    const { method, url } = ctx.request
    console.log(`${method}: ${url}`)
    next()
})

app.listen(3000, () => {
    console.log('Server started on port 3000')
})
