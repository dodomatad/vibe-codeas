# 🚀 Vibe Code Ultimate - Parte 2: Testes, UI e Infraestrutura

> **Implementação completa de testes, UI enterprise, observability e security hardening.**

---

## 🧪 Fase P1: Sistema de Testes Completo

### Resumo Técnico
Suite completa de testes com 80%+ cobertura: unit tests, integration tests, E2E tests, performance benchmarks e accessibility audits.

### Solução Rápida (MVP)
```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['**/*.test.ts', '**/*.spec.ts', '**/node_modules/**'],
    },
  },
});
```

```typescript
// tests/unit/cost-tracker.test.ts
import { describe, it, expect } from 'vitest';
import { CostTrackerEnterprise } from '@/lib/pricing/cost-tracker-complete';

describe('CostTracker', () => {
  it('should return zero cost for AI errors', () => {
    const tracker = new CostTrackerEnterprise();
    const result = tracker.calculateCost('claude-sonnet-4', 1000, 2000, true);
    expect(result.totalCost).toBe(0);
  });
});
```

### Solução Enterprise

**Estrutura Completa de Testes:**

```
tests/
├── unit/                          # Unit tests (80%+ coverage)
│   ├── pricing/
│   │   ├── cost-tracker.test.ts
│   │   ├── cost-calculator.test.ts
│   │   └── budget-alerts.test.ts
│   ├── ai/
│   │   ├── model-router.test.ts
│   │   ├── fallback-logic.test.ts
│   │   └── rate-limiter.test.ts
│   ├── devprod/
│   │   ├── environment-guard.test.ts
│   │   └── audit-logger.test.ts
│   ├── sync/
│   │   ├── merkle-tree.test.ts
│   │   └── delta-computation.test.ts
│   ├── agents/
│   │   ├── bugbot.test.ts
│   │   ├── testgen.test.ts
│   │   └── security-agent.test.ts
│   ├── rag/
│   │   ├── embedding.test.ts
│   │   ├── retrieval.test.ts
│   │   └── reranking.test.ts
│   ├── autofix/
│   │   ├── syntax-fix.test.ts
│   │   ├── import-fix.test.ts
│   │   └── type-fix.test.ts
│   └── memory/
│       ├── persistence.test.ts
│       ├── semantic-recall.test.ts
│       └── temporal-decay.test.ts
│
├── integration/                   # Integration tests
│   ├── cost-tracking-flow.test.ts
│   ├── model-routing-flow.test.ts
│   ├── merkle-sync-flow.test.ts
│   ├── background-agents-flow.test.ts
│   ├── rag-retrieval-flow.test.ts
│   └── end-to-end-generation.test.ts
│
├── e2e/                           # End-to-end tests (Playwright)
│   ├── code-generation.spec.ts
│   ├── debugging-workflow.spec.ts
│   ├── multi-framework.spec.ts
│   ├── cost-tracking-ui.spec.ts
│   ├── background-agents-ui.spec.ts
│   └── settings-flow.spec.ts
│
├── performance/                   # Performance benchmarks
│   ├── merkle-sync.bench.ts
│   ├── model-router.bench.ts
│   ├── vector-search.bench.ts
│   └── autofix.bench.ts
│
├── a11y/                          # Accessibility tests
│   ├── cost-indicator.a11y.ts
│   ├── framework-selector.a11y.ts
│   ├── agents-panel.a11y.ts
│   └── code-editor.a11y.ts
│
├── setup.ts                       # Test setup
├── fixtures/                      # Test fixtures
└── helpers/                       # Test helpers
```

**vitest.config.ts Enterprise:**

```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage thresholds
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: ['lib/**/*.ts', 'lib/**/*.tsx'],
      exclude: [
        '**/*.test.ts',
        '**/*.spec.ts',
        '**/*.d.ts',
        '**/node_modules/**',
        '**/dist/**',
      ],
      lines: 80,
      functions: 80,
      branches: 75,
      statements: 80,
      // Fail build se coverage < threshold
      thresholdAutoUpdate: false,
      perFile: true,
    },

    // Test timeout
    testTimeout: 10000,
    hookTimeout: 10000,

    // Isolate tests
    isolate: true,
    threads: true,
    maxThreads: 4,

    // Reporter
    reporters: ['verbose', 'html', 'junit'],
    outputFile: {
      junit: './test-results/junit.xml',
      html: './test-results/html/index.html',
    },

    // Mock setup
    mockReset: true,
    restoreMocks: true,
    clearMocks: true,
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
```

