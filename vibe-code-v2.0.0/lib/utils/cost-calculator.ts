// lib/utils/cost-calculator.ts
/**
 * Cost Calculator for Vibe Code
 * Calculates operational costs for AI code generation
 */

// Token costs per 1M tokens (as of 2025-01-30)
export const MODEL_COSTS = {
  // Anthropic Claude
  'claude-sonnet-4': {
    input: 3.00,   // $3.00 per 1M input tokens
    output: 15.00, // $15.00 per 1M output tokens
  },
  'claude-opus-4': {
    input: 15.00,
    output: 75.00,
  },
  'claude-haiku-4': {
    input: 0.25,
    output: 1.25,
  },

  // OpenAI GPT
  'gpt-4': {
    input: 30.00,
    output: 60.00,
  },
  'gpt-4-turbo': {
    input: 10.00,
    output: 30.00,
  },
  'gpt-3.5-turbo': {
    input: 0.50,
    output: 1.50,
  },

  // Google Gemini
  'gemini-2.0-flash': {
    input: 0.30,
    output: 1.20,
  },
  'gemini-1.5-pro': {
    input: 1.25,
    output: 5.00,
  },
} as const;

export type ModelName = keyof typeof MODEL_COSTS;

// E2B Sandbox costs
export const SANDBOX_COSTS = {
  compute: 0.001, // $0.001 per minute
  storage: 0.10,  // $0.10 per GB-hour
} as const;

// Competitor costs (monthly subscriptions)
export const COMPETITOR_COSTS = {
  lovable: 20,    // $20/month
  cursor: 20,     // $20/month (Pro)
  replit: 25,     // $25/month (Core)
  copilot: 10,    // $10/month (individual)
  v0: 20,         // $20/month
} as const;

/**
 * Estimate token counts for prompt and generation
 */
export function estimateTokens(prompt: string, generationType: 'simple' | 'medium' | 'complex') {
  // Base prompt tokens (rough estimate: 1 token ≈ 4 characters)
  const basePromptTokens = Math.ceil(prompt.length / 4);

  // Enhanced prompt adds context (estimated multiplier)
  const enhancedPromptTokens = basePromptTokens * 10;

  // Output tokens based on complexity
  const outputTokens = {
    simple: 500,      // Simple component: ~500 tokens
    medium: 2000,     // Medium feature: ~2000 tokens
    complex: 5000,    // Complex app: ~5000 tokens
  }[generationType];

  return {
    inputTokens: enhancedPromptTokens,
    outputTokens,
    totalTokens: enhancedPromptTokens + outputTokens,
  };
}

/**
 * Calculate cost for single generation
 */
export function calculateGenerationCost(
  model: ModelName,
  inputTokens: number,
  outputTokens: number
): number {
  const costs = MODEL_COSTS[model];

  const inputCost = (inputTokens / 1_000_000) * costs.input;
  const outputCost = (outputTokens / 1_000_000) * costs.output;

  return inputCost + outputCost;
}

/**
 * Calculate sandbox cost for generation
 */
export function calculateSandboxCost(durationMinutes: number): number {
  return durationMinutes * SANDBOX_COSTS.compute;
}

/**
 * Calculate total cost for complete app generation
 */
export interface GenerationCostBreakdown {
  aiCost: number;
  sandboxCost: number;
  totalCost: number;
  inputTokens: number;
  outputTokens: number;
  durationMinutes: number;
}

export function calculateCompleteCost(
  model: ModelName,
  prompt: string,
  generationType: 'simple' | 'medium' | 'complex',
  durationMinutes: number = 1
): GenerationCostBreakdown {
  const tokens = estimateTokens(prompt, generationType);
  const aiCost = calculateGenerationCost(model, tokens.inputTokens, tokens.outputTokens);
  const sandboxCost = calculateSandboxCost(durationMinutes);

  return {
    aiCost,
    sandboxCost,
    totalCost: aiCost + sandboxCost,
    inputTokens: tokens.inputTokens,
    outputTokens: tokens.outputTokens,
    durationMinutes,
  };
}

/**
 * Calculate monthly cost based on usage
 */
export interface MonthlyCostEstimate {
  generationsPerMonth: number;
  costPerGeneration: number;
  totalMonthlyCost: number;
  vsCursor: number;      // Savings compared to Cursor
  vsLovable: number;     // Savings compared to Lovable
  vsReplit: number;      // Savings compared to Replit
  savingsPercent: number;
}

