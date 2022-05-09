import { IncomingMessage, ServerResponse } from 'http';

// UTILS

export type NextFn = () => void

/**
 * Context object containing the request and response objects.
 */
export type Context = {
    request: IncomingMessage,
    response: ServerResponse & {
        body?: any;
        send: (body: any, status?: number) => void;
        params: Record<string, string>;
    },
    query: string | undefined;
}

/**
 * Parses the body of the given request
 * @param {Context} ctx context of the request
 * @param {Function} next call next middleware
 */
export function parseBodyMiddleware(ctx: Context, next: NextFn): Promise<void>;

// HELPERS

import { NextFn, Context } from "./utils";

/**
 * Returns the function which would be called only once and then persist the result
 * @param {Function} fn function to be called only once
 * @returns {Function} function which would be called only once and then persist the result
 */
export function once(fn: Function): Function;

/**
 * Returns reversed string
 * @param {string} str string to be reversed
 * @returns {string} reversed string
 */
export function reverse(str: string): string;

/**
 * Returns string with first char removed
 * @param {string} str string to be trimmed
 * @param {string} char char to be removed
 * @returns {string} string with first char removed
 */
export function trimStart(str: string, char?: string): string;

/**
 * Returns string with last char removed
 * @param {string} str string to be trimmed
 * @param {string} char char to be removed
 * @returns {string} string with last char removed
 */
export function trimEnd(str: string, char?: string): string;

/**
 * Returns string with first and last char removed
 * @param {string} str string to be trimmed
 * @param {string} char char to be removed
 * @returns {string} string with first and last char removed
 */
export function trim(str: string, char?: string): string;

/**
 * Listener of the request
 */
export type listener = (ctx: Context, next: NextFn) => void;

/**
 * Returns a generator which iterates over the given middleware
 * @param {Array<Function|Array<Function>>} middleware middleware to be iterated over
 * @returns {Promise<Generator>} generator which iterates over the given middleware
 */
export function createMiddlewareGenerator(middleware: Array<listener | Array<listener>>): Promise<Generator>;

/**
 * Adds next parameter to the given middleware
 * @param {Array<Function|Array<Function>>} middleware middleware to be added next parameter
 * @returns {Array<Function|Array<Function>>} middleware with next parameter
 */
export function applyNext(middleware: Array<Function | Array<Function>>): Array<Function | Array<Function>>;

/**
 * 
 * Sends a response with the given status code and body
 * @param {Response} response response to be sent
 * @param {number} statusCode status code to be sent
 * @param {any} body body to be sent
 */
export function sendResponse(response: Response, body: any, status?: number): void;

// REST LIBRARY

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
