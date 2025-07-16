import { afterAll, afterEach, beforeAll } from 'vitest'
import { setupServer } from 'msw/node'
import { graphqlHandlers } from './mocks/graphqlHandlers'

// Setup MSW server with only GraphQL handlers
export const server = setupServer(...graphqlHandlers)

// Start server before all tests
beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' })
})

// Reset handlers after each test
afterEach(() => {
    server.resetHandlers()
})

// Clean up after all tests
afterAll(() => {
    server.close()
})