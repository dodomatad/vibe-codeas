/**
 * Telemetry and Observability
 * 
 * Sistema de monitoramento para produção com OpenTelemetry.
 * Tracking de métricas, traces e logs estruturados.
 * 
 * @layer MVP
 */

import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

/**
 * Initialize OpenTelemetry
 * MVP: Basic tracing with OTLP export
 */
export function initTelemetry() {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Telemetry disabled in non-production environment');
    return;
  }

  const sdk = new NodeSDK({
    resource: new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: 'vibe-code',
      [SemanticResourceAttributes.SERVICE_VERSION]: '1.1.0',
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: process.env.NODE_ENV,
    }),
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318/v1/traces',
      headers: {
        'x-api-key': process.env.OTEL_API_KEY || '',
      },
    }),
    instrumentations: [
      getNodeAutoInstrumentations({
        // Disable filesystem instrumentation for performance
        '@opentelemetry/instrumentation-fs': { enabled: false },
        // Enable HTTP instrumentation
        '@opentelemetry/instrumentation-http': {
          enabled: true,
          ignoreIncomingPaths: ['/health', '/metrics'],
        },
        // Enable database instrumentation
        '@opentelemetry/instrumentation-pg': { enabled: true },
      }),
    ],
  });

  sdk.start();

  // Graceful shutdown
  process.on('SIGTERM', () => {
    sdk
      .shutdown()
      .then(() => console.log('Telemetry terminated'))
      .catch((error) => console.error('Error terminating telemetry', error))
      .finally(() => process.exit(0));
  });

  console.log('Telemetry initialized successfully');
}

/**
 * Custom trace decorator
 * Usage: @trace() on methods to automatically create spans
 */
export function trace(spanName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const tracer = getTracer();
      const name = spanName || `${target.constructor.name}.${propertyKey}`;

      return tracer.startActiveSpan(name, async (span) => {
        try {
          const result = await originalMethod.apply(this, args);
          span.setStatus({ code: 0 }); // OK
          return result;
        } catch (error: any) {
          span.setStatus({ code: 2, message: error.message }); // ERROR
          span.recordException(error);
          throw error;
        } finally {
          span.end();
        }
      });
    };

    return descriptor;
  };
}

/**
 * Get tracer instance
 */
export function getTracer() {
  const { trace } = require('@opentelemetry/api');
  return trace.getTracer('vibe-code', '1.1.0');
}

/**
 * Enterprise Layer: Advanced observability
 */
export class EnterpriseObservability {
  private static instance: EnterpriseObservability;

  private constructor() {}

  static getInstance(): EnterpriseObservability {
    if (!EnterpriseObservability.instance) {
      EnterpriseObservability.instance = new EnterpriseObservability();
    }
    return EnterpriseObservability.instance;
  }

  // TODO: Implement distributed tracing
  // TODO: Add custom metrics
  // TODO: Error aggregation and alerting
  // TODO: Performance profiling
}
