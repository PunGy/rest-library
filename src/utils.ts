import { readData } from './helpers.js'
import { ServerResponse, IncomingMessage } from 'node:http'

export type NextFn = () => void

export type QueryStringRecord = Record<string, string | undefined>

export type RestRequest = IncomingMessage & {
    params: Record<string, string>;
    query: string;
    queryParams: QueryStringRecord;
}

export type RestResponse = ServerResponse & {
    send: (body: Record<string, unknown>, status?: number) => void;
    sendFile: (path: string) => Promise<void>;
}

type ContextDefault = { request: RestRequest; response: RestResponse; }
/**
 * Context object containing the request and response objects.
 */
export type Context<
    REQ extends object = RestRequest,
    RES extends object = RestResponse,
    T extends object = ContextDefault,
> = {
    request: RestRequest & REQ;
    response: RestResponse & RES;
} & T;

/**
 * Listener of the request
 */
export type Listener = (ctx: Context, next: NextFn) => void;

/**
 * In case if middleware is an array of listeners, it will be executed in sequence
 */
export type Middleware = Array<Listener> | Listener

export type BodyJSONParameter = { body: Record<string, unknown> | string; }
/**
 * Parses the body of the given request and adds body parameter to ctx.request
 * @param ctx context of the request
 * @param next call next middleware
 */
export async function parseBodyMiddleware(
    ctx: Context<BodyJSONParameter>,
    next: NextFn,
) {
    const req = ctx.request

    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
        const contentType = req.headers['content-type'] ?? 'plain/text'

        if (contentType === 'application/json') {
            const data = (await readData(req)).toString()
            ctx.request.body = data === '' ? {} : JSON.parse(data.toString())
        } else if (contentType === 'plain/text') {
            const data = await readData(req)
            ctx.request.body = data.toString()
        }
    }
    next()
}
