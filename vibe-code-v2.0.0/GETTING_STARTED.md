# 🚀 Getting Started - Vibe Code Ultimate

## Instalação Rápida

```bash
# Clonar repositório
git clone https://github.com/vibe-code/ultimate.git
cd ultimate

# Instalar dependências
pnpm install

# Configurar variáveis ambiente
cp .env.example .env

# Adicionar suas API keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...

# Rodar em desenvolvimento
pnpm dev
```

## Configuração

### 1. API Keys Necessárias

- **Anthropic** (primary LLM): https://console.anthropic.com
- **OpenAI** (alternative LLM): https://platform.openai.com
- **E2B** (sandbox): https://e2b.dev
- **Neon** (database): https://neon.tech

### 2. Database Setup

```bash
# Gerar cliente Prisma
pnpm db:generate

# Push schema
pnpm db:push

# Abrir Prisma Studio
pnpm db:studio
```

### 3. Development

```bash
# Rodar dev server
pnpm dev

# Build para produção
pnpm build

# Rodar produção
pnpm start
```

## Arquitetura Core

### Multi-Model System
```typescript
import { modelRouter } from '@/lib/ai/multi-model/model-router';

// Roteamento automático baseado na tarefa
const model = modelRouter.selectModel('code-generation');
// → 'claude-sonnet-4'

// Override manual se necessário
const customModel = modelRouter.selectModelWithOverride(
  'code-generation',
  'gpt-5'
);
```

### Cost Tracking (NUNCA cobra erros IA)
```typescript
import { costTracker } from '@/lib/pricing/real-time/cost-tracker';

// Calcular custo
const breakdown = costTracker.calculateCost(
  'claude-sonnet-4',
  1200, // input tokens
  450,  // output tokens
  false // wasError (se true, custo = 0)
);

// Registrar request
await costTracker.trackRequest(breakdown, userId);

// Obter custos atuais
const costs = costTracker.getCurrentCosts();
```

### Environment Guard (evita incidente Replit)
```typescript
import { EnvironmentGuard } from '@/lib/devprod/environment-guard';

// Executa APENAS em dev
await EnvironmentGuard.executeInDev(
  async () => {
    await db.users.deleteAll();
  },
  'database_delete'
);
// → Bloqueia se produção

// Requer confirmações para ops críticas em prod
await EnvironmentGuard.executeInProdWithConfirmation(
  async () => {
    await criticalOperation();
  },
  3 // confirmações necessárias
);
```

### Multi-Framework Support
```typescript
import { frameworkDetector } from '@/lib/frameworks/framework-detector';

// Detectar framework
const framework = frameworkDetector.detectFromPackageJson(packageJson);
// → 'react' | 'vue' | 'svelte' | 'angular' | 'solid' | 'astro'

// Obter config
const config = frameworkDetector.getConfig('vue');
```

## Features Core

### ✅ Implementados

1. **Multi-Model Architecture** - Roteamento automático
2. **Real-Time Cost Tracking** - Nunca cobra erros IA
3. **Environment Guard** - Separação dev/prod rigorosa
4. **Multi-Framework Support** - 6+ frameworks
5. **Merkle Tree Sync** - Eficiência Cursor-style
6. **Background Agents** - Trabalho autônomo
7. **Memory System** - Cross-session context
8. **Debugging Tools** - Breakpoints reais
9. **RAG System** - Grounding em conhecimento real
10. **AutoFix Post-Processor** - Correção durante geração

### 🔄 Em Desenvolvimento

- Voice input support
- Visual canvas planning
- VS Code extension
- JetBrains plugin
- Mobile app (iOS/Android)

## Documentação Completa

- [Architecture](./ARCHITECTURE.md) - Arquitetura técnica
- [API Reference](./docs/api.md) - Referência de APIs
- [Multi-Model](./docs/multi-model.md) - Sistema multi-model
- [Cost Tracking](./docs/cost-tracking.md) - Sistema de custos

## Suporte

- 📧 Email: support@vibecode.dev (humanos reais!)
- 💬 Discord: discord.gg/vibecode
- 📖 Docs: docs.vibecode.dev
- 🐛 Issues: github.com/vibe-code/issues

## Licença

MIT License - use comercialmente!
