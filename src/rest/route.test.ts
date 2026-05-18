import { describe, expect, expectTypeOf, it } from 'vitest'
import {
    buildRestPath,
    normalizeRestQuery,
    restRoute,
    type RestRoute,
    type RestRouteOptions,
} from './route'
import type { PathRequestBody } from './types'

describe('REST route builder', () => {
    it('builds paths with encoded path parameters', () => {
        expect(
            restRoute('/v1/funding-sources/{fundingSourceId}', 'get', {
                params: { fundingSourceId: 'fs_123/with space' },
            })
        ).toEqual({
            method: 'get',
            path: '/v1/funding-sources/fs_123%2Fwith%20space',
        })
    })

    it('rejects missing path parameters', () => {
        expect(() => buildRestPath('/v1/funding-sources/{fundingSourceId}')).toThrow(
            'Missing path parameter: fundingSourceId'
        )
    })

    it('normalizes scalar query parameters', () => {
        expect(
            normalizeRestQuery({
                limit: 50,
                cursor: undefined,
                lossOnly: 'true',
                includeDisabled: false,
            })
        ).toEqual({
            limit: 50,
            lossOnly: 'true',
            includeDisabled: false,
        })
    })

    it('rejects unsupported query parameter values', () => {
        expect(() => normalizeRestQuery({ ids: ['one', 'two'] })).toThrow(
            'Unsupported query parameter value for ids'
        )
    })

    it('includes request bodies unchanged', () => {
        expect(
            restRoute('/v1/sandbox/bypass-kyc', 'post', {
                body: { country: 'US' },
            })
        ).toEqual({
            method: 'post',
            path: '/v1/sandbox/bypass-kyc',
            body: { country: 'US' },
        })
    })

    it('binds the generated operation type to the route', () => {
        const route = restRoute('/v1/funding-sources/{fundingSourceId}', 'get', {
            params: { fundingSourceId: 'fs_123' },
        })

        expectTypeOf(route).toMatchTypeOf<
            RestRoute<'/v1/funding-sources/{fundingSourceId}', 'get'>
        >()
    })

    it('keeps required request bodies required at the route seam', () => {
        type CreateDepositBody = PathRequestBody<'/v1/deposits/direct', 'post'>
        type CreateDepositOptions = RestRouteOptions<'/v1/deposits/direct', 'post'>

        expectTypeOf<CreateDepositOptions>().toMatchTypeOf<{ body: CreateDepositBody }>()
    })

    it('allows omitting bodies that the generated contract accepts as empty objects', () => {
        expectTypeOf<{}>().toMatchTypeOf<RestRouteOptions<'/v1/bank-accounts/link-token', 'post'>>()
    })
})
