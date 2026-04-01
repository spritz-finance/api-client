import { DocumentNode, OperationDefinitionNode, print } from 'graphql'
import { castToError, Headers } from './util'
import { config } from '../config'
import { Environment } from '../env'
import { validatePositiveInteger } from '../utils/validatePositiveInteger'
import { APIConnectionError, APIConnectionTimeoutError, APIError, SpritzApiError } from './error'
import { gracefulParseJSON } from '../utils/json'
import { validateGraphQLQuery, sanitizeGraphQLVariables } from '../utils/graphqlSecurity'
import { stampRequest } from './hmac'

type GraphQLVariables = Record<string, unknown>

interface QueryParams<V extends GraphQLVariables | undefined = GraphQLVariables> {
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
    private baseRestApiURL: string
    private timeout: number
    private apiKey: string | undefined
    private integrationKey: string | undefined
    private integratorSecret: string | undefined

    constructor({
        environment,
        timeout = 300000, // 5 minutes
        apiKey,
        integrationKey,
        integratorSecret,
    }: {
        environment: Environment
        timeout?: number | undefined
        integrationKey: string | undefined
        integratorSecret: string | undefined
        apiKey: string | undefined
    }) {
        this.apiKey = apiKey
        this.integrationKey = integrationKey
        this.integratorSecret = integratorSecret
        this.baseGraphURL = config[environment].graphEndpoint
        this.baseRestURL = config[environment].baseEndpoint
        this.baseRestApiURL = config[environment].restEndpoint
        this.timeout = validatePositiveInteger('timeout', timeout)
    }

    async query<Q, V extends GraphQLVariables | undefined = GraphQLVariables>({
        query,
        variables,
    }: QueryParams<V>) {
        // Validate GraphQL query for security
        validateGraphQLQuery(query)

        // Sanitize variables to prevent injection attacks
        const sanitizedVariables = sanitizeGraphQLVariables(variables)

        return this.sendQuery({
            query,
            variables: sanitizedVariables,
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

    public async request<Response, Request extends GraphQLVariables = GraphQLVariables>({
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

    public async restApi<Response, Request extends GraphQLVariables = GraphQLVariables>({
        method,
        path,
        body = undefined,
        query,
    }: {
        method: HTTPMethod
        path: string
        body?: Request | undefined
        query?: Record<string, string | number | boolean | undefined>
    }) {
        return this.sendRestApiRequest({
            method,
            path,
            body,
            query,
        })
            .then((res) => parseAPIResponse<Response>(res))
            .then(({ response }) => response)
    }

    public async sendQuery({
        query: documentNodeQuery,
        variables: inputVariables,
    }: QueryParams<GraphQLVariables>) {
        const { url, req, timeout } = this.buildGraphRequest({
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
        body: GraphQLVariables | undefined
    }) {
        const { url, req, timeout } = this.buildRestRequest(method, path, body)
        return this.sendHTTPRequest({ url, req, timeout })
    }

    public async sendRestApiRequest({
        method,
        path,
        body,
        query,
    }: {
        method: HTTPMethod
        path: string
        body: GraphQLVariables | undefined
        query?: Record<string, string | number | boolean | undefined>
    }) {
        const { url, req, timeout } = this.buildRestRequest(method, path, body, this.baseRestApiURL, query)

        if (this.integrationKey && this.integratorSecret) {
            const stamped = await stampRequest(
                this.integrationKey,
                this.integratorSecret,
                method,
                url,
                (req.body as string | undefined) ?? null,
            )
            const { 'X-INTEGRATION-KEY': _, ...headers } = req.headers as Record<string, string>
            req.headers = { ...headers, ...stamped }
        }

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

        // Use AbortSignal.any to combine signals (Node 20+)
        const timeoutSignal = AbortSignal.timeout(timeoutMs)
        const combinedSignal = signal
            ? AbortSignal.any([signal, timeoutSignal, controller.signal])
            : AbortSignal.any([timeoutSignal, controller.signal])

        return fetch(url, { ...options, signal: combinedSignal })
    }

    private buildGraphRequest({ query, variables }: QueryParams<GraphQLVariables>) {
        const reqBody = {
            query: print(query),
            variables,
            operationName: (query?.definitions?.[0] as OperationDefinitionNode)?.name?.value,
        }

        const body = reqBody ? JSON.stringify(reqBody, null, 2) : null
        const contentLength = this.calculateContentLength(body)
        const timeout = this.timeout

        const baseHeaders = {
            ...(contentLength && { 'Content-Length': contentLength }),
            ...this.defaultHeaders(),
        }

        // Safely filter out null values to prevent prototype pollution
        const reqHeaders: Record<string, string> = Object.fromEntries(
            Object.entries(baseHeaders).filter(([_, value]) => value !== null)
        )

        const req: RequestInit = {
            method: 'POST',
            ...(body ? { body } : {}),
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
        reqBody?: GraphQLVariables | null,
        baseURL?: string,
        query?: Record<string, string | number | boolean | undefined>,
    ) {
        const body = reqBody ? JSON.stringify(reqBody) : null
        const contentLength = this.calculateContentLength(body)
        const timeout = this.timeout

        const baseHeaders = {
            ...(contentLength && { 'Content-Length': contentLength }),
            ...this.defaultHeaders(),
        }

        // Safely filter out null values to prevent prototype pollution
        const reqHeaders: Record<string, string> = Object.fromEntries(
            Object.entries(baseHeaders).filter(([_, value]) => value !== null)
        )

        const req: RequestInit = {
            method,
            ...(body ? { body } : {}),
            headers: reqHeaders,
        }

        const base = baseURL ?? this.baseRestURL
        const normalizedPath = path.startsWith('/') ? path : '/' + path
        const url = new URL(normalizedPath, base)

        if (query) {
            for (const [key, value] of Object.entries(query)) {
                if (value !== undefined) {
                    url.searchParams.set(key, String(value))
                }
            }
        }

        return {
            url: url.toString(),
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
        error: Record<string, unknown> | undefined,
        message: string | undefined,
        headers: Headers | undefined
    ) {
        return APIError.generate(status, error, message, headers)
    }
}
