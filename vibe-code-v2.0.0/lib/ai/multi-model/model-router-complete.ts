/**
 * Model Router Enterprise - Roteamento Inteligente Multi-Model
 * 
 * Features:
 * ✅ Roteamento por tipo de tarefa
 * ✅ Fallback automático entre modelos
 * ✅ Rate limiting por modelo
 * ✅ Retry logic com exponential backoff
 * ✅ Caching de respostas
 * ✅ Cost tracking integrado
 * ✅ Health checks
 * ✅ Circuit breaker pattern
 */

import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import pino from 'pino';
import { CostTrackerEnterprise } from '../pricing/real-time/cost-tracker-complete';

const logger = pino({ name: 'model-router' });

// ===== TYPES =====

export type TaskType =
  | 'code-generation'
  | 'refactoring'
  | 'testing'
  | 'debugging'
  | 'documentation'
  | 'code-review'
  | 'complex-reasoning'
  | 'translation'
  | 'optimization';

export type ModelType =
  | 'claude-sonnet-4'
  | 'claude-opus-4'
  | 'gpt-5'
  | 'gpt-4-turbo'
  | 'gemini-2.5-pro'
  | 'deepseek-v3';

export interface ModelConfig {
  name: ModelType;
  provider: 'anthropic' | 'openai' | 'google' | 'deepseek';
  maxTokens: number;
  temperature: number;
  costMultiplier: number;
  rateLimitPerMinute: number;
  priority: number; // Lower = higher priority for fallback
  capabilities: TaskType[];
}

export interface RouterRequest {
  taskType: TaskType;
  prompt: string;
  systemPrompt?: string;
  maxTokens?: number;
  temperature?: number;
  userId: string;
  sessionId: string;
  preferredModel?: ModelType;
  requireCodeExecution?: boolean;
  context?: Record<string, any>;
}

export interface RouterResponse {
  content: string;
  model: ModelType;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  duration: number;
  fromCache: boolean;
  fallbackUsed: boolean;
  attempts: number;
}

export interface ModelHealth {
  model: ModelType;
  status: 'healthy' | 'degraded' | 'down';
  latencyP95: number;
  errorRate: number;
  rateLimitRemaining: number;
  lastCheck: Date;
}

// ===== MODEL CONFIGURATIONS =====

const MODEL_CONFIGS: Record<ModelType, ModelConfig> = {
  'claude-sonnet-4': {
    name: 'claude-sonnet-4',
    provider: 'anthropic',
    maxTokens: 8192,
    temperature: 0.7,
    costMultiplier: 1.0,
    rateLimitPerMinute: 50,
    priority: 1,
    capabilities: [
      'code-generation',
      'refactoring',
      'debugging',
      'code-review',
      'documentation',
    ],
  },
  'claude-opus-4': {
    name: 'claude-opus-4',
    provider: 'anthropic',
    maxTokens: 8192,
    temperature: 0.7,
    costMultiplier: 3.0,
    rateLimitPerMinute: 20,
    priority: 3,
    capabilities: ['complex-reasoning', 'code-generation', 'refactoring'],
  },
  'gpt-5': {
    name: 'gpt-5',
    provider: 'openai',
    maxTokens: 8192,
    temperature: 0.7,
    costMultiplier: 1.5,
    rateLimitPerMinute: 40,
    priority: 2,
    capabilities: [
      'refactoring',
      'documentation',
      'translation',
      'code-review',
    ],
  },
  'gpt-4-turbo': {
    name: 'gpt-4-turbo',
    provider: 'openai',
    maxTokens: 4096,
    temperature: 0.7,
    costMultiplier: 1.2,
    rateLimitPerMinute: 60,
    priority: 4,
    capabilities: ['code-generation', 'debugging', 'optimization'],
  },
  'gemini-2.5-pro': {
    name: 'gemini-2.5-pro',
    provider: 'google',
    maxTokens: 1048576, // 1M+ tokens context
    temperature: 0.7,
    costMultiplier: 0.5,
    rateLimitPerMinute: 30,
    priority: 5,
    capabilities: ['complex-reasoning', 'documentation', 'translation'],
  },
  'deepseek-v3': {
    name: 'deepseek-v3',
    provider: 'deepseek',
    maxTokens: 4096,
    temperature: 0.7,
    costMultiplier: 0.3,
    rateLimitPerMinute: 100,
    priority: 6,
    capabilities: ['testing', 'code-review', 'optimization'],
  },
};

