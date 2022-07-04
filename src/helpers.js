import { stat } from 'node:fs/promises'
import { createReadStream } from 'node:fs'
import { fileTypeFromBuffer } from 'file-type'

export function reverse(str)
{
    let result = ''

    for (let i = str.length - 1; i >= 0; i--)
        result += str[i]

    return result
}

export function trimStart(str, char = ' ')
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

export const trimEnd = (str, char = ' ') => reverse(trimStart(reverse(str), char))

export const trim = (str, char = '') => trimEnd(trimStart(str, char), char)

export function* createMiddlewareGenerator(middleware) {
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

export function applyNext(middleware) {
    if (Array.isArray(middleware)) {
        return middleware.map(applyNext)
    } else {
        return next => (...args) => middleware.apply(this, args.concat(next))
    }
}

export function sendJson(response, body, status = 200) {
    let json
    try {
        json = JSON.stringify(body)
        response.statusCode = 200
    } catch (error) {
        console.error(`Failed to stringify body: ${error}`)
        response.statusCode = 500
        json = `{"error": "${error.message}"}`
    }
    
    response.writeHead(status, {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(json),
    })
    response.end(json)
}

export function sendFile(response, path) {
    return new Promise(async (finish, reject) => {
        const fileStats = await stat(path).catch(() => null)

        if (fileStats) {
            const readFile = createReadStream(path)
            
            readFile.on('error', (error) => {
                reject(error)
                response.send({ error }, 500)
            })

            function firstChunkReader(chunk) {
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
            response.send({ error: 'Not found such file' }, 404)
        }
    })
}

export function readData(request) {
    return new Promise((resolve, reject) => {
        const data = []
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
export function parseQuery(query) {
    if (!query) {
        return {}
    }
    const params = query.split('&')
    const result = {}
    params.forEach(param => {
        const [key, value] = param.split('=')
        result[key] = value
    })
    return result
}
