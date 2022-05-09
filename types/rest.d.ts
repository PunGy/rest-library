import { listener } from "./helpers";

export = RestLib;
/**
 * Class for handling REST http requests
 */
declare class RestLib {
    /**
     * Starts the server.
     * @param {number} port The port to listen on.
     * @param {Function} callback The callback to call when the server is started.
     * @public
     */
    public listen(port: number, callback: () => void): RestLib;
    
    /**
     * Registers a middleware which will be called for all requests.
     * @param {Function} middleware The middleware listener to add for every request.
     * @returns {RestLib} The instance.
     */
    use(middleware: listener): RestLib;
    
    get(path: string, ...listeners: Array<listener>): RestLib;
    post(path: string, ...listeners: Array<listener>): RestLib;
    put(path: string, ...listeners: Array<listener>): RestLib;
    delete(path: string, ...listeners: Array<listener>): RestLib;
    patch(path: string, ...listeners: Array<listener>): RestLib;
}