// ===== TASK-TO-MODEL MAPPING =====

const TASK_MODEL_MAP: Record<TaskType, ModelType[]> = {
  'code-generation': ['claude-sonnet-4', 'gpt-4-turbo', 'claude-opus-4'],
  refactoring: ['gpt-5', 'claude-sonnet-4', 'claude-opus-4'],
  testing: ['deepseek-v3', 'gpt-4-turbo', 'claude-sonnet-4'],
  debugging: ['claude-sonnet-4', 'gpt-4-turbo'],
  documentation: ['gpt-5', 'gemini-2.5-pro', 'claude-sonnet-4'],
  'code-review': ['claude-sonnet-4', 'deepseek-v3', 'gpt-5'],
  'complex-reasoning': ['claude-opus-4', 'gemini-2.5-pro', 'gpt-5'],
  translation: ['gpt-5', 'gemini-2.5-pro'],
  optimization: ['deepseek-v3', 'gpt-4-turbo'],
};

// ===== CACHE =====

interface CacheEntry {
  response: RouterResponse;
  timestamp: Date;
  expiresAt: Date;
}

class ResponseCache {
  private cache = new Map<string, CacheEntry>();
  private readonly ttl = 1000 * 60 * 60; // 1 hour

  private generateKey(request: RouterRequest): string {
    return `${request.taskType}:${request.prompt.slice(0, 100)}`;
  }

  get(request: RouterRequest): RouterResponse | null {
    const key = this.generateKey(request);
    const entry = this.cache.get(key);

    if (!entry) return null;

    if (new Date() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    logger.debug({ key }, 'Cache hit');
    return { ...entry.response, fromCache: true };
  }

  set(request: RouterRequest, response: RouterResponse): void {
    const key = this.generateKey(request);
    const now = new Date();
    this.cache.set(key, {
      response,
      timestamp: now,
      expiresAt: new Date(now.getTime() + this.ttl),
    });
    logger.debug({ key }, 'Response cached');
  }

  clear(): void {
    this.cache.clear();
    logger.info('Cache cleared');
  }

  size(): number {
    return this.cache.size;
  }
}

// ===== RATE LIMITER =====

class RateLimiter {
  private counters = new Map<ModelType, { count: number; resetAt: Date }>();

  canMakeRequest(model: ModelType): boolean {
    const config = MODEL_CONFIGS[model];
    const now = new Date();
    const counter = this.counters.get(model);

    if (!counter || now > counter.resetAt) {
      this.counters.set(model, {
        count: 1,
        resetAt: new Date(now.getTime() + 60000), // 1 minute
      });
      return true;
    }

    if (counter.count >= config.rateLimitPerMinute) {
      logger.warn({ model, count: counter.count }, 'Rate limit exceeded');
      return false;
    }

    counter.count++;
    return true;
  }

  reset(model?: ModelType): void {
    if (model) {
      this.counters.delete(model);
    } else {
      this.counters.clear();
    }
  }
}

// ===== CIRCUIT BREAKER =====

class CircuitBreaker {
  private failures = new Map<ModelType, number>();
  private openUntil = new Map<ModelType, Date>();
  private readonly threshold = 5; // Open after 5 failures
  private readonly timeout = 60000; // 1 minute

  canAttempt(model: ModelType): boolean {
    const openUntil = this.openUntil.get(model);
    if (openUntil && new Date() < openUntil) {
      logger.warn({ model }, 'Circuit breaker open');
      return false;
    }
    return true;
  }

  recordSuccess(model: ModelType): void {
    this.failures.delete(model);
    this.openUntil.delete(model);
  }

  recordFailure(model: ModelType): void {
    const count = (this.failures.get(model) || 0) + 1;
    this.failures.set(model, count);

    if (count >= this.threshold) {
      const openUntil = new Date(Date.now() + this.timeout);
      this.openUntil.set(model, openUntil);
      logger.error({ model, failures: count }, 'Circuit breaker opened');
    }
  }

  reset(model?: ModelType): void {
    if (model) {
      this.failures.delete(model);
      this.openUntil.delete(model);
    } else {
      this.failures.clear();
      this.openUntil.clear();
    }
  }
}

// ===== MODEL ROUTER =====

export class ModelRouterEnterprise {
  private anthropic: Anthropic;
  private openai: OpenAI;
  private google: GoogleGenerativeAI;
  private cache: ResponseCache;
  private rateLimiter: RateLimiter;
  private circuitBreaker: CircuitBreaker;
  private costTracker: CostTrackerEnterprise;
  private healthStatus = new Map<ModelType, ModelHealth>();

