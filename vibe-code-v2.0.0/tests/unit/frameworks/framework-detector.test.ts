import { describe, it, expect, beforeEach } from 'vitest';
import { FrameworkDetector } from '@/lib/frameworks/framework-detector';

describe('FrameworkDetector', () => {
  let detector: FrameworkDetector;

  beforeEach(() => {
    detector = new FrameworkDetector();
  });

  describe('Package.json Detection', () => {
    it('should detect Next.js from dependencies', () => {
      const packageJson = {
        dependencies: { 'next': '^14.0.0' },
      };

      const result = detector.detectFromPackageJson(packageJson);
      expect(result.framework).toBe('nextjs');
      expect(result.version).toBe('14.0.0');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should detect React from dependencies', () => {
      const packageJson = {
        dependencies: { 'react': '^18.2.0', 'react-dom': '^18.2.0' },
      };

      const result = detector.detectFromPackageJson(packageJson);
      expect(result.framework).toBe('react');
      expect(result.version).toBe('18.2.0');
    });

    it('should detect Vue.js', () => {
      const packageJson = {
        dependencies: { 'vue': '^3.3.0' },
      };

      const result = detector.detectFromPackageJson(packageJson);
      expect(result.framework).toBe('vue');
    });

    it('should detect Svelte', () => {
      const packageJson = {
        devDependencies: { 'svelte': '^4.0.0' },
      };

      const result = detector.detectFromPackageJson(packageJson);
      expect(result.framework).toBe('svelte');
    });
  });

  describe('File Structure Detection', () => {
    it('should detect Next.js from app directory', () => {
      const files = [
        'app/page.tsx',
        'app/layout.tsx',
        'next.config.js',
      ];

      const result = detector.detectFromFileStructure(files);
      expect(result.framework).toBe('nextjs');
      expect(result.features).toContain('app-router');
    });

    it('should detect React with Vite from vite.config', () => {
      const files = [
        'src/App.tsx',
        'vite.config.ts',
        'index.html',
      ];

      const result = detector.detectFromFileStructure(files);
      expect(result.framework).toBe('react');
      expect(result.buildTool).toBe('vite');
    });

    it('should detect Astro from astro.config', () => {
      const files = [
        'src/pages/index.astro',
        'astro.config.mjs',
      ];

      const result = detector.detectFromFileStructure(files);
      expect(result.framework).toBe('astro');
    });
  });

  describe('Content Analysis', () => {
    it('should detect framework from import statements', () => {
      const content = `
        import { useRouter } from 'next/navigation';
        import Image from 'next/image';
      `;

      const result = detector.analyzeContent(content, 'app.tsx');
      expect(result.framework).toBe('nextjs');
      expect(result.imports).toContain('next/navigation');
    });

    it('should detect React hooks', () => {
      const content = `
        import { useState, useEffect } from 'react';
        
        export default function Component() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const result = detector.analyzeContent(content, 'Component.tsx');
      expect(result.framework).toBe('react');
      expect(result.features).toContain('hooks');
    });
  });

  describe('Multi-Framework Projects', () => {
    it('should detect monorepo with multiple frameworks', () => {
      const structure = {
        'packages/web': ['next.config.js', 'app/page.tsx'],
        'packages/mobile': ['app.json', 'App.tsx'],
        'packages/api': ['index.ts', 'tsconfig.json'],
      };

      const result = detector.detectMonorepo(structure);
      expect(result.type).toBe('monorepo');
      expect(result.packages).toHaveLength(3);
      expect(result.packages[0].framework).toBe('nextjs');
    });

    it('should handle framework migration scenarios', () => {
      const files = [
        'pages/index.tsx', // Old Pages Router
        'app/page.tsx',    // New App Router
        'next.config.js',
      ];

      const result = detector.detectFromFileStructure(files);
      expect(result.framework).toBe('nextjs');
      expect(result.migration).toBe('pages-to-app');
      expect(result.warnings).toContain('Mixed routing detected');
    });
  });

  describe('Confidence Scoring', () => {
    it('should have high confidence with multiple signals', () => {
      const result = detector.detect({
        packageJson: { dependencies: { 'next': '^14.0.0' } },
        files: ['app/page.tsx', 'next.config.js'],
        content: 'import { useRouter } from "next/navigation"',
      });

      expect(result.confidence).toBeGreaterThan(0.95);
    });

    it('should have low confidence with conflicting signals', () => {
      const result = detector.detect({
        packageJson: { dependencies: { 'react': '^18.0.0' } },
        files: ['vite.config.ts'],
        content: 'import { createApp } from "vue"', // Vue import in React project
      });

      expect(result.confidence).toBeLessThan(0.5);
      expect(result.warnings).not.toHaveLength(0);
    });
  });
});