**playwright.config.ts Enterprise:**

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  
  reporter: [
    ['html'],
    ['junit', { outputFile: 'test-results/e2e-junit.xml' }],
    ['json', { outputFile: 'test-results/e2e-results.json' }],
  ],

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 13'] },
    },
  ],

  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**Exemplo de Unit Test Completo:**

```typescript
// tests/unit/pricing/cost-tracker.test.ts
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { CostTrackerEnterprise } from '@/lib/pricing/cost-tracker-complete';

describe('CostTrackerEnterprise', () => {
  let tracker: CostTrackerEnterprise;

  beforeEach(() => {
    tracker = new CostTrackerEnterprise();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('calculateCost', () => {
    it('should return zero cost for AI errors', () => {
      const result = tracker.calculateCost(
        'claude-sonnet-4',
        1000,
        2000,
        true // wasError
      );

      expect(result.totalCost).toBe(0);
      expect(result.wasError).toBe(true);
    });

    it('should calculate correct cost for successful requests', () => {
      const result = tracker.calculateCost(
        'claude-sonnet-4',
        1000,
        2000,
        false
      );

      // 1000 input * $0.003/1K = $0.003
      // 2000 output * $0.015/1K = $0.030
      // Total = $0.033
      expect(result.totalCost).toBeCloseTo(0.033, 3);
      expect(result.wasError).toBe(false);
    });

    it('should handle different models', () => {
      const claude = tracker.calculateCost('claude-sonnet-4', 1000, 1000, false);
      const gpt = tracker.calculateCost('gpt-5', 1000, 1000, false);
      const gemini = tracker.calculateCost('gemini-2.5-pro', 1000, 1000, false);

      expect(claude.totalCost).toBeGreaterThan(0);
      expect(gpt.totalCost).toBeGreaterThan(0);
      expect(gemini.totalCost).toBeLessThan(claude.totalCost); // Cheaper
    });
  });

  describe('trackRequest', () => {
    it('should track multiple requests', async () => {
      const breakdown1 = tracker.calculateCost('claude-sonnet-4', 1000, 2000, false);
      const breakdown2 = tracker.calculateCost('gpt-5', 500, 1000, false);

      await tracker.trackRequest(breakdown1, 'user123', 'session1');
      await tracker.trackRequest(breakdown2, 'user123', 'session1');

      const costs = tracker.getCurrentCosts();
      expect(costs.breakdown).toHaveLength(2);
      expect(costs.sessionTotal).toBeGreaterThan(0);
    });

    it('should calculate savings vs competitors', async () => {
      const breakdown = tracker.calculateCost('claude-sonnet-4', 1000, 2000, false);
      await tracker.trackRequest(breakdown, 'user123', 'session1');

      const costs = tracker.getCurrentCosts();
      expect(costs.savingsVsCompetitors.lovable).toBeGreaterThan(0);
      expect(costs.savingsVsCompetitors.replit).toBeGreaterThan(0);
      expect(costs.savingsVsCompetitors.cursor).toBeGreaterThan(0);
    });

    it('should emit cost-tracked event', async () => {
      const mockHandler = vi.fn();
      tracker.on('cost-tracked', mockHandler);

      const breakdown = tracker.calculateCost('claude-sonnet-4', 1000, 2000, false);
      await tracker.trackRequest(breakdown, 'user123', 'session1');

      expect(mockHandler).toHaveBeenCalledWith({
        userId: 'user123',
        breakdown: expect.objectContaining({
          model: 'claude-sonnet-4',
          totalCost: expect.any(Number),
        }),
      });
    });
  });

  describe('budget alerts', () => {
    it('should trigger alert at 75% threshold', async () => {
      const alertHandler = vi.fn();
      tracker.on('budget-alert', alertHandler);

      // Simulate reaching 75% of budget
      tracker['sessionCosts'].monthlyTotal = 75;
      tracker['monthlyBudget'] = 100;
      tracker['checkBudgetAlerts']('user123');

      expect(alertHandler).toHaveBeenCalledWith({
        userId: 'user123',
        alert: expect.objectContaining({
          type: 'warning',
          threshold: 75,
        }),
      });
    });

    it('should trigger danger alert at 90% threshold', async () => {
      const alertHandler = vi.fn();
      tracker.on('budget-alert', alertHandler);

      tracker['sessionCosts'].monthlyTotal = 90;
      tracker['monthlyBudget'] = 100;
      tracker['checkBudgetAlerts']('user123');

      expect(alertHandler).toHaveBeenCalledWith({
        userId: 'user123',
        alert: expect.objectContaining({
          type: 'danger',
          threshold: 90,
        }),
      });
    });
  });

  describe('export', () => {
    it('should export costs in JSON format', async () => {
      const breakdown1 = tracker.calculateCost('claude-sonnet-4', 1000, 2000, false);
      const breakdown2 = tracker.calculateCost('gpt-5', 500, 1000, false);
      
      await tracker.trackRequest(breakdown1, 'user123', 'session1');
      await tracker.trackRequest(breakdown2, 'user123', 'session1');

      const exported = await tracker.exportCosts(
        'user123',
        new Date('2025-01-01'),
        new Date('2025-12-31'),
        'json'
      );

      expect(exported.format).toBe('json');
      expect(exported.data).toHaveLength(2);
      expect(exported.summary.total).toBeGreaterThan(0);
      expect(exported.summary.byModel).toHaveProperty('claude-sonnet-4');
      expect(exported.summary.byModel).toHaveProperty('gpt-5');
    });
  });
});
```

