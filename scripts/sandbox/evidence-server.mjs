#!/usr/bin/env node
import { createServer } from 'node:http'
import { createHash, createHmac } from 'node:crypto'
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises'
import { dirname, extname, resolve, sep } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const host = process.env.EVIDENCE_HOST || '127.0.0.1'
const port = Number(process.env.PORT || process.env.EVIDENCE_PORT || 3001)
const staticRoot = dirname(fileURLToPath(import.meta.url))
const outputDir = resolve(process.cwd(), process.env.EVIDENCE_DIR || 'qc/evidence')
const maxBodyBytes = 5 * 1024 * 1024
const legacySandboxBaseUrl = 'https://api-staging.spritz.finance'
const sandboxRestBaseUrl = 'https://sandbox.spritz.finance'
const sdkModulePath = resolve(staticRoot, '../../dist/spritz-api-client.mjs')
let sdkModulePromise = null

function sendJson(res, status, body) {
    res.writeHead(status, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'content-type',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json',
    })
    res.end(JSON.stringify(body))
}

function contentType(filePath) {
    switch (extname(filePath)) {
        case '.html':
            return 'text/html; charset=utf-8'
        case '.js':
        case '.mjs':
            return 'text/javascript; charset=utf-8'
        case '.css':
            return 'text/css; charset=utf-8'
        case '.json':
            return 'application/json; charset=utf-8'
        default:
            return 'application/octet-stream'
    }
}

async function sendStatic(req, res, pathname) {
    const relativePath = pathname === '/' ? '/ach-onramp.html' : pathname
    const filePath = resolve(staticRoot, `.${relativePath}`)

    if (filePath !== staticRoot && !filePath.startsWith(`${staticRoot}${sep}`)) {
        sendJson(res, 403, { ok: false, error: 'Forbidden' })
        return
    }

    try {
        const fileStat = await stat(filePath)
        if (!fileStat.isFile()) {
            sendJson(res, 404, { ok: false, error: 'Not found' })
            return
        }

        res.writeHead(200, {
            'Cache-Control': 'no-store',
            'Content-Length': fileStat.size,
            'Content-Type': contentType(filePath),
        })

        if (req.method !== 'HEAD') {
            res.end(await readFile(filePath))
        } else {
            res.end()
        }
    } catch {
        sendJson(res, 404, { ok: false, error: 'Not found' })
    }
}

function safeFileName(value) {
    const base = String(value || `ach-qc-${new Date().toISOString()}`)
        .replace(/[:]/g, '-')
        .replace(/[^a-zA-Z0-9_.-]/g, '_')
        .replace(/\.json$/i, '')
        .slice(0, 160)
    return `${base || 'ach-qc-evidence'}.json`
}

function assertString(value, name) {
    if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error(`${name} is required`)
    }
    return value.trim()
}

function assertObject(value, name) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error(`${name} is required`)
    }
    return value
}

function optionalQuery(input) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) return undefined
    return 'query' in input ? input.query : input
}

async function readBody(req) {
    const chunks = []
    let size = 0

    for await (const chunk of req) {
        size += chunk.length
        if (size > maxBodyBytes) throw new Error('Evidence payload is too large')
        chunks.push(chunk)
    }

    return Buffer.concat(chunks).toString('utf8')
}

async function readJsonBody(req) {
    const body = await readBody(req)
    if (!body) return {}
    return JSON.parse(body)
}

function sha256Hex(data) {
    return createHash('sha256').update(data).digest('hex')
}

function hmacSha256Hex(secret, data) {
    return createHmac('sha256', secret).update(data).digest('hex')
}

function stampRequest(integrationKey, integratorSecret, method, url, body) {
    const parsed = new URL(url)
    const params = [...parsed.searchParams.keys()].sort()
    const qs = params
        .map(
            (key) =>
                `${encodeURIComponent(key)}=${encodeURIComponent(parsed.searchParams.get(key))}`
        )
        .join('&')
    const path = qs ? `${parsed.pathname}?${qs}` : parsed.pathname
    const timestamp = Date.now()
    const bodyHash = body ? sha256Hex(body) : ''
    const payload = `${timestamp}.${method.toUpperCase()}.${path}.${bodyHash}`
    const signature = `sha256=${hmacSha256Hex(integratorSecret, payload)}`

    return {
        'X-Integrator-Key': integrationKey,
        'X-Signature': signature,
        'X-Timestamp': String(timestamp),
    }
}

async function requestJson(url, options) {
    const response = await fetch(url, options)
    const text = await response.text()
    const body = text ? JSON.parse(text) : null

    if (!response.ok) {
        const message = body?.detail || body?.title || body?.error || `HTTP ${response.status}`
        throw new Error(`${message} (${response.status})`)
    }

    return body
}

