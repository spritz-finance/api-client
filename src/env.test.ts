import { describe, expect, it } from 'vitest'
import { Environment, normalizeEnvironment } from './env'

describe('Environment', () => {
    it('uses sandbox as the canonical public value', () => {
        expect(Environment.Sandbox).toBe('sandbox')
    })

    it('accepts staging only as a compatibility alias', () => {
        expect(normalizeEnvironment('staging')).toBe(Environment.Sandbox)
    })

    it('preserves canonical values', () => {
        expect(normalizeEnvironment(Environment.Sandbox)).toBe(Environment.Sandbox)
        expect(normalizeEnvironment(Environment.Production)).toBe(Environment.Production)
    })
})
