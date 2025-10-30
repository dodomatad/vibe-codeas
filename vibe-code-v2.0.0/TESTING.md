# Testing Guide - Vibe Code

**Documentação completa de testes e cobertura**

## 📊 Status de Cobertura

### Atual
- **Testes Totais:** 14 arquivos
- **Coverage Estimado:** ~45%
- **Endpoints Testados:** 3/24 (12.5%)
- **Componentes Testados:** 0/196 (0%)
- **Lib Modules Testados:** 11/45 (24%)

### Meta
- **Coverage Target:** 60%+
- **Endpoints:** 15/24 (60%+)
- **Componentes:** 30/196 (15%+)
- **Lib Modules:** 30/45 (65%+)

## 🧪 Estrutura de Testes

```
tests/
├── unit/                    # Testes unitários
│   ├── ai/                  # Testes de IA
│   │   ├── model-router.test.ts
│   │   └── rag/
│   │       ├── advanced-rag.test.ts
│   │       └── chunker.test.ts
│   ├── devprod/
│   │   └── environment-guard.test.ts
│   ├── frameworks/
│   │   └── framework-detector.test.ts
│   ├── pricing/
│   │   └── cost-tracker.test.ts
│   ├── security/
│   │   └── rate-limiter.test.ts
│   └── sync/
│       └── merkle-tree.test.ts
├── integration/             # Testes de integração
│   ├── api/                 # Testes de API endpoints (NOVO)
│   │   ├── generate-ai-code-stream.test.ts
│   │   ├── apply-ai-code-stream.test.ts
│   │   └── create-ai-sandbox-v2.test.ts
│   ├── code-generation-flow.test.ts
│   └── cost-tracking-flow.test.ts
└── e2e/                     # Testes end-to-end (NOVO)
    └── complete-code-generation-flow.spec.ts
```

## 🚀 Executando Testes

### Todos os Testes
```bash
npm test
```

### Testes Unitários
```bash
npm run test:unit
```

### Testes de Integração
```bash
npm run test:integration
```

### Testes E2E
```bash
npm run test:e2e
```

### Com Coverage
```bash
npm run test:coverage
```

### Watch Mode
```bash
npm run test:watch
```

### UI Mode (Vitest)
```bash
npm run test:ui
```

## 📝 Novos Testes Implementados

### 1. API Endpoint Tests

#### generate-ai-code-stream.test.ts
Testa o endpoint principal de geração de código.

**Cobertura:**
- ✅ Validação de request
- ✅ Seleção de modelo de IA
- ✅ Streaming de resposta
- ✅ Contexto e histórico
- ✅ Error handling
- ✅ Rate limiting
- ✅ Cost tracking
- ✅ Performance benchmarks

**Exemplo:**
```typescript
it('should return 400 if message is missing', async () => {
  const response = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });

  expect(response.status).toBe(400);
});
```

#### apply-ai-code-stream.test.ts
Testa aplicação de código no sandbox.

**Cobertura:**
- ✅ Criação/atualização/deleção de arquivos
- ✅ Detecção de pacotes
- ✅ AutoFix processing
- ✅ Streaming de progresso
- ✅ Security (path traversal)
- ✅ Performance

#### create-ai-sandbox-v2.test.ts
Testa criação e gerenciamento de sandbox.

**Cobertura:**
- ✅ Criação de sandbox
- ✅ Inicialização Vite React
- ✅ Cleanup e isolamento
- ✅ Global state management
- ✅ Resource management
- ✅ Error handling

### 2. E2E Tests

#### complete-code-generation-flow.spec.ts
Testa o fluxo completo de usuário.

**Cobertura:**
- ✅ Navegação e UI
- ✅ Criação de sandbox
- ✅ Geração de código
- ✅ Aplicação de código
- ✅ Preview
- ✅ Error scenarios
- ✅ Multiple iterations
- ✅ Conversation history
- ✅ Cost tracking
- ✅ Loading states
- ✅ Keyboard shortcuts
- ✅ Accessibility (WCAG 2.1 AA)
- ✅ Mobile responsiveness
- ✅ Performance metrics

**Exemplo:**
```typescript
test('should complete full code generation workflow', async ({ page }) => {
  await page.goto('http://localhost:3000');
  await page.fill('textarea', 'Create a React counter');
  await page.click('button:has-text("Generate")');
  await expect(page.locator('pre code')).toBeVisible({ timeout: 30000 });
});
```

