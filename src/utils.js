/**
 * Parses the body of the given request
 * @param {object} ctx context of the request
 * @param {Function} next call next middleware
 */
 async function parseBodyMiddleware(ctx, next) {
    const req = ctx.request
    
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') { 
        const contentType = req.headers['Content-Type'] ?? 'plain/text'
        const allowedContentTypes = ['application/json', 'plain/text']

        if (allowedContentTypes.includes(contentType)) {
            const data = await readData(req)
            ctx.request.body = JSON.parse(data.toString())
        }
    }
    next()
}


module.exports = {
    parseBodyMiddleware,
}
