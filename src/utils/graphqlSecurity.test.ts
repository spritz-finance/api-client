import { describe, it, expect } from 'vitest'
import { parse } from 'graphql'
import { validateGraphQLQuery, sanitizeGraphQLVariables } from './graphqlSecurity'

describe('GraphQL Security', () => {
    describe('validateGraphQLQuery', () => {
        it('should accept valid simple queries', () => {
            const query = parse(`
                query GetUser {
                    user {
                        id
                        name
                    }
                }
            `)

            expect(() => validateGraphQLQuery(query)).not.toThrow()
        })

        it('should reject queries that are too deep', () => {
            const deepQuery = parse(`
                query DeepQuery {
                    user {
                        posts {
                            comments {
                                replies {
                                    author {
                                        posts {
                                            comments {
                                                replies {
                                                    author {
                                                        posts {
                                                            comments {
                                                                id
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            `)

            expect(() => validateGraphQLQuery(deepQuery)).toThrow('GraphQL query too deep')
        })

        it('should reject multiple operations', () => {
            const multipleOpsQuery = parse(`
                query GetUser {
                    user { id }
                }
                
                query GetPost {
                    post { id }
                }
            `)

            expect(() => validateGraphQLQuery(multipleOpsQuery)).toThrow(
                'multiple operations not allowed'
            )
        })

        it('should reject subscriptions', () => {
            const subscriptionQuery = parse(`
                subscription {
                    messageAdded {
                        id
                        content
                    }
                }
            `)

            expect(() => validateGraphQLQuery(subscriptionQuery)).toThrow(
                'Invalid GraphQL operation type'
            )
        })

        it('should reject empty queries', () => {
            const emptyQuery = parse(`
                fragment UserFragment on User {
                    id
                    name
                }
            `)

            expect(() => validateGraphQLQuery(emptyQuery)).toThrow('no operation definition found')
        })
    })

    describe('sanitizeGraphQLVariables', () => {
        it('should return undefined for undefined input', () => {
            expect(sanitizeGraphQLVariables(undefined)).toBeUndefined()
        })

        it('should sanitize string variables', () => {
            const variables = {
                name: 'John\x00Doe',
                email: 'john@example.com',
            }

            const sanitized = sanitizeGraphQLVariables(variables)
            expect(sanitized?.['name']).toBe('JohnDoe')
            expect(sanitized?.['email']).toBe('john@example.com')
        })

        it('should reject invalid variable names', () => {
            const variables = {
                'invalid-name': 'value',
                validName: 'value',
            }

            expect(() => sanitizeGraphQLVariables(variables)).toThrow(
                'Invalid GraphQL variable name'
            )
        })

        it('should prevent prototype pollution', () => {
            // Test with constructor property which is a real prototype pollution vector
            const variables = {
                constructor: { polluted: true },
                validVar: 'value',
            }

            expect(() => sanitizeGraphQLVariables(variables)).toThrow(
                'Invalid property name: constructor'
            )
        })

        it('should handle nested objects', () => {
            const variables = {
                user: {
                    name: 'John\x01Doe',
                    age: 30,
                    active: true,
                },
            }

            const sanitized = sanitizeGraphQLVariables(variables)
            expect(sanitized?.['user']?.['name']).toBe('JohnDoe')
            expect(sanitized?.['user']?.['age']).toBe(30)
            expect(sanitized?.['user']?.['active']).toBe(true)
        })

        it('should handle arrays', () => {
            const variables = {
                tags: ['tag1\x00', 'tag2', 'tag3\x7F'],
            }

            const sanitized = sanitizeGraphQLVariables(variables)
            expect(sanitized?.['tags']).toEqual(['tag1', 'tag2', 'tag3'])
        })
    })
})
