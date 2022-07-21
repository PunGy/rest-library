import { stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { IncomingMessage, ServerResponse } from 'node:http'
import { fileTypeFromBuffer } from 'file-type'
import { Context, Listener, NextFn, QueryStringRecord } from './utils'

export type InvertedListener = (next: NextFn) => (ctx: Context) => void;

/**
 * Returns reversed string
 * @param str string to be reversed
 * @returns reversed string
 */
export function reverse(str: string): string
{
    let result = ''

    for (let i = str.length - 1; i >= 0; i--)
        result += str[i]

    return result
}

/**
 * Returns string with first char removed
 * @param str string to be trimmed
 * @param char char to be removed
 * @returns string with first char removed
 */
export function trimStart(str: string, char?: string): string
{
    let result = ''

    for (let i = 0; i < str.length; i++)
    {
        if (str[i] !== char)
        {
            result = str.slice(i)
            break
        }
    }

    return result
}

/**
 * Returns string with last char removed
 * @param str string to be trimmed
 * @param char char to be removed
 * @returns string with last char removed
 */
export const trimEnd = (str: string, char = ' '): string => reverse(trimStart(reverse(str), char))

/**
 * Returns string with first and last char removed
 * @param str string to be trimmed
 * @param char char to be removed
 * @returns string with first and last char removed
 */
export const trim = (str: string, char = ''): string => trimEnd(trimStart(str, char), char)

type ListenerCall = ReturnType<InvertedListener>
/**
 * Returns a generator which iterates over the given middleware
 * @param middleware middleware to be iterated over
 * @returns generator which iterates over the given middleware
 */
export function* createMiddlewareGenerator(middleware: Array<Array<InvertedListener> | InvertedListener>): Generator<ListenerCall> {
    let finished = false
    const next = () => {
        finished = false
    }

    for (const fn of middleware) {
        if (Array.isArray(fn)) {
            for (const _fn of fn) {
                finished = true
                yield _fn(next)

                if (finished) {
                    return
                }
            }
        } else {
            finished = true
            yield fn(next)

            if (finished) {
                return
            }
        }
    }
}

export function applyNext(middleware: Array<Listener>): Array<InvertedListener>;
export function applyNext(middleware: Listener): InvertedListener;
export function applyNext(middleware: Array<Listener> | Listener): Array<InvertedListener> | InvertedListener;
/**
 * Adds next parameter to the given middleware
 * @param middleware middleware to be added next parameter
 * @returns middleware with next parameter
 */
export function applyNext(middleware: Array<Listener> | Listener): Array<InvertedListener> | InvertedListener {
    if (Array.isArray(middleware)) {
        return middleware.map((listener) => applyNext(listener))
    } else {
        return next => (ctx) => middleware(ctx, next)
    }
}

/**
 *
 * Sends a response with the given status code and body
 * @param response response to be sent
 * @param statusCode status code to be sent
 * @param body body to be sent
 */
export function sendJson(response: ServerResponse, body: Record<string, unknown>, status = 200): void {
    let json: string
    try {
        json = JSON.stringify(body)
    } catch (error) {
        // eslint-disable-next-line no-console
        console.error(`Failed to stringify body: ${error}`)
        status = 500
        json = `{"error": "${(error as Error).message}"}`
    }

    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
    })
    response.end(json)
}

/**
 * Sends a file from the path string
 * @param response response to be sent
 * @param path is the path (desirably absolute) to the file
 */
export async function sendFile({ send, response }: { response: ServerResponse; send: Context['send']; }, path: string): Promise<void> {
    const fileStats = await stat(path).catch(() => null)
    return new Promise((finish, reject) => {
        if (fileStats != null) {
            const readFile = createReadStream(path)

            readFile.on('error', (error) => {
                reject(error)
                send({ error }, 500)
            })

            const firstChunkReader = (chunk: Buffer) => {
                fileTypeFromBuffer(chunk)
                    .then(fileType => {
                        response.writeHead(200, {
                            'Content-Type': fileType ? fileType.mime : 'text/plain',
                            'Content-Size': fileStats.size,
                        })

                        readFile.on('data', (chunk) => {
                            response.write(chunk)
                        })

                        response.write(chunk)
                    })

                readFile.removeListener('data', firstChunkReader)
            }

            readFile.on('data', firstChunkReader)
            readFile.on('end', () => {
                response.end()
            })

            response.on('finish', () => {
                finish()
            })
        } else {
            send({ error: 'Not found such file' }, 404)
        }
    })
}

export function readData(request: IncomingMessage): Promise<Buffer> {
    return new Promise((resolve, reject) => {
        const data: Array<Buffer> = []
        request.on('data', (chunk) => {
            data.push(chunk)
        })
        request.on('error', (error) => {
            reject(error)
        })
        request.on('end', () => {
            resolve(Buffer.concat(data))
        })
    })
}

/**
 * Parse query string to object
 */
export function parseQuery(query: string): QueryStringRecord {
    const params = query.split('&')
    const result: QueryStringRecord = {}
    params.forEach(param => {
        const [key, value] = param.split('=') as [string, string | undefined]
        result[key] = value
    })
    return result
}
