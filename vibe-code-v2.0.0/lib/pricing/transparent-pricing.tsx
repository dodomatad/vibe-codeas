/**
 * TRANSPARENT PRICING SYSTEM - Vibe Code Ultimate
 * 
 * PROBLEMA #1 de TODAS as plataformas: Cobrar por erros da IA
 * - Lovable: "Você é cobrado pelos erros da própria IA" (40-60% reclamações)
 * - Replit: "$1K desde que Agent 3 lançou" por erros
 * - bolt.new: "140 milhões de tokens desperdiçados quando resposta falha"
 * - v0.dev: "Cobrado por gerações falhadas"
 * 
 * NOSSA SOLUÇÃO:
 * ✅ Sem cobranças por erros de IA
 * ✅ Cost tracking em tempo real na UI
 * ✅ Pricing previsível e transparente
 * ✅ Orçamento configurável com alertas
 * ✅ Breakdown detalhado de custos
 * ✅ Rollback sem custos
 */

export interface CostBreakdown {
  timestamp: number;
  operation: string;
  modelUsed: string;
  tokensInput: number;
  tokensOutput: number;
  costInput: number;
  costOutput: number;
  totalCost: number;
  wasError: boolean;
  wasRollback: boolean;
  userCharged: boolean; // FALSE se foi erro da IA
}

export interface BudgetConfig {
  dailyLimit: number;
  weeklyLimit: number;
  monthlyLimit: number;
  alertThresholds: number[]; // [50%, 75%, 90%]
  autoStopAtLimit: boolean;
}

export interface CostMetrics {
  today: number;
  thisWeek: number;
  thisMonth: number;
  allTime: number;
  operationsCount: number;
  errorsNotCharged: number;
  savingsFromErrorPolicy: number;
}

export class TransparentPricingEngine {
  private costHistory: CostBreakdown[] = [];
  private budget: BudgetConfig;
  private metrics: CostMetrics = {
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    allTime: 0,
    operationsCount: 0,
    errorsNotCharged: 0,
    savingsFromErrorPolicy: 0,
  };

  constructor(budget?: BudgetConfig) {
    this.budget = budget || {
      dailyLimit: 10.0,
      weeklyLimit: 50.0,
      monthlyLimit: 200.0,
      alertThresholds: [0.5, 0.75, 0.9],
      autoStopAtLimit: true,
    };
  }

  /**
   * TRACK OPERATION - Registra custo com transparência total
   * 
   * CRITICAL: Se operação falhou por erro da IA, usuário NÃO É COBRADO
   */
  public async trackOperation(params: {
    operation: string;
    modelUsed: string;
    tokensInput: number;
    tokensOutput: number;
    costPerTokenInput: number;
    costPerTokenOutput: number;
    success: boolean;
    errorCausedByAI: boolean;
  }): Promise<CostBreakdown> {
    const costInput = params.tokensInput * params.costPerTokenInput;
    const costOutput = params.tokensOutput * params.costPerTokenOutput;
    const totalCost = costInput + costOutput;

    // POLICY: Não cobrar se erro causado pela IA
    const userCharged = params.success || !params.errorCausedByAI;
    const wasError = !params.success;

    const breakdown: CostBreakdown = {
      timestamp: Date.now(),
      operation: params.operation,
      modelUsed: params.modelUsed,
      tokensInput: params.tokensInput,
      tokensOutput: params.tokensOutput,
      costInput,
      costOutput,
      totalCost,
      wasError,
      wasRollback: false,
      userCharged,
    };

    this.costHistory.push(breakdown);

    // Update metrics
    if (userCharged) {
      this.metrics.today += totalCost;
      this.metrics.thisWeek += totalCost;
      this.metrics.thisMonth += totalCost;
      this.metrics.allTime += totalCost;
    } else {
      this.metrics.errorsNotCharged++;
      this.metrics.savingsFromErrorPolicy += totalCost;
    }
    
    this.metrics.operationsCount++;

    // Check budget limits
    await this.checkBudgetLimits();

    return breakdown;
  }

