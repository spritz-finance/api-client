import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.ts'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      provider: 'v8',
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.test.ts',
        '**/*.config.js',
        '**/__types__/**'
      ]
    }
  },
  define: {
    'import.meta.vitest': 'undefined'
  }
})