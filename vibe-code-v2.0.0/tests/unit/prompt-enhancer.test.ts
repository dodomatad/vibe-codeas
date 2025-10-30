// tests/unit/prompt-enhancer.test.ts
/**
 * Unit tests for PromptEnhancer
 * Tests intelligent prompt enhancement and analysis
 */

import { describe, it, expect } from 'vitest';
import { PromptEnhancer, enhancePrompt } from '@/lib/ai/prompt-engineering/prompt-enhancer';

describe('PromptEnhancer', () => {
  describe('Type Detection', () => {
    it('should detect component type', () => {
      const result = PromptEnhancer.enhance('Create a button component');
      expect(result.reasoning[0]).toContain('component');
    });

    it('should detect app type', () => {
      const result = PromptEnhancer.enhance('Create a todo app');
      expect(result.reasoning[0]).toContain('app');
    });

    it('should detect page type', () => {
      const result = PromptEnhancer.enhance('Create a landing page');
      expect(result.reasoning[0]).toContain('page');
    });

    it('should detect feature type', () => {
      const result = PromptEnhancer.enhance('Add authentication feature');
      expect(result.reasoning[0]).toContain('feature');
    });
  });

  describe('Complexity Detection', () => {
    it('should detect simple complexity', () => {
      const result = PromptEnhancer.enhance('Create a button');
      expect(result.reasoning[1]).toContain('simple');
    });

    it('should detect medium complexity', () => {
      const result = PromptEnhancer.enhance('Create a todo app with add, edit, and delete functionality');
      expect(result.reasoning[1]).toContain('medium');
    });

    it('should detect complex complexity', () => {
      const result = PromptEnhancer.enhance(
        'Create a full-stack e-commerce application with user authentication, product catalog, shopping cart, checkout, payment integration, order history, admin dashboard, and analytics'
      );
      expect(result.reasoning[1]).toContain('complex');
    });
  });

  describe('Framework Detection', () => {
    it('should detect React', () => {
      const result = PromptEnhancer.enhance('Create a React component');
      expect(result.reasoning).toContainEqual(expect.stringContaining('React'));
    });

    it('should detect Vue', () => {
      const result = PromptEnhancer.enhance('Create a Vue component');
      expect(result.reasoning).toContainEqual(expect.stringContaining('Vue'));
    });

    it('should detect Next.js', () => {
      const result = PromptEnhancer.enhance('Create a Next.js page');
      expect(result.reasoning).toContainEqual(expect.stringContaining('Next.js'));
    });

    it('should handle no framework specified', () => {
      const result = PromptEnhancer.enhance('Create a component');
      // Should still generate valid enhanced prompt
      expect(result.enhanced).toContain('React'); // Default to React
    });
  });

  describe('Library Detection', () => {
    it('should detect Tailwind CSS', () => {
      const result = PromptEnhancer.enhance('Create a component with Tailwind');
      expect(result.reasoning).toContainEqual(expect.stringContaining('Tailwind CSS'));
    });

    it('should detect multiple libraries', () => {
      const result = PromptEnhancer.enhance('Create a form with Tailwind and Framer Motion animations');
      expect(result.reasoning).toContainEqual(expect.stringContaining('Tailwind CSS'));
      expect(result.reasoning).toContainEqual(expect.stringContaining('Framer Motion'));
    });

    it('should detect shadcn/ui', () => {
      const result = PromptEnhancer.enhance('Create a component using shadcn');
      expect(result.reasoning).toContainEqual(expect.stringContaining('shadcn/ui'));
    });
  });

  describe('Requirements Extraction', () => {
    it('should detect creation requirement', () => {
      const result = PromptEnhancer.enhance('Create a new component');
      expect(result.detectedPatterns).toContain('creation');
    });

    it('should detect API requirement', () => {
      const result = PromptEnhancer.enhance('Fetch data from API');
      expect(result.detectedPatterns).toContain('api');
    });

    it('should detect form requirement', () => {
      const result = PromptEnhancer.enhance('Create a login form');
      expect(result.detectedPatterns).toContain('form');
    });

    it('should detect authentication requirement', () => {
      const result = PromptEnhancer.enhance('Add login functionality');
      expect(result.detectedPatterns).toContain('authentication');
    });

    it('should detect responsive requirement', () => {
      const result = PromptEnhancer.enhance('Make it mobile responsive');
      expect(result.detectedPatterns).toContain('responsive');
    });

    it('should detect theming requirement', () => {
      const result = PromptEnhancer.enhance('Add dark mode support');
      expect(result.detectedPatterns).toContain('theming');
    });
  });

  describe('Enhanced Prompt Quality', () => {
    it('should generate much longer prompt than original', () => {
      const original = 'Create a button';
      const result = PromptEnhancer.enhance(original);

      expect(result.enhanced.length).toBeGreaterThan(original.length * 10);
    });

    it('should include role context', () => {
      const result = PromptEnhancer.enhance('Create a component');
      expect(result.enhanced).toContain('expert');
    });

    it('should include original request', () => {
      const original = 'Create a todo app';
      const result = PromptEnhancer.enhance(original);
      expect(result.enhanced).toContain(original);
    });

    it('should include technical requirements', () => {
      const result = PromptEnhancer.enhance('Create a component');
      expect(result.enhanced).toContain('Technical Stack');
      expect(result.enhanced).toContain('TypeScript');
    });

    it('should include best practices', () => {
      const result = PromptEnhancer.enhance('Create a component');
      expect(result.enhanced).toContain('Best Practices');
      expect(result.enhanced).toContain('Error Handling');
      expect(result.enhanced).toContain('Accessibility');
    });

    it('should include quality checklist', () => {
      const result = PromptEnhancer.enhance('Create a component');
      expect(result.enhanced).toContain('Quality Checklist');
      expect(result.enhanced).toContain('✅');
    });

    it('should include output format', () => {
      const result = PromptEnhancer.enhance('Create a component');
      expect(result.enhanced).toContain('Output Format');
      expect(result.enhanced).toContain('```');
    });
  });

  describe('Added Context', () => {
    it('should always include basic context', () => {
      const result = PromptEnhancer.enhance('Create a component');

      expect(result.addedContext).toContain('TypeScript types and interfaces');
      expect(result.addedContext).toContain('Error handling with try/catch');
      expect(result.addedContext).toContain('Loading and empty states');
      expect(result.addedContext).toContain('Accessibility (ARIA labels)');
      expect(result.addedContext).toContain('Responsive design');
      expect(result.addedContext).toContain('Best practices enforcement');
    });

    it('should add form-specific context', () => {
      const result = PromptEnhancer.enhance('Create a contact form');
      expect(result.addedContext).toContain('Form validation with Zod');
    });

    it('should add API-specific context', () => {
      const result = PromptEnhancer.enhance('Fetch data from API');
      expect(result.addedContext).toContain('API error handling');
    });
  });

  describe('Helper Function', () => {
    it('should work with enhancePrompt helper', () => {
      const result = enhancePrompt('Create a button');

      expect(typeof result).toBe('string');
      expect(result.length).toBeGreaterThan(100);
      expect(result).toContain('TypeScript');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty prompt', () => {
      const result = PromptEnhancer.enhance('');
      expect(result.enhanced).toBeTruthy();
      expect(result.reasoning).toBeTruthy();
    });

    it('should handle very short prompt', () => {
      const result = PromptEnhancer.enhance('Button');
      expect(result.enhanced).toBeTruthy();
      expect(result.enhanced.length).toBeGreaterThan(100);
    });

    it('should handle very long prompt', () => {
      const longPrompt = 'Create a component '.repeat(100);
      const result = PromptEnhancer.enhance(longPrompt);
      expect(result.enhanced).toBeTruthy();
      expect(result.reasoning[1]).toContain('complex');
    });

    it('should handle special characters', () => {
      const result = PromptEnhancer.enhance('Create a <Button /> with @click handler');
      expect(result.enhanced).toBeTruthy();
    });
  });

  describe('Real-World Examples', () => {
    it('should enhance simple todo app prompt', () => {
      const result = PromptEnhancer.enhance('Create a todo app');

      expect(result.reasoning[0]).toContain('app');
      expect(result.detectedPatterns.length).toBeGreaterThan(0);
      expect(result.enhanced).toContain('production-ready');
      expect(result.enhanced).toContain('TypeScript');
    });

    it('should enhance e-commerce prompt', () => {
      const result = PromptEnhancer.enhance(
        'Create a product catalog with shopping cart and checkout'
      );

      expect(result.reasoning[1]).toContain('medium');
      expect(result.enhanced).toContain('Best Practices');
    });

    it('should enhance dashboard prompt', () => {
      const result = PromptEnhancer.enhance(
        'Create an analytics dashboard with charts using Recharts'
      );

      expect(result.enhanced).toContain('TypeScript');
      expect(result.detectedPatterns.length).toBeGreaterThan(0);
    });
  });
});

/**
 * COVERAGE: This test file covers:
 * - Type detection (component, page, feature, app)
 * - Complexity detection (simple, medium, complex)
 * - Framework detection (React, Vue, Next.js)
 * - Library detection (Tailwind, Framer Motion, shadcn)
 * - Requirements extraction (creation, API, forms, auth, responsive, theming)
 * - Enhanced prompt quality (length, structure, completeness)
 * - Added context (TypeScript, error handling, accessibility)
 * - Edge cases (empty, short, long prompts)
 * - Real-world examples
 *
 * EXPECTED: 95%+ code coverage of prompt-enhancer.ts
 */
