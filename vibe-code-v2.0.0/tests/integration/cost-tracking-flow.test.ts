import { describe, it, expect, beforeEach } from 'vitest';
import { CostTracker } from '@/lib/pricing/real-time/cost-tracker-complete';
import { AdvancedModelRouter } from '@/lib/ai/multi-model/model-router-complete';

describe('Cost Tracking Flow', () => {
  let costTracker: CostTracker;
  let modelRouter: AdvancedModelRouter;

  beforeEach(async () => {
    costTracker = new CostTracker();
    modelRouter = new AdvancedModelRouter();
    await costTracker.reset(); // Clean state
  });

  describe('Real-time Cost Tracking', () => {
    it('should track costs for each model call', async () => {
      const userId = 'user-456';
      
      // Generate code using expensive model
      const result = await modelRouter.routeWithContext({
        prompt: 'create complex architecture',
        task: 'code-generation',
        userId,
      });

      await costTracker.track({
        userId,
        model: result.model,
        inputTokens: result.tokensUsed.input,
        outputTokens: result.tokensUsed.output,
        operation: 'code-generation',
      });

      const costs = await costTracker.getUserCosts(userId);
      expect(costs.totalCost).toBeGreaterThan(0);
      expect(costs.breakdown[result.model]).toBeDefined();
    });

    it('should aggregate costs across multiple operations', async () => {
      const userId = 'user-789';

      // Perform multiple operations
      const operations = [
        { prompt: 'create component', task: 'code-generation' },
        { prompt: 'fix bug', task: 'code-modification' },
        { prompt: 'add tests', task: 'test-generation' },
      ];

      for (const op of operations) {
        const result = await modelRouter.routeWithContext({
          ...op,
          userId,
        });

        await costTracker.track({
          userId,
          model: result.model,
          inputTokens: result.tokensUsed.input,
          outputTokens: result.tokensUsed.output,
          operation: op.task,
        });
      }

      const costs = await costTracker.getUserCosts(userId);
      expect(costs.operationCount).toBe(3);
      expect(costs.totalTokens.input).toBeGreaterThan(0);
      expect(costs.totalTokens.output).toBeGreaterThan(0);
    });
  });

  describe('Budget Management', () => {
    it('should enforce user budget limits', async () => {
      const userId = 'limited-user';
      await costTracker.setBudget(userId, 0.10); // $0.10 limit

      // Perform operations until budget exceeded
      let exceeded = false;
      for (let i = 0; i < 20 && !exceeded; i++) {
        try {
          const result = await modelRouter.routeWithContext({
            prompt: 'test operation',
            task: 'code-generation',
            userId,
          });

          await costTracker.track({
            userId,
            model: result.model,
            inputTokens: 1000,
            outputTokens: 2000,
            operation: 'test',
          });
        } catch (error: any) {
          if (error.message.includes('Budget exceeded')) {
            exceeded = true;
          }
        }
      }

      expect(exceeded).toBe(true);
    });

    it('should send warnings at 80% budget', async () => {
      const userId = 'warned-user';
      await costTracker.setBudget(userId, 1.00);

      const warnings: string[] = [];
      costTracker.on('budget-warning', (message) => {
        warnings.push(message);
      });

      // Consume 85% of budget
      await costTracker.track({
        userId,
        model: 'gpt-4',
        inputTokens: 10000,
        outputTokens: 20000,
        operation: 'test',
      });

      expect(warnings).not.toHaveLength(0);
      expect(warnings[0]).toContain('80%');
    });
  });

  describe('Cost Optimization', () => {
    it('should suggest cheaper models for similar results', async () => {
      const userId = 'optimize-user';
      
      const expensiveResult = await modelRouter.routeWithContext({
        prompt: 'simple task',
        task: 'code-modification',
        preferredModel: 'gpt-4',
        userId,
      });

      const suggestion = await costTracker.suggestOptimization({
        userId,
        currentModel: 'gpt-4',
        task: 'code-modification',
      });

      expect(suggestion.alternativeModel).toBe('gpt-3.5-turbo');
      expect(suggestion.estimatedSavings).toBeGreaterThan(0);
    });

    it('should track cost trends over time', async () => {
      const userId = 'trend-user';

      // Simulate usage over time
      for (let day = 0; day < 7; day++) {
        await costTracker.track({
          userId,
          model: 'claude-3-sonnet',
          inputTokens: 1000 + (day * 100),
          outputTokens: 2000,
          operation: 'daily-task',
          timestamp: new Date(Date.now() - day * 86400000),
        });
      }

      const trends = await costTracker.getTrends(userId, '7d');
      expect(trends.dailyAverage).toBeDefined();
      expect(trends.trend).toBe('increasing');
    });
  });

  describe('Reporting', () => {
    it('should generate detailed cost report', async () => {
      const userId = 'report-user';

      // Simulate varied usage
      const models = ['gpt-4', 'gpt-3.5-turbo', 'claude-3-sonnet'];
      for (const model of models) {
        await costTracker.track({
          userId,
          model,
          inputTokens: 1000,
          outputTokens: 2000,
          operation: 'test',
        });
      }

      const report = await costTracker.generateReport(userId, {
        startDate: new Date(Date.now() - 86400000),
        endDate: new Date(),
      });

      expect(report.totalCost).toBeGreaterThan(0);
      expect(report.modelBreakdown).toHaveLength(3);
      expect(report.recommendations).not.toHaveLength(0);
    });

    it('should export costs to CSV', async () => {
      const userId = 'export-user';

      await costTracker.track({
        userId,
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 2000,
        operation: 'test',
      });

      const csv = await costTracker.exportCSV(userId);
      expect(csv).toContain('timestamp,model,operation,cost');
      expect(csv).toContain('gpt-4');
    });
  });

  describe('Multi-tenant Cost Isolation', () => {
    it('should isolate costs between users', async () => {
      const user1 = 'user-A';
      const user2 = 'user-B';

      await costTracker.track({
        userId: user1,
        model: 'gpt-4',
        inputTokens: 1000,
        outputTokens: 2000,
        operation: 'test',
      });

      await costTracker.track({
        userId: user2,
        model: 'gpt-3.5-turbo',
        inputTokens: 500,
        outputTokens: 1000,
        operation: 'test',
      });

      const costs1 = await costTracker.getUserCosts(user1);
      const costs2 = await costTracker.getUserCosts(user2);

      expect(costs1.totalCost).not.toBe(costs2.totalCost);
      expect(costs1.breakdown['gpt-4']).toBeDefined();
      expect(costs2.breakdown['gpt-3.5-turbo']).toBeDefined();
    });
  });
});
