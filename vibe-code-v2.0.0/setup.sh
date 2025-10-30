#!/bin/bash

# Vibe Code - Setup Automático
# Este script configura o projeto automaticamente

set -e

echo "🚀 Vibe Code - Setup Automático"
echo "================================"
echo ""

# Verificar Node.js
echo "📦 Verificando Node.js..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Instale Node.js 18+ primeiro:"
    echo "   https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "⚠️  Node.js versão $NODE_VERSION detectada. Recomendado: 18+"
fi

echo "✅ Node.js $(node -v) encontrado"
echo ""

# Verificar npm
echo "📦 Verificando npm..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado"
    exit 1
fi
echo "✅ npm $(npm -v) encontrado"
echo ""

# Instalar dependências
echo "📦 Instalando dependências..."
echo "   (Isso pode levar alguns minutos...)"
npm install
echo "✅ Dependências instaladas"
echo ""

# Configurar .env
echo "🔑 Configurando variáveis de ambiente..."
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ Arquivo .env criado"
    echo ""
    echo "⚠️  IMPORTANTE: Configure suas API keys no arquivo .env"
    echo ""
    echo "   Você precisa de pelo menos UMA destas API keys:"
    echo "   - ANTHROPIC_API_KEY (Recomendado)"
    echo "   - OPENAI_API_KEY"
    echo "   - GOOGLE_API_KEY"
    echo ""
    echo "   Como conseguir:"
    echo "   - Anthropic: https://console.anthropic.com/"
    echo "   - OpenAI: https://platform.openai.com/"
    echo "   - Google: https://makersuite.google.com/"
    echo ""
else
    echo "ℹ️  Arquivo .env já existe"

    # Verificar se há pelo menos uma API key configurada
    if grep -q "ANTHROPIC_API_KEY=sk-ant-" .env || \
       grep -q "OPENAI_API_KEY=sk-" .env || \
       grep -q "GOOGLE_API_KEY=." .env; then
        echo "✅ API key encontrada no .env"
    else
        echo ""
        echo "⚠️  Nenhuma API key configurada no .env"
        echo "   Adicione pelo menos uma API key antes de iniciar o app"
    fi
fi
echo ""

# Build do TypeScript
echo "🔨 Verificando tipos TypeScript..."
npm run type-check || echo "⚠️  Alguns erros de tipo encontrados (não bloqueante)"
echo ""

# Sucesso
echo "================================"
echo "✅ Setup completo!"
echo ""
echo "🎯 Próximos passos:"
echo ""
echo "1. Configure suas API keys no arquivo .env:"
echo "   nano .env"
echo ""
echo "2. Inicie o servidor de desenvolvimento:"
echo "   npm run dev"
echo ""
echo "3. Abra o app no navegador:"
echo "   http://localhost:3000"
echo ""
echo "📚 Documentação: ./README.md"
echo "❓ Problemas? Veja: ./README.md#troubleshooting"
echo ""