export function calculateMonthlyCost(
  model: ModelName,
  generationsPerMonth: number,
  generationType: 'simple' | 'medium' | 'complex' = 'medium'
): MonthlyCostEstimate {
  // Average generation cost
  const costPerGeneration = calculateCompleteCost(
    model,
    'Create a todo app with authentication',
    generationType,
    1
  ).totalCost;

  const totalMonthlyCost = costPerGeneration * generationsPerMonth;

  // Compare with competitors (assume unlimited usage)
  const cursorCost = COMPETITOR_COSTS.cursor;
  const lovableCost = COMPETITOR_COSTS.lovable;
  const replitCost = COMPETITOR_COSTS.replit;

  const avgCompetitorCost = (cursorCost + lovableCost + replitCost) / 3;
  const savingsPercent = ((avgCompetitorCost - totalMonthlyCost) / avgCompetitorCost) * 100;

  return {
    generationsPerMonth,
    costPerGeneration,
    totalMonthlyCost,
    vsCursor: cursorCost - totalMonthlyCost,
    vsLovable: lovableCost - totalMonthlyCost,
    vsReplit: replitCost - totalMonthlyCost,
    savingsPercent: Math.max(0, savingsPercent),
  };
}

/**
 * Get cost recommendations based on usage
 */
export interface CostRecommendation {
  recommendedModel: ModelName;
  estimatedMonthlyCost: number;
  reason: string;
}

export function getRecommendedModel(
  generationsPerMonth: number
): CostRecommendation {
  // For low usage (< 50/month), Claude Sonnet 4 is best
  if (generationsPerMonth < 50) {
    const cost = calculateMonthlyCost('claude-sonnet-4', generationsPerMonth);
    return {
      recommendedModel: 'claude-sonnet-4',
      estimatedMonthlyCost: cost.totalMonthlyCost,
      reason: 'Best quality/cost ratio for low usage',
    };
  }

  // For medium usage (50-200/month), GPT-4 Turbo is competitive
  if (generationsPerMonth < 200) {
    const cost = calculateMonthlyCost('gpt-4-turbo', generationsPerMonth);
    return {
      recommendedModel: 'gpt-4-turbo',
      estimatedMonthlyCost: cost.totalMonthlyCost,
      reason: 'Good balance of quality and cost for medium usage',
    };
  }

  // For high usage (200+/month), Gemini Flash is most cost-effective
  const cost = calculateMonthlyCost('gemini-2.0-flash', generationsPerMonth);
  return {
    recommendedModel: 'gemini-2.0-flash',
    estimatedMonthlyCost: cost.totalMonthlyCost,
    reason: 'Most cost-effective for high volume',
  };
}

/**
 * Format cost as currency
 */
export function formatCost(cost: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 4,
  }).format(cost);
}

/**
 * Calculate cost breakdown for display
 */
export interface CostBreakdownDisplay {
  model: ModelName;
  prompt: string;
  generationType: string;
  inputTokens: string;
  outputTokens: string;
  aiCost: string;
  sandboxCost: string;
  totalCost: string;
  vsCursor: string;
  vsLovable: string;
  savings: string;
}

export function getDisplayCostBreakdown(
  model: ModelName,
  prompt: string,
  generationType: 'simple' | 'medium' | 'complex'
): CostBreakdownDisplay {
  const cost = calculateCompleteCost(model, prompt, generationType);

  // Compare with single use of competitor (average $0.50 per generation)
  const competitorCostPerGen = 0.50;
  const savings = competitorCostPerGen - cost.totalCost;
  const savingsPercent = (savings / competitorCostPerGen) * 100;

  return {
    model,
    prompt: prompt.substring(0, 50) + '...',
    generationType,
    inputTokens: cost.inputTokens.toLocaleString(),
    outputTokens: cost.outputTokens.toLocaleString(),
    aiCost: formatCost(cost.aiCost),
    sandboxCost: formatCost(cost.sandboxCost),
    totalCost: formatCost(cost.totalCost),
    vsCursor: formatCost(COMPETITOR_COSTS.cursor),
    vsLovable: formatCost(COMPETITOR_COSTS.lovable),
    savings: `${formatCost(savings)} (${savingsPercent.toFixed(0)}% cheaper)`,
  };
}

// Export all types and functions
export default {
  MODEL_COSTS,
  SANDBOX_COSTS,
  COMPETITOR_COSTS,
  estimateTokens,
  calculateGenerationCost,
  calculateSandboxCost,
  calculateCompleteCost,
  calculateMonthlyCost,
  getRecommendedModel,
  formatCost,
  getDisplayCostBreakdown,
};
