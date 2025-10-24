/**
 * Open Lovable Enhanced - Exports
 * Exports centralizados para fácil importação
 */

// AI Core
export {
  buildSystemPrompt,
  enhanceUserMessage,
  type PromptConfig,
  type ProjectContext
} from './lib/ai/enhanced/system-prompts';

export {
  ModelRouter,
  createModelRouter,
  estimateCost,
  MODEL_CAPABILITIES,
  type ModelId,
  type TaskType,
  type ModelConfig,
  type UserPreferences
} from './lib/ai/multi-model/model-router';

export {
  ContextBuilder,
  createContextBuilder,
  type ComponentInfo,
  type RouteInfo,
  type DesignTokens
} from './lib/ai/context/context-builder';

// Storage
export {
  HybridStorage,
  storage,
  type Project
} from './lib/storage/hybrid-storage';

// Testing
export {
  AutoTestGenerator,
  TestRunner,
  testGenerator,
  testRunner,
  type TestSuite,
  type TestResult,
  type CoverageReport
} from './lib/testing/auto-test-gen';

// Components
export {
  EnhancedPreview,
  type PreviewMetrics,
  type DevicePreset
} from './components/preview/enhanced/EnhancedPreview';

// Types
export type * from './types/global';
