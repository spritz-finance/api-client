import type { paths } from './__generated__/api'

export type RestPath = keyof paths
export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete'
export type RestMethod<P extends RestPath> = HttpMethod & keyof paths[P]

type Extract200<P extends RestPath, M extends RestMethod<P>> = paths[P][M] extends {
    responses: { 200: { content: { 'application/json': infer R } } }
}
    ? R
    : never

type Extract201<P extends RestPath, M extends RestMethod<P>> = paths[P][M] extends {
    responses: { 201: { content: { 'application/json': infer R } } }
}
    ? R
    : never

/** Extract the success (200/201) JSON response body for a path + method */
export type PathResponse<P extends RestPath, M extends RestMethod<P>> =
    Extract200<P, M> extends never ? Extract201<P, M> : Extract200<P, M> | Extract201<P, M>

/** Extract the JSON request body for a path + method */
export type PathRequestBody<P extends RestPath, M extends RestMethod<P>> = paths[P][M] extends {
    requestBody: { content: { 'application/json': infer B } }
}
    ? B
    : never

/** Extract query parameters for a path + method */
export type PathQuery<P extends RestPath, M extends RestMethod<P>> = paths[P][M] extends {
    parameters: { query?: infer Q }
}
    ? Q
    : never

/** Extract path parameters for a path + method */
export type PathParams<P extends RestPath, M extends RestMethod<P>> = paths[P][M] extends {
    parameters: { path: infer PP }
}
    ? PP
    : never
