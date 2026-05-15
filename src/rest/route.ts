import type {
    HttpMethod,
    PathParams,
    PathQuery,
    PathRequestBody,
    RestMethod,
    RestPath,
} from './types'

type IsNever<T> = [T] extends [never] ? true : false

type RestPathParamsOption<P extends RestPath, M extends RestMethod<P>> =
    IsNever<PathParams<P, M>> extends true ? { params?: never } : { params: PathParams<P, M> }

type RestBodyOption<P extends RestPath, M extends RestMethod<P>> =
    IsNever<PathRequestBody<P, M>> extends true
        ? { body?: never }
        : { body?: PathRequestBody<P, M> }

type RestQueryOption<P extends RestPath, M extends RestMethod<P>> =
    IsNever<PathQuery<P, M>> extends true ? { query?: never } : { query?: PathQuery<P, M> }

type RestRouteNeedsOptions<P extends RestPath, M extends RestMethod<P>> =
    IsNever<PathParams<P, M>> extends false ? true : false

export type RestQueryValue = string | number | boolean | undefined
export type RestQuery = Record<string, RestQueryValue>

export type RestRouteOptions<P extends RestPath, M extends RestMethod<P>> = RestPathParamsOption<
    P,
    M
> &
    RestBodyOption<P, M> &
    RestQueryOption<P, M>

export type RestRoute<P extends RestPath = RestPath, M extends RestMethod<P> = RestMethod<P>> = {
    method: M
    path: string
    body?: PathRequestBody<P, M>
    query?: RestQuery
}

function pathParamsAsRecord(params: unknown): Record<string, unknown> | undefined {
    if (!params || typeof params !== 'object') return undefined
    return params as Record<string, unknown>
}

export function buildRestPath(path: string, params?: Record<string, unknown>) {
    return path.replace(/\{([^}]+)\}/g, (_, key: string) => {
        if (!params || !(key in params)) {
            throw new Error(`Missing path parameter: ${key}`)
        }

        const value = params[key]
        if (value === undefined || value === null) {
            throw new Error(`Missing path parameter: ${key}`)
        }

        return encodeURIComponent(String(value))
    })
}

export function normalizeRestQuery(query?: Record<string, unknown>): RestQuery | undefined {
    if (!query) return undefined

    const entries: [string, string | number | boolean][] = []

    for (const [key, value] of Object.entries(query)) {
        if (value === undefined) continue

        if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean') {
            throw new Error(`Unsupported query parameter value for ${key}`)
        }

        entries.push([key, value])
    }

    return entries.length > 0 ? Object.fromEntries(entries) : undefined
}

export function restRoute<P extends RestPath, M extends RestMethod<P>>(
    path: P,
    method: M,
    ...[options]: RestRouteNeedsOptions<P, M> extends true
        ? [options: RestRouteOptions<P, M>]
        : [options?: RestRouteOptions<P, M>]
): RestRoute<P, M> {
    const params = pathParamsAsRecord(options?.params)
    const routePath = buildRestPath(path, params)
    const query = normalizeRestQuery(options?.query as Record<string, unknown> | undefined)
    const body = options?.body as PathRequestBody<P, M> | undefined

    return {
        method,
        path: routePath,
        ...(body !== undefined ? { body } : {}),
        ...(query ? { query } : {}),
    }
}

export type { HttpMethod, RestMethod, RestPath }
