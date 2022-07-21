import { readData } from './helpers.js'
import { ServerResponse, IncomingMessage } from 'node:http'

export type NextFn = () => void

export type QueryStringRecord = Record<string, string | undefined>

/**
 * Context object containing the request and response objects.
 */
export type Context = {
    response: ServerResponse;
    send: (body: Record<string, unknown>, status?: number) => void;
    sendFile: (path: string) => Promise<void>;

    request: IncomingMessage;
    params: Record<string, string>;
    query: string;
    queryParams: QueryStringRecord;
};

/**
 * Listener of the request
 */
export type Listener<C extends Context = Context> = (ctx: C, next: NextFn) => void;

/**
 * In case if middleware is an array of listeners, it will be executed in sequence
 */
export type Middleware<C extends Context = Context> = Array<Listener<C>> | Listener<C>

export type BodyJSONParameter = { body: Record<string, unknown> | string; }
/**
 * Parses the body of the given request and adds body parameter to ctx.request
 * @param ctx context of the request
 * @param next call next middleware
 */
export async function parseBodyMiddleware(
    ctx: Context & BodyJSONParameter,
    next: NextFn,
) {
    const req = ctx.request

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'] ?? 'plain/text'

        if (contentType === 'application/json') {
            const data = (await readData(req)).toString()
            ctx.body = data === '' ? {} : JSON.parse(data.toString())
        } else if (contentType === 'plain/text') {
            const data = await readData(req)
            ctx.body = data.toString()
        }
    }
    next()
}
