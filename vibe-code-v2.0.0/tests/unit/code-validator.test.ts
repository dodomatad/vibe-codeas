// tests/unit/code-validator.test.ts
/**
 * Unit tests for CodeValidator
 * Tests code validation, bug detection, and auto-fix capabilities
 */

import { describe, it, expect } from 'vitest';
import { CodeValidator, validateCode } from '@/lib/validation/code-validator';

describe('CodeValidator', () => {
  describe('Syntax Validation', () => {
    it('should pass valid TypeScript code', async () => {
      const code = `
        export default function App() {
          return <div>Hello</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      expect(result.errors.filter(e => e.rule === 'syntax')).toHaveLength(0);
    });

    it('should detect mismatched curly braces', async () => {
      const code = `
        export default function App() {
          return <div>Hello</div>;
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      const syntaxErrors = result.errors.filter(e => e.rule === 'syntax');
      expect(syntaxErrors.length).toBeGreaterThan(0);
      expect(syntaxErrors[0].message).toContain('curly braces');
    });

    it('should detect mismatched parentheses', async () => {
      const code = `
        function test() {
          console.log('hello';
        }
      `;

      const result = await CodeValidator.validate(code, 'test.ts');
      const syntaxErrors = result.errors.filter(e => e.rule === 'syntax');
      expect(syntaxErrors.length).toBeGreaterThan(0);
      expect(syntaxErrors[0].message).toContain('parentheses');
    });
  });

  describe('Import Validation', () => {
    it('should detect missing React import when using hooks', async () => {
      const code = `
        export default function App() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      const importErrors = result.errors.filter(e => e.rule === 'missing-import');
      expect(importErrors.length).toBeGreaterThan(0);
      expect(importErrors[0].message).toContain('useState');
      expect(importErrors[0].fix).toContain('import');
    });

    it('should pass when React is imported', async () => {
      const code = `
        import { useState } from 'react';

        export default function App() {
          const [count, setCount] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      const importErrors = result.errors.filter(e => e.rule === 'missing-import');
      expect(importErrors).toHaveLength(0);
    });

    it('should detect multiple missing hooks', async () => {
      const code = `
        export default function App() {
          const [count, setCount] = useState(0);
          useEffect(() => {}, []);
          const ref = useRef(null);
          return <div>{count}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      const importErrors = result.errors.filter(e => e.rule === 'missing-import');
      expect(importErrors.length).toBeGreaterThan(0);
    });

    it('should detect JSX without React import', async () => {
      const code = `
        export default function App() {
          return <MyComponent />;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      const importErrors = result.errors.filter(e => e.rule === 'missing-import');
      expect(importErrors.length).toBeGreaterThan(0);
    });
  });

  describe('Common Bug Detection', () => {
    it('should detect missing await on fetch', async () => {
      const code = `
        async function getData() {
          const response = fetch('https://api.example.com/data');
          return response;
        }
      `;

      const result = await CodeValidator.validate(code, 'api.ts');
      const bugErrors = result.errors.filter(e => e.rule === 'missing-await');
      expect(bugErrors.length).toBeGreaterThan(0);
      expect(bugErrors[0].message).toContain('fetch');
      expect(bugErrors[0].fix).toContain('await');
    });

    it('should detect missing await on .json()', async () => {
      const code = `
        async function getData() {
          const response = await fetch('https://api.example.com/data');
          const data = response.json();
          return data;
        }
      `;

      const result = await CodeValidator.validate(code, 'api.ts');
      const bugErrors = result.errors.filter(e => e.rule === 'missing-await');
      expect(bugErrors.length).toBeGreaterThan(0);
      expect(bugErrors[0].message).toContain('.json()');
    });

    it('should pass when fetch is awaited', async () => {
      const code = `
        async function getData() {
          const response = await fetch('https://api.example.com/data');
          const data = await response.json();
          return data;
        }
      `;

      const result = await CodeValidator.validate(code, 'api.ts');
      const bugErrors = result.errors.filter(e => e.rule === 'missing-await');
      expect(bugErrors).toHaveLength(0);
    });

    it('should suggest optional chaining', async () => {
      const code = `
        function render(user) {
          return user.profile.name;
        }
      `;

      const result = await CodeValidator.validate(code, 'utils.ts');
      const safeNavErrors = result.errors.filter(e => e.rule === 'safe-navigation');
      expect(safeNavErrors.length).toBeGreaterThan(0);
      expect(safeNavErrors[0].message).toContain('optional chaining');
      expect(safeNavErrors[0].fix).toContain('?.');
    });

    it('should pass when optional chaining is used', async () => {
      const code = `
        function render(user) {
          return user?.profile?.name;
        }
      `;

      const result = await CodeValidator.validate(code, 'utils.ts');
      const safeNavErrors = result.errors.filter(e => e.rule === 'safe-navigation');
      expect(safeNavErrors).toHaveLength(0);
    });
  });

  describe('Security Checks', () => {
    it('should warn about dangerouslySetInnerHTML', async () => {
      const code = `
        export default function App() {
          return <div dangerouslySetInnerHTML={{ __html: content }} />;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0].message).toContain('dangerouslySetInnerHTML');
      expect(result.warnings[0].message).toContain('XSS');
    });

    it('should error on eval usage', async () => {
      const code = `
        function executeCode(code) {
          return eval(code);
        }
      `;

      const result = await CodeValidator.validate(code, 'utils.ts');
      const securityWarnings = result.warnings.filter(e => e.rule === 'security');
      expect(securityWarnings.length).toBeGreaterThan(0);
      expect(securityWarnings[0].message).toContain('eval');
      expect(securityWarnings[0].severity).toBe('error');
    });

    it('should pass secure code', async () => {
      const code = `
        export default function App() {
          return <div>{sanitizedContent}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      const securityWarnings = result.warnings.filter(e => e.rule === 'security');
      expect(securityWarnings).toHaveLength(0);
    });
  });

  describe('AutoFix Functionality', () => {
    it('should auto-fix missing React import', async () => {
      const code = `
        export default function App() {
          const [count] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      expect(result.fixed).toBe(true);
      expect(result.fixedCode).toBeTruthy();
      expect(result.fixedCode).toContain('import');
      expect(result.fixedCode).toContain('useState');
    });

    it('should auto-fix missing await', async () => {
      const code = `
        async function getData() {
          const response = fetch('https://api.example.com/data');
          return response;
        }
      `;

      const result = await CodeValidator.validate(code, 'api.ts');
      expect(result.fixed).toBe(true);
      expect(result.fixedCode).toContain('await fetch');
    });

    it('should not fix if no fixes available', async () => {
      const code = `
        function test() {
          console.log('hello';
        }
      `;

      const result = await CodeValidator.validate(code, 'test.ts');
      expect(result.fixed).toBe(false);
      expect(result.fixedCode).toBeUndefined();
    });

    it('should count auto-fixes in metrics', async () => {
      const code = `
        export default function App() {
          const [count] = useState(0);
          return <div>{count}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      expect(result.metrics.autoFixesApplied).toBeGreaterThan(0);
    });
  });

  describe('Validation Metrics', () => {
    it('should count lines checked', async () => {
      const code = `
        function test() {
          const x = 1;
          const y = 2;
          return x + y;
        }
      `;

      const result = await CodeValidator.validate(code, 'test.ts');
      expect(result.metrics.linesChecked).toBe(code.split('\n').length);
    });

    it('should count errors found', async () => {
      const code = `
        export default function App() {
          const [count] = useState(0);
          const data = fetch('https://api.example.com/data');
          return <div>{count}</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      expect(result.metrics.errorsFound).toBeGreaterThan(0);
    });

    it('should count warnings found', async () => {
      const code = `
        function test() {
          return eval('1 + 1');
        }
      `;

      const result = await CodeValidator.validate(code, 'test.ts');
      expect(result.metrics.warningsFound).toBeGreaterThan(0);
    });
  });

  describe('File Type Handling', () => {
    it('should validate .ts files', async () => {
      const code = `
        export function add(a: number, b: number) {
          return a + b;
        }
      `;

      const result = await CodeValidator.validate(code, 'utils.ts');
      expect(result).toBeTruthy();
    });

    it('should validate .tsx files', async () => {
      const code = `
        export default function App() {
          return <div>Hello</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.tsx');
      expect(result).toBeTruthy();
    });

    it('should validate .js files', async () => {
      const code = `
        export function add(a, b) {
          return a + b;
        }
      `;

      const result = await CodeValidator.validate(code, 'utils.js');
      expect(result).toBeTruthy();
    });

    it('should validate .jsx files', async () => {
      const code = `
        export default function App() {
          return <div>Hello</div>;
        }
      `;

      const result = await CodeValidator.validate(code, 'App.jsx');
      expect(result).toBeTruthy();
    });
  });

  describe('Helper Function', () => {
    it('should work with validateCode helper', async () => {
      const code = `
        export default function App() {
          return <div>Hello</div>;
        }
      `;

      const result = await validateCode(code, 'App.tsx');
      expect(result).toBeTruthy();
      expect(result.valid).toBeDefined();
      expect(result.errors).toBeDefined();
      expect(result.metrics).toBeDefined();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty code', async () => {
      const result = await CodeValidator.validate('', 'empty.ts');
      expect(result).toBeTruthy();
      expect(result.valid).toBe(true);
    });

    it('should handle very long code', async () => {
      const code = 'const x = 1;\n'.repeat(1000);
      const result = await CodeValidator.validate(code, 'long.ts');
      expect(result).toBeTruthy();
      expect(result.metrics.linesChecked).toBeGreaterThan(900);
    });

    it('should handle code with special characters', async () => {
      const code = `
        const emoji = '🚀';
        const unicode = '你好';
      `;

      const result = await CodeValidator.validate(code, 'special.ts');
      expect(result).toBeTruthy();
    });
  });

  describe('Real-World Examples', () => {
    it('should validate complete React component', async () => {
      const code = `
        import { useState } from 'react';

        export default function Counter() {
          const [count, setCount] = useState(0);

          return (
            <div>
              <p>Count: {count}</p>
              <button onClick={() => setCount(count + 1)}>
                Increment
              </button>
            </div>
          );
        }
      `;

      const result = await CodeValidator.validate(code, 'Counter.tsx');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should validate and fix buggy API call', async () => {
      const code = `
        async function loadUser(id) {
          const response = fetch(\`/api/users/\${id}\`);
          const data = response.json();
          return data.user.name;
        }
      `;

      const result = await CodeValidator.validate(code, 'api.ts');
      expect(result.valid).toBe(false);
      expect(result.fixed).toBe(true);
      expect(result.fixedCode).toContain('await fetch');
      expect(result.fixedCode).toContain('await response.json()');
    });

    it('should validate form component with hooks', async () => {
      const code = `
        import { useState } from 'react';

        export default function LoginForm() {
          const [email, setEmail] = useState('');
          const [password, setPassword] = useState('');

          const handleSubmit = async (e) => {
            e.preventDefault();
            const response = await fetch('/api/login', {
              method: 'POST',
              body: JSON.stringify({ email, password })
            });
            const data = await response.json();
            console.log(data);
          };

          return (
            <form onSubmit={handleSubmit}>
              <input value={email} onChange={(e) => setEmail(e.target.value)} />
              <input value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="submit">Login</button>
            </form>
          );
        }
      `;

      const result = await CodeValidator.validate(code, 'LoginForm.tsx');
      expect(result.valid).toBe(true);
    });
  });
});

/**
 * COVERAGE: This test file covers:
 * - Syntax validation (braces, parentheses)
 * - Import validation (React hooks, JSX)
 * - Bug detection (missing await, unsafe property access)
 * - Security checks (XSS, eval)
 * - AutoFix functionality (imports, await)
 * - Validation metrics (lines, errors, warnings)
 * - File type handling (.ts, .tsx, .js, .jsx)
 * - Edge cases (empty, long, special characters)
 * - Real-world examples
 *
 * EXPECTED: 95%+ code coverage of code-validator.ts
 */
