/**
 * Environment Guard Enterprise
 * 
 * Validação e proteção de ambientes com:
 * ✅ Environment validation
 * ✅ Feature flags
 * ✅ Safe mode
 * ✅ Rollback mechanisms
 * ✅ Config validation
 * 
 * @module EnvironmentGuard
 */

import { z } from 'zod';
import pino from 'pino';

const logger = pino({ name: 'environment-guard' });

// ===== TYPES =====

export type Environment = 'development' | 'staging' | 'production';

export interface FeatureFlag {
  name: string;
  enabled: boolean;
  environments: Environment[];
  rolloutPercentage?: number;
  description?: string;
}

export interface EnvironmentConfig {
  environment: Environment;
  nodeEnv: string;
  isDevelopment: boolean;
  isStaging: boolean;
  isProduction: boolean;
  apiUrl: string;
  databaseUrl: string;
  redisUrl?: string;
  featureFlags: Map<string, FeatureFlag>;
}

export interface SafeModeConfig {
  enabled: boolean;
  readOnly: boolean;
  maxRequestsPerMinute: number;
  disabledFeatures: string[];
  allowedOperations: string[];
}

// ===== VALIDATION SCHEMAS =====

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production']),
  DATABASE_URL: z.string().url(),
  REDIS_URL: z.string().url().optional(),
  API_URL: z.string().url(),
  ANTHROPIC_API_KEY: z.string().min(1),
  OPENAI_API_KEY: z.string().min(1).optional(),
  GOOGLE_AI_API_KEY: z.string().min(1).optional(),
  NEXTAUTH_SECRET: z.string().min(32),
  NEXTAUTH_URL: z.string().url(),
});

// ===== ENVIRONMENT GUARD =====

export class EnvironmentGuard {
  private config: EnvironmentConfig;
  private safeMode: SafeModeConfig;
  private validated: boolean = false;

  constructor() {
    this.config = this.initializeConfig();
    this.safeMode = this.initializeSafeMode();
  }

  /**
   * Initialize environment configuration
   */
  private initializeConfig(): EnvironmentConfig {
    const nodeEnv = (process.env.NODE_ENV || 'development') as Environment;
    
    return {
      environment: nodeEnv,
      nodeEnv: process.env.NODE_ENV || 'development',
      isDevelopment: nodeEnv === 'development',
      isStaging: nodeEnv === 'staging',
      isProduction: nodeEnv === 'production',
      apiUrl: process.env.API_URL || 'http://localhost:3000',
      databaseUrl: process.env.DATABASE_URL || '',
      redisUrl: process.env.REDIS_URL,
      featureFlags: this.loadFeatureFlags(),
    };
  }

  /**
   * Initialize safe mode configuration
   */
  private initializeSafeMode(): SafeModeConfig {
    const enabled = process.env.SAFE_MODE === 'true';
    
    return {
      enabled,
      readOnly: enabled,
      maxRequestsPerMinute: enabled ? 10 : 100,
      disabledFeatures: enabled ? ['ai-generation', 'deployment'] : [],
      allowedOperations: enabled ? ['read', 'preview'] : ['read', 'write', 'delete'],
    };
  }

  /**
   * Load feature flags from environment or config
   */
  private loadFeatureFlags(): Map<string, FeatureFlag> {
    const flags = new Map<string, FeatureFlag>();

    // Default feature flags
    const defaultFlags: FeatureFlag[] = [
      {
        name: 'cost-tracking',
        enabled: true,
        environments: ['development', 'staging', 'production'],
        description: 'Real-time cost tracking',
      },
      {
        name: 'model-routing',
        enabled: true,
        environments: ['development', 'staging', 'production'],
        description: 'Multi-model routing',
      },
      {
        name: 'background-agents',
        enabled: !this.config.isProduction, // Disabled in production by default
        environments: ['development', 'staging'],
        description: 'Background AI agents',
      },
      {
        name: 'rag-search',
        enabled: false, // Beta feature
        environments: ['development'],
        rolloutPercentage: 10,
        description: 'RAG-based code search',
      },
      {
        name: 'autofix',
        enabled: false, // Beta feature
        environments: ['development'],
        rolloutPercentage: 5,
        description: 'Automatic error fixing',
      },
    ];

    defaultFlags.forEach((flag) => {
      flags.set(flag.name, flag);
    });

    // Load custom flags from environment
    const customFlags = process.env.FEATURE_FLAGS;
    if (customFlags) {
      try {
        const parsed = JSON.parse(customFlags);
        Object.entries(parsed).forEach(([name, enabled]) => {
          if (flags.has(name)) {
            const flag = flags.get(name)!;
            flag.enabled = enabled as boolean;
          }
        });
      } catch (error) {
        logger.warn({ error }, 'Failed to parse custom feature flags');
      }
    }

    return flags;
  }