**Exemplo de Integration Test:**

```typescript
// tests/integration/cost-tracking-flow.test.ts
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { CostTrackerEnterprise } from '@/lib/pricing/cost-tracker-complete';
import { ModelRouterEnterprise } from '@/lib/ai/model-router-complete';

describe('Cost Tracking Integration', () => {
  let costTracker: CostTrackerEnterprise;
  let modelRouter: ModelRouterEnterprise;

  beforeAll(async () => {
    costTracker = new CostTrackerEnterprise();
    modelRouter = new ModelRouterEnterprise(costTracker);
  });

  afterAll(async () => {
    await costTracker.cleanup('test-user');
    modelRouter.cleanup();
  });

  it('should track costs during model routing', async () => {
    const request = {
      taskType: 'code-generation' as const,
      prompt: 'Create a React component',
      userId: 'test-user',
      sessionId: 'test-session',
    };

    const response = await modelRouter.route(request);

    expect(response.cost).toBeGreaterThan(0);
    expect(response.inputTokens).toBeGreaterThan(0);
    expect(response.outputTokens).toBeGreaterThan(0);

    const costs = costTracker.getCurrentCosts();
    expect(costs.sessionTotal).toBeCloseTo(response.cost, 4);
  });

  it('should not charge for AI errors', async () => {
    const initialCosts = costTracker.getCurrentCosts();

    // Simulate AI error
    try {
      await modelRouter.route({
        taskType: 'code-generation',
        prompt: 'Invalid prompt that causes error',
        userId: 'test-user',
        sessionId: 'test-session',
      });
    } catch (error) {
      // Expected error
    }

    const finalCosts = costTracker.getCurrentCosts();
    expect(finalCosts.sessionTotal).toBe(initialCosts.sessionTotal); // No increase
  });
});
```

**Exemplo de E2E Test:**