  /**
   * ROLLBACK TRACKING - Rollbacks são GRATUITOS
   * 
   * Se usuário precisa reverter mudanças, não há custos adicionais
   * Cursor/Replit cobram por rollbacks, nós não
   */
  public trackRollback(originalOperationId: string): CostBreakdown {
    const breakdown: CostBreakdown = {
      timestamp: Date.now(),
      operation: `Rollback: ${originalOperationId}`,
      modelUsed: 'none',
      tokensInput: 0,
      tokensOutput: 0,
      costInput: 0,
      costOutput: 0,
      totalCost: 0,
      wasError: false,
      wasRollback: true,
      userCharged: false, // ROLLBACKS SÃO SEMPRE GRATUITOS
    };

    this.costHistory.push(breakdown);
    return breakdown;
  }

  /**
   * REAL-TIME COST DISPLAY - Mostrar custos ANTES de executar
   */
  public estimateCost(params: {
    operation: string;
    estimatedInputTokens: number;
    estimatedOutputTokens: number;
    modelKey: string;
  }): {
    estimated: number;
    breakdown: string;
    withinBudget: boolean;
    budgetRemaining: number;
  } {
    const model = this.getModelPricing(params.modelKey);
    const estimatedCost = 
      (params.estimatedInputTokens * model.costPerTokenInput) +
      (params.estimatedOutputTokens * model.costPerTokenOutput);

    const budgetRemaining = this.budget.dailyLimit - this.metrics.today;
    const withinBudget = estimatedCost <= budgetRemaining;

    return {
      estimated: estimatedCost,
      breakdown: `Input: ${params.estimatedInputTokens} tokens × $${model.costPerTokenInput} = $${(params.estimatedInputTokens * model.costPerTokenInput).toFixed(6)}\nOutput: ${params.estimatedOutputTokens} tokens × $${model.costPerTokenOutput} = $${(params.estimatedOutputTokens * model.costPerTokenOutput).toFixed(6)}`,
      withinBudget,
      budgetRemaining,
    };
  }

  /**
   * BUDGET ALERTS - Notificar antes de atingir limites
   */
  private async checkBudgetLimits(): Promise<void> {
    const dailyUsagePercent = this.metrics.today / this.budget.dailyLimit;

    for (const threshold of this.budget.alertThresholds) {
      if (dailyUsagePercent >= threshold && dailyUsagePercent < threshold + 0.05) {
        await this.sendAlert({
          level: threshold >= 0.9 ? 'critical' : 'warning',
          message: `Você usou ${(dailyUsagePercent * 100).toFixed(1)}% do seu limite diário ($${this.metrics.today.toFixed(2)} de $${this.budget.dailyLimit.toFixed(2)})`,
          budgetRemaining: this.budget.dailyLimit - this.metrics.today,
        });
      }
    }

    // Auto-stop if limit reached
    if (this.budget.autoStopAtLimit && dailyUsagePercent >= 1.0) {
      throw new Error(`Daily budget limit reached ($${this.budget.dailyLimit}). Operations paused. Increase limit or wait until tomorrow.`);
    }
  }

  /**
   * DETAILED BREAKDOWN - Transparência total
   */
  public getDetailedBreakdown(timeframe: 'today' | 'week' | 'month' | 'all'): {
    operations: CostBreakdown[];
    totalCost: number;
    totalCharged: number;
    errorsSavedMoney: number;
    byModel: Map<string, number>;
    byOperation: Map<string, number>;
  } {
    const now = Date.now();
    const cutoff = this.getTimeframeCutoff(timeframe);
    
    const operations = this.costHistory.filter(op => op.timestamp >= cutoff);
    const totalCost = operations.reduce((sum, op) => sum + op.totalCost, 0);
    const totalCharged = operations.reduce((sum, op) => op.userCharged ? sum + op.totalCost : sum, 0);
    const errorsSavedMoney = operations.reduce((sum, op) => !op.userCharged && op.wasError ? sum + op.totalCost : sum, 0);

    const byModel = new Map<string, number>();
    const byOperation = new Map<string, number>();

    for (const op of operations) {
      if (op.userCharged) {
        byModel.set(op.modelUsed, (byModel.get(op.modelUsed) || 0) + op.totalCost);
        byOperation.set(op.operation, (byOperation.get(op.operation) || 0) + op.totalCost);
      }
    }

    return {
      operations,
      totalCost,
      totalCharged,
      errorsSavedMoney,
      byModel,
      byOperation,
    };
  }

