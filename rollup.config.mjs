import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'
import graphql from '@rollup/plugin-graphql'

const bundle = (config) => ({
    ...config,
    input: 'src/index.ts',
})

export default [
    bundle({
        plugins: [
            esbuild({
                target: 'esnext',
                optimizeDeps: {
                    include: [
                        'graphql',
                        'ethereum-cryptography/keccak',
                        'ethereum-cryptography/utils',
                    ],
                },
                minify: true,
            }),
            graphql(),
        ],
        output: [
            {
                file: `dist/spritz-api-client.js`,
                format: 'cjs',
            },
            {
                file: `dist/spritz-api-client.mjs`,
                format: 'es',
            },
        ],
        external: ['axios'],
    }),
    bundle({
        plugins: [dts()],
        output: {
            file: `dist/spritz-api-client.d.ts`,
            format: 'es',
        },
    }),
]
