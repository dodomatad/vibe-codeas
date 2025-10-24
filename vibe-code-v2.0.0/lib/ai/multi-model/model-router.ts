/**
 * Multi-Model Router (v0.dev style)
 * Roteia requests para o melhor modelo baseado na tarefa
 */

export type ModelType = 
  | 'claude-sonnet-4'  // Melhor para agentic
  | 'gpt-5'            // Performance geral forte
  | 'gemini-2.5-pro'   // Long context (1M+ tokens)
  | 'deepseek-v3';     // Cost-effective

export type TaskType = 
  | 'code-generation'
  | 'code-edit'
  | 'debugging'
  | 'refactoring'
  | 'testing'
  | 'documentation'
  | 'complex-reasoning';

const TASK_MODEL_MAP: Record<TaskType, ModelType> = {
  'code-generation': 'claude-sonnet-4',
  'code-edit': 'claude-sonnet-4',
  'debugging': 'claude-sonnet-4',
  'refactoring': 'gpt-5',
  'testing': 'deepseek-v3', 
  'documentation': 'deepseek-v3',
  'complex-reasoning': 'gemini-2.5-pro',
};

export class ModelRouter {
  /**
   * Seleciona o melhor modelo baseado na tarefa
   */
  selectModel(task: TaskType): ModelType {
    return TASK_MODEL_MAP[task];
  }

  /**
   * Permite override manual pelo usuário
   */
  selectModelWithOverride(
    task: TaskType,
    userOverride?: ModelType
  ): ModelType {
    return userOverride ?? this.selectModel(task);
  }

  /**
   * Calcula custo estimado para a tarefa
   */
  estimateCost(
    task: TaskType,
    estimatedTokens: { input: number; output: number },
    model?: ModelType
  ): number {
    const selectedModel = model ?? this.selectModel(task);
    const pricing = MODEL_PRICING[selectedModel];
    
    const inputCost = (estimatedTokens.input / 1000) * pricing.input;
    const outputCost = (estimatedTokens.output / 1000) * pricing.output;
    
    return inputCost + outputCost;
  }
}

const MODEL_PRICING = {
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'gpt-5': { input: 0.005, output: 0.015 },
  'gemini-2.5-pro': { input: 0.001, output: 0.005 },
  'deepseek-v3': { input: 0.0005, output: 0.002 },
} as const;

export const modelRouter = new ModelRouter();