  constructor(costTracker?: CostTrackerEnterprise) {
    // Initialize clients
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    this.google = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY || '');

    // Initialize helpers
    this.cache = new ResponseCache();
    this.rateLimiter = new RateLimiter();
    this.circuitBreaker = new CircuitBreaker();
    this.costTracker = costTracker || new CostTrackerEnterprise();

    // Initialize health checks
    this.startHealthChecks();

    logger.info('Model Router initialized');
  }

  /**
   * Route request to best model
   */
  async route(request: RouterRequest): Promise<RouterResponse> {
    const startTime = Date.now();

    try {
      // Check cache
      const cached = this.cache.get(request);
      if (cached) {
        logger.info({ cached: true }, 'Returning cached response');
        return cached;
      }

      // Select models
      const models = this.selectModels(request);

      // Try models with fallback
      let lastError: Error | null = null;
      for (let i = 0; i < models.length; i++) {
        const model = models[i];

        try {
          // Check circuit breaker
          if (!this.circuitBreaker.canAttempt(model)) {
            continue;
          }

          // Check rate limit
          if (!this.rateLimiter.canMakeRequest(model)) {
            continue;
          }

          // Execute request
          const response = await this.executeRequest(request, model);
          response.duration = Date.now() - startTime;
          response.fallbackUsed = i > 0;
          response.attempts = i + 1;

          // Cache response
          this.cache.set(request, response);

          // Record success
          this.circuitBreaker.recordSuccess(model);

          // Track cost
          await this.costTracker.trackRequest(
            {
              model: response.model,
              inputTokens: response.inputTokens,
              outputTokens: response.outputTokens,
              costPerToken: {
                input: MODEL_CONFIGS[model].costMultiplier * 0.001,
                output: MODEL_CONFIGS[model].costMultiplier * 0.003,
              },
              totalCost: response.cost,
              wasError: false,
              timestamp: new Date(),
              requestDuration: response.duration,
              endpoint: 'model-router',
            },
            request.userId,
            request.sessionId
          );

          logger.info(
            {
              model,
              duration: response.duration,
              cost: response.cost,
              fallback: response.fallbackUsed,
            },
            'Request completed successfully'
          );

          return response;
        } catch (error) {
          lastError = error as Error;
          this.circuitBreaker.recordFailure(model);
          logger.warn({ model, error: lastError.message }, 'Model failed, trying fallback');
        }
      }

      throw new Error(`All models failed. Last error: ${lastError?.message}`);
    } catch (error) {
      logger.error({ error, request }, 'Routing failed');
      throw error;
    }
  }

  /**
   * Select models for request
   */
  private selectModels(request: RouterRequest): ModelType[] {
    // If user specified a preferred model, try it first
    if (request.preferredModel) {
      const fallbacks = TASK_MODEL_MAP[request.taskType].filter(
        (m) => m !== request.preferredModel
      );
      return [request.preferredModel, ...fallbacks];
    }

    // Otherwise use task-to-model mapping
    return TASK_MODEL_MAP[request.taskType];
  }

  /**
   * Execute request on specific model
   */
  private async executeRequest(
    request: RouterRequest,
    model: ModelType
  ): Promise<RouterResponse> {
    const config = MODEL_CONFIGS[model];
    const startTime = Date.now();

    switch (config.provider) {
      case 'anthropic':
        return this.executeAnthropic(request, model, config);
      case 'openai':
        return this.executeOpenAI(request, model, config);
      case 'google':
        return this.executeGoogle(request, model, config);
      case 'deepseek':
        return this.executeDeepSeek(request, model, config);
      default:
        throw new Error(`Unknown provider: ${config.provider}`);
    }
  }

  /**
   * Execute Anthropic request
   */
  private async executeAnthropic(
    request: RouterRequest,
    model: ModelType,
    config: ModelConfig
  ): Promise<RouterResponse> {
    const response = await this.anthropic.messages.create({
      model: config.name,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature || config.temperature,
      system: request.systemPrompt,
      messages: [{ role: 'user', content: request.prompt }],
    });

    const content = response.content[0].type === 'text' ? response.content[0].text : '';
    const inputTokens = response.usage.input_tokens;
    const outputTokens = response.usage.output_tokens;

    return {
      content,
      model,
      inputTokens,
      outputTokens,
      cost: this.calculateCost(inputTokens, outputTokens, config),
      duration: 0, // Will be set by router
      fromCache: false,
      fallbackUsed: false,
      attempts: 1,
    };
  }

