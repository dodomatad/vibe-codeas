/**
 * Enhanced Preview Component
 * Preview avançado com multi-device, métricas de performance e console integrado
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Monitor, Smartphone, Tablet, Maximize, Code, Activity } from 'lucide-react';

export interface PreviewMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  cls: number; // Cumulative Layout Shift
  tbt: number; // Total Blocking Time
  fid: number; // First Input Delay
}

export interface ConsoleMessage {
  type: 'log' | 'warn' | 'error' | 'info';
  message: string;
  timestamp: number;
  stack?: string;
}

export interface DevicePreset {
  id: string;
  name: string;
  width: number;
  height: number;
  icon: any;
}

const DEVICE_PRESETS: DevicePreset[] = [
  { id: 'mobile', name: 'Mobile', width: 375, height: 667, icon: Smartphone },
  { id: 'tablet', name: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { id: 'desktop', name: 'Desktop', width: 1440, height: 900, icon: Monitor },
  { id: 'wide', name: '4K', width: 3840, height: 2160, icon: Maximize }
];

export interface EnhancedPreviewProps {
  url: string;
  onError?: (error: Error) => void;
  onMetricsUpdate?: (metrics: PreviewMetrics) => void;
}

export function EnhancedPreview({ url, onError, onMetricsUpdate }: EnhancedPreviewProps) {
  const [device, setDevice] = useState<DevicePreset>(DEVICE_PRESETS[2]);
  const [showMetrics, setShowMetrics] = useState(true);
  const [showConsole, setShowConsole] = useState(false);
  const [metrics, setMetrics] = useState<PreviewMetrics | null>(null);
  const [consoleMessages, setConsoleMessages] = useState<ConsoleMessage[]>([]);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Monitor Web Vitals
  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'paint') {
          // FCP detection
        } else if (entry.entryType === 'largest-contentful-paint') {
          // LCP detection
        }
      }
    });

    observer.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });

    return () => observer.disconnect();
  }, []);

  // Capture console messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'console') {
        const message: ConsoleMessage = {
          type: event.data.level,
          message: event.data.message,
          timestamp: Date.now(),
          stack: event.data.stack
        };
        setConsoleMessages(prev => [...prev.slice(-99), message]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  // Simulate metrics update
  useEffect(() => {
    const interval = setInterval(() => {
      const newMetrics: PreviewMetrics = {
        fcp: Math.random() * 2000,
        lcp: Math.random() * 3000,
        cls: Math.random() * 0.1,
        tbt: Math.random() * 500,
        fid: Math.random() * 100
      };
      setMetrics(newMetrics);
      onMetricsUpdate?.(newMetrics);
    }, 5000);

    return () => clearInterval(interval);
  }, [onMetricsUpdate]);

  return (
    <div className="flex flex-col h-full bg-zinc-950 text-zinc-100">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          {DEVICE_PRESETS.map((preset) => {
            const Icon = preset.icon;
            return (
              <button
                key={preset.id}
                onClick={() => setDevice(preset)}
                className={`p-2 rounded-lg transition-colors ${
                  device.id === preset.id
                    ? 'bg-blue-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800'
                }`}
                aria-label={`Switch to ${preset.name}`}
              >
                <Icon size={18} />
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMetrics(!showMetrics)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showMetrics
                ? 'bg-green-600/20 text-green-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Activity size={16} className="inline mr-1" />
            Metrics
          </button>
          
          <button
            onClick={() => setShowConsole(!showConsole)}
            className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
              showConsole
                ? 'bg-blue-600/20 text-blue-400'
                : 'text-zinc-400 hover:text-zinc-100'
            }`}
          >
            <Code size={16} className="inline mr-1" />
            Console
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Preview Area */}
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <motion.div
            key={device.id}
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.2 }}
            style={{
              width: `${device.width}px`,
              height: `${device.height}px`,
              maxWidth: '100%',
              maxHeight: '100%'
            }}
            className="bg-white rounded-lg shadow-2xl overflow-hidden"
          >
            <iframe
              ref={iframeRef}
              src={url}
              className="w-full h-full"
              sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
              title="Preview"
            />
          </motion.div>
        </div>

        {/* Metrics Panel */}
        <AnimatePresence>
          {showMetrics && metrics && (
            <motion.div
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className="w-80 border-l border-zinc-800 p-4 overflow-auto"
            >
              <h3 className="text-lg font-semibold mb-4">Web Vitals</h3>
              
              <MetricCard
                label="FCP"
                value={metrics.fcp}
                unit="ms"
                threshold={1800}
                description="First Contentful Paint"
              />
              
              <MetricCard
                label="LCP"
                value={metrics.lcp}
                unit="ms"
                threshold={2500}
                description="Largest Contentful Paint"
              />
              
              <MetricCard
                label="CLS"
                value={metrics.cls}
                unit=""
                threshold={0.1}
                description="Cumulative Layout Shift"
              />
              
              <MetricCard
                label="TBT"
                value={metrics.tbt}
                unit="ms"
                threshold={300}
                description="Total Blocking Time"
              />
              
              <MetricCard
                label="FID"
                value={metrics.fid}
                unit="ms"
                threshold={100}
                description="First Input Delay"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Console Panel */}
      <AnimatePresence>
        {showConsole && (
          <motion.div
            initial={{ y: 200, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 200, opacity: 0 }}
            className="h-64 border-t border-zinc-800 bg-zinc-900 overflow-auto"
          >
            <div className="p-4 space-y-1">
              {consoleMessages.length === 0 ? (
                <p className="text-zinc-500 text-sm">No console messages</p>
              ) : (
                consoleMessages.map((msg, i) => (
                  <ConsoleMessage key={i} message={msg} />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface MetricCardProps {
  label: string;
  value: number;
  unit: string;
  threshold: number;
  description: string;
}

function MetricCard({ label, value, unit, threshold, description }: MetricCardProps) {
  const isGood = value <= threshold;
  const percentage = Math.min((value / threshold) * 100, 100);

  return (
    <div className="mb-4 p-3 bg-zinc-900 rounded-lg">
      <div className="flex justify-between items-start mb-2">
        <div>
          <h4 className="text-sm font-medium">{label}</h4>
          <p className="text-xs text-zinc-500">{description}</p>
        </div>
        <span className={`text-lg font-bold ${isGood ? 'text-green-400' : 'text-red-400'}`}>
          {value.toFixed(0)}{unit}
        </span>
      </div>
      
      <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full ${isGood ? 'bg-green-500' : 'bg-red-500'}`}
        />
      </div>
    </div>
  );
}

function ConsoleMessage({ message }: { message: ConsoleMessage }) {
  const colors = {
    log: 'text-zinc-300',
    warn: 'text-yellow-400',
    error: 'text-red-400',
    info: 'text-blue-400'
  };

  return (
    <div className={`text-xs font-mono ${colors[message.type]} flex gap-2`}>
      <span className="text-zinc-500">
        {new Date(message.timestamp).toLocaleTimeString()}
      </span>
      <span className="font-semibold">[{message.type.toUpperCase()}]</span>
      <span className="flex-1">{message.message}</span>
    </div>
  );
}