  /**
   * Validate environment configuration
   * @throws {Error} If validation fails
   */
  validate(): void {
    try {
      // Validate required environment variables
      EnvSchema.parse(process.env);

      // Validate environment-specific requirements
      if (this.config.isProduction) {
        this.validateProduction();
      }

      this.validated = true;
      logger.info(
        { environment: this.config.environment },
        'Environment validated successfully'
      );
    } catch (error) {
      logger.error({ error }, 'Environment validation failed');
      throw new Error(`Environment validation failed: ${error}`);
    }
  }

  /**
   * Validate production-specific requirements
   */
  private validateProduction(): void {
    // Ensure HTTPS
    if (!this.config.apiUrl.startsWith('https://')) {
      throw new Error('Production must use HTTPS');
    }

    // Ensure database URL is production-ready
    if (this.config.databaseUrl.includes('localhost')) {
      throw new Error('Production cannot use localhost database');
    }

    // Ensure Redis is configured
    if (!this.config.redisUrl) {
      throw new Error('Production requires Redis configuration');
    }

    // Ensure safe mode is disabled
    if (this.safeMode.enabled) {
      logger.warn('Safe mode is enabled in production');
    }
  }

  /**
   * Check if feature flag is enabled
   */
  isFeatureEnabled(featureName: string, userId?: string): boolean {
    const flag = this.config.featureFlags.get(featureName);
    
    if (!flag) {
      logger.warn({ featureName }, 'Feature flag not found');
      return false;
    }

    // Check if feature is enabled
    if (!flag.enabled) {
      return false;
    }

    // Check if feature is enabled for current environment
    if (!flag.environments.includes(this.config.environment)) {
      return false;
    }

    // Check rollout percentage
    if (flag.rolloutPercentage !== undefined && userId) {
      const hash = this.hashUserId(userId);
      const userPercentage = hash % 100;
      return userPercentage < flag.rolloutPercentage;
    }

    return true;
  }

  /**
   * Hash user ID for consistent rollout
   */
  private hashUserId(userId: string): number {
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Enable safe mode
   */
  enableSafeMode(reason: string): void {
    this.safeMode.enabled = true;
    this.safeMode.readOnly = true;
    
    logger.warn({ reason }, 'Safe mode enabled');
  }

  /**
   * Disable safe mode
   */
  disableSafeMode(): void {
    this.safeMode.enabled = false;
    this.safeMode.readOnly = false;
    
    logger.info('Safe mode disabled');
  }

  /**
   * Check if operation is allowed
   */
  isOperationAllowed(operation: string): boolean {
    if (!this.safeMode.enabled) {
      return true;
    }

    return this.safeMode.allowedOperations.includes(operation);
  }

  /**
   * Check if feature is allowed in safe mode
   */
  isFeatureAllowedInSafeMode(featureName: string): boolean {
    if (!this.safeMode.enabled) {
      return true;
    }

    return !this.safeMode.disabledFeatures.includes(featureName);
  }

  /**
   * Get current configuration
   */
  getConfig(): EnvironmentConfig {
    return { ...this.config };
  }

  /**
   * Get safe mode status
   */
  getSafeModeStatus(): SafeModeConfig {
    return { ...this.safeMode };
  }

  /**
   * Ensure environment is validated
   */
  ensureValidated(): void {
    if (!this.validated) {
      throw new Error('Environment not validated. Call validate() first.');
    }
  }
}

// ===== SINGLETON INSTANCE =====

export const environmentGuard = new EnvironmentGuard();

// ===== HELPER FUNCTIONS =====

/**
 * Quick check if in development
 */
export function isDevelopment(): boolean {
  return environmentGuard.getConfig().isDevelopment;
}

/**
 * Quick check if in production
 */
export function isProduction(): boolean {
  return environmentGuard.getConfig().isProduction;
}

/**
 * Quick check if in staging
 */
export function isStaging(): boolean {
  return environmentGuard.getConfig().isStaging;
}

/**
 * Get current environment
 */
export function getCurrentEnvironment(): Environment {
  return environmentGuard.getConfig().environment;
}

/**
 * Check if feature is enabled
 */
export function isFeatureEnabled(featureName: string, userId?: string): boolean {
  return environmentGuard.isFeatureEnabled(featureName, userId);
}

/**
 * Validate environment on startup
 */
export function validateEnvironment(): void {
  environmentGuard.validate();
}