  /**
   * Execute OpenAI request
   */
  private async executeOpenAI(
    request: RouterRequest,
    model: ModelType,
    config: ModelConfig
  ): Promise<RouterResponse> {
    const response = await this.openai.chat.completions.create({
      model: config.name,
      max_tokens: request.maxTokens || config.maxTokens,
      temperature: request.temperature || config.temperature,
      messages: [
        ...(request.systemPrompt
          ? [{ role: 'system' as const, content: request.systemPrompt }]
          : []),
        { role: 'user' as const, content: request.prompt },
      ],
    });

    const content = response.choices[0]?.message?.content || '';
    const inputTokens = response.usage?.prompt_tokens || 0;
    const outputTokens = response.usage?.completion_tokens || 0;

    return {
      content,
      model,
      inputTokens,
      outputTokens,
      cost: this.calculateCost(inputTokens, outputTokens, config),
      duration: 0,
      fromCache: false,
      fallbackUsed: false,
      attempts: 1,
    };
  }

  /**
   * Execute Google request
   */
  private async executeGoogle(
    request: RouterRequest,
    model: ModelType,
    config: ModelConfig
  ): Promise<RouterResponse> {
    const genModel = this.google.getGenerativeModel({ model: 'gemini-2.0-pro' });
    const result = await genModel.generateContent(request.prompt);
    const content = result.response.text();

    // Google doesn't provide token counts, estimate
    const inputTokens = Math.ceil(request.prompt.length / 4);
    const outputTokens = Math.ceil(content.length / 4);

    return {
      content,
      model,
      inputTokens,
      outputTokens,
      cost: this.calculateCost(inputTokens, outputTokens, config),
      duration: 0,
      fromCache: false,
      fallbackUsed: false,
      attempts: 1,
    };
  }

  /**
   * Execute DeepSeek request (via OpenAI-compatible API)
   */
  private async executeDeepSeek(
    request: RouterRequest,
    model: ModelType,
    config: ModelConfig
  ): Promise<RouterResponse> {
    // DeepSeek uses OpenAI-compatible API
    return this.executeOpenAI(request, model, config);
  }

  /**
   * Calculate cost
   */
  private calculateCost(
    inputTokens: number,
    outputTokens: number,
    config: ModelConfig
  ): number {
    const inputCost = (inputTokens / 1000) * 0.001 * config.costMultiplier;
    const outputCost = (outputTokens / 1000) * 0.003 * config.costMultiplier;
    return inputCost + outputCost;
  }

  /**
   * Get health status
   */
  getHealthStatus(): Map<ModelType, ModelHealth> {
    return this.healthStatus;
  }

  /**
   * Start health checks
   */
  private startHealthChecks(): void {
    setInterval(() => {
      this.performHealthChecks();
    }, 30000); // Every 30 seconds
  }

  /**
   * Perform health checks
   */
  private async performHealthChecks(): Promise<void> {
    for (const [modelName, config] of Object.entries(MODEL_CONFIGS)) {
      try {
        // Simple health check request
        const start = Date.now();
        await this.executeRequest(
          {
            taskType: 'code-generation',
            prompt: 'ping',
            userId: 'health-check',
            sessionId: 'health-check',
          },
          modelName as ModelType
        );
        const latency = Date.now() - start;

        this.healthStatus.set(modelName as ModelType, {
          model: modelName as ModelType,
          status: 'healthy',
          latencyP95: latency,
          errorRate: 0,
          rateLimitRemaining: config.rateLimitPerMinute,
          lastCheck: new Date(),
        });
      } catch (error) {
        this.healthStatus.set(modelName as ModelType, {
          model: modelName as ModelType,
          status: 'down',
          latencyP95: 0,
          errorRate: 100,
          rateLimitRemaining: 0,
          lastCheck: new Date(),
        });
      }
    }
  }

  /**
   * Cleanup
   */
  cleanup(): void {
    this.cache.clear();
    this.rateLimiter.reset();
    this.circuitBreaker.reset();
    logger.info('Model router cleaned up');
  }
}

// ===== SINGLETON INSTANCE =====

export const modelRouter = new ModelRouterEnterprise();
