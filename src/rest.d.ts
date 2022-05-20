import { Context, Listener } from './utils'

/**
 * Class for handling REST http requests
 */
export declare class RestLib {
    /**
     * Starts the server.
     * @param port The port to listen on.
     * @param callback The callback to call when the server is started.
     */
    listen(port: number, callback: Function): RestLib;
    
    /**
     * Registers a middleware which will be called for all requests.
     * @param middleware The middleware listener to add for every request.
     */
    use(middleware: Listener): RestLib;
    
    /**
     * Register a listeners which will be called for GET request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    get(path: string, ...listeners: Array<Listener>): RestLib;
    
    /**
     * Register a listeners which will be called for POST request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    post(path: string, ...listeners: Array<Listener>): RestLib;
    
    /**
     * Register a listeners which will be called for PUT request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    put(path: string, ...listeners: Array<Listener>): RestLib;
    
    /**
     * Register a listeners which will be called for DELETE request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    delete(path: string, ...listeners: Array<Listener>): RestLib;
    
    /**
     * Register a listeners which will be called for PATCH request and particular route.
     * @param path Route path to listen for.
     * @param listeners Listeners to be called
     */
    patch(path: string, ...listeners: Array<Listener>): RestLib;

    /**
     * Set error handler, which will be called when an unhandled error occurs.
     * @param handler The error handler.
     */
    error(handler: (ctx: Context, error: Error) => void): RestLib;

    /**
     * Set handler for 404 errors
     * @param handler The handler of 404 error
     */
    notFound(handler: (ctx: Context) => void): RestLib;
}
