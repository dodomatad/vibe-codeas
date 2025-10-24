/**
 * Global Type Definitions
 * Tipos compartilhados entre todo o projeto
 */

declare global {
  namespace OpenLovable {
    // AI Models
    type ModelProvider = 'anthropic' | 'openai' | 'deepseek' | 'google';
    type ModelId = 
      | 'claude-sonnet-4'
      | 'claude-opus-4'
      | 'gpt-4o'
      | 'gpt-4o-mini'
      | 'deepseek-v3'
      | 'gemini-2.0-flash'
      | 'o1-preview';

    // Tasks
    type TaskType =
      | 'initial-generation'
      | 'quick-edit'
      | 'refactoring'
      | 'bug-fix'
      | 'optimization'
      | 'testing'
      | 'documentation'
      | 'complex-logic';

    type TaskComplexity = 'low' | 'medium' | 'high';

    // Project
    interface Project {
      id: string;
      name: string;
      files: Record<string, string>;
      framework: Framework;
      createdAt: number;
      updatedAt: number;
      version: number;
      metadata?: ProjectMetadata;
    }

    interface ProjectMetadata {
      author?: string;
      description?: string;
      tags?: string[];
      dependencies?: Record<string, string>;
    }

    type Framework = 'next' | 'react' | 'vite' | 'remix';
    
    // Context
    interface CodeContext {
      framework: Framework;
      components: ComponentInfo[];
      routes: RouteInfo[];
      styleSystem: StyleSystem;
      stateManagement?: StateManagement;
    }

    type StyleSystem = 'tailwind' | 'styled-components' | 'css-modules' | 'emotion';
    type StateManagement = 'zustand' | 'jotai' | 'redux' | 'mobx';

    // Generation
    interface GenerationRequest {
      message: string;
      projectPath?: string;
      taskType?: TaskType;
      complexity?: TaskComplexity;
      context?: CodeContext;
    }

    interface GenerationResponse {
      success: boolean;
      data?: {
        code: string;
        model: ModelId;
        latency: number;
        usage: TokenUsage;
        context: {
          framework: Framework;
          components: number;
        };
      };
      error?: string;
    }

    interface TokenUsage {
      inputTokens: number;
      outputTokens: number;
      totalTokens?: number;
      cost?: number;
    }

    // Testing
    interface TestResult {
      file: string;
      passed: boolean;
      duration: number;
      assertions: number;
      coverage?: CoverageData;
    }

    interface CoverageData {
      lines: number;
      functions: number;
      branches: number;
      statements: number;
    }

    // Storage
    interface StorageAdapter {
      save(project: Project): Promise<void>;
      load(id: string): Promise<Project | undefined>;
      list(): Promise<Project[]>;
      delete(id: string): Promise<void>;
    }

    // Preview
    interface PreviewMetrics {
      fcp: number; // First Contentful Paint
      lcp: number; // Largest Contentful Paint
      cls: number; // Cumulative Layout Shift
      tbt: number; // Total Blocking Time
      fid: number; // First Input Delay
    }

    interface DevicePreset {
      id: string;
      name: string;
      width: number;
      height: number;
      userAgent?: string;
    }

    // User Preferences
    interface UserPreferences {
      qualityBias: number; // 0-1, higher = prefer quality over cost
      maxCostPerRequest?: number;
      maxResponseTime?: number;
      preferredModels?: ModelId[];
      blockedModels?: ModelId[];
      theme?: 'light' | 'dark' | 'system';
      codeStyle?: CodeStylePreferences;
    }

    interface CodeStylePreferences {
      indentation: 'spaces' | 'tabs';
      indentSize: number;
      quotestyle: 'single' | 'double';
      semicolons: boolean;
      trailingComma: 'none' | 'es5' | 'all';
    }

    // Component Info
    interface ComponentInfo {
      name: string;
      path: string;
      props: PropInfo[];
      isServerComponent: boolean;
      isClientComponent: boolean;
      dependencies: string[];
      complexity: TaskComplexity;
    }

    interface PropInfo {
      name: string;
      type: string;
      required: boolean;
      defaultValue?: string;
      description?: string;
    }

    interface RouteInfo {
      path: string;
      type: 'static' | 'dynamic' | 'catch-all';
      hasLayout: boolean;
      hasLoading: boolean;
      hasError: boolean;
      isProtected: boolean;
    }

    // API Types
    type ApiMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

    interface ApiResponse<T = any> {
      success: boolean;
      data?: T;
      error?: string;
      meta?: {
        timestamp: number;
        requestId: string;
        version: string;
      };
    }

    // Events
    interface CustomEvents {
      'generation:start': { taskType: TaskType };
      'generation:complete': GenerationResponse;
      'generation:error': { error: Error };
      'preview:update': { metrics: PreviewMetrics };
      'storage:save': { project: Project };
      'storage:load': { projectId: string };
    }
  }
}

export {};
