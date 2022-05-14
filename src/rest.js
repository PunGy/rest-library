const http = require('http')
const helpers = require('./helpers')

/**
 * Class for handling REST http requests
 */
class RestLib {
    /**
     * The array of middleware, where middleware is a function that takes a context and next caller.
     * It also can be a array of middleware. It means that it's a listener of some request. It will be called iną order.
     * @type {Array<import('./rest').Middleware>}
     * @private
     */
    #middleware

    /**
     * Map of listeners, where key is method and value is the Map, where key is the path and value is the listener.
     * Actually an array of listeners, chain of middleware. It would be used in the middleware array
     * @type {Map<string, Map<string, Array<import('./rest').Listener>>>}
    */
    #listeners

    /**
     * The server instance.
     * @type {http.Server}
     * @private
     */
    #server

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

    /**
     * Registers a listeners on requesting specific method and path.
     * @param {string} method The method to listen on.
     * @param {string} path The path to listen on.
     * @param {Array<Function>} listeners The listeners to add.
     * @returns {RestLib} The instance.
     * @private
     * @throws {Error} If the method is not supported.
     */
    #registerMethod(method, path, ...listeners) {
        if (!this.#listeners.has(method)) {
            throw new Error(`Method ${method} is not supported.`)
        }
        this.#registerListener(method, path, listeners)
        this.#registerMiddleware(listeners)

        return this
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
        request.query = query
        request.queryParams = query ?? helpers.parseQuery(query)

        const context = {
            request,
            response,
        }
        
        if (this.#listeners.has(method)) {
            const methodListeners = this.#listeners.get(method)
            const pathEntries = helpers.trim(path, '/').split('/')

            // Find the listener for the path
            // If there would be a parameters, it will be added to the context
            // @type {[string, Array<Function>]}
            const pathListenersEntry = Array.from(methodListeners.entries()).find(([path]) => {
                const listenerPathEntries = helpers.trim(path, '/').split('/')
                if (pathEntries.length !== listenerPathEntries.length) {
                    return false
                }

                let params = {}

                const isOk = listenerPathEntries.every((entry, index) => {
                    if (index === 0) params = {}

                    if (entry.startsWith(':')) {
                        params[entry.substring(1)] = pathEntries[index]
                    } else {
                        return entry === pathEntries[index]
                    }
                })
                if (isOk) {
                    context.request.params = params
                }
                
                return isOk
            })

            if (pathListenersEntry) {
                // An array of middleware
                const pathListeners = pathListenersEntry[1]

                // Left only generic middleware and the current one for the path
                const middleware = this.#middleware.filter(middleware => {
                    if (Array.isArray(middleware)) {
                        return middleware === pathListeners
                    }
                    return true
                }).map(helpers.applyNext)
                const middlewareGenerator = helpers.createMiddlewareGenerator(middleware)

                for await (const fn of middlewareGenerator) {
                    await fn(context)
                }
            }
        }

        if (!response.writableEnded) {
            response.end()
        }
    }

    /**
     * Registers a listener for a specific method and path.
     * @param {string} method The method.
     * @param {string} path The path.
     * @param {Array<Function>} listeners The listeners.
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
     * @param {Function|Array<Function>} middleware The middleware to register.
     */
    #registerMiddleware(middleware) {
        this.#middleware.push(middleware)
    }
}

module.exports = RestLib