## 🎯 Guidelines para Novos Testes

### 1. Testes Unitários

**Quando usar:**
- Funções puras
- Utility functions
- Business logic isolada

**Estrutura:**
```typescript
describe('FunctionName', () => {
  describe('happy path', () => {
    it('should return expected result', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = myFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });

  describe('edge cases', () => {
    it('should handle empty input', () => {
      expect(myFunction('')).toBe(null);
    });
  });

  describe('error handling', () => {
    it('should throw on invalid input', () => {
      expect(() => myFunction(null)).toThrow();
    });
  });
});
```

### 2. Testes de Integração

**Quando usar:**
- API endpoints
- Database operations
- External service integration

**Estrutura:**
```typescript
describe('POST /api/endpoint', () => {
  beforeEach(async () => {
    // Setup
    await setupTestDB();
  });

  afterEach(async () => {
    // Cleanup
    await cleanupTestDB();
  });

  it('should process request successfully', async () => {
    const response = await fetch('/api/endpoint', {
      method: 'POST',
      body: JSON.stringify({ data: 'test' })
    });

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.success).toBe(true);
  });
});
```

### 3. Testes E2E

**Quando usar:**
- User workflows
- Critical user journeys
- Cross-component interactions

**Estrutura:**
```typescript
test('user can complete task', async ({ page }) => {
  // 1. Navigate
  await page.goto('/');

  // 2. Interact
  await page.fill('input', 'value');
  await page.click('button');

  // 3. Assert
  await expect(page.locator('.result')).toHaveText('expected');
});
```

## 📈 Melhorando a Cobertura

### Prioridade Alta (Próxima Semana)

1. **Endpoints de API (5 novos testes)**
   ```
   - install-packages-v2.test.ts
   - run-command-v2.test.ts
   - detect-and-install-packages.test.ts
   - get-sandbox-files.test.ts
   - sandbox-logs.test.ts
   ```

2. **Componentes Críticos (10 testes)**
   ```
   - HeroInput.test.tsx
   - CostIndicator.test.tsx
   - CodeBlock.test.tsx
   - SandboxPreview.test.tsx
   - ChatMessage.test.tsx
   ```

### Prioridade Média (Próximo Mês)

3. **Módulos Lib (15 testes)**
   ```
   - rag-system.test.ts
   - autofix-processor.test.ts
   - background-agents.test.ts
   - telemetry.test.ts
   - sandbox-manager.test.ts
   ```

4. **E2E Workflows (5 cenários)**
   ```
   - error-recovery-flow.spec.ts
   - multi-file-editing-flow.spec.ts
   - package-installation-flow.spec.ts
   - export-project-flow.spec.ts
   - collaborative-editing-flow.spec.ts
   ```

## 🛠️ Ferramentas e Configuração

### Vitest (Unit + Integration)
```javascript
// vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    coverage: {
      provider: 'istanbul',
      reporter: ['text', 'html', 'lcov'],
      statements: 60,
      branches: 60,
      functions: 60,
      lines: 60
    }
  }
});
```

### Playwright (E2E)
```javascript
// playwright.config.ts
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 120000,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  }
});
```

## 📊 Métricas de Qualidade

### Coverage Mínimo
- **Statements:** 60%
- **Branches:** 60%
- **Functions:** 60%
- **Lines:** 60%

### Performance
- **Unit tests:** < 100ms cada
- **Integration tests:** < 5s cada
- **E2E tests:** < 2min cada

### Qualidade
- **Zero flaky tests**
- **100% tests passing**
- **No skipped tests em CI**

## 🚨 Troubleshooting

### Testes falhando localmente

```bash
# Limpar cache
rm -rf node_modules .next
npm install

# Verificar tipos
npm run type-check

# Rodar testes individuais
npm test -- generate-ai-code-stream.test.ts
```

### Testes E2E falhando

```bash
# Iniciar servidor dev
npm run dev

# Em outro terminal, rodar E2E
npm run test:e2e

# Debug mode
npm run test:e2e:ui
```

### Coverage baixo

```bash
# Gerar relatório detalhado
npm run test:coverage

# Abrir relatório HTML
open coverage/index.html
```

## 📚 Recursos Adicionais

- [Vitest Documentation](https://vitest.dev/)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Última atualização:** 2025-01-30
**Próxima revisão:** 2025-02-15