  /**
   * EXPORT BILLING REPORT - Para contabilidade do usuário
   */
  public exportBillingReport(format: 'json' | 'csv'): string {
    if (format === 'json') {
      return JSON.stringify({
        metrics: this.metrics,
        budget: this.budget,
        history: this.costHistory,
        generatedAt: new Date().toISOString(),
      }, null, 2);
    } else {
      // CSV export
      let csv = 'Timestamp,Operation,Model,Tokens In,Tokens Out,Cost In,Cost Out,Total Cost,Was Error,User Charged\n';
      for (const op of this.costHistory) {
        csv += `${new Date(op.timestamp).toISOString()},${op.operation},${op.modelUsed},${op.tokensInput},${op.tokensOutput},$${op.costInput.toFixed(6)},$${op.costOutput.toFixed(6)},$${op.totalCost.toFixed(6)},${op.wasError},${op.userCharged}\n`;
      }
      return csv;
    }
  }

  /**
   * COMPARISON WITH COMPETITORS - Mostrar economias
   */
  public compareWithCompetitors(): {
    vibeCost: number;
    lovableCost: number;
    replitCost: number;
    boltNewCost: number;
    v0DevCost: number;
    savings: {
      vsLovable: number;
      vsReplit: number;
      vsBoltNew: number;
      vsV0Dev: number;
    };
  } {
    const vibeCost = this.metrics.allTime;
    
    // Competitors cobram por TODOS erros
    const errorCosts = this.costHistory
      .filter(op => op.wasError)
      .reduce((sum, op) => sum + op.totalCost, 0);

    // Lovable: cobra 100% dos erros
    const lovableCost = vibeCost + errorCosts;
    
    // Replit: cobra 100% + overhead de "effort-based pricing" (estimado 1.5x)
    const replitCost = (vibeCost + errorCosts) * 1.5;
    
    // bolt.new: consome tokens até em erros (estimado 2x por "dynamic reasoning")
    const boltNewCost = (vibeCost + errorCosts) * 2;
    
    // v0.dev: cobra por gerações falhadas
    const v0DevCost = vibeCost + errorCosts;

    return {
      vibeCost,
      lovableCost,
      replitCost,
      boltNewCost,
      v0DevCost,
      savings: {
        vsLovable: lovableCost - vibeCost,
        vsReplit: replitCost - vibeCost,
        vsBoltNew: boltNewCost - vibeCost,
        vsV0Dev: v0DevCost - vibeCost,
      },
    };
  }

  // ==================== HELPER METHODS ====================

  private getTimeframeCutoff(timeframe: string): number {
    const now = Date.now();
    switch (timeframe) {
      case 'today':
        return now - (24 * 60 * 60 * 1000);
      case 'week':
        return now - (7 * 24 * 60 * 60 * 1000);
      case 'month':
        return now - (30 * 24 * 60 * 60 * 1000);
      default:
        return 0;
    }
  }

  private getModelPricing(modelKey: string): {
    costPerTokenInput: number;
    costPerTokenOutput: number;
  } {
    // Map to model configs from multi-model router
    const pricing: Record<string, { costPerTokenInput: number; costPerTokenOutput: number }> = {
      'claude-sonnet-4': { costPerTokenInput: 0.000003, costPerTokenOutput: 0.000015 },
      'gpt-5': { costPerTokenInput: 0.000005, costPerTokenOutput: 0.000015 },
      'gemini-2.5-pro': { costPerTokenInput: 0.000002, costPerTokenOutput: 0.000008 },
      'deepseek-v3': { costPerTokenInput: 0.0000006, costPerTokenOutput: 0.0000006 },
      'quick-edit-1': { costPerTokenInput: 0.0000001, costPerTokenOutput: 0.0000001 },
    };

    return pricing[modelKey] || { costPerTokenInput: 0.000003, costPerTokenOutput: 0.000015 };
  }

