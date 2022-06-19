const { readData } = require('./helpers')

async function parseBodyMiddleware(ctx, next) {
    const req = ctx.request
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') { 
        const contentType = req.headers['content-type'] ?? 'plain/text'

        if (contentType === 'application/json') {
            const data = (await readData(req)).toString()
            ctx.request.body = data === '' ? {} : JSON.parse(data.toString())
        } else if (contentType === 'plain/text') {
            const data = await readData(req)
            ctx.request.body = data.toString()
        }
    }
    next()
}

module.exports = {
    parseBodyMiddleware,
}
