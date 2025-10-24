/**
 * CostIndicator - Real-time Cost Tracking Component
 * 
 * Features:
 * ✅ Real-time WebSocket updates
 * ✅ Cost breakdown by model/task
 * ✅ Comparison with competitors
 * ✅ Export functionality (CSV/JSON)
 * ✅ WCAG 2.1 AA compliant
 * ✅ Keyboard accessible
 * ✅ Screen reader optimized
 * 
 * @module CostIndicator
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { formatCost, type SessionCosts, type BudgetAlert } from '@/lib/pricing/real-time/cost-tracker-complete';

// ===== TYPES =====

interface CostIndicatorProps {
  /** User ID for personalized tracking */
  userId: string;
  /** Session ID for current session */
  sessionId: string;
  /** WebSocket URL for real-time updates */
  wsUrl?: string;
  /** Show detailed breakdown */
  showBreakdown?: boolean;
  /** Show competitor comparison */
  showComparison?: boolean;
  /** Compact mode */
  compact?: boolean;
  /** Callback when export is triggered */
  onExport?: (format: 'csv' | 'json') => void;
  /** Custom className */
  className?: string;
}

// ===== COMPONENT =====

export function CostIndicator({
  userId,
  sessionId,
  wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000/ws',
  showBreakdown = true,
  showComparison = true,
  compact = false,
  onExport,
  className = '',
}: CostIndicatorProps) {
  // State
  const [costs, setCosts] = useState<SessionCosts>({
    currentRequest: 0,
    sessionTotal: 0,
    monthlyTotal: 0,
    estimatedNextRequest: 0,
    breakdown: [],
    freeCreditsRemaining: 100,
    savingsVsCompetitors: {
      lovable: 0,
      replit: 0,
      cursor: 0,
    },
  });
  const [alert, setAlert] = useState<BudgetAlert | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Refs
  const wsRef = useRef<WebSocket | null>(null);
  const liveRegionRef = useRef<HTMLDivElement>(null);

  // WebSocket connection
  useEffect(() => {
    const ws = new WebSocket(`${wsUrl}?userId=${userId}`);
    wsRef.current = ws;

    ws.onopen = () => {
      setIsConnected(true);
      console.log('[CostIndicator] WebSocket connected');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'COST_UPDATE') {
          setCosts(data.payload);
          
          // Update live region for screen readers
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = 
              `Current request cost: ${formatCost(data.payload.currentRequest)}. Session total: ${formatCost(data.payload.sessionTotal)}.`;
          }
        } else if (data.type === 'BUDGET_ALERT') {
          setAlert(data.payload);
          
          // Announce alert to screen readers
          if (liveRegionRef.current) {
            liveRegionRef.current.textContent = data.payload.message;
          }
        }
      } catch (error) {
        console.error('[CostIndicator] Failed to parse WebSocket message:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('[CostIndicator] WebSocket error:', error);
      setIsConnected(false);
    };

    ws.onclose = () => {
      setIsConnected(false);
      console.log('[CostIndicator] WebSocket disconnected');
    };

    return () => {
      ws.close();
    };
  }, [userId, wsUrl]);

  // Export handler
  const handleExport = async (format: 'csv' | 'json') => {
    setIsExporting(true);
    
    try {
      if (onExport) {
        await onExport(format);
      } else {
        // Default export implementation
        const response = await fetch(`/api/cost/export?format=${format}&userId=${userId}&sessionId=${sessionId}`);
        const data = await response.json();
        
        // Download file
        const blob = new Blob([format === 'json' ? JSON.stringify(data, null, 2) : data], {
          type: format === 'json' ? 'application/json' : 'text/csv',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cost-export-${sessionId}.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('[CostIndicator] Export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  // Dismiss alert
  const dismissAlert = () => {
    setAlert(null);
  };

  // Compact mode
  if (compact) {
    return (
      <div 
        className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800 text-sm ${className}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <span className="sr-only">Current cost:</span>
        <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
          {formatCost(costs.currentRequest)}
        </span>
        <span className="text-gray-500 dark:text-gray-400">|</span>
        <span className="text-gray-600 dark:text-gray-300">
          Session: {formatCost(costs.sessionTotal)}
        </span>
        {!isConnected && (
          <span 
            className="w-2 h-2 rounded-full bg-red-500" 
            aria-label="Disconnected"
            title="WebSocket disconnected"
          />
        )}
      </div>
    );
  }

  // Full mode
  return (
    <div 
      className={`rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-sm ${className}`}
      role="region"
      aria-label="Cost tracking"
    >
      {/* Live region for screen readers */}
      <div 
        ref={liveRegionRef}
        className="sr-only" 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
      />

      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Cost Tracker
          </h2>
          <div 
            className={`flex items-center gap-2 px-2 py-1 rounded-full text-xs font-medium ${
              isConnected 
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
            }`}
            role="status"
            aria-label={isConnected ? 'Connected' : 'Disconnected'}
          >
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} aria-hidden="true" />
            {isConnected ? 'Live' : 'Offline'}
          </div>
        </div>

        {/* Export buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => handleExport('json')}
            disabled={isExporting}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Export as JSON"
          >
            JSON
          </button>
          <button
            onClick={() => handleExport('csv')}
            disabled={isExporting}
            className="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            aria-label="Export as CSV"
          >
            CSV
          </button>
        </div>
      </div>

      {/* Budget alert */}
      {alert && (
        <div 
          className={`p-4 border-b ${
            alert.type === 'danger' 
              ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' 
              : 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800'
          }`}
          role="alert"
          aria-live="assertive"
        >
          <div className="flex items-start justify-between">
            <div className="flex gap-3">
              <span className="text-2xl" role="img" aria-label={alert.type === 'danger' ? 'Danger' : 'Warning'}>
                {alert.type === 'danger' ? '🚨' : '⚠️'}
              </span>
              <div>
                <p className={`font-medium ${
                  alert.type === 'danger' 
                    ? 'text-red-900 dark:text-red-200' 
                    : 'text-yellow-900 dark:text-yellow-200'
                }`}>
                  {alert.message}
                </p>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Current: {formatCost(alert.current)} ({alert.percentage.toFixed(1)}% of budget)
                </p>
              </div>
            </div>
            <button
              onClick={dismissAlert}
              className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded"
              aria-label="Dismiss alert"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Main costs */}
      <div className="p-4 space-y-4">
        {/* Current request */}
        <div>
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Current Request
          </div>
          <div className="mt-1 text-3xl font-bold font-mono text-gray-900 dark:text-gray-100">
            {formatCost(costs.currentRequest)}
          </div>
        </div>

        {/* Session & Monthly */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Session Total
            </div>
            <div className="mt-1 text-xl font-semibold font-mono text-gray-900 dark:text-gray-100">
              {formatCost(costs.sessionTotal)}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
              Monthly Total
            </div>
            <div className="mt-1 text-xl font-semibold font-mono text-gray-900 dark:text-gray-100">
              {formatCost(costs.monthlyTotal)}
            </div>
          </div>
        </div>

        {/* Estimated next request */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-500 dark:text-gray-400">
            Estimated Next Request
          </div>
          <div className="mt-1 text-lg font-medium font-mono text-gray-700 dark:text-gray-300">
            ~{formatCost(costs.estimatedNextRequest)}
          </div>
        </div>
      </div>

      {/* Breakdown */}
      {showBreakdown && costs.breakdown.length > 0 && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-2">
            Recent Requests
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {costs.breakdown.slice(-5).reverse().map((item, index) => (
              <div 
                key={index} 
                className="flex items-center justify-between text-sm p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    item.wasError 
                      ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' 
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                  }`}>
                    {item.model}
                  </span>
                  {item.wasError && (
                    <span className="text-xs text-red-600 dark:text-red-400" title="No charge for AI errors">
                      (Error - $0)
                    </span>
                  )}
                </div>
                <span className="font-mono font-medium text-gray-900 dark:text-gray-100">
                  {formatCost(item.totalCost)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Competitor comparison */}
      {showComparison && (
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
          <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-3">
            Savings vs Competitors
          </h3>
          <div className="space-y-2">
            {Object.entries(costs.savingsVsCompetitors).map(([competitor, savings]) => (
              <div key={competitor} className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400 capitalize">
                  {competitor}
                </span>
                <span className="font-mono font-medium text-green-600 dark:text-green-400">
                  +{formatCost(savings)} saved
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ===== VARIANTS =====

/**
 * Compact variant for toolbar/header
 */
export function CostIndicatorCompact(props: Omit<CostIndicatorProps, 'compact'>) {
  return <CostIndicator {...props} compact />;
}

/**
 * Minimal variant with only current cost
 */
export function CostIndicatorMinimal({ 
  userId, 
  sessionId, 
  className = '' 
}: Pick<CostIndicatorProps, 'userId' | 'sessionId' | 'className'>) {
  return (
    <CostIndicator
      userId={userId}
      sessionId={sessionId}
      compact
      showBreakdown={false}
      showComparison={false}
      className={className}
    />
  );
}
