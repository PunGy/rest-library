import { IncomingMessage, ServerResponse } from 'http';

export type NextFn = () => void

/**
 * In case if middleware is an array of listeners, it will be executed in sequence
 */
export type Middleware = Listener | Array<Listener>

/**
 * Context object containing the request and response objects.
 */
export type Context = {
    request: IncomingMessage & {
        body?: any;
        params?: Record<string, string>;
        query?: string;
        queryParams?: Record<string, string>;
    },
    response: ServerResponse & {
        send: (body: any, status?: number) => void;
    },
}

/**
 * Parses the body of the given request
 * @param ctx context of the request
 * @param next call next middleware
 */
export function parseBodyMiddleware(ctx: Context, next: NextFn): Promise<void>;