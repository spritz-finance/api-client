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
        ['sign'],
    )
    const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
    return hexEncode(signature)
}

/**
 * Canonicalize query string for HMAC signature.
 * Params are sorted alphabetically by key and URL-encoded.
 */
export function canonicalizeQueryString(url: URL): string {
    const params = url.searchParams
    if ([...params].length === 0) return ''

    return [...params.keys()]
        .sort()
        .map((key) => {
            const value = params.get(key) ?? ''
            return `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
        })
        .join('&')
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
    request: { method: string; path: string; body?: string | null },
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
    body?: string | null,
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
