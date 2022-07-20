import http, { IncomingMessage, Server as HttpServer, ServerResponse } from 'node:http'
import https, { Server as HttpsServer, ServerOptions } from 'node:https'
import * as helpers from './helpers.js'
import { Context, Listener, Middleware, RestRequest, RestResponse } from './utils.js'

export interface RestLibOptions {
    server: ServerOptions;
}

export type ErrorHandler = (ctx: Context, error: any) => void;

/**
 * Class for handling REST http requests
 */
export default class RestLib {
    /**
     * The array of middleware, where middleware is a function that takes a context and next caller.
     * It also can be a array of middleware. It means that it's a listener of some request. It will be called iną order.
     * @private
     */
    #middleware: Array<Middleware>

    /**
     * Map of listeners, where key is method and value is the Map, where key is the path and value is the listener.
     * Actually an array of listeners, chain of middleware. It would be used in the middleware array
     * @private
    */
    #listeners: Map<string, Map<string, Array<Listener>>>

    /**
     * The server instance.
     * @private
     */
    #server: HttpServer | HttpsServer

    /**
     * Optional function to be called when application falls with unhandled error.
     */
    #errorHandler?: ErrorHandler

    /**
     * Optional function to be called when appropriate listener is not found.
     */
    #notFoundHandler?: ErrorHandler

    constructor(options: RestLibOptions) {
        const server = options?.server
        if (server && 'key' in server && 'cert' in server) {
            this.#server = https.createServer(server, this.#handleRequest.bind(this))
        } else {
            this.#server = http.createServer(this.#handleRequest.bind(this))
        }

        this.#middleware = []
        this.#listeners = new Map([
            ['GET', new Map()],
            ['POST', new Map()],
            ['PUT', new Map()],
            ['DELETE', new Map()],
            ['PATCH', new Map()],
        ])
    }

    /**
     * Starts the server.
     * @param port The port to listen on.
     * @param callback The callback to call when the server is started.
     */
    listen(port: number, callback?: () => void) {
        this.#server.listen(port, callback)

        return this
    }

    /**
     * Registers a middleware which will be called for all requests.
     * @param middleware The middleware listener to add for every request.
     */
    use(middleware: Middleware) {
        this.#registerMiddleware(middleware)

        return this
    }

    /**
     * Register a listeners which will be called for GET request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    get(path: string, ...listeners: Array<Listener>) {
        return this.#registerMethod('GET', path, listeners)
    }
    /**
     * Register a listeners which will be called for POST request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    post(path: string, ...listeners: Array<Listener>) {
        return this.#registerMethod('POST', path, listeners)
    }
    /**
     * Register a listeners which will be called for PUT request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    put(path: string, ...listeners: Array<Listener>) {
        return this.#registerMethod('PUT', path, listeners)
    }
    /**
     * Register a listeners which will be called for DELETE request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    delete(path: string, ...listeners: Array<Listener>) {
        return this.#registerMethod('DELETE', path, listeners)
    }
    /**
     * Register a listeners which will be called for PATCH request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    patch(path: string, ...listeners: Array<Listener>) {
        return this.#registerMethod('PATCH', path, listeners)
    }
    /**
     * Register a listeners which will be called for ALL available methods
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    all(path: string, ...listeners: Array<Listener>) {
        for (const method of this.#listeners.keys()) {
            this.#registerListener(method, path, listeners)
        }
        this.#registerMiddleware(listeners)

        return this
    }

    /**
     * Set error handler, which will be called when an unhandled error occurs.
     * @param handler The error handler.
     */
    error(handler: (error: any) => void) {
        this.#errorHandler = handler
    }

    /**
     * Set handler for 404 errors
     * @param handler The handler of 404 error
     */
    notFound(handler: (error: any) => void) {
        this.#notFoundHandler = handler
    }

    /**
     * Registers a listeners on requesting specific method and path.
     * @param method The method to listen on.
     * @param path The path to listen on.
     * @param listeners The listeners to add.
     * @private
     * @throws {Error} If the method is not supported.
     */
    #registerMethod(method: string, path: string, listeners: Array<Listener>) {
        if (!this.#listeners.has(method)) {
            throw new Error(`Method ${method} is not supported.`)
        }
        this.#registerListener(method, path, listeners)
        this.#registerMiddleware(listeners)

        return this
    }

    async #iterateOverMiddleware(ctx: Context, middleware: Array<Middleware>) {
        const middlewareGenerator = helpers.createMiddlewareGenerator(middleware.map(m => helpers.applyNext(m)))

        for (const fn of middlewareGenerator) {
            try {
                await fn(ctx)
            } catch (error) {
                if (this.#errorHandler) {
                    this.#errorHandler(ctx, error)
                } else {
                    const message = error instanceof Error ? error.message : error
                    ctx.response.statusCode = 500
                    ctx.response.end(`{ "error": "${message}" }`)
                }
                return
            }
        }
    }

    /**
     * Handles a request.
     * @param request The request.
     * @param response The response.
     * @private
     */
    async #handleRequest(serverRequest: IncomingMessage, serverResponse: ServerResponse) {
        const request = serverRequest as RestRequest
        const response = serverResponse as RestResponse
        const { method, url } = request as { method: string; url: string; }

        const [path, query] = url.split('?') as [string, string | undefined]

        response.send = helpers.sendJson.bind(this, response)
        response.sendFile = helpers.sendFile.bind(this, response)
        request.query = query ?? ''
        request.queryParams = request.query.length > 0 ? helpers.parseQuery(query) : {}

        const context: Context = {
            request,
            response,
        }

        if (this.#listeners.has(method)) {
            // We checking on such method existence above
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const methodListeners = this.#listeners.get(method)!
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

                let params: Record<string, string> = {}

                const isMatched = listenerPathEntries.every((listenerPathEntry, index) => {
                    if (index === 0) params = {}

                    // We checking that pathEntries and listenerPathEntries has same length above, so we can use index with confidence
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    const requestPathEntry = pathEntries[index]!

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
                    this.#notFoundHandler(context, new Error('not found'))
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
    #registerListener(method: string, path: string, listeners: Array<Listener>) {
        const methodListeners = this.#listeners.get(method)
        if (methodListeners == null) {
            throw new Error(`${method} is not allowed`)
        }
        if (methodListeners.has(path)) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            methodListeners.get(path)!.push(...listeners)
        } else {
            methodListeners.set(path, listeners)
        }
    }

    /**
     * Registers a middleware.
     * @param {import('./utils').Middleware} middleware The middleware to register.
     */
    #registerMiddleware(middleware: Middleware) {
        this.#middleware.push(middleware)
    }
}
