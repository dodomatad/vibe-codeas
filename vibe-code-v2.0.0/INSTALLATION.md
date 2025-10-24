# 🚀 Guia de Instalação - Open Lovable Enhanced

## Resumo Técnico

**Stack**: Next.js 15 + TypeScript + Multi-Model AI + IndexedDB  
**Tempo de setup**: ~5 minutos  
**Requerimentos**: Node 18+, pnpm/npm/yarn

## Instalação Rápida

```bash
# 1. Clone
git clone <repo> && cd open-lovable-enhanced

# 2. Install
pnpm install

# 3. Configure
cp .env.example .env.local
# Edite .env.local com suas API keys

# 4. Run
pnpm dev
```

## Configuração Detalhada

### 1. API Keys (Requeridas)

#### Firecrawl (Obrigatório)
```env
FIRECRAWL_API_KEY=fc-xxx
```
- Criar conta: https://firecrawl.dev
- Free tier: 500 requests/mês
- Usado para web scraping

#### AI Providers (Escolha pelo menos 1)

**Opção 1: Anthropic Claude (Recomendado)**
```env
ANTHROPIC_API_KEY=sk-ant-xxx
```
- Melhor qualidade geral
- $3 por milhão de tokens (Sonnet)
- Context: 200k tokens

**Opção 2: OpenAI GPT**
```env
OPENAI_API_KEY=sk-xxx
```
- Mais rápido para edições
- $2.50 por milhão de tokens (GPT-4o)
- Context: 128k tokens

**Opção 3: Google Gemini**
```env
GEMINI_API_KEY=xxx
```
- Mais barato
- $0.075 por milhão de tokens
- Context: 1M tokens

**Opção 4: Groq (Ultra-rápido)**
```env
GROQ_API_KEY=gsk-xxx
```
- Inferência mais rápida
- Modelos open-source
- Free tier generoso

### 2. Sandbox Provider (Requerido)

#### Opção 1: Vercel (Recomendado)
```bash
# Instalar Vercel CLI
pnpm add -g vercel

# Setup
vercel link
vercel env pull

# Isso gera automaticamente VERCEL_OIDC_TOKEN
```

```env
SANDBOX_PROVIDER=vercel
VERCEL_OIDC_TOKEN=xxx  # Auto-gerado
```

#### Opção 2: E2B
```env
SANDBOX_PROVIDER=e2b
E2B_API_KEY=xxx
```
- Criar conta: https://e2b.dev
- Free tier: 100 horas/mês

### 3. Features Opcionais

#### Fast Edits (MorphLLM)
```env
MORPH_API_KEY=xxx
```
- 10x mais rápido para edições
- https://morphllm.com

## Estrutura de Arquivos

```
open-lovable-enhanced/
├── app/
│   ├── api/
│   │   └── generate-enhanced/    # Multi-model API
│   ├── page.tsx                   # Home page
│   └── layout.tsx
├── lib/
│   ├── ai/
│   │   ├── enhanced/             # Sistema de prompts v2
│   │   ├── multi-model/          # Model orchestration
│   │   └── context/              # Context builder
│   ├── storage/                  # Hybrid storage
│   └── testing/                  # Auto test gen
├── components/
│   └── preview/
│       └── enhanced/             # Enhanced preview
├── examples/
│   └── usage.ts                  # Exemplos de uso
├── types/
│   └── global.d.ts              # Tipos globais
├── .env.example                  # Template de config
└── README_ENHANCED.md            # Documentação

```

## Checklist de Setup

### ✅ Instalação Base
- [ ] Node.js 18+ instalado
- [ ] pnpm/npm/yarn instalado
- [ ] Git instalado
- [ ] Editor de código (VS Code recomendado)

### ✅ Configuração de APIs
- [ ] Firecrawl API key configurada
- [ ] Pelo menos 1 AI provider configurado
- [ ] Sandbox provider configurado
- [ ] .env.local criado e populado

### ✅ Verificação
```bash
# Testar configuração
pnpm type-check    # Verificar TypeScript
pnpm lint          # Verificar ESLint
pnpm dev           # Iniciar dev server
```

### ✅ Features Opcionais
- [ ] MorphLLM configurado (fast edits)
- [ ] Múltiplos AI providers (fallback)
- [ ] Analytics configurado
- [ ] Sentry para error tracking

## Validação da Instalação

### Teste 1: Server rodando
```bash
pnpm dev
# ✓ Abrir http://localhost:3000
# ✓ Deve carregar sem erros
```

### Teste 2: AI Generation
```bash
# No console do navegador:
fetch('/api/generate-enhanced', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    message: 'criar um botão',
    taskType: 'quick-edit'
  })
}).then(r => r.json()).then(console.log)

# ✓ Deve retornar código gerado
```

### Teste 3: Storage
```bash
# No console do navegador:
const { storage } = await import('@/lib/storage/hybrid-storage');
await storage.init();
await storage.save({
  id: 'test',
  name: 'Test Project',
  files: {},
  framework: 'next',
  createdAt: Date.now(),
  updatedAt: Date.now(),
  version: 1
});
console.log(await storage.list());

# ✓ Deve listar projeto salvo
```

## Troubleshooting

### Erro: "Module not found"
```bash
# Reinstalar dependências
rm -rf node_modules .next
pnpm install
```

### Erro: "API key invalid"
- Verificar formato da key no .env.local
- Testar key direto no provider
- Verificar expiração da key

### Erro: "Cannot connect to sandbox"
```bash
# Vercel
vercel link --yes
vercel env pull .env.local

# E2B
# Verificar quota no dashboard
```

### Performance lenta
1. Trocar para modelo mais rápido (gpt-4o-mini)
2. Reduzir complexidade das requisições
3. Ativar cache local
4. Usar MorphLLM para edições

## Próximos Passos

1. **Explorar exemplos**: `/examples/usage.ts`
2. **Ler documentação**: `/README_ENHANCED.md`
3. **Configurar preferências**: Ajustar `qualityBias` no router
4. **Testar features**: Enhanced preview, storage, testing
5. **Customizar**: Adicionar seus próprios prompts

## Suporte

- 📖 Docs: `/README_ENHANCED.md`
- 🐛 Issues: GitHub Issues
- 💬 Discord: [Link do servidor]
- 📧 Email: support@project.com

---

**Setup completo em ~5 minutos** ✨
