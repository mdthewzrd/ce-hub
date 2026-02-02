/**
 * Vitest Configuration for Traderra Enhanced Journal Testing
 *
 * Optimized configuration for comprehensive testing including unit tests,
 * integration tests, and accessibility validation.
 */

import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],

  test: {
    // Test environment configuration
    environment: 'jsdom',
    setupFiles: ['./src/tests/setup.ts'],

    // Global test configuration
    globals: true,
    clearMocks: true,
    restoreMocks: true,

    // Test discovery and execution
    include: [
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'src/tests/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '**/*.e2e.{test,spec}.{js,ts,jsx,tsx}'
    ],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      include: [
        'src/components/**',
        'src/hooks/**',
        'src/services/**',
        'src/lib/**'
      ],
      exclude: [
        'src/**/*.d.ts',
        'src/**/*.test.{ts,tsx}',
        'src/**/*.spec.{ts,tsx}',
        'src/tests/**',
        'node_modules/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 85,
          lines: 85,
          statements: 85
        },
        // Specific thresholds for critical components
        'src/components/journal/': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/folderApi.ts': {
          branches: 95,
          functions: 95,
          lines: 95,
          statements: 95
        }
      }
    },

    // Performance and timeout configuration
    testTimeout: 10000,
    hookTimeout: 10000,
    teardownTimeout: 5000,

    // Parallel execution
    maxConcurrency: 4,
    minThreads: 1,
    maxThreads: 4,

    // Output configuration
    outputFile: {
      junit: './test-results/junit.xml',
      json: './test-results/results.json'
    },

    // Watch mode configuration
    watch: false,

    // Reporter configuration
    reporter: [
      'default',
      'junit',
      'json',
      ['html', { outputFile: './test-results/index.html' }]
    ],

    // Mock configuration
    deps: {
      external: ['@testing-library/jest-dom']
    }
  },

  // Path resolution for imports
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/components': path.resolve(__dirname, './src/components'),
      '@/hooks': path.resolve(__dirname, './src/hooks'),
      '@/services': path.resolve(__dirname, './src/services'),
      '@/lib': path.resolve(__dirname, './src/lib'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  },

  // Build configuration for testing
  define: {
    'process.env.NODE_ENV': '"test"',
    'process.env.NEXT_PUBLIC_API_BASE_URL': '"http://localhost:6500"'
  }
})