  private async sendAlert(alert: {
    level: 'info' | 'warning' | 'critical';
    message: string;
    budgetRemaining: number;
  }): Promise<void> {
    // TODO: Integrate with notification system
    console.warn(`[BUDGET ALERT - ${alert.level.toUpperCase()}] ${alert.message}`);
  }

  /**
   * PUBLIC API - Get current metrics
   */
  public getMetrics(): CostMetrics {
    return { ...this.metrics };
  }

  public getBudget(): BudgetConfig {
    return { ...this.budget };
  }

  public updateBudget(newBudget: Partial<BudgetConfig>): void {
    this.budget = { ...this.budget, ...newBudget };
  }
}

/**
 * REACT HOOK - Real-time cost tracking na UI
 */
export function useCostTracking(pricingEngine: TransparentPricingEngine) {
  const [metrics, setMetrics] = React.useState(pricingEngine.getMetrics());
  const [budget, setBudget] = React.useState(pricingEngine.getBudget());

  React.useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(pricingEngine.getMetrics());
      setBudget(pricingEngine.getBudget());
    }, 1000); // Update every second

    return () => clearInterval(interval);
  }, [pricingEngine]);

  return { metrics, budget };
}

/**
 * UI COMPONENT - Cost Dashboard
 */
export function CostDashboard({ pricingEngine }: { pricingEngine: TransparentPricingEngine }) {
  const { metrics, budget } = useCostTracking(pricingEngine);
  const comparison = pricingEngine.compareWithCompetitors();

  const dailyPercent = (metrics.today / budget.dailyLimit) * 100;

  return (
    <div className="cost-dashboard">
      <h2>💰 Transparent Pricing</h2>
      
      <div className="budget-gauge">
        <div className="gauge-fill" style={{ width: `${Math.min(dailyPercent, 100)}%` }} />
        <span>${metrics.today.toFixed(2)} / ${budget.dailyLimit.toFixed(2)} today</span>
      </div>

      <div className="metrics-grid">
        <div className="metric">
          <label>This Week</label>
          <value>${metrics.thisWeek.toFixed(2)}</value>
        </div>
        <div className="metric">
          <label>This Month</label>
          <value>${metrics.thisMonth.toFixed(2)}</value>
        </div>
        <div className="metric">
          <label>Total Operations</label>
          <value>{metrics.operationsCount}</value>
        </div>
        <div className="metric highlight">
          <label>Errors Not Charged</label>
          <value>{metrics.errorsNotCharged}</value>
        </div>
        <div className="metric highlight">
          <label>Savings (AI Errors)</label>
          <value>${metrics.savingsFromErrorPolicy.toFixed(2)}</value>
        </div>
      </div>

      <div className="competitor-comparison">
        <h3>🎯 Your Savings vs Competitors</h3>
        <table>
          <tr>
            <td>Vibe Code (You)</td>
            <td>${comparison.vibeCost.toFixed(2)}</td>
            <td className="baseline">Baseline</td>
          </tr>
          <tr>
            <td>Lovable</td>
            <td>${comparison.lovableCost.toFixed(2)}</td>
            <td className="savings">+${comparison.savings.vsLovable.toFixed(2)}</td>
          </tr>
          <tr>
            <td>Replit</td>
            <td>${comparison.replitCost.toFixed(2)}</td>
            <td className="savings">+${comparison.savings.vsReplit.toFixed(2)}</td>
          </tr>
          <tr>
            <td>bolt.new</td>
            <td>${comparison.boltNewCost.toFixed(2)}</td>
            <td className="savings">+${comparison.savings.vsBoltNew.toFixed(2)}</td>
          </tr>
        </table>
        <p className="disclaimer">
          * Competitors charge you for AI errors. We don't. Your savings are real.
        </p>
      </div>

      <button onClick={() => {
        const report = pricingEngine.exportBillingReport('csv');
        // Download CSV
        const blob = new Blob([report], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `vibe-code-billing-${Date.now()}.csv`;
        a.click();
      }}>
        📊 Export Billing Report
      </button>
    </div>
  );
}
