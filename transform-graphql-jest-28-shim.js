const { process: upstreamProcess } = require('jest-transform-graphql')

const process = (...args) => {
    const code = upstreamProcess(...args)
    return { code }
}

module.exports = { process }
