import graphql from '@rollup/plugin-graphql'
import dts from 'rollup-plugin-dts'
import esbuild from 'rollup-plugin-esbuild'

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
                    include: ['graphql', 'viem', 'zod'],
                },
                minify: true,
            }),
            graphql(),
        ],
        output: [
            {
                file: `dist/spritz-api-client.cjs`,
                format: 'cjs',
            },
            {
                file: `dist/spritz-api-client.mjs`,
                format: 'es',
            },
        ],
        external: ['@solana/web3.js'],
    }),
    bundle({
        plugins: [dts()],
        output: {
            file: `dist/spritz-api-client.d.ts`,
            format: 'es',
        },
    }),
]
