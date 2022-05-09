/**
 * Returns the function which would be called only once and then persist the result
 * @param {Function} fn function to be called only once
 * @returns {Function} function which would be called only once and then persist the result
 */
function once(fn) {
    let called = false;
    let result;
    return function (...args) {
        if (!called) {
            result = fn.apply(this, args);
            called = true;
        }
        return result;
    }
}

/**
 * Returns reversed string
 * @param {string} str string to be reversed
 * @returns {string} reversed string
 */
function reverse(str)
{
    let result = ''

    for (let i = str.length - 1; i >= 0; i--)
        result += str[i]

    return result
}

/**
 * Returns string with first char removed
 * @param {string} str string to be trimmed
 * @param {string} char char to be removed
 * @returns {string} string with first char removed
 */
function trimStart(str, char = ' ')
{
    let result = ''

    for (let i = 0; i < str.length; i++)
    {
        if (str[i] !== char)
        {
            result = str.slice(i)
            break
        }
    }

    return result
}

/**
 * Returns string with last char removed
 * @param {string} str string to be trimmed
 * @param {string} char char to be removed
 * @returns {string} string with last char removed
 */
const trimEnd = (str, char = ' ') => reverse(trimStart(reverse(str), char))

/**
 * Returns string with first and last char removed
 * @param {string} str string to be trimmed
 * @param {string} char char to be removed
 * @returns {string} string with first and last char removed
 */
const trim = (str, char = '') => trimEnd(trimStart(str, char), char)

/**
 * Returns a generator which iterates over the given middleware
 * @param {Array<Function|Array<Function>>} middleware middleware to be iterated over
 * @returns {Promise<Generator>} generator which iterates over the given middleware
 */
async function* createMiddlewareGenerator(middleware) {
    let finished = false
    const next = () => {
        finished = false
    }

    for (const fn of middleware) {
        if (Array.isArray(fn)) {
            yield* await createMiddlewareGenerator(fn)
        } else {
            finished = true
            const res = yield fn(next)
            if (res instanceof Promise) {
                await res
            }
            if (finished) {
                return
            }
        }
    }
}

/**
 * Adds next parameter to the given middleware
 * @param {Array<Function|Array<Function>>} middleware middleware to be added next parameter
 * @returns {Array<Function|Array<Function>>} middleware with next parameter
 */
function applyNext(middleware) {
    if (Array.isArray(middleware)) {
        return middleware.map(applyNext)
    } else {
        return next => (...args) => middleware.apply(this, args.concat(next))
    }
}

/**
 * Sends a response with the given status code and body
 * @param {Response} response response to be sent
 * @param {number} statusCode status code to be sent
 * @param {any} body body to be sent
 */
function sendResponse(response, body, status = 200) {
    let json
    try {
        json = JSON.stringify(body)
        response.statusCode = 200
    } catch (error) {
        console.error(`Failed to stringify body: ${error}`)
        response.statusCode = 500
        json = `{"error": "${error.message}"}`
    }
    
    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
    })
    response.end(json)
}

/**
 * Returns the data of the given request
 * @param {IncomingMessage} request request to be read
 * @returns {Promise<Buffer>} data of the given request
 */
function readData(request) {
    return new Promise((resolve, reject) => {
        const data = []
        request.on('data', (chunk) => {
            data.push(chunk)
        })
        request.on('error', (error) => {
            reject(error)
        })
        request.on('end', () => {
            resolve(Buffer.concat(data))
        })
    })
}
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
    once,
    reverse,
    trimStart,
    trimEnd,
    trim,
    createMiddlewareGenerator,
    applyNext,
    sendResponse,
    parseBodyMiddleware,
}
