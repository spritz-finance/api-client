import { DocumentNode, OperationDefinitionNode } from 'graphql'

/**
 * Maximum allowed query depth to prevent deeply nested queries
 */
const MAX_QUERY_DEPTH = 10

/**
 * Maximum allowed query complexity (rough estimate based on field count)
 */
const MAX_QUERY_COMPLEXITY = 100

/**
 * Validates a GraphQL query to ensure it's safe to execute
 */
export function validateGraphQLQuery(query: DocumentNode): void {
    if (!query || !query.definitions) {
        throw new Error('Invalid GraphQL query: missing definitions')
    }

    // Check for multiple operations (potential attack vector)
    const operationDefinitions = query.definitions.filter(
        (def) => def.kind === 'OperationDefinition'
    ) as OperationDefinitionNode[]

    if (operationDefinitions.length > 1) {
        throw new Error('Invalid GraphQL query: multiple operations not allowed')
    }

    if (operationDefinitions.length === 0) {
        throw new Error('Invalid GraphQL query: no operation definition found')
    }

    const operation = operationDefinitions[0]

    // Validate query depth
    const depth = calculateQueryDepth(operation as OperationDefinitionNode)
    if (depth > MAX_QUERY_DEPTH) {
        throw new Error(`GraphQL query too deep: ${depth} levels (max: ${MAX_QUERY_DEPTH})`)
    }

    // Validate query complexity
    const complexity = calculateQueryComplexity(operation as OperationDefinitionNode)
    if (complexity > MAX_QUERY_COMPLEXITY) {
        throw new Error(
            `GraphQL query too complex: ${complexity} fields (max: ${MAX_QUERY_COMPLEXITY})`
        )
    }

    // Validate operation type
    if (operation?.operation !== 'query' && operation?.operation !== 'mutation') {
        throw new Error(`Invalid GraphQL operation type: ${operation?.operation}`)
    }
}

/**
 * Calculates the depth of a GraphQL query
 */
function calculateQueryDepth(operation: OperationDefinitionNode): number {
    if (!operation.selectionSet) {
        return 0
    }

    function getDepth(selectionSet: any): number {
        let maxDepth = 0

        for (const selection of selectionSet.selections) {
            if (selection.kind === 'Field' && selection.selectionSet) {
                const depth = 1 + getDepth(selection.selectionSet)
                maxDepth = Math.max(maxDepth, depth)
            } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
                const depth = getDepth(selection.selectionSet)
                maxDepth = Math.max(maxDepth, depth)
            } else if (selection.kind === 'FragmentSpread') {
                // For fragment spreads, we assume a depth of 1 for safety
                maxDepth = Math.max(maxDepth, 1)
            }
        }

        return maxDepth
    }

    return getDepth(operation.selectionSet)
}

/**
 * Calculates the complexity of a GraphQL query (rough estimate)
 */
function calculateQueryComplexity(operation: OperationDefinitionNode): number {
    if (!operation.selectionSet) {
        return 0
    }

    function getComplexity(selectionSet: any): number {
        let complexity = 0

        for (const selection of selectionSet.selections) {
            complexity += 1 // Each field adds to complexity

            if (selection.kind === 'Field' && selection.selectionSet) {
                complexity += getComplexity(selection.selectionSet)
            } else if (selection.kind === 'InlineFragment' && selection.selectionSet) {
                complexity += getComplexity(selection.selectionSet)
            } else if (selection.kind === 'FragmentSpread') {
                // For fragment spreads, we assume a complexity of 5 for safety
                complexity += 5
            }
        }

        return complexity
    }

    return getComplexity(operation.selectionSet)
}

/**
 * Sanitizes GraphQL variables to prevent injection attacks
 */
export function sanitizeGraphQLVariables(
    variables: Record<string, any> | undefined
): Record<string, any> | undefined {
    if (!variables) {
        return undefined
    }

    // Create a clean object to prevent prototype pollution
    const sanitized = Object.create(null)

    for (const [key, value] of Object.entries(variables)) {
        // Validate key format (should be valid GraphQL variable name)
        if (!isValidVariableName(key)) {
            throw new Error(`Invalid GraphQL variable name: ${key}`)
        }

        // Prevent prototype pollution attacks
        if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
            throw new Error(`Invalid property name: ${key}`)
        }

        // Recursively sanitize values
        sanitized[key] = sanitizeValue(value)
    }

    return sanitized
}

/**
 * Validates if a string is a valid GraphQL variable name
 */
function isValidVariableName(name: string): boolean {
    // GraphQL variable names must start with a letter or underscore
    // and can contain letters, numbers, and underscores
    return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name)
}

/**
 * Sanitizes a value to prevent injection attacks
 */
function sanitizeValue(value: any): any {
    if (value === null || value === undefined) {
        return value
    }

    if (typeof value === 'string') {
        // Basic string sanitization - remove control characters
        // eslint-disable-next-line no-control-regex
        return value.replace(/[\x00-\x1F\x7F]/g, '')
    }

    if (typeof value === 'number' || typeof value === 'boolean') {
        return value
    }

    if (Array.isArray(value)) {
        return value.map(sanitizeValue)
    }

    if (typeof value === 'object') {
        // Create a clean object to prevent prototype pollution
        const sanitized = Object.create(null)

        for (const [key, val] of Object.entries(value)) {
            // Validate property names
            if (
                typeof key !== 'string' ||
                key.includes('__proto__') ||
                key.includes('constructor')
            ) {
                throw new Error(`Invalid property name: ${key}`)
            }

            sanitized[key] = sanitizeValue(val)
        }

        return sanitized
    }

    // For any other type, convert to string and sanitize
    // eslint-disable-next-line no-control-regex
    return String(value).replace(/[\x00-\x1F\x7F]/g, '')
}
