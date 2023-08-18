import fetch from 'cross-fetch'
import { DocumentNode, OperationDefinitionNode, print } from 'graphql'
import { castToError, Headers } from './util'
import { config } from '../config'
import { Environment } from '../env'
import { validatePositiveInteger } from '../utils/validatePositiveInteger'
import { APIConnectionError, APIConnectionTimeoutError, APIError, SpritzApiError } from './error'
import { gracefulParseJSON } from '../utils/json'

interface QueryParams<V = any> {
    query: DocumentNode
    variables?: V | undefined
}

type APIResponseProps = {
    response: Response
    controller: AbortController
    headers: Headers
}

type GraphQLResponseData<T> = {
    data: T
    errors?: { message: string }[] | null
}

type HTTPMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'

async function parseAPIResponse<Response>(
    props: APIResponseProps
): Promise<{ response: Response; headers: Headers }> {
    const { response } = props

    const contentType = response.headers.get('content-type')
    if (contentType?.includes('application/json')) {
        const json = await response.json()
        return { response: json as Response, headers: props.headers }
    }

    const text = await response.text()
    return { response: text as Response, headers: props.headers }
}

export class SpritzClient {
    private baseGraphURL: string
    private baseRestURL: string
    private timeout: number
    private apiKey: string | undefined
    private integrationKey: string | undefined

    constructor({
        environment,
        timeout = 300000, // 5 minutes
        apiKey,
        integrationKey,
    }: {
        environment: Environment
        timeout?: number | undefined
        integrationKey: string | undefined
        apiKey: string | undefined
    }) {
        this.apiKey = apiKey
        this.integrationKey = integrationKey
        this.baseGraphURL = config[environment].graphEndpoint
        this.baseRestURL = config[environment].baseEndpoint
        this.timeout = validatePositiveInteger('timeout', timeout)
    }

    async query<Q = any, V = any>({ query, variables }: QueryParams<V>) {
        return this.sendQuery<V>({
            query,
            variables,
        })
            .then((res) => parseAPIResponse<GraphQLResponseData<Q>>(res))
            .then(({ response, headers }) => {
                if (response.data) {
                    return response.data as Q
                } else if (response.errors) {
                    const error = response.errors[0] ?? { message: 'Unknown error' }
                    throw new SpritzApiError(error.message, headers)
                } else {
                    throw new Error('Unknown error')
                }
            })
    }

    public async request<Response, Request extends Record<string, any> = Record<string, any>>({
        method,
        path,
        body = undefined,
    }: {
        method: HTTPMethod
        path: string
        body?: Request | undefined
    }) {
        return this.sendRequest({
            method,
            path,
            body,
        })
            .then((res) => parseAPIResponse<Response>(res))
            .then(({ response }) => response)
    }

    public async sendQuery<V = any>({
        query: documentNodeQuery,
        variables: inputVariables,
    }: QueryParams<V>) {
        const { url, req, timeout } = this.buildGraphRequest<V>({
            query: documentNodeQuery,
            variables: inputVariables,
        })
        return this.sendHTTPRequest({ url, req, timeout })
    }

    public async sendRequest({
        method,
        path,
        body,
    }: {
        method: HTTPMethod
        path: string
        body: Record<string, any> | undefined
    }) {
        const { url, req, timeout } = this.buildRestRequest(method, path, body)
        return this.sendHTTPRequest({ url, req, timeout })
    }

    private async sendHTTPRequest({
        url,
        req,
        timeout,
    }: {
        url: string
        req: RequestInit
        timeout: number
    }) {
        const controller = new AbortController()
        const response = await this.fetchWithTimeout(url, req, timeout, controller).catch(
            castToError
        )

        if (response instanceof Error) {
            if (response.name === 'AbortError') {
                throw new APIConnectionTimeoutError()
            }
            throw new APIConnectionError({ cause: response })
        }

        const headers = this.getResponseHeaders(response.headers)

        if (!response.ok) {
            const errText = await response.text().catch(() => 'Unknown error')
            const errJSON = gracefulParseJSON(errText)
            const err = this.makeStatusError(
                response.status,
                errJSON,
                errJSON ? undefined : errText,
                headers
            )
            throw err
        }

        return { response, controller, headers }
    }

    private getResponseHeaders(headers: globalThis.Headers) {
        const traceId = headers.get('x-amzn-trace-id')
        const requestId = headers.get('x-amzn-requestid')
        return { traceId, requestId }
    }

    private async fetchWithTimeout(
        url: RequestInfo,
        req: RequestInit | undefined,
        timeoutMs: number,
        controller: AbortController
    ): Promise<Response> {
        const { signal, ...options } = req || {}
        if (signal) signal.addEventListener('abort', () => controller.abort())

        const timeout = setTimeout(() => controller.abort(), timeoutMs)

        return fetch(url, { ...options }).finally(() => {
            clearTimeout(timeout)
        })
    }

    private buildGraphRequest<V = any>({ query, variables }: QueryParams<V>) {
        const reqBody = {
            query: print(query),
            variables,
            operationName: (query?.definitions?.[0] as OperationDefinitionNode)?.name?.value,
        }

        const body = reqBody ? JSON.stringify(reqBody, null, 2) : null
        const contentLength = this.calculateContentLength(body)
        const timeout = this.timeout

        const reqHeaders: Record<string, string> = {
            ...(contentLength && { 'Content-Length': contentLength }),
            ...this.defaultHeaders(),
        }

        Object.keys(reqHeaders).forEach((key) => reqHeaders[key] === null && delete reqHeaders[key])

        const req: RequestInit = {
            method: 'POST',
            ...(body && { body: body as any }),
            headers: reqHeaders,
        }

        return {
            url: this.baseGraphURL,
            req,
            timeout,
        }
    }

    private buildRestRequest(
        method: HTTPMethod,
        path: string,
        reqBody?: Record<string, any> | null
    ) {
        const body = reqBody ? JSON.stringify(reqBody, null, 2) : null
        const contentLength = this.calculateContentLength(body)
        const timeout = this.timeout

        const reqHeaders: Record<string, string> = {
            ...(contentLength && { 'Content-Length': contentLength }),
            ...this.defaultHeaders(),
        }

        Object.keys(reqHeaders).forEach((key) => reqHeaders[key] === null && delete reqHeaders[key])

        const req: RequestInit = {
            method,
            ...(body && { body: body as any }),
            headers: reqHeaders,
        }

        return {
            url: `${this.baseRestURL}${path.startsWith('/') ? path : '/' + path}`,
            req,
            timeout,
        }
    }

    private defaultHeaders(): Headers {
        return {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...this.authHeaders(),
        }
    }

    private calculateContentLength(body: unknown): string | null {
        if (typeof body === 'string') {
            if (typeof Buffer !== 'undefined') {
                return Buffer.byteLength(body, 'utf8').toString()
            }

            if (typeof TextEncoder !== 'undefined') {
                const encoder = new TextEncoder()
                const encoded = encoder.encode(body)
                return encoded.length.toString()
            }
        }

        return null
    }

    protected authHeaders(): Headers {
        return {
            Authorization: 'Bearer ' + this.apiKey,
            ...(this.integrationKey ? { 'X-INTEGRATION-KEY': this.integrationKey } : {}),
        }
    }

    private makeStatusError(
        status: number | undefined,
        error: Record<string, any> | undefined,
        message: string | undefined,
        headers: Headers | undefined
    ) {
        return APIError.generate(status, error, message, headers)
    }
}
