import { ServerResponse } from 'http';
import { Middleware } from './utils';

/**
 * Returns reversed string
 * @param str string to be reversed
 * @returns reversed string
 */
export function reverse(str: string): string;

/**
 * Returns string with first char removed
 * @param str string to be trimmed
 * @param char char to be removed
 * @returns string with first char removed
 */
export function trimStart(str: string, char?: string): string;

/**
 * Returns string with last char removed
 * @param str string to be trimmed
 * @param char char to be removed
 * @returns string with last char removed
 */
export function trimEnd(str: string, char?: string): string;

/**
 * Returns string with first and last char removed
 * @param str string to be trimmed
 * @param char char to be removed
 * @returns string with first and last char removed
 */
export function trim(str: string, char?: string): string;

/**
 * Returns a generator which iterates over the given middleware
 * @param middleware middleware to be iterated over
 * @returns generator which iterates over the given middleware
 */
export function createMiddlewareGenerator(middleware: Array<Middleware>): Promise<Generator>;

/**
 * Adds next parameter to the given middleware
 * @param middleware middleware to be added next parameter
 * @returns middleware with next parameter
 */
export function applyNext(middleware: Array<Middleware>): Array<Middleware>;

/**
 * 
 * Sends a response with the given status code and body
 * @param response response to be sent
 * @param statusCode status code to be sent
 * @param body body to be sent
 */
export function sendResponse(response: ServerResponse, body: any, status?: number): void;
