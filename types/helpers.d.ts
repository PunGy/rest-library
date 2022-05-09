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
