import { describe, it, expect, beforeEach, vi } from 'vitest';
import { RateLimiter } from '@/lib/security/rate-limiter';
import { RAGSystem } from '@/lib/ai/rag/rag-system';
import { AdvancedModelRouter } from '@/lib/ai/multi-model/model-router-complete';
import { CostTracker } from '@/lib/pricing/real-time/cost-tracker-complete';

describe('Code Generation Flow (E2E)', () => {
  let rateLimiter: RateLimiter;
  let ragSystem: RAGSystem;
  let modelRouter: AdvancedModelRouter;
  let costTracker: CostTracker;

  beforeEach(() => {
    rateLimiter = new RateLimiter();
    ragSystem = new RAGSystem();
    modelRouter = new AdvancedModelRouter();
    costTracker = new CostTracker();
    vi.clearAllMocks();
  });

  describe('Full Generation Pipeline', () => {
    it('should generate code with RAG context and track costs', async () => {
      const userId = 'test-user-123';
      const prompt = 'create a login form with email and password';

      // Step 1: Rate limiting check
      await expect(rateLimiter.enforce(userId)).resolves.not.toThrow();

      // Step 2: RAG context retrieval
      const context = await ragSystem.retrieveContext(prompt);
      expect(context).toBeDefined();
      expect(context.chunks).not.toHaveLength(0);
      expect(context.totalTokens).toBeGreaterThan(0);

      // Step 3: Model routing with context
      const result = await modelRouter.routeWithContext({
        prompt,
        context: context.chunks,
        task: 'code-generation',
        userId,
      });

      expect(result.code).toBeDefined();
      expect(result.model).toBeDefined();
      expect(result.tokensUsed).toBeGreaterThan(0);

      // Step 4: Cost tracking
      await costTracker.track({
        userId,
        model: result.model,
        inputTokens: result.tokensUsed.input,
        outputTokens: result.tokensUsed.output,
        operation: 'code-generation',
      });

      const userCosts = await costTracker.getUserCosts(userId);
      expect(userCosts.totalCost).toBeGreaterThan(0);
      expect(userCosts.operations).toContain('code-generation');
    });

    it('should handle rate limit exceeded gracefully', async () => {
      const userId = 'rate-limited-user';

      // Simulate 11 requests (limit is 10 per minute)
      for (let i = 0; i < 11; i++) {
        if (i === 10) {
          await expect(rateLimiter.enforce(userId)).rejects.toThrow(
            'Rate limit exceeded'
          );
        } else {
          await rateLimiter.enforce(userId);
        }
      }
    });

    it('should fallback to smaller model when context is large', async () => {
      const largePrompt = 'a'.repeat(50000); // Simulate large context

      const result = await modelRouter.routeWithContext({
        prompt: largePrompt,
        task: 'code-generation',
      });

      // Should route to a model with larger context window
      expect(['claude-3-opus', 'gpt-4-turbo']).toContain(result.model);
    });
  });

  describe('RAG Context Quality', () => {
    it('should retrieve relevant context from codebase', async () => {
      // Setup: Index sample codebase
      await ragSystem.indexFiles([
        {
          path: 'components/LoginForm.tsx',
          content: `
            export function LoginForm() {
              const [email, setEmail] = useState('');
              const [password, setPassword] = useState('');
              return <form>...</form>;
            }
          `,
        },
        {
          path: 'lib/auth.ts',
          content: 'export function validateEmail(email: string) {...}',
        },
      ]);

      const context = await ragSystem.retrieveContext('create a login form');

      expect(context.chunks).not.toHaveLength(0);
      expect(context.chunks[0].metadata.filePath).toContain('LoginForm');
      expect(context.relevanceScore).toBeGreaterThan(0.7);
    });

    it('should limit context to token budget', async () => {
      const context = await ragSystem.retrieveContext('create a dashboard', {
        maxTokens: 1000,
      });

      expect(context.totalTokens).toBeLessThanOrEqual(1000);
    });

    it('should prioritize recent files', async () => {
      await ragSystem.indexFiles([
        {
          path: 'old-component.tsx',
          content: 'old code',
          lastModified: new Date('2023-01-01'),
        },
        {
          path: 'new-component.tsx',
          content: 'new code',
          lastModified: new Date(),
        },
      ]);

      const context = await ragSystem.retrieveContext('component');
      expect(context.chunks[0].metadata.filePath).toContain('new-component');
    });
  });

  describe('Model Selection Logic', () => {
    it('should select fast model for simple tasks', async () => {
      const result = await modelRouter.routeWithContext({
        prompt: 'add a console.log',
        task: 'code-modification',
      });

      expect(['claude-3-haiku', 'gpt-3.5-turbo']).toContain(result.model);
    });

    it('should select powerful model for complex tasks', async () => {
      const result = await modelRouter.routeWithContext({
        prompt: 'refactor this entire architecture',
        task: 'refactoring',
      });

      expect(['claude-3-opus', 'gpt-4']).toContain(result.model);
    });

    it('should respect user model preference', async () => {
      const result = await modelRouter.routeWithContext({
        prompt: 'create a component',
        task: 'code-generation',
        preferredModel: 'claude-3-sonnet',
      });

      expect(result.model).toBe('claude-3-sonnet');
    });
  });

  describe('Error Handling', () => {
    it('should retry on transient failures', async () => {
      const mockRouter = vi.spyOn(modelRouter, 'routeWithContext');
      mockRouter
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          code: 'success',
          model: 'claude-3-sonnet',
          tokensUsed: { input: 100, output: 200 },
        });

      const result = await modelRouter.routeWithContext({
        prompt: 'test',
        task: 'code-generation',
        retries: 3,
      });

      expect(result.code).toBe('success');
      expect(mockRouter).toHaveBeenCalledTimes(2);
    });

    it('should provide fallback when all models fail', async () => {
      const mockRouter = vi
        .spyOn(modelRouter, 'routeWithContext')
        .mockRejectedValue(new Error('All models unavailable'));

      const result = await modelRouter.routeWithContext({
        prompt: 'test',
        task: 'code-generation',
        enableFallback: true,
      });

      expect(result.code).toContain('// Fallback response');
      expect(result.error).toBeDefined();
    });
  });

  describe('Performance Optimization', () => {
    it('should cache RAG results for repeated queries', async () => {
      const query = 'create a button component';

      const start1 = performance.now();
      await ragSystem.retrieveContext(query);
      const duration1 = performance.now() - start1;

      const start2 = performance.now();
      await ragSystem.retrieveContext(query);
      const duration2 = performance.now() - start2;

      // Second query should be significantly faster due to caching
      expect(duration2).toBeLessThan(duration1 * 0.3);
    });

    it('should parallelize independent operations', async () => {
      const start = performance.now();

      await Promise.all([
        ragSystem.retrieveContext('query 1'),
        ragSystem.retrieveContext('query 2'),
        ragSystem.retrieveContext('query 3'),
      ]);

      const duration = performance.now() - start;

      // Should complete in roughly the time of 1 query, not 3
      expect(duration).toBeLessThan(1000);
    });
  });
});