async function createSandboxUser(req, res) {
    const body = await readJsonBody(req)
    const integrationKey = assertString(body.integrationKey, 'integrationKey')
    const email =
        body.fresh === true
            ? `ach-qc+${Date.now()}@spritz.finance`
            : typeof body.email === 'string' && body.email.trim()
              ? body.email.trim()
              : `ach-qc+${Date.now()}@spritz.finance`

    const user = await requestJson(`${legacySandboxBaseUrl}/users/integration`, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            'X-INTEGRATION-KEY': integrationKey,
        },
        body: JSON.stringify({ email }),
    })

    sendJson(res, 200, {
        userId: user.userId,
        email: user.email,
        apiKey: user.apiKey,
    })
}

async function bypassSandboxKyc(req, res) {
    const body = await readJsonBody(req)
    const integrationKey = assertString(body.integrationKey, 'integrationKey')
    const integratorSecret = assertString(body.integratorSecret, 'integratorSecret')
    const apiKey = assertString(body.apiKey, 'apiKey')
    const country =
        typeof body.country === 'string' && body.country.trim() ? body.country.trim() : 'US'
    const url = `${sandboxRestBaseUrl}/v1/sandbox/bypass-kyc`
    const requestBody = JSON.stringify({ country })

    const result = await requestJson(url, {
        method: 'POST',
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...stampRequest(integrationKey, integratorSecret, 'POST', url, requestBody),
        },
        body: requestBody,
    })

    sendJson(res, 200, { country, result })
}

function selectedResponseHeaders(headers) {
    const selected = {}
    for (const name of [
        'x-request-id',
        'x-trace-id',
        'x-correlation-id',
        'x-amzn-requestid',
        'x-amzn-trace-id',
        'request-id',
        'trace-id',
    ]) {
        const value = headers.get(name)
        if (value) selected[name] = value
    }
    return selected
}

async function sandboxApiProxy(req, res) {
    const body = await readJsonBody(req)
    const method = assertString(body.method, 'method').toUpperCase()
    const path = assertString(body.path, 'path')
    const integrationKey = assertString(body.integrationKey, 'integrationKey')
    const integratorSecret = assertString(body.integratorSecret, 'integratorSecret')
    const apiKey = assertString(body.apiKey, 'apiKey')

    if (!['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        throw new Error(`Unsupported method: ${method}`)
    }
    if (!path.startsWith('/v1/')) {
        throw new Error('Only /v1 sandbox API paths are allowed')
    }

    const url = `${sandboxRestBaseUrl}${path}`
    const requestBody =
        body.body === undefined || body.body === null ? null : JSON.stringify(body.body)
    const response = await fetch(url, {
        method,
        headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
            ...stampRequest(integrationKey, integratorSecret, method, url, requestBody),
        },
        ...(requestBody ? { body: requestBody } : {}),
    })
    const text = await response.text()
    let responseBody = null

    try {
        responseBody = text ? JSON.parse(text) : null
    } catch {
        responseBody = text
    }

    sendJson(res, 200, {
        status: response.status,
        ok: response.ok,
        headers: selectedResponseHeaders(response.headers),
        body: responseBody,
    })
}

async function loadSdkModule() {
    try {
        sdkModulePromise ??= import(pathToFileURL(sdkModulePath).href)
        return await sdkModulePromise
    } catch {
        sdkModulePromise = null
        throw new Error(
            `Unable to load built SDK from ${sdkModulePath}. Run yarn build, then restart the evidence server.`
        )
    }
}

async function createSdkClient({ integrationKey, integratorSecret, apiKey }) {
    const { Environment, SpritzApiClient } = await loadSdkModule()
    return SpritzApiClient.initialize({
        environment: Environment.Sandbox,
        integrationKey,
        integratorSecret,
        apiKey,
    })
}

async function invokeSdkAction(client, action, input) {
    switch (action) {
        case 'bankAccount.createLinkToken':
            return client.bankAccount.createLinkToken()
        case 'bankAccount.completeLinking':
            return client.bankAccount.completeLinking(assertObject(input, 'input'))
        case 'fundingSource.list':
            return client.fundingSource.list()
        case 'fundingSource.get':
            return client.fundingSource.get(assertString(input?.fundingSourceId, 'fundingSourceId'))
        case 'fundingSource.getDepositLimits':
            return client.fundingSource.getDepositLimits(
                assertString(input?.fundingSourceId, 'fundingSourceId')
            )
        case 'deposit.prepare':
            return client.deposit.prepare(assertObject(input, 'input'))
        case 'deposit.create':
            return client.deposit.create(assertObject(input, 'input'))
        case 'sandbox.bypassKyc':
            return client.sandbox.bypassKyc(input?.country ? { country: input.country } : undefined)
        case 'sandbox.createDepositWithReturn':
            return client.sandbox.createDepositWithReturn(assertObject(input, 'input'))
        case 'onrampPayment.list':
            return client.onrampPayment.list(optionalQuery(input))
        case 'onrampPayment.get':
            return client.onrampPayment.get(assertString(input?.onRampId, 'onRampId'))
        case 'achDebitReturn.list':
            return client.achDebitReturn.list(optionalQuery(input))
        case 'achDebitReturn.get':
            return client.achDebitReturn.get(assertString(input?.returnId, 'returnId'))
        default:
            throw new Error(`Unsupported SDK action: ${action}`)
    }
}