```typescript
// tests/e2e/code-generation.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Code Generation E2E', () => {
  test('should generate code with cost tracking', async ({ page }) => {
    await page.goto('/');

    // Select framework
    await page.click('[data-testid="framework-selector"]');
    await page.click('[data-testid="framework-react"]');

    // Enter prompt
    await page.fill(
      '[data-testid="prompt-input"]',
      'Create a user profile component with avatar and bio'
    );

    // Submit
    await page.click('[data-testid="generate-button"]');

    // Wait for generation (max 30s)
    await page.waitForSelector('[data-testid="code-output"]', {
      timeout: 30000,
    });

    // Verify code was generated
    const code = await page.textContent('[data-testid="code-output"]');
    expect(code).toContain('function UserProfile');
    expect(code).toContain('avatar');
    expect(code).toContain('bio');

    // Verify cost tracking
    const cost = await page.textContent('[data-testid="current-cost"]');
    expect(parseFloat(cost!)).toBeGreaterThan(0);

    // Verify savings indicator
    const savings = await page.textContent('[data-testid="savings-indicator"]');
    expect(savings).toContain('vs');
  });

  test('should not charge for AI errors', async ({ page }) => {
    await page.goto('/');

    // Get initial cost
    const initialCost = await page.textContent('[data-testid="current-cost"]');

    // Trigger error scenario
    await page.fill(
      '[data-testid="prompt-input"]',
      'Invalid prompt that will cause AI error'
    );
    await page.click('[data-testid="generate-button"]');

    // Wait for error
    await page.waitForSelector('[data-testid="error-message"]');

    // Verify cost didn't increase
    const finalCost = await page.textContent('[data-testid="current-cost"]');
    expect(finalCost).toBe(initialCost);

    // Verify error message
    const errorMessage = await page.textContent('[data-testid="error-message"]');
    expect(errorMessage).toContain('error');
  });

  test('should show cost comparison with competitors', async ({ page }) => {
    await page.goto('/');

    // Generate code
    await page.fill('[data-testid="prompt-input"]', 'Create a button component');
    await page.click('[data-testid="generate-button"]');
    await page.waitForSelector('[data-testid="code-output"]');

    // Click comparison button
    await page.click('[data-testid="show-comparison"]');

    // Verify comparison modal
    await page.waitForSelector('[data-testid="comparison-modal"]');
    
    const lovableCost = await page.textContent('[data-testid="lovable-cost"]');
    const replitCost = await page.textContent('[data-testid="replit-cost"]');
    const cursorCost = await page.textContent('[data-testid="cursor-cost"]');

    expect(parseFloat(lovableCost!)).toBeGreaterThan(0);
    expect(parseFloat(replitCost!)).toBeGreaterThan(0);
    expect(parseFloat(cursorCost!)).toBeGreaterThan(0);
  });
});
```

**Exemplo de Performance Benchmark:**

```typescript
// tests/performance/merkle-sync.bench.ts
import { describe, bench } from 'vitest';
import { MerkleTreeSyncEnterprise } from '@/lib/sync/merkle-tree/merkle-enterprise';

describe('Merkle Tree Sync Performance', () => {
  const sync = new MerkleTreeSyncEnterprise();

  bench('build tree with 1,000 files', async () => {
    const files = generateMockFiles(1000);
    await sync.buildTree('/workspace', files);
  });

  bench('build tree with 10,000 files', async () => {
    const files = generateMockFiles(10000);
    await sync.buildTree('/workspace', files);
  });

  bench('compute delta for 100 changed files', async () => {
    const clientTree = await sync.buildTree('/client', generateMockFiles(1000));
    const serverTree = await sync.buildTree('/server', generateMockFiles(1100));
    sync.computeDelta(clientTree, serverTree);
  });

  bench('incremental index 100 files', async () => {
    const delta = {
      added: Array.from({ length: 50 }, (_, i) => `file-${i}.ts`),
      modified: Array.from({ length: 50 }, (_, i) => `file-${i + 50}.ts`),
      deleted: [],
    };
    await sync.incrementalIndex(delta);
  });
});

function generateMockFiles(count: number): Map<string, string> {
  const files = new Map<string, string>();
  for (let i = 0; i < count; i++) {
    files.set(`file-${i}.ts`, `export const value${i} = ${i};`);
  }
  return files;
}
```

**Exemplo de Accessibility Test:**

