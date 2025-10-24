/**
 * Real-Time Cost Tracker
 * REGRA CRÍTICA: Nunca cobrar por erros da IA
 */

export interface CostBreakdown {
  model: string;
  inputTokens: number;
  outputTokens: number;
  costPerToken: { input: number; output: number };
  totalCost: number;
  wasError: boolean; // Se erro IA, custo = 0
}

export interface SessionCosts {
  currentRequest: number;
  sessionTotal: number;
  monthlyTotal: number;
  estimatedNextRequest: number;
  breakdown: CostBreakdown[];
  freeCreditsRemaining: number;
}

const MODEL_PRICING = {
  'claude-sonnet-4': { input: 0.003, output: 0.015 },
  'gpt-5': { input: 0.005, output: 0.015 },
  'gemini-2.5-pro': { input: 0.001, output: 0.005 },
} as const;

export class CostTracker {
  private sessionCosts: SessionCosts = {
    currentRequest: 0,
    sessionTotal: 0,
    monthlyTotal: 0,
    estimatedNextRequest: 0,
    breakdown: [],
    freeCreditsRemaining: 100,
  };

  /**
   * Calcular custo de request
   * IMPORTANTE: Se erro IA, retorna custo 0
   */
  calculateCost(
    model: keyof typeof MODEL_PRICING,
    inputTokens: number,
    outputTokens: number,
    wasError: boolean = false
  ): CostBreakdown {
    const pricing = MODEL_PRICING[model];
    
    // REGRA CRÍTICA: Nunca cobrar por erros da IA
    if (wasError) {
      return {
        model,
        inputTokens,
        outputTokens,
        costPerToken: pricing,
        totalCost: 0, // CUSTO ZERO
        wasError: true,
      };
    }

    const inputCost = (inputTokens / 1000) * pricing.input;
    const outputCost = (outputTokens / 1000) * pricing.output;
    const totalCost = inputCost + outputCost;

    return {
      model,
      inputTokens,
      outputTokens,
      costPerToken: pricing,
      totalCost,
      wasError: false,
    };
  }

  async trackRequest(breakdown: CostBreakdown, userId: string): Promise<void> {
    this.sessionCosts.currentRequest = breakdown.totalCost;
    this.sessionCosts.sessionTotal += breakdown.totalCost;
    this.sessionCosts.breakdown.push(breakdown);
    await this.persistToDatabase(userId, breakdown);
    this.emitCostUpdate(userId, this.sessionCosts);
  }

  getCurrentCosts(): SessionCosts {
    return { ...this.sessionCosts };
  }

  private async persistToDatabase(userId: string, breakdown: CostBreakdown): Promise<void> {
    // Implementar persistência PostgreSQL
  }

  private emitCostUpdate(userId: string, costs: SessionCosts): void {
    // Emitir via WebSocket/SSE para UI real-time
  }
}

export const costTracker = new CostTracker();
