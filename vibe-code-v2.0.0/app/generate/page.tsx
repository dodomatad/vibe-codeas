'use client';

/**
 * VIBE CODE - Simple Generation Interface
 *
 * Interface estilo Lovable: prompt → app completo
 * Mostra progresso em tempo real
 */

import { useState, useRef } from 'react';

interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

export default function GeneratePage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState<ProgressEvent[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      setError('Please enter a prompt');
      return;
    }

    setIsGenerating(true);
    setProgress([]);
    setPreviewUrl(null);
    setError(null);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('/api/generate-app-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          framework: 'auto',
          model: 'claude-sonnet-4',
          autoInstallPackages: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Generation failed');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            try {
              const event: ProgressEvent = JSON.parse(data);
              setProgress(prev => [...prev, event]);

              // If completed, extract preview URL
              if (event.step === 'complete' && event.data?.previewUrl) {
                setPreviewUrl(event.data.previewUrl);
              }

              // If error, show it
              if (event.step === 'error') {
                setError(event.message);
              }
            } catch (e) {
              console.error('Failed to parse event:', e);
            }
          }
        }
      }
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        setError('Generation cancelled');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to generate app');
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    abortControllerRef.current?.abort();
    setIsGenerating(false);
  };

  const latestProgress = progress[progress.length - 1];
  const currentProgress = latestProgress?.progress || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Vibe Code
          </h1>
          <p className="text-gray-600 text-lg">
            Generate complete apps with AI • No platform fees • Just pay for AI API
          </p>
        </div>

        {/* Main Input */}
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-3">
            What do you want to build?
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Example: Create a modern todo app with React, Tailwind, and local storage. Include animations and dark mode support."
            disabled={isGenerating}
            className="w-full h-32 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200 transition-all resize-none disabled:bg-gray-50 disabled:cursor-not-allowed"
          />

          {/* Action Buttons */}
          <div className="flex gap-3 mt-4">
            {!isGenerating ? (
              <button
                onClick={handleGenerate}
                disabled={!prompt.trim()}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
              >
                🚀 Generate App
              </button>
            ) : (
              <button
                onClick={handleCancel}
                className="flex-1 bg-red-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-red-600 transition-all shadow-lg"
              >
                ❌ Cancel
              </button>
            )}
          </div>

          {/* Model Info */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            Using Claude Sonnet 4 • Auto-detects framework • Auto-installs packages
          </p>
        </div>

        {/* Progress Display */}
        {progress.length > 0 && (
          <div className="bg-white rounded-2xl shadow-xl p-8 mb-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              Generation Progress
            </h2>

            {/* Progress Bar */}
            <div className="relative w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-6">
              <div
                className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                style={{ width: `${currentProgress}%` }}
              />
            </div>

            {/* Progress Steps */}
            <div className="space-y-3">
              {progress.map((event, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg transition-all ${
                    index === progress.length - 1
                      ? 'bg-indigo-50 border-2 border-indigo-200'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {event.step === 'error' ? (
                      <span className="text-2xl">❌</span>
                    ) : event.step === 'complete' ? (
                      <span className="text-2xl">🎉</span>
                    ) : (
                      <span className="text-2xl">⏳</span>
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-800">
                      {event.message}
                    </p>
                    {event.data && (
                      <p className="text-xs text-gray-500 mt-1">
                        {JSON.stringify(event.data, null, 2)}
                      </p>
                    )}
                  </div>
                  <div className="flex-shrink-0 text-sm font-semibold text-indigo-600">
                    {event.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Preview */}
        {previewUrl && (
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">
                🎉 Your App is Ready!
              </h2>
              <a
                href={previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-all"
              >
                Open in New Tab →
              </a>
            </div>
            <div className="border-4 border-gray-200 rounded-xl overflow-hidden bg-white">
              <iframe
                src={previewUrl}
                className="w-full h-[600px]"
                title="App Preview"
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 text-red-700">
            <p className="font-semibold">❌ Error</p>
            <p className="text-sm">{error}</p>
          </div>
        )}

        {/* Features */}
        {!isGenerating && progress.length === 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-bold text-gray-800 mb-2">Lightning Fast</h3>
              <p className="text-sm text-gray-600">
                Generate complete apps in seconds. No waiting, no limits.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl mb-3">💰</div>
              <h3 className="font-bold text-gray-800 mb-2">Pay Only AI API</h3>
              <p className="text-sm text-gray-600">
                No platform fees. Just pay for the AI you use directly.
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <div className="text-3xl mb-3">🎨</div>
              <h3 className="font-bold text-gray-800 mb-2">Full Control</h3>
              <p className="text-sm text-gray-600">
                Open source, self-hosted. Customize everything.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
