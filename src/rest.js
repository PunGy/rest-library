const http = require('http')
const helpers = require('./helpers')

/**
 * Class for handling REST http requests
 */
class RestLib {
    /**
     * The array of middleware, where middleware is a function that takes a context and next caller.
     * It also can be a array of middleware. It means that it's a listener of some request. It will be called iną order.
     * @type {Array<import('./utils').Middleware>}
     * @private
     */
    #middleware

    /**
     * Map of listeners, where key is method and value is the Map, where key is the path and value is the listener.
     * Actually an array of listeners, chain of middleware. It would be used in the middleware array
     * @type {Map<string, Map<string, Array<import('./utils').Listener>>>}
    */
    #listeners

    /**
     * The server instance.
     * @type {http.Server}
     * @private
     */
    #server

    /**
     * Optional function to be called when application falls with unhandled error.
     */
    #errorHandler

    /**
     * Optional function to be called when appropriate listener is not found.
     */
    #notFoundHandler

    constructor() {
        this.#server = http.createServer(this.#handleRequest.bind(this))
        this.#middleware = []
        this.#listeners = new Map([
            ['GET', new Map()],
            ['POST', new Map()],
            ['PUT', new Map()],
            ['DELETE', new Map()],
            ['PATCH', new Map()],
        ])
    }

    listen(port, callback) {
        this.#server.listen(port, callback)
        
        return this
    }

    use(middleware) {
        this.#registerMiddleware(middleware)

        return this
    }

    get(path, ...listeners) {
        return this.#registerMethod('GET', path, listeners)
    }
    post(path, ...listeners) {
        return this.#registerMethod('POST', path, listeners)
    }
    put(path, ...listeners) {
        return this.#registerMethod('PUT', path, listeners)
    }
    delete(path, ...listeners) {
        return this.#registerMethod('DELETE', path, listeners)
    }
    patch(path, ...listeners) {
        return this.#registerMethod('PATCH', path, listeners)
    }
    all(path, ...listeners) {
        for (const method of this.#listeners.keys()) {
            this.#registerListener(method, path, listeners)
        }
        this.#registerMiddleware(listeners)

        return this
    }

    error(handler) {
        this.#errorHandler = handler
    }

    notFound(handler) {
        this.#notFoundHandler = handler
    }

    /**
     * Registers a listeners on requesting specific method and path.
     * @param {string} method The method to listen on.
     * @param {string} path The path to listen on.
     * @param {Array<import('./utils').Listener>} listeners The listeners to add.
     * @returns {RestLib} The instance.
     * @private
     * @throws {Error} If the method is not supported.
     */
    #registerMethod(method, path, listeners) {
        if (!this.#listeners.has(method)) {
            throw new Error(`Method ${method} is not supported.`)
        }
        this.#registerListener(method, path, listeners)
        this.#registerMiddleware(listeners)

        return this
    }

    async #iterateOverMiddleware(ctx, middleware) {
        const middlewareGenerator = helpers.createMiddlewareGenerator(middleware.map(helpers.applyNext))

        for (const fn of middlewareGenerator) {
            try {
                await fn(ctx)
            } catch (error) {
                if (this.#errorHandler) {
                    this.#errorHandler(ctx, error)
                } else {
                    ctx.response.statusCode = 500
                    ctx.response.end(`{ "error": "${error.message}" }`)
                }
                return
            }
        }
    }

    /**
     * Handles a request.
     * @param {http.IncomingMessage} request The request.
     * @param {http.ServerResponse} response The response.
     * @private
     */
    async #handleRequest(request, response) {
        const { method, url } = request

        const [path, query] = url.split('?')

        response.send = helpers.sendResponse.bind(this, response)
        request.query = query ?? ''
        request.queryParams = request.query.length > 0 ? helpers.parseQuery(query) : {}

        const context = {
            request,
            response,
        }
        
        if (this.#listeners.has(method)) {
            const methodListeners = this.#listeners.get(method)
            const pathEntries = helpers.trim(path, '/').split('/')

            // Find the listener for the path
            // If there would be a parameters, it will be added to the context
            // @type {Array<[string, Array<Function>]>}
            const pathListenersEntry = Array.from(methodListeners.entries()).filter(([path]) => {
                const listenerPathEntries = helpers.trim(path, '/').split('/')

                /**
                 * If the path is longer than the listener path, it can't be a match
                 * But if path includes asterisk, it can be a match
                 */
                if (pathEntries.length !== listenerPathEntries.length && !path.includes('*')) {
                    return false
                }

                let params = {}

                const isMatched = listenerPathEntries.every((listenerPathEntry, index) => {
                    if (index === 0) params = {}
                    const requestPathEntry = pathEntries[index]

                    if (listenerPathEntry.startsWith(':')) {
                        params[listenerPathEntry.substring(1)] = requestPathEntry
                        return true
                    } else if (listenerPathEntry === '*') {
                        return true
                    } else {
                        return listenerPathEntry === requestPathEntry
                    }
                })
                if (isMatched) {
                    context.request.params = params
                }
                
                return isMatched
            })

            if (pathListenersEntry.length > 0) {
                // An array of middleware functions
                const pathListeners = pathListenersEntry.map(entry => entry[1])

                // Left only generic middleware and matched for the path
                const middleware = this.#middleware.filter(middleware => {
                    if (Array.isArray(middleware)) {
                        return pathListeners.some(listener => listener === middleware)
                    }
                    return true
                })
                
                await this.#iterateOverMiddleware(context, middleware)
            } else {
                if (this.#notFoundHandler) {
                    this.#notFoundHandler(context)
                } else {
                    response.statusCode = 404
                    response.end(`{ "error": "Not found" }`)
                }
            }
        } else if (method === 'OPTIONS' || method === 'HEAD') {
            response.statusCode = 200
            const middleware = this.#middleware
                .filter(middleware => !Array.isArray(middleware))
            
            await this.#iterateOverMiddleware(context, middleware)
            
            response.end()
        }
    }

    /**
     * Registers a listener for a specific method and path.
     * @param {string} method The method.
     * @param {string} path The path.
     * @param {Array<import('./utils').Listener>} listeners The listeners.
     * @private
     */
    #registerListener(method, path, listeners) {
        const methodListeners = this.#listeners.get(method)
        if (methodListeners.has(path)) {
            methodListeners.get(path).push(...listeners)
        } else {
            methodListeners.set(path, listeners)
        }
    }

    /**
     * Registers a middleware.
     * @param {import('./utils').Middleware} middleware The middleware to register.
     */
    #registerMiddleware(middleware) {
        this.#middleware.push(middleware)
    }
}

module.exports = RestLib