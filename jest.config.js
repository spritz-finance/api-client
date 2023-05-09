module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',

    transform: {
        '^.+\\.ts?$': 'ts-jest',
        '\\.(gql|graphql)$': './transform-graphql-jest-28-shim.js',
    },
    transformIgnorePatterns: ['<rootDir>/node_modules/'],
}
