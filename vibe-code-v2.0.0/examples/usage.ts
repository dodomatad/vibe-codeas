/**
 * EXEMPLO DE USO - Open Lovable Enhanced
 * Demonstra implementação completa dos novos recursos
 */

import { createModelRouter } from '@/lib/ai/multi-model/model-router';
import { createContextBuilder } from '@/lib/ai/context/context-builder';
import { buildSystemPrompt, enhanceUserMessage } from '@/lib/ai/enhanced/system-prompts';
import { storage } from '@/lib/storage/hybrid-storage';
import { testGenerator } from '@/lib/testing/auto-test-gen';

// ========================================
// EXEMPLO 1: Multi-Model Orchestration
// ========================================

async function exemplo1_MultiModel() {
  // Criar router com preferências
  const router = createModelRouter({
    qualityBias: 0.7,        // 70% qualidade, 30% custo
    maxCostPerRequest: 1.0,  // Máx $1 por request
    preferredModels: ['claude-sonnet-4', 'gpt-4o']
  });

  // Selecionar modelo ideal para tarefa
  const config = router.selectModel(
    'refactoring',  // Tipo de tarefa
    5000,          // Tamanho do contexto
    'high'         // Complexidade
  );

  console.log('Modelo selecionado:', config);
  // Output: { id: 'claude-sonnet-4', provider: 'anthropic', ... }

  // Registrar resultado para aprendizado
  router.recordUsage(
    config.id,
    true,      // sucesso
    1500,      // latência (ms)
    10000      // tokens usados
  );

  // Ver estatísticas
  const stats = router.getUsageStats();
  console.log('Estatísticas:', stats);
}

// ========================================
// EXEMPLO 2: Context-Aware Generation
// ========================================

async function exemplo2_ContextAware() {
  // Analisar projeto
  const builder = createContextBuilder(process.cwd());
  const context = await builder.buildContext();

  console.log('Contexto do projeto:', {
    framework: context.framework,
    componentes: context.components.length,
    rotas: context.routes.length,
    styleSystem: context.styleSystem
  });

  // Gerar código usando contexto
  const userMessage = 'Criar componente de card';
  const enhancedMessage = enhanceUserMessage(userMessage, context);

  console.log('Mensagem enhanced:', enhancedMessage);
  // Inclui informações do projeto para geração consistente
}

// ========================================
// EXEMPLO 3: Enhanced Prompts
// ========================================

async function exemplo3_EnhancedPrompts() {
  // Build system prompt otimizado
  const systemPrompt = buildSystemPrompt({
    framework: 'next',
    complexity: 'medium',
    focus: 'quality',
    features: ['typescript', 'accessibility', 'testing']
  });

  console.log('System prompt gerado');
  // Prompt otimizado com best practices e guidelines
}

// ========================================
// EXEMPLO 4: Local Storage
// ========================================

async function exemplo4_LocalStorage() {
  // Inicializar storage
  await storage.init();

  // Criar projeto
  const project: OpenLovable.Project = {
    id: 'proj-1',
    name: 'Meu App',
    files: {
      'app/page.tsx': 'export default function Home() { return <div>Hello</div> }',
      'components/Button.tsx': '// Button component'
    },
    framework: 'next',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1
  };

  // Salvar
  await storage.save(project);

  // Carregar
  const loaded = await storage.load('proj-1');
  console.log('Projeto carregado:', loaded?.name);

  // Criar snapshot de versão
  const versionId = await storage.createVersion('proj-1', 'Initial commit');
  console.log('Versão criada:', versionId);

  // Listar versões
  const versions = await storage.getVersions('proj-1');
  console.log('Versões:', versions.length);

  // Restaurar versão anterior
  await storage.restoreVersion(versionId);

  // Exportar projeto
  const blob = await storage.export('proj-1');
  console.log('Projeto exportado:', blob.size, 'bytes');

  // Importar projeto
  const newId = await storage.import(blob);
  console.log('Projeto importado com ID:', newId);
}

// ========================================
// EXEMPLO 5: Testing Automation
// ========================================