```typescript
// tests/a11y/cost-indicator.a11y.ts
import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y, getViolations } from 'axe-playwright';

test.describe('Cost Indicator Accessibility', () => {
  test('should have no accessibility violations', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, '[data-testid="cost-indicator"]');
    expect(violations).toHaveLength(0);
  });

  test('should have proper ARIA labels', async ({ page }) => {
    await page.goto('/');

    const costIndicator = page.locator('[data-testid="cost-indicator"]');
    
    // Check role
    await expect(costIndicator).toHaveAttribute('role', 'status');
    
    // Check aria-label
    const ariaLabel = await costIndicator.getAttribute('aria-label');
    expect(ariaLabel).toContain('Current cost');
  });

  test('should have sufficient color contrast', async ({ page }) => {
    await page.goto('/');
    await injectAxe(page);

    const violations = await getViolations(page, '[data-testid="cost-indicator"]', {
      runOnly: ['color-contrast'],
    });
    
    expect(violations).toHaveLength(0);
  });

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/');

    // Tab to cost indicator
    await page.keyboard.press('Tab');
    
    // Verify focus
    const focused = await page.evaluate(() => document.activeElement?.getAttribute('data-testid'));
    expect(focused).toBe('cost-indicator');

    // Press Enter to expand
    await page.keyboard.press('Enter');
    
    // Verify expanded
    const expanded = await page.locator('[data-testid="cost-details"]').isVisible();
    expect(expanded).toBe(true);
  });

  test('should announce updates to screen readers', async ({ page }) => {
    await page.goto('/');

    // Generate code to update cost
    await page.fill('[data-testid="prompt-input"]', 'Create a component');
    await page.click('[data-testid="generate-button"]');

    // Wait for cost update
    await page.waitForSelector('[data-testid="code-output"]');

    // Verify aria-live region
    const costIndicator = page.locator('[data-testid="cost-indicator"]');
    await expect(costIndicator).toHaveAttribute('aria-live', 'polite');
  });
});
```

### Checklist de Validação
- ✅ **Unit tests**: 80%+ coverage (lines, functions, branches, statements)
- ✅ **Integration tests**: Fluxos críticos cobertos
- ✅ **E2E tests**: User journeys principais
- ✅ **Performance benchmarks**: Validar SLAs (< 5s para 10K files, 1M+ TPS)
- ✅ **Accessibility audits**: WCAG 2.1 Level AA compliance
- ✅ **CI/CD integration**: Tests rodam automaticamente
- ✅ **Test reports**: HTML, JSON, JUnit para análise
- ✅ **Coverage tracking**: Trending over time

### Próximos Passos
- ✅ Visual regression tests (Percy, Chromatic)
- ✅ Load testing (k6, Artillery)
- ✅ Chaos engineering (Chaos Monkey)
- ✅ Mutation testing (Stryker)
- ✅ Contract testing (Pact)

---

## 🎨 Fase P1: UI/UX Components Enterprise

### Resumo Técnico
Design System completo com componentes acessíveis (WCAG AA), tokens semânticos, dark mode e responsive design mobile-first.

### Solução Rápida (MVP)

**Design Tokens:**
```typescript
// styles/design-system/tokens.ts
export const tokens = {
  color: {
    primary: {
      DEFAULT: '#0066ff',
      hover: '#0052cc',
      active: '#0040a3',
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
    },
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
  },
};
```

**Component Básico:**
```typescript
// components/ui/Button.tsx
export function Button({ children, onClick }: ButtonProps) {
  return (
    <button
      className="px-4 py-2 bg-primary text-white rounded"
      onClick={onClick}
    >
      {children}
    </button>
  );
}
```

### Solução Enterprise

**Design System Completo:**

