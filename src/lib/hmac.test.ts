import { describe, expect, it, vi } from 'vitest'
import {
    canonicalizeQueryString,
    buildPathWithQuery,
    generateHmacSignature,
    stampRequest,
} from './hmac'

describe('HMAC Request Stamping', () => {
    const testSecret = 'test-secret-key-12345'
    const testRequest = {
        method: 'POST',
        path: '/v1/transactions',
        body: '{"amount":100}',
    }

    describe('canonicalizeQueryString', () => {
        it('returns empty string for URL without query params', () => {
            const url = new URL('https://api.example.com/v1/users/me')
            expect(canonicalizeQueryString(url)).toBe('')
        })

        it('sorts params alphabetically by key', () => {
            const url = new URL(
                'https://api.example.com/v1/on-ramps?token=USDC&limit=20&network=ethereum',
            )
            expect(canonicalizeQueryString(url)).toBe('limit=20&network=ethereum&token=USDC')
        })

        it('URL-encodes special characters', () => {
            const url = new URL(
                'https://api.example.com/v1/test?filter=a+b&query=hello%26world',
            )
            expect(canonicalizeQueryString(url)).toBe('filter=a%20b&query=hello%26world')
        })

        it('handles single param', () => {
            const url = new URL('https://api.example.com/v1/on-ramps?limit=20')
            expect(canonicalizeQueryString(url)).toBe('limit=20')
        })

        it('handles empty value', () => {
            const url = new URL('https://api.example.com/v1/test?key=')
            expect(canonicalizeQueryString(url)).toBe('key=')
        })

        it('produces consistent output regardless of param order', () => {
            const url1 = new URL(
                'https://api.example.com/v1/on-ramps?network=ethereum&token=USDC&limit=20',
            )
            const url2 = new URL(
                'https://api.example.com/v1/on-ramps?limit=20&token=USDC&network=ethereum',
            )
            expect(canonicalizeQueryString(url1)).toBe(canonicalizeQueryString(url2))
        })
    })

    describe('buildPathWithQuery', () => {
        it('returns just path for URL without query params', () => {
            const url = new URL('https://api.example.com/v1/users/me')
            expect(buildPathWithQuery(url)).toBe('/v1/users/me')
        })

        it('returns path with canonicalized query', () => {
            const url = new URL(
                'https://api.example.com/v1/on-ramps?token=USDC&limit=20&network=ethereum',
            )
            expect(buildPathWithQuery(url)).toBe(
                '/v1/on-ramps?limit=20&network=ethereum&token=USDC',
            )
        })

        it('produces same output regardless of query param order', () => {
            const url1 = new URL(
                'https://api.example.com/v1/on-ramps?network=ethereum&token=USDC&limit=20',
            )
            const url2 = new URL(
                'https://api.example.com/v1/on-ramps?limit=20&token=USDC&network=ethereum',
            )
            expect(buildPathWithQuery(url1)).toBe(buildPathWithQuery(url2))
        })
    })

    describe('generateHmacSignature', () => {
        it('generates a signature with sha256= prefix', async () => {
            const signature = await generateHmacSignature(testSecret, Date.now(), testRequest)
            expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/)
        })

        it('generates consistent signatures for same inputs', async () => {
            const timestamp = 1700000000000
            const sig1 = await generateHmacSignature(testSecret, timestamp, testRequest)
            const sig2 = await generateHmacSignature(testSecret, timestamp, testRequest)
            expect(sig1).toBe(sig2)
        })

        it('generates different signatures for different timestamps', async () => {
            const sig1 = await generateHmacSignature(testSecret, 1700000000000, testRequest)
            const sig2 = await generateHmacSignature(testSecret, 1700000000001, testRequest)
            expect(sig1).not.toBe(sig2)
        })

        it('generates different signatures for different secrets', async () => {
            const timestamp = 1700000000000
            const sig1 = await generateHmacSignature('secret1', timestamp, testRequest)
            const sig2 = await generateHmacSignature('secret2', timestamp, testRequest)
            expect(sig1).not.toBe(sig2)
        })

        it('generates different signatures for different bodies', async () => {
            const timestamp = 1700000000000
            const sig1 = await generateHmacSignature(testSecret, timestamp, {
                ...testRequest,
                body: '{"amount":100}',
            })
            const sig2 = await generateHmacSignature(testSecret, timestamp, {
                ...testRequest,
                body: '{"amount":200}',
            })
            expect(sig1).not.toBe(sig2)
        })

        it('handles requests without body', async () => {
            const signature = await generateHmacSignature(testSecret, Date.now(), {
                method: 'GET',
                path: '/v1/users',
            })
            expect(signature).toMatch(/^sha256=[0-9a-f]{64}$/)
        })

        it('normalizes HTTP method to uppercase', async () => {
            const timestamp = 1700000000000
            const sig1 = await generateHmacSignature(testSecret, timestamp, {
                method: 'post',
                path: '/v1/test',
            })
            const sig2 = await generateHmacSignature(testSecret, timestamp, {
                method: 'POST',
                path: '/v1/test',
            })
            expect(sig1).toBe(sig2)
        })

        it('includes canonicalized query string in signature', async () => {
            const timestamp = 1700000000000
            const url = new URL(
                'https://api.example.com/v1/on-ramps?token=USDC&limit=20&network=ethereum',
            )
            const sig = await generateHmacSignature(testSecret, timestamp, {
                method: 'GET',
                path: buildPathWithQuery(url),
            })
            expect(sig).toMatch(/^sha256=[0-9a-f]{64}$/)
        })

        it('generates same signature regardless of query param order', async () => {
            const timestamp = 1700000000000
            const url1 = new URL(
                'https://api.example.com/v1/on-ramps?network=ethereum&token=USDC&limit=20',
            )
            const url2 = new URL(
                'https://api.example.com/v1/on-ramps?limit=20&token=USDC&network=ethereum',
            )

            const sig1 = await generateHmacSignature(testSecret, timestamp, {
                method: 'GET',
                path: buildPathWithQuery(url1),
            })
            const sig2 = await generateHmacSignature(testSecret, timestamp, {
                method: 'GET',
                path: buildPathWithQuery(url2),
            })
            expect(sig1).toBe(sig2)
        })

        it('generates different signatures when query params differ', async () => {
            const timestamp = 1700000000000
            const sigWithout = await generateHmacSignature(testSecret, timestamp, {
                method: 'GET',
                path: '/v1/on-ramps',
            })
            const url = new URL('https://api.example.com/v1/on-ramps?limit=20')
            const sigWith = await generateHmacSignature(testSecret, timestamp, {
                method: 'GET',
                path: buildPathWithQuery(url),
            })
            expect(sigWithout).not.toBe(sigWith)
        })
    })

    describe('stampRequest', () => {
        it('returns all required HMAC headers', async () => {
            const headers = await stampRequest(
                'int_abc123',
                testSecret,
                'POST',
                'https://platform.spritz.finance/v1/transactions',
                '{"amount":100}',
            )

            expect(headers).toHaveProperty('X-Integrator-Key', 'int_abc123')
            expect(headers).toHaveProperty('X-Signature')
            expect(headers).toHaveProperty('X-Timestamp')
            expect(headers['X-Signature']).toMatch(/^sha256=[0-9a-f]{64}$/)
            expect(Number(headers['X-Timestamp'])).toBeGreaterThan(0)
        })

        it('uses current timestamp', async () => {
            const before = Date.now()
            const headers = await stampRequest(
                'int_abc123',
                testSecret,
                'GET',
                'https://platform.spritz.finance/v1/users/me',
            )
            const after = Date.now()
            const ts = Number(headers['X-Timestamp'])
            expect(ts).toBeGreaterThanOrEqual(before)
            expect(ts).toBeLessThanOrEqual(after)
        })

        it('canonicalizes query params in URL', async () => {
            vi.spyOn(Date, 'now').mockReturnValue(1700000000000)

            const headers1 = await stampRequest(
                'int_abc123',
                testSecret,
                'GET',
                'https://platform.spritz.finance/v1/on-ramps?token=USDC&limit=20',
            )
            const headers2 = await stampRequest(
                'int_abc123',
                testSecret,
                'GET',
                'https://platform.spritz.finance/v1/on-ramps?limit=20&token=USDC',
            )

            expect(headers1['X-Signature']).toBe(headers2['X-Signature'])

            vi.restoreAllMocks()
        })

        it('handles null body same as undefined', async () => {
            vi.spyOn(Date, 'now').mockReturnValue(1700000000000)

            const headers1 = await stampRequest(
                'int_abc123',
                testSecret,
                'GET',
                'https://platform.spritz.finance/v1/users/me',
                null,
            )
            const headers2 = await stampRequest(
                'int_abc123',
                testSecret,
                'GET',
                'https://platform.spritz.finance/v1/users/me',
            )

            expect(headers1['X-Signature']).toBe(headers2['X-Signature'])

            vi.restoreAllMocks()
        })
    })

    describe('cross-compatibility with platform server', () => {
        // Golden test vectors computed using the platform's Node crypto implementation:
        //   crypto.createHmac('sha256', secret).update(payload).digest('hex')
        // Payload format: `{timestamp}.{METHOD}.{path}.{bodyHash}`

        it('matches platform signature for POST with body', async () => {
            const sig = await generateHmacSignature(testSecret, 1700000000000, {
                method: 'POST',
                path: '/v1/transactions',
                body: '{"amount":100}',
            })
            expect(sig).toBe(
                'sha256=12dcf2a7647146ce08a465349ab03f992d8a18542cd576d40a9eb8e2958d4b9f',
            )
        })

        it('matches platform signature for GET without body', async () => {
            const sig = await generateHmacSignature(testSecret, 1700000000000, {
                method: 'GET',
                path: '/v1/users/me',
            })
            expect(sig).toBe(
                'sha256=147ecf7209d3d91ca62d3cc190473954120d305b85c007b50976d4fe88551c52',
            )
        })

        it('matches platform signature for GET with canonicalized query params', async () => {
            const url = new URL(
                'https://api.example.com/v1/on-ramps?token=USDC&limit=20&network=ethereum',
            )
            const sig = await generateHmacSignature(testSecret, 1700000000000, {
                method: 'GET',
                path: buildPathWithQuery(url),
            })
            expect(sig).toBe(
                'sha256=77cc4cdebcc5256d682fb3974346c15e84b289f6a4bb454adaa7f9495d3bbc55',
            )
        })
    })
})
