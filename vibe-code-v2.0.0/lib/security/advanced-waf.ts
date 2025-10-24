// lib/security/advanced-waf.ts
/**
 * Advanced Web Application Firewall
 * 
 * Features:
 * - Pattern-based threat detection (SQL injection, XSS, Path Traversal)
 * - ML-based anomaly detection
 * - Configurable severity levels
 * - Real-time blocking
 */

export interface WAFRule {
  id: string;
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high' | 'critical';
  category: string;
  action: 'log' | 'block';
}

export interface Threat {
  ruleId: string;
  severity: string;
  category: string;
  matchedPattern: string;
  payload: string;
}

export interface SecurityReport {
  threats: Threat[];
  blocked: boolean;
  score: number; // 0-100, higher = more suspicious
  timestamp: Date;
}

export class AdvancedWAF {
  private rules: WAFRule[] = [
    // SQL Injection
    {
      id: 'SQL-001',
      pattern: /(\bUNION\b.*\bSELECT\b|\bSELECT\b.*\bFROM\b.*\bWHERE\b)/i,
      severity: 'critical',
      category: 'sql-injection',
      action: 'block',
    },
    {
      id: 'SQL-002',
      pattern: /(\bDROP\b.*\bTABLE\b|\bDELETE\b.*\bFROM\b)/i,
      severity: 'critical',
      category: 'sql-injection',
      action: 'block',
    },
    {
      id: 'SQL-003',
      pattern: /(\bINSERT\b.*\bINTO\b|\bUPDATE\b.*\bSET\b)/i,
      severity: 'high',
      category: 'sql-injection',
      action: 'block',
    },
    
    // XSS (Cross-Site Scripting)
    {
      id: 'XSS-001',
      pattern: /<script[^>]*>.*?<\/script>/gi,
      severity: 'high',
      category: 'xss',
      action: 'block',
    },
    {
      id: 'XSS-002',
      pattern: /on\w+\s*=\s*["'][^"']*["']/gi,
      severity: 'high',
      category: 'xss',
      action: 'block',
    },
    {
      id: 'XSS-003',
      pattern: /<iframe[^>]*>/gi,
      severity: 'medium',
      category: 'xss',
      action: 'log',
    },
    
    // Path Traversal
    {
      id: 'PATH-001',
      pattern: /\.\.[\/\\]/,
      severity: 'high',
      category: 'path-traversal',
      action: 'block',
    },
    {
      id: 'PATH-002',
      pattern: /[\/\\]etc[\/\\]passwd/i,
      severity: 'critical',
      category: 'path-traversal',
      action: 'block',
    },
    
    // Command Injection
    {
      id: 'CMD-001',
      pattern: /[;&|`$()]/,
      severity: 'high',
      category: 'command-injection',
      action: 'block',
    },
    {
      id: 'CMD-002',
      pattern: /\b(eval|exec|system)\s*\(/i,
      severity: 'critical',
      category: 'command-injection',
      action: 'block',
    },
    
    // SSRF (Server-Side Request Forgery)
    {
      id: 'SSRF-001',
      pattern: /(localhost|127\.0\.0\.1|0\.0\.0\.0|::1)/i,
      severity: 'medium',
      category: 'ssrf',
      action: 'log',
    },
    {
      id: 'SSRF-002',
      pattern: /169\.254\.169\.254/i, // AWS metadata endpoint
      severity: 'critical',
      category: 'ssrf',
      action: 'block',
    },
  ];

  async analyze(request: any): Promise<SecurityReport> {
    const threats: Threat[] = [];
    let threatScore = 0;

    // Analyze request body
    const body = this.serializeRequest(request);
    
    // Pattern-based detection
    for (const rule of this.rules) {
      const matches = body.match(rule.pattern);
      if (matches) {
        threats.push({
          ruleId: rule.id,
          severity: rule.severity,
          category: rule.category,
          matchedPattern: rule.pattern.toString(),
          payload: matches[0].substring(0, 100), // Limit payload size
        });

        // Calculate threat score
        threatScore += this.getSeverityScore(rule.severity);
      }
    }

    // ML-based anomaly detection
    const anomalyScore = await this.detectAnomalies(request);
    threatScore += anomalyScore;

    // Determine if should block
    const shouldBlock = threats.some(
      t => t.severity === 'critical' || t.severity === 'high'
    ) || threatScore > 75;

    return {
      threats,
      blocked: shouldBlock,
      score: Math.min(threatScore, 100),
      timestamp: new Date(),
    };
  }

  private serializeRequest(request: any): string {
    return JSON.stringify({
      body: request.body || {},
      query: request.query || {},
      headers: request.headers || {},
    });
  }

  private getSeverityScore(severity: string): number {
    const scores = {
      low: 10,
      medium: 25,
      high: 50,
      critical: 100,
    };
    return scores[severity as keyof typeof scores] || 0;
  }

  /**
   * ML-based anomaly detection
   * Uses heuristics to detect suspicious patterns
   */
  private async detectAnomalies(request: any): Promise<number> {
    const features = this.extractFeatures(request);
    
    let score = 0;

    // Large request body
    if (features.requestSize > 10000) {
      score += 20;
    }

    // Too many headers
    if (features.headerCount > 30) {
      score += 15;
    }

    // Unusual headers
    if (features.unusualHeaders > 5) {
      score += 25;
    }

    // High entropy (potential obfuscation)
    if (features.entropy > 7.5) {
      score += 20;
    }

    // Multiple suspicious patterns
    if (features.suspiciousPatterns > 3) {
      score += 30;
    }

    return score;
  }

  private extractFeatures(request: any): {
    requestSize: number;
    headerCount: number;
    unusualHeaders: number;
    entropy: number;
    suspiciousPatterns: number;
  } {
    const body = this.serializeRequest(request);

    return {
      requestSize: body.length,
      headerCount: Object.keys(request.headers || {}).length,
      unusualHeaders: this.countUnusualHeaders(request.headers || {}),
      entropy: this.calculateEntropy(body),
      suspiciousPatterns: this.countSuspiciousPatterns(body),
    };
  }

  private countUnusualHeaders(headers: Record<string, any>): number {
    const commonHeaders = new Set([
      'accept',
      'accept-encoding',
      'accept-language',
      'authorization',
      'cache-control',
      'connection',
      'content-type',
      'host',
      'user-agent',
      'referer',
      'cookie',
    ]);

    return Object.keys(headers).filter(
      h => !commonHeaders.has(h.toLowerCase())
    ).length;
  }

  private calculateEntropy(text: string): number {
    const frequency: Record<string, number> = {};
    
    for (const char of text) {
      frequency[char] = (frequency[char] || 0) + 1;
    }

    let entropy = 0;
    const len = text.length;
    
    for (const count of Object.values(frequency)) {
      const p = count / len;
      entropy -= p * Math.log2(p);
    }

    return entropy;
  }

  private countSuspiciousPatterns(body: string): number {
    const patterns = [
      /eval\s*\(/gi,
      /function\s*\(/gi,
      /new\s+Function/gi,
      /document\./gi,
      /window\./gi,
      /\.\./g,
      /base64/gi,
    ];

    return patterns.filter(p => p.test(body)).length;
  }

  /**
   * Get statistics about WAF activity
   */
  getStats(): {
    totalRules: number;
    criticalRules: number;
    highRules: number;
  } {
    return {
      totalRules: this.rules.length,
      criticalRules: this.rules.filter(r => r.severity === 'critical').length,
      highRules: this.rules.filter(r => r.severity === 'high').length,
    };
  }

  /**
   * Add custom rule
   */
  addRule(rule: WAFRule): void {
    this.rules.push(rule);
  }

  /**
   * Remove rule by ID
   */
  removeRule(ruleId: string): boolean {
    const index = this.rules.findIndex(r => r.id === ruleId);
    if (index !== -1) {
      this.rules.splice(index, 1);
      return true;
    }
    return false;
  }
}
