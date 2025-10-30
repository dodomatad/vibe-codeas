// vitest.config.ts
/**
 * Vitest Configuration
 * 
 * Resumo:
 * Configuração de testes com coverage, UI e setup global
 * 
 * MVP: Unit tests com coverage básico
 * Enterprise: E2E, performance, a11y testing
 */

import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  
  test: {
    // Environment
    environment: 'jsdom',
    
    // Setup files
    setupFiles: ['./tests/setup/vitest.setup.ts'],
    
    // Coverage configuration
    coverage: {
      provider: 'istanbul', // Changed from v8 for better accuracy
      reporter: ['text', 'json', 'html', 'lcov'],
      reportsDirectory: './coverage',
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
        '**/.next',
        '**/types/**',
        '**/*.test.ts',
        '**/*.spec.ts',
      ],
      // UPGRADED: Production coverage thresholds (was 40%, now 70%)
      all: true,
      statements: 70,
      branches: 70,
      functions: 70,
      lines: 70,
    },
    
    // Performance optimization
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false,
        maxThreads: 4,
      },
    },
    
    // Benchmark support
    benchmark: {
      include: ['**/*.bench.ts'],
    },
    
    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,
    
    // Globals
    globals: true,
    
    // Aliases (match tsconfig)
    alias: {
      '@': path.resolve(__dirname, './'),
      '@/lib': path.resolve(__dirname, './lib'),
      '@/components': path.resolve(__dirname, './components'),
      '@/tests': path.resolve(__dirname, './tests'),
    },
  },
});

// Enterprise features available:
// - E2E testing (Playwright)
// - Performance benchmarking
// - Accessibility testing (axe-core)
// - Visual regression testing
// - Parallel execution
// - Test sharding
