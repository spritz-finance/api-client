import { defineConfig } from 'vitest/config'
import graphqlLoader from 'vite-plugin-graphql-loader'

export default defineConfig({
  plugins: [graphqlLoader()],
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    setupFiles: ['src/test/setup.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.js',
        '**/__types__/**',
        'src/test/**'
      ]
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
})