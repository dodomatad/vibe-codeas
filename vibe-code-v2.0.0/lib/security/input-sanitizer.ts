// lib/security/input-sanitizer.ts
/**
 * Input Sanitizer
 * 
 * Resumo:
 * Proteção contra XSS, SQL injection, command injection e prompt injection
 * 
 * MVP: Sanitização básica com regex patterns
 * Enterprise: ML-based prompt injection detection
 */

import DOMPurify from 'isomorphic-dompurify';
import validator from 'validator';

export class InputSanitizer {
  /**
   * MVP: Sanitize HTML básico
   * Remove tags perigosas, mantém apenas formatação segura
   */
  static sanitizeHTML(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'code', 'pre', 'p', 'br'],
      ALLOWED_ATTR: [],
    });
  }
  
  /**
   * MVP: Validate and sanitize prompts
   * Remove SQL injection, command injection patterns
   */
  static validateAndSanitizePrompt(prompt: string): string {
    // 1. Check length
    if (!validator.isLength(prompt, { min: 1, max: 10000 })) {
      throw new SecurityError('Invalid input length', 'INVALID_LENGTH');
    }
    
    // 2. Remove SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
      /(--|#|\/\*|\*\/)/g, // SQL comments
    ];
    
    for (const pattern of sqlPatterns) {
      if (pattern.test(prompt)) {
        throw new SecurityError('SQL injection detected', 'SQL_INJECTION');
      }
    }
    
    // 3. Remove command injection patterns
    const cmdPatterns = [
      /[;&|`$(){}[\]<>]/g, // Shell metacharacters
      /\b(eval|exec|system|shell_exec)\b/gi, // Dangerous functions
    ];
    
    let sanitized = prompt;
    for (const pattern of cmdPatterns) {
      if (pattern.test(sanitized)) {
        throw new SecurityError('Command injection detected', 'COMMAND_INJECTION');
      }
    }
    
    // 4. Check for prompt injection patterns
    if (this.detectPromptInjection(sanitized)) {
      throw new SecurityError('Prompt injection detected', 'PROMPT_INJECTION');
    }
    
    return sanitized;
  }
  
  /**
   * MVP: Detect common prompt injection patterns
   * Pattern-based detection
   */
  private static detectPromptInjection(prompt: string): boolean {
    const injectionPatterns = [
      /ignore (previous|all|above) instructions?/i,
      /disregard (previous|all) instructions?/i,
      /forget (everything|all) (you|we) (said|discussed)/i,
      /new (instructions?|rules?|system prompt)/i,
      /you are (now|going to be) a/i,
      /system:\s*you are/i,
      /###\s*Instruction/i,
    ];
    
    return injectionPatterns.some(pattern => pattern.test(prompt));
  }
  
  /**
   * MVP: Sanitize filename
   * Remove path traversal, dangerous characters
   */
  static sanitizeFilename(filename: string): string {
    // Remove path traversal
    let safe = filename.replace(/\.\./g, '');
    
    // Remove dangerous characters
    safe = safe.replace(/[^a-zA-Z0-9._-]/g, '_');
    
    // Limit length
    if (safe.length > 255) {
      safe = safe.substring(0, 255);
    }
    
    return safe;
  }
  
  /**
   * MVP: Validate email
   */
  static validateEmail(email: string): boolean {
    return validator.isEmail(email);
  }
  
  /**
   * MVP: Validate URL
   */
  static validateURL(url: string): boolean {
    return validator.isURL(url, {
      protocols: ['http', 'https'],
      require_protocol: true,
    });
  }
}

export class SecurityError extends Error {
  constructor(
    message: string,
    public readonly code: string
  ) {
    super(message);
    this.name = 'SecurityError';
  }
}

/**
 * ENTERPRISE VERSION
 * 
 * Features adicionais:
 * - ML-based prompt injection detection (fine-tuned model)
 * - Context-aware sanitization
 * - Advanced XSS protection (Content Security Policy)
 * - Audit logging de tentativas de injeção
 * - Honeypot traps
 * - Rate limiting integrado
 * 
 * Example:
 * ```typescript
 * const sanitizer = new EnterpriseInputSanitizer({
 *   mlDetection: {
 *     enabled: true,
 *     model: 'vibe-code/prompt-injection-detector-v1',
 *     threshold: 0.85,
 *   },
 *   audit: {
 *     enabled: true,
 *     logSuspicious: true,
 *   },
 *   honeypot: {
 *     enabled: true,
 *     trapKeywords: ['jailbreak', 'bypass', 'override'],
 *   },
 * });
 * 
 * const result = await sanitizer.sanitize(userInput, {
 *   context: 'code-generation',
 *   userId: 'user-123',
 * });
 * ```
 */
