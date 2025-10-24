import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EnvironmentGuard } from '@/lib/devprod/environment-guard';

describe('EnvironmentGuard', () => {
  let guard: EnvironmentGuard;

  beforeEach(() => {
    vi.clearAllMocks();
    guard = new EnvironmentGuard();
  });

  describe('Environment Detection', () => {
    it('should detect development environment', () => {
      process.env.NODE_ENV = 'development';
      expect(guard.isDevelopment()).toBe(true);
      expect(guard.isProduction()).toBe(false);
    });

    it('should detect production environment', () => {
      process.env.NODE_ENV = 'production';
      expect(guard.isProduction()).toBe(true);
      expect(guard.isDevelopment()).toBe(false);
    });

    it('should detect staging environment', () => {
      process.env.NODE_ENV = 'staging';
      expect(guard.isStaging()).toBe(true);
    });
  });

  describe('Feature Gating', () => {
    it('should block debug tools in production', () => {
      process.env.NODE_ENV = 'production';
      expect(() => guard.assertDevelopmentOnly('debug-panel')).toThrow(
        'Feature "debug-panel" is only available in development'
      );
    });

    it('should allow debug tools in development', () => {
      process.env.NODE_ENV = 'development';
      expect(() => guard.assertDevelopmentOnly('debug-panel')).not.toThrow();
    });

    it('should enforce production-only features', () => {
      process.env.NODE_ENV = 'development';
      expect(() => guard.assertProductionOnly('analytics')).toThrow(
        'Feature "analytics" is only available in production'
      );
    });
  });

  describe('Security Enforcement', () => {
    it('should block sensitive data exposure in production', () => {
      process.env.NODE_ENV = 'production';
      const sensitiveData = { apiKey: 'secret-123' };
      
      expect(() => guard.validateSensitiveData(sensitiveData)).toThrow(
        'Sensitive data exposure blocked in production'
      );
    });

    it('should allow sensitive data in development', () => {
      process.env.NODE_ENV = 'development';
      const sensitiveData = { apiKey: 'secret-123' };
      
      expect(() => guard.validateSensitiveData(sensitiveData)).not.toThrow();
    });

    it('should sanitize logs in production', () => {
      process.env.NODE_ENV = 'production';
      const log = 'API Key: sk-1234567890';
      const sanitized = guard.sanitizeLog(log);
      
      expect(sanitized).not.toContain('sk-1234567890');
      expect(sanitized).toContain('[REDACTED]');
    });
  });

  describe('Performance Monitoring', () => {
    it('should track execution time', async () => {
      const result = await guard.trackExecution('test-operation', async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'success';
      });

      expect(result).toBe('success');
      expect(guard.getMetrics('test-operation')).toMatchObject({
        count: 1,
        avgDuration: expect.any(Number),
      });
    });

    it('should alert on slow operations in production', async () => {
      process.env.NODE_ENV = 'production';
      const alertSpy = vi.spyOn(guard, 'alertSlowOperation');

      await guard.trackExecution('slow-op', async () => {
        await new Promise((resolve) => setTimeout(resolve, 2000));
      });

      expect(alertSpy).toHaveBeenCalledWith('slow-op', expect.any(Number));
    });
  });
});
