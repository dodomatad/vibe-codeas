# Vibe Code - AI-Powered Development Platform

A plataforma de desenvolvimento com IA que **realmente funciona**. Clone, configure as API keys, e comece a usar.

## Quick Start (5 minutos)

### 1. Clone e instale

```bash
git clone https://github.com/seu-usuario/vibe-code.git
cd vibe-code
npm install
```

### 2. Configure as variáveis de ambiente

Copie o arquivo de exemplo e preencha suas API keys:

```bash
cp .env.example .env
```

Edite o arquivo `.env` e adicione **pelo menos uma** das API keys de IA:

```env
# Escolha pelo menos uma (recomendado: Anthropic Claude)
ANTHROPIC_API_KEY=sk-ant-sua-chave-aqui
OPENAI_API_KEY=sk-sua-chave-aqui
GOOGLE_API_KEY=sua-chave-aqui
```

### 3. Rode o app

```bash
npm run dev
```

Abra [http://localhost:3000](http://localhost:3000) no navegador.

## API Keys - Onde conseguir?

### Anthropic (Claude) - Recomendado
1. Acesse: https://console.anthropic.com/
2. Crie uma conta
3. Vá em "API Keys"
4. Copie a chave que começa com `sk-ant-...`

### OpenAI (GPT)
1. Acesse: https://platform.openai.com/
2. Crie uma conta
3. Vá em "API Keys"
4. Copie a chave que começa com `sk-...`

### Google (Gemini)
1. Acesse: https://makersuite.google.com/
2. Crie uma conta
3. Gere uma API key
4. Copie a chave

## Configuração Opcional

### Banco de Dados (PostgreSQL)

Se quiser usar funcionalidades avançadas (histórico, usuários):

```bash
# Instale PostgreSQL localmente
# macOS: brew install postgresql
# Ubuntu: apt install postgresql

# Configure a URL do banco
DATABASE_URL=postgresql://user:pass@localhost:5432/vibecode
```

### Redis (Cache)

Para melhor performance:

```bash
# Instale Redis
# macOS: brew install redis
# Ubuntu: apt install redis

# Configure a URL do Redis
REDIS_URL=redis://localhost:6379
```

## Estrutura do Projeto

```
vibe-code/
├── app/              # Páginas e API routes (Next.js)
├── components/       # Componentes React
├── lib/              # Lógica de negócio
│   ├── ai/          # Integração com modelos de IA
│   ├── sandbox/     # Execução de código isolada
│   ├── security/    # Rate limiting, sanitização
│   └── frameworks/  # Suporte multi-framework
├── styles/          # Estilos globais (Tailwind)
├── types/           # TypeScript definitions
└── tests/           # Testes automatizados
```

## Features Principais

- **Multi-Model AI**: Suporte para Claude, GPT, Gemini
- **Sandbox Execution**: Código roda isolado e seguro
- **Framework Detection**: Detecta React, Vue, Svelte, etc
- **Real-time Streaming**: Respostas da IA em tempo real
- **Cost Tracking**: Nunca cobrar por erros da IA
- **Package Detection**: Instala dependências automaticamente

## Comandos Úteis

```bash
# Desenvolvimento
npm run dev          # Inicia servidor dev

# Build e produção
npm run build        # Build otimizado
npm run start        # Roda build de produção

# Testes
npm run test         # Roda todos os testes
npm run test:watch   # Testes em watch mode

# Qualidade de código
npm run lint         # Verifica erros
npm run type-check   # Verifica tipos TypeScript
npm run format       # Formata código
```

## Troubleshooting

### App não inicia

```bash
# Limpe cache e reinstale
rm -rf node_modules package-lock.json
npm install
```

### Erro de API Key

Verifique se:
1. Copiou a key completa (sem espaços)
2. A key começa com o prefixo correto (`sk-ant-`, `sk-`, etc)
3. O arquivo `.env` está na raiz do projeto
4. Reiniciou o servidor após adicionar a key

### Erro de porta 3000 em uso

```bash
# Use outra porta
PORT=3001 npm run dev
```

## Requisitos Mínimos

- Node.js 18+ (recomendado 20+)
- npm ou pnpm
- 2GB RAM disponível
- Uma API key de IA (Anthropic, OpenAI ou Google)

## Stack Tecnológico

- **Framework**: Next.js 15 + React 19
- **Linguagem**: TypeScript 5
- **Styling**: Tailwind CSS + Radix UI
- **State**: Jotai
- **AI SDK**: Vercel AI SDK
- **Database**: PostgreSQL (opcional)
- **Cache**: Redis (opcional)

## Documentação Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura técnica
- [GETTING_STARTED.md](./GETTING_STARTED.md) - Guia detalhado
- [INSTALLATION.md](./INSTALLATION.md) - Instalação avançada

## Licença

MIT - Use comercialmente sem restrições

## Suporte

- Issues: https://github.com/seu-usuario/vibe-code/issues
- Discussões: https://github.com/seu-usuario/vibe-code/discussions

---

**Feito com foco em funcionalidade e simplicidade**