```typescript
// styles/design-system/tokens.ts
export const designTokens = {
  // Colors
  color: {
    primary: {
      50: '#e6f0ff',
      100: '#b3d1ff',
      200: '#80b3ff',
      300: '#4d94ff',
      400: '#1a75ff',
      500: '#0066ff', // DEFAULT
      600: '#0052cc',
      700: '#0040a3',
      800: '#002d7a',
      900: '#001a52',
    },
    semantic: {
      success: {
        DEFAULT: '#00cc66',
        light: '#e6fff2',
        dark: '#009944',
      },
      warning: {
        DEFAULT: '#ff9933',
        light: '#fff2e6',
        dark: '#cc7700',
      },
      danger: {
        DEFAULT: '#ff3333',
        light: '#ffe6e6',
        dark: '#cc0000',
      },
      info: {
        DEFAULT: '#0099ff',
        light: '#e6f5ff',
        dark: '#0077cc',
      },
    },
    text: {
      primary: '#1a1a1a',
      secondary: '#666666',
      tertiary: '#999999',
      inverse: '#ffffff',
      disabled: '#cccccc',
    },
    background: {
      primary: '#ffffff',
      secondary: '#f5f5f5',
      tertiary: '#e6e6e6',
      inverse: '#1a1a1a',
    },
    border: {
      primary: '#e6e6e6',
      secondary: '#cccccc',
      focus: '#0066ff',
      error: '#ff3333',
    },
  },

  // Spacing (4px base)
  spacing: {
    0: '0',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
  },

  // Typography
  typography: {
    fontFamily: {
      sans: 'Inter, system-ui, -apple-system, sans-serif',
      mono: 'JetBrains Mono, Consolas, monospace',
    },
    fontSize: {
      xs: ['12px', { lineHeight: '16px' }],
      sm: ['14px', { lineHeight: '20px' }],
      base: ['16px', { lineHeight: '24px' }],
      lg: ['18px', { lineHeight: '28px' }],
      xl: ['20px', { lineHeight: '28px' }],
      '2xl': ['24px', { lineHeight: '32px' }],
      '3xl': ['30px', { lineHeight: '36px' }],
      '4xl': ['36px', { lineHeight: '40px' }],
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: '-0.02em',
      normal: '0',
      wide: '0.02em',
    },
  },

  // Shadows
  shadow: {
    sm: '0 1px 2px rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.15)',
    '2xl': '0 25px 50px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },

  // Border radius
  radius: {
    none: '0',
    sm: '4px',
    md: '8px',
    lg: '12px',
    xl: '16px',
    '2xl': '24px',
    full: '9999px',
  },

  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
    bounce: '300ms cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },

  // Breakpoints
  breakpoint: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },

  // Z-index
  zIndex: {
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modalBackdrop: 1040,
    modal: 1050,
    popover: 1060,
    tooltip: 1070,
  },
};
```

**Componente Acessível Completo:**

