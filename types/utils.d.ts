import { IncomingMessage, ServerResponse } from 'http';

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
