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
      // UPGRADED: Enterprise coverage thresholds (was 40%, now 85%)
      all: true,
      statements: 85,
      branches: 85,
      functions: 85,
      lines: 85,
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

/**
 * SOLUTION ENTERPRISE
 * 
 * Features adicionais:
 * - E2E testing (Playwright integration)
 * - Performance benchmarking
 * - Accessibility testing (axe-core)
 * - Visual regression testing (Percy/Chromatic)
 * - Parallel execution (CI optimization)
 * - Test sharding (large test suites)
 * 
 * Example:
 * ```typescript
 * export default defineConfig({
 *   test: {
 *     coverage: {
 *       statements: 80,
 *       branches: 80,
 *       functions: 80,
 *       lines: 80,
 *     },
 *     benchmark: {
 *       include: ['**/*.bench.ts'],
 *     },
 *     reporters: ['default', 'html', 'junit'],
 *   },
 * });
 * ```
 */

/**
 * CHECKLIST UI/UX
 * 
 * Testing UI components:
 * - [ ] Snapshot tests (visual regression)
 * - [ ] Accessibility tests (axe-core)
 * - [ ] Interaction tests (user-event)
 * - [ ] Responsive tests (viewport sizes)
 * - [ ] Keyboard navigation tests
 * - [ ] Screen reader compatibility
 */

/**
 * VALIDAÇÃO
 * 
 * Métricas alvo:
 * - [ ] Coverage > 40% (MVP) / 80% (Enterprise)
 * - [ ] Tests run in < 30s (MVP) / < 2min (Enterprise)
 * - [ ] Zero flaky tests
 * - [ ] All critical paths covered
 */

/**
 * PRÓXIMOS PASSOS
 * 
 * Week 1:
 * - [ ] Implement unit tests (40% coverage)
 * - [ ] Setup coverage reports
 * - [ ] CI integration
 * 
 * Week 2:
 * - [ ] Integration tests (5+ flows)
 * - [ ] Component tests
 * - [ ] Performance benchmarks
 */