```typescript
// components/ui/CostIndicator.tsx
import { useState } from 'react';
import { formatCost } from '@/lib/pricing/cost-tracker-complete';
import { ChevronDown, DollarSign, TrendingDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CostIndicatorProps {
  currentCost: number;
  sessionTotal: number;
  monthlyTotal: number;
  threshold: number;
  showComparison?: boolean;
  savingsVsCompetitors?: {
    lovable: number;
    replit: number;
    cursor: number;
  };
}

export function CostIndicator({
  currentCost,
  sessionTotal,
  monthlyTotal,
  threshold,
  showComparison = false,
  savingsVsCompetitors,
}: CostIndicatorProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const percentOfThreshold = (monthlyTotal / threshold) * 100;
  const isNearLimit = percentOfThreshold >= 75;
  const isDangerZone = percentOfThreshold >= 90;

  return (
    <div
      className={cn(
        'cost-indicator',
        'rounded-lg border p-4',
        'transition-all duration-200',
        isDangerZone && 'border-danger bg-danger-light',
        isNearLimit && !isDangerZone && 'border-warning bg-warning-light',
        !isNearLimit && 'border-primary bg-primary-50'
      )}
      role="status"
      aria-label={`Current cost: ${formatCost(currentCost)}`}
      aria-live="polite"
      data-testid="cost-indicator"
    >
      {/* Header */}
      <button
        className="w-full flex items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
        aria-expanded={isExpanded}
        aria-controls="cost-details"
      >
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" aria-hidden="true" />
          <span className="font-semibold">Current Request</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold">
            {formatCost(currentCost)}
          </span>
          <ChevronDown
            className={cn(
              'h-5 w-5 transition-transform',
              isExpanded && 'rotate-180'
            )}
            aria-hidden="true"
          />
        </div>
      </button>

      {/* Expandable Details */}
      {isExpanded && (
        <div
          id="cost-details"
          className="mt-4 space-y-4"
          data-testid="cost-details"
        >
          {/* Session Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-secondary">Session Total</span>
            <span className="font-semibold">
              {formatCost(sessionTotal)}
            </span>
          </div>

          {/* Monthly Total */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-secondary">Monthly Total</span>
              <span className="font-semibold">
                {formatCost(monthlyTotal)} / {formatCost(threshold)}
              </span>
            </div>

            {/* Progress Bar */}
            <div
              className="h-2 bg-gray-200 rounded-full overflow-hidden"
              role="progressbar"
              aria-valuenow={percentOfThreshold}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label={`${percentOfThreshold.toFixed(0)}% of monthly budget used`}
            >
              <div
                className={cn(
                  'h-full transition-all duration-300',
                  isDangerZone && 'bg-danger',
                  isNearLimit && !isDangerZone && 'bg-warning',
                  !isNearLimit && 'bg-success'
                )}
                style={{ width: `${Math.min(percentOfThreshold, 100)}%` }}
              />
            </div>

            <span className="text-xs text-secondary">
              {percentOfThreshold.toFixed(1)}% used
            </span>
          </div>

          {/* Budget Alert */}
          {isNearLimit && (
            <div
              className={cn(
                'flex items-start gap-2 p-3 rounded-md',
                isDangerZone ? 'bg-danger-light text-danger-dark' : 'bg-warning-light text-warning-dark'
              )}
              role="alert"
            >
              <TrendingDown className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
              <div>
                <p className="font-semibold">
                  {isDangerZone ? 'Budget Limit Nearly Reached' : 'Approaching Budget Limit'}
                </p>
                <p className="text-sm mt-1">
                  You've used {percentOfThreshold.toFixed(1)}% of your monthly budget (
                  {formatCost(threshold)})
                </p>
              </div>
            </div>
          )}

          {/* Competitor Comparison */}
          {showComparison && savingsVsCompetitors && (
            <div className="space-y-2 border-t pt-4">
              <h4 className="font-semibold text-sm">Savings vs Competitors</h4>
              
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">vs Lovable:</span>
                  <span className="text-success font-semibold">
                    +{formatCost(savingsVsCompetitors.lovable)} (
                    {((savingsVsCompetitors.lovable / sessionTotal) * 100).toFixed(0)}%)
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">vs Replit:</span>
                  <span className="text-success font-semibold">
                    +{formatCost(savingsVsCompetitors.replit)} (
                    {((savingsVsCompetitors.replit / sessionTotal) * 100).toFixed(0)}%)
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-secondary">vs Cursor:</span>
                  <span className="text-success font-semibold">
                    +{formatCost(savingsVsCompetitors.cursor)} (
                    {((savingsVsCompetitors.cursor / sessionTotal) * 100).toFixed(0)}%)
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

### Checklist UI/UX
- ✅ **Acessibilidade**: WCAG 2.1 Level AA compliant
- ✅ **Contraste**: 4.5:1 para texto, 3:1 para UI
- ✅ **Navegação por teclado**: Tab, Enter, Space, Escape
- ✅ **Screen readers**: aria-* attributes corretos
- ✅ **Focus indicators**: Visíveis e claros
- ✅ **Responsive**: Mobile-first (320px+)
- ✅ **Dark mode**: Suporte completo
- ✅ **Performance**: < 100ms interaction
- ✅ **Animations**: Respeitam prefers-reduced-motion

### Validação
- ✅ Axe DevTools: Zero violations
- ✅ Lighthouse: 100 Accessibility score
- ✅ NVDA/JAWS: Testado com screen readers
- ✅ Keyboard navigation: 100% navegável
- ✅ Color contrast: Validated

### Próximos Passos
- ✅ Component playground (Storybook)
- ✅ Design tokens generator
- ✅ Theme builder
- ✅ Component documentation
- ✅ Figma integration

---

*Continuando com Observability e Security no próximo arquivo...*
