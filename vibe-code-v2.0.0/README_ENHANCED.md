# Open Lovable Enhanced 🚀

**Enterprise-grade AI-powered React app builder** - Fork melhorado do Open Lovable com multi-model orchestration, context awareness e offline-first architecture.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/license-MIT-green)](LICENSE)

## 🎯 Resumo Técnico

Versão aprimorada do Open Lovable com:
- **Multi-Model Orchestration**: Seleção inteligente entre Claude, GPT, Gemini, DeepSeek
- **Context-Aware Generation**: Análise de projeto para código consistente
- **Enhanced Prompts v2**: Sistema de prompts otimizado com chain-of-thought
- **Offline-First**: IndexedDB + sync cloud opcional
- **Testing Automation**: Geração automática de testes
- **Enhanced Preview**: Multi-device + Web Vitals + Console integrado

## ⚡ Quick Start

```bash
# 1. Install
git clone <repo>
cd open-lovable-enhanced
pnpm install  # ou npm/yarn

# 2. Configure .env.local (veja seção abaixo)

# 3. Run
pnpm dev

# 4. Open http://localhost:3000
```

## 🔑 Configuração (.env.local)

```env
# === REQUIRED ===
FIRECRAWL_API_KEY=fc-xxx            # https://firecrawl.dev

# === AI PROVIDERS (escolha pelo menos 1) ===
ANTHROPIC_API_KEY=sk-ant-xxx        # Recomendado
OPENAI_API_KEY=sk-xxx
GEMINI_API_KEY=xxx
GROQ_API_KEY=gsk-xxx

# === SANDBOX (escolha 1) ===
SANDBOX_PROVIDER=vercel             # ou 'e2b'

# Vercel (OIDC - recomendado)
VERCEL_OIDC_TOKEN=xxx               # Run: vercel link && vercel env pull

# Vercel (Token alternativo)
# VERCEL_TEAM_ID=team_xxx
# VERCEL_PROJECT_ID=prj_xxx
# VERCEL_TOKEN=xxx

# E2B (alternativo)
# E2B_API_KEY=xxx

# === OPTIONAL ===
MORPH_API_KEY=xxx                   # Fast edits (morphllm.com)
```

## 🎨 Features Principais

### 1. Multi-Model Orchestration
Seleção automática do modelo ideal baseado em:
- Tipo de tarefa (geração, edição, refactoring)
- Complexidade do código
- Custo vs Qualidade (configurável)
- Performance histórica

```typescript
// Uso
const router = createModelRouter({
  qualityBias: 0.7,  // 0 = custo, 1 = qualidade
  maxCostPerRequest: 1.0
});

const model = router.selectModel('refactoring', contextSize, 'high');
```

### 2. Context-Aware Generation
Análise inteligente do projeto para gerar código consistente:
- Detecta framework e padrões
- Identifica componentes reutilizáveis
- Mantém estilo de código
- Respeita convenções do projeto

```typescript
const builder = createContextBuilder('./');
const context = await builder.buildContext();
// Retorna: framework, components, routes, patterns, etc
```

### 3. Enhanced Preview
Preview profissional com métricas em tempo real:
- Multi-device (Mobile, Tablet, Desktop, 4K)
- Web Vitals (FCP, LCP, CLS, TBT, FID)
- Console integrado
- Visual diff

### 4. Offline-First Storage
IndexedDB com sync opcional:
```typescript
import { storage } from '@/lib/storage/hybrid-storage';

await storage.save(project);
const project = await storage.load(id);
await storage.createVersion(id, 'Feature X');
```

### 5. Testing Automation
Geração automática de testes:
```typescript
const generator = new AutoTestGenerator();
const tests = generator.generateComponentTests(component);
// Retorna: unit, integration, e2e, accessibility
```

## 📊 Comparação: Lovable vs Enhanced

| Feature | Lovable | Enhanced |
|---------|---------|----------|
| Offline mode | ❌ | ✅ |
| Multi-model | ❌ | ✅ (5+ models) |
| Context awareness | Básico | ✅ Avançado |
| Testing automation | ❌ | ✅ |
| Local storage | ❌ | ✅ IndexedDB |
| Cost control | ❌ | ✅ Configurável |
| IDE integration | ❌ | 🚧 Planejado |
| Customizável | ❌ | ✅ 100% |

## 🏗️ Arquitetura

```
app/
  api/
    generate-enhanced/    # Multi-model code gen
lib/
  ai/
    enhanced/            # Sistema de prompts v2
    multi-model/         # Model orchestration
    context/            # Context builder
  storage/              # Hybrid storage
  testing/              # Auto test gen
components/
  preview/
    enhanced/           # Enhanced preview
```

## 🎯 Roadmap

### ✅ MVP (Completo)
- [x] Multi-model orchestration
- [x] Enhanced prompts
- [x] Context awareness
- [x] Enhanced preview
- [x] Local storage
- [x] Testing automation

### 🚧 Em Progresso
- [ ] VS Code extension
- [ ] Real-time collaboration
- [ ] Component marketplace
- [ ] Analytics dashboard

### 📋 Planejado
- [ ] Figma integration
- [ ] Deploy automation
- [ ] Team management
- [ ] Version control UI

## 🤝 Contribuindo

```bash
# 1. Fork o repo
# 2. Crie sua branch
git checkout -b feature/amazing-feature

# 3. Commit
git commit -m 'Add amazing feature'

# 4. Push
git push origin feature/amazing-feature

# 5. Abra um PR
```

## 📝 Licença

MIT - veja [LICENSE](LICENSE)

## 🙏 Créditos

Baseado no [Open Lovable](https://github.com/firecrawl/open-lovable) pela equipe [Firecrawl](https://firecrawl.dev/)

## 📧 Suporte

- 🐛 Issues: [GitHub Issues](https://github.com/your-repo/issues)
- 💬 Discussions: [GitHub Discussions](https://github.com/your-repo/discussions)
- 📧 Email: support@yourproject.com

---

**Desenvolvido com ❤️ e TypeScript**