async function exemplo5_Testing() {
  const componentCode = `
interface ButtonProps {
  label: string;
  onClick: () => void;
  disabled?: boolean;
}

export function Button({ label, onClick, disabled }: ButtonProps) {
  return (
    <button onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}
  `;

  // Analisar componente
  const analysis = testGenerator.analyzeComponent(componentCode);
  console.log('Análise:', analysis);

  // Gerar testes
  const tests = testGenerator.generateComponentTests(analysis);
  
  console.log('Testes gerados:');
  console.log('- Unit:', tests.unit.length);
  console.log('- Integration:', tests.integration.length);
  console.log('- E2E:', tests.e2e.length);
  console.log('- A11y:', tests.accessibility.length);

  // Ver exemplo de teste
  console.log('\nExemplo de teste unit:');
  console.log(tests.unit[0]);
}

// ========================================
// EXEMPLO 6: API Integration
// ========================================

async function exemplo6_APIIntegration() {
  const response = await fetch('/api/generate-enhanced', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: 'Criar componente de formulário de login',
      projectPath: process.cwd(),
      taskType: 'initial-generation',
      complexity: 'medium'
    })
  });

  const data: OpenLovable.GenerationResponse = await response.json();
  
  if (data.success) {
    console.log('Código gerado com modelo:', data.data?.model);
    console.log('Latência:', data.data?.latency, 'ms');
    console.log('Tokens usados:', data.data?.usage.totalTokens);
    console.log('Custo estimado:', data.data?.usage.cost);
    console.log('\nCódigo:\n', data.data?.code);
  }
}

// ========================================
// EXEMPLO 7: Uso Completo
// ========================================

async function exemploCompleto() {
  console.log('🚀 Open Lovable Enhanced - Demo Completa\n');

  // 1. Setup
  await storage.init();
  const router = createModelRouter({ qualityBias: 0.7 });
  const builder = createContextBuilder(process.cwd());

  // 2. Analisar projeto
  console.log('📊 Analisando projeto...');
  const context = await builder.buildContext();
  console.log(`✓ Framework: ${context.framework}`);
  console.log(`✓ Componentes: ${context.components.length}`);
  console.log(`✓ Rotas: ${context.routes.length}\n`);

  // 3. Selecionar modelo
  console.log('🤖 Selecionando modelo ideal...');
  const model = router.selectModel('refactoring', 5000, 'medium');
  console.log(`✓ Modelo: ${model.id}`);
  console.log(`✓ Provider: ${model.provider}\n`);

  // 4. Gerar código (simulado)
  console.log('💻 Gerando código...');
  const code = '// Código gerado pelo AI...';
  console.log(`✓ Código gerado: ${code.length} caracteres\n`);

  // 5. Salvar projeto
  console.log('💾 Salvando projeto...');
  const project: OpenLovable.Project = {
    id: 'demo-' + Date.now(),
    name: 'Demo Project',
    files: { 'app/page.tsx': code },
    framework: 'next',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    version: 1
  };
  await storage.save(project);
  console.log(`✓ Projeto salvo: ${project.id}\n`);

  // 6. Gerar testes
  console.log('🧪 Gerando testes...');
  const analysis = testGenerator.analyzeComponent(code);
  const tests = testGenerator.generateComponentTests(analysis);
  console.log(`✓ Testes gerados: ${tests.unit.length + tests.integration.length + tests.e2e.length}\n`);

  // 7. Criar versão
  console.log('📦 Criando snapshot...');
  const versionId = await storage.createVersion(project.id, 'Demo version');
  console.log(`✓ Versão criada: ${versionId}\n`);

  console.log('✅ Demo completa!');
}

// ========================================
// EXECUTAR EXEMPLOS
// ========================================

export async function runExamples() {
  console.log('\n=================================');
  console.log('OPEN LOVABLE ENHANCED - EXEMPLOS');
  console.log('=================================\n');

  try {
    // Descomentar para executar exemplos individuais
    // await exemplo1_MultiModel();
    // await exemplo2_ContextAware();
    // await exemplo3_EnhancedPrompts();
    // await exemplo4_LocalStorage();
    // await exemplo5_Testing();
    // await exemplo6_APIIntegration();
    
    // Ou executar demo completa
    await exemploCompleto();
  } catch (error) {
    console.error('Erro ao executar exemplos:', error);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  runExamples();
}