function serializeSdkError(error) {
    if (error instanceof Error) {
        return {
            name: error.name,
            message: error.message,
            status: 'status' in error ? error.status : undefined,
            headers: 'headers' in error ? error.headers : undefined,
            timestamp: 'timestamp' in error ? error.timestamp : undefined,
            error: 'error' in error ? error.error : undefined,
            cause:
                error.cause instanceof Error
                    ? { name: error.cause.name, message: error.cause.message }
                    : undefined,
        }
    }

    return {
        name: 'Error',
        message: String(error),
    }
}

async function sdkCall(req, res) {
    const body = await readJsonBody(req)
    const action = assertString(body.action, 'action')
    const integrationKey = assertString(body.integrationKey, 'integrationKey')
    const integratorSecret = assertString(body.integratorSecret, 'integratorSecret')
    const apiKey = assertString(body.apiKey, 'apiKey')

    try {
        const client = await createSdkClient({ integrationKey, integratorSecret, apiKey })
        const result = await invokeSdkAction(client, action, body.input)

        sendJson(res, 200, {
            ok: true,
            action,
            body: result ?? null,
        })
    } catch (error) {
        sendJson(res, 200, {
            ok: false,
            action,
            error: serializeSdkError(error),
        })
    }
}

function validateEvidence(payload) {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Evidence payload must be an object')
    }
    if (!Array.isArray(payload.events)) {
        throw new Error('Evidence payload must include events[]')
    }
    if (payload.environment !== 'sandbox') {
        throw new Error('Evidence payload must be for sandbox')
    }
}

const server = createServer(async (req, res) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`)

    if (req.method === 'OPTIONS') {
        sendJson(res, 204, {})
        return
    }

    if (req.method === 'GET' && url.pathname === '/health') {
        sendJson(res, 200, { ok: true, outputDir })
        return
    }

    if ((req.method === 'GET' || req.method === 'HEAD') && url.pathname !== '/evidence') {
        await sendStatic(req, res, decodeURIComponent(url.pathname))
        return
    }

    if (req.method === 'POST' && url.pathname === '/sandbox-user/create') {
        try {
            await createSandboxUser(req, res)
        } catch (error) {
            sendJson(res, 400, {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to create sandbox user',
            })
        }
        return
    }

    if (req.method === 'POST' && url.pathname === '/sandbox-user/bypass-kyc') {
        try {
            await bypassSandboxKyc(req, res)
        } catch (error) {
            sendJson(res, 400, {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to bypass sandbox KYC',
            })
        }
        return
    }

    if (req.method === 'POST' && url.pathname === '/sandbox-api') {
        try {
            await sandboxApiProxy(req, res)
        } catch (error) {
            sendJson(res, 400, {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to proxy sandbox API call',
            })
        }
        return
    }

    if (req.method === 'POST' && url.pathname === '/sdk-call') {
        try {
            await sdkCall(req, res)
        } catch (error) {
            sendJson(res, 400, {
                ok: false,
                error: error instanceof Error ? error.message : 'Failed to run SDK call',
            })
        }
        return
    }

    if (req.method !== 'POST' || url.pathname !== '/evidence') {
        sendJson(res, 404, { ok: false, error: 'Not found' })
        return
    }

    try {
        const payload = await readJsonBody(req)
        validateEvidence(payload)

        await mkdir(outputDir, { recursive: true })
        const filePath = resolve(outputDir, safeFileName(payload.runId))
        await writeFile(
            filePath,
            `${JSON.stringify({ ...payload, receivedAt: new Date().toISOString() }, null, 2)}\n`
        )

        sendJson(res, 200, { ok: true, path: filePath })
    } catch (error) {
        sendJson(res, 400, {
            ok: false,
            error: error instanceof Error ? error.message : 'Invalid evidence payload',
        })
    }
})

server.listen(port, host, () => {
    console.log(`ACH QC example app listening at http://${host}:${port}/ach-onramp.html`)
    console.log(`ACH QC evidence receiver listening at http://${host}:${port}/evidence`)
    console.log(`Writing evidence to ${outputDir}`)
})
