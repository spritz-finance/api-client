const SIGNATURE_PREFIX = 'sha256='

function hexEncode(buffer: ArrayBuffer): string {
    return Array.from(new Uint8Array(buffer))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
}

async function sha256Hex(data: string): Promise<string> {
    const encoded = new TextEncoder().encode(data)
    const hash = await crypto.subtle.digest('SHA-256', encoded)
    return hexEncode(hash)
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
    const encoder = new TextEncoder()
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return hexEncode(signature)
}

/**
 * Percent-encode a query component so that the result is a fixed point of the
 * WHATWG URL parser.
 *
 * `encodeURIComponent` leaves `'` untouched but the URL parser escapes it in the
 * query of a special scheme, which would make the transmitted query string
 * differ from the signed one. Escaping it up front keeps the two identical.
 */
function encodeQueryComponent(value: string): string {
    return encodeURIComponent(value).replace(/'/g, '%27')
}

/**
 * Canonicalize query entries for HMAC signature.
 * Params are sorted lexicographically by key and percent-encoded.
 *
 * This is the single serializer used both to build the request URL and to sign
 * it, so the signed path always matches the requested path byte for byte.
 */
export function canonicalizeQueryEntries(entries: Iterable<[string, string]>): string {
    const params = [...entries]
    if (params.length === 0) return ''

    return params
        .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
        .map(([key, value]) => `${encodeQueryComponent(key)}=${encodeQueryComponent(value)}`)
        .join('&')
}

/**
 * Canonicalize query string for HMAC signature.
 * Params are sorted alphabetically by key and URL-encoded.
 */
export function canonicalizeQueryString(url: URL): string {
    return canonicalizeQueryEntries(url.searchParams)
}

/**
 * Build path with canonicalized query string for HMAC signature.
 */
export function buildPathWithQuery(url: URL): string {
    const canonicalQuery = canonicalizeQueryString(url)
    if (canonicalQuery === '') return url.pathname
    return `${url.pathname}?${canonicalQuery}`
}

/**
 * Generate HMAC-SHA256 signature for a request.
 *
 * Payload format: `{timestamp}.{METHOD}.{pathWithQuery}.{bodyHash}`
 * - Body is SHA256 hashed; empty string if no body
 * - Method is normalized to uppercase
 * - Path should include canonicalized query string (use buildPathWithQuery)
 */
export async function generateHmacSignature(
    secret: string,
    timestamp: number,
    request: { method: string; path: string; body?: string | null }
): Promise<string> {
    const bodyHash = request.body ? await sha256Hex(request.body) : ''
    const payload = `${timestamp}.${request.method.toUpperCase()}.${request.path}.${bodyHash}`
    const signature = await hmacSha256Hex(secret, payload)
    return `${SIGNATURE_PREFIX}${signature}`
}

export interface StampedHeaders {
    'X-Integrator-Key': string
    'X-Signature': string
    'X-Timestamp': string
}

/**
 * Stamp a REST API request with HMAC signature headers.
 *
 * Returns the three headers required for integrator HMAC auth:
 * - X-Integrator-Key: the integrator's API key
 * - X-Signature: sha256={hmac hex digest}
 * - X-Timestamp: Unix milliseconds
 */
export async function stampRequest(
    integratorKey: string,
    integratorSecret: string,
    method: string,
    url: string,
    body?: string | null
): Promise<StampedHeaders> {
    const parsedUrl = new URL(url)
    const path = buildPathWithQuery(parsedUrl)
    const timestamp = Date.now()
    const signature = await generateHmacSignature(integratorSecret, timestamp, {
        method,
        path,
        body,
    })

    return {
        'X-Integrator-Key': integratorKey,
        'X-Signature': signature,
        'X-Timestamp': String(timestamp),
    }
}
