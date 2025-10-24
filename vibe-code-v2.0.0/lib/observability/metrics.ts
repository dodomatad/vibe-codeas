/**
 * Metrics System
 * 
 * Sistema de métricas para monitoramento de aplicação.
 * Tracking de performance, uso de recursos e comportamento do usuário.
 * 
 * @layer MVP
 */

/**
 * Initialize metrics collection
 * MVP: Basic browser metrics with Datadog RUM
 */
export function initMetrics() {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'production') {
    console.log('Metrics disabled in non-production or server environment');
    return;
  }

  // Datadog RUM initialization
  if (process.env.NEXT_PUBLIC_DD_APP_ID && process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN) {
    import('@datadog/browser-rum').then(({ datadogRum }) => {
      datadogRum.init({
        applicationId: process.env.NEXT_PUBLIC_DD_APP_ID!,
        clientToken: process.env.NEXT_PUBLIC_DD_CLIENT_TOKEN!,
        site: 'datadoghq.com',
        service: 'vibe-code',
        env: process.env.NODE_ENV,
        version: '1.1.0',
        sessionSampleRate: 100,
        sessionReplaySampleRate: 20,
        trackUserInteractions: true,
        trackResources: true,
        trackLongTasks: true,
        defaultPrivacyLevel: 'mask-user-input',
      });

      datadogRum.startSessionReplayRecording();
      console.log('Datadog RUM initialized successfully');
    });
  }
}

/**
 * Track custom metric
 */
export function trackMetric(name: string, value: number, tags?: Record<string, string>) {
  if (typeof window === 'undefined') return;

  // Send to Datadog
  if (window.DD_RUM) {
    window.DD_RUM.addAction(name, {
      value,
      ...tags,
    });
  }

  // Console log in development
  if (process.env.NODE_ENV !== 'production') {
    console.log('[Metric]', name, value, tags);
  }
}

/**
 * Track user action
 */
export function trackAction(action: string, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  if (window.DD_RUM) {
    window.DD_RUM.addAction(action, metadata);
  }

  if (process.env.NODE_ENV !== 'production') {
    console.log('[Action]', action, metadata);
  }
}

/**
 * Track error
 */
export function trackError(error: Error, context?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  if (window.DD_RUM) {
    window.DD_RUM.addError(error, context);
  }

  console.error('[Error]', error, context);
}

/**
 * Track performance timing
 */
export async function trackTiming<T>(
  operation: string,
  fn: () => Promise<T>,
  metadata?: Record<string, any>
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    trackMetric(`${operation}.duration`, duration, metadata);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    trackMetric(`${operation}.error`, duration, metadata);
    throw error;
  }
}

/**
 * Track page view
 */
export function trackPageView(pageName: string, metadata?: Record<string, any>) {
  if (typeof window === 'undefined') return;

  if (window.DD_RUM) {
    window.DD_RUM.addAction('pageview', {
      pageName,
      ...metadata,
    });
  }
}

/**
 * Enterprise Layer: Advanced metrics
 */
export class EnterpriseMetrics {
  // TODO: Add custom dashboards
  // TODO: Add real-time alerting
  // TODO: Add cost attribution
  // TODO: Add user cohort analysis
  // TODO: Add A/B testing framework
}

/**
 * Type declarations for Datadog
 */
declare global {
  interface Window {
    DD_RUM?: {
      addAction: (name: string, context?: any) => void;
      addError: (error: Error, context?: any) => void;
      startSessionReplayRecording: () => void;
    };
  }
}
