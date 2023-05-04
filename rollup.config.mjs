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
                optimizeDeps: {
                    include: ['graphql', 'js-sha3'],
                },
                minify: true,
            }),
            graphql(),
        ],
        output: [
            {
                file: `dist/spritz-api-client.js`,
                format: 'cjs',
                sourcemap: true,
            },
            {
                file: `dist/spritz-api-client.mjs`,
                format: 'es',
                sourcemap: true,
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
