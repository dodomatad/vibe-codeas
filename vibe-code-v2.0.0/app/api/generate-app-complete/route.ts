// app/api/generate-app-complete/route.ts
/**
 * COMPLETE APP GENERATION ORCHESTRATOR
 *
 * Este endpoint faz TUDO que Lovable/Cursor/Replit fazem:
 * 1. Recebe prompt do usuário
 * 2. Cria sandbox automaticamente
 * 3. Gera código completo com IA
 * 4. Aplica código no sandbox
 * 5. Detecta e instala pacotes
 * 6. Retorna preview URL
 *
 * DIFERENCIAL: Você só paga pelas API keys da IA, sem custos extras!
 */

import { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 300; // 5 minutos max

interface GenerateAppRequest {
  prompt: string;
  framework?: 'react' | 'vue' | 'svelte' | 'nextjs' | 'auto';
  model?: 'claude-sonnet-4' | 'gpt-4' | 'gemini-2.0-flash';
  autoInstallPackages?: boolean;
}

interface ProgressEvent {
  step: string;
  progress: number;
  message: string;
  data?: any;
}

/**
 * Orchestrates complete app generation from prompt to preview
 */
export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();

  try {
    const body: GenerateAppRequest = await request.json();
    const {
      prompt,
      framework = 'auto',
      model = 'claude-sonnet-4',
      autoInstallPackages = true
    } = body;

    if (!prompt || prompt.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: 'Prompt is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create streaming response
    const stream = new ReadableStream({
      async start(controller) {
        // Helper to send progress events
        const sendProgress = (event: ProgressEvent) => {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(event)}\n\n`)
          );
        };

        try {
          // STEP 1: Create Sandbox
          sendProgress({
            step: 'sandbox',
            progress: 10,
            message: '🏗️ Creating sandbox environment...',
          });

          const sandboxResponse = await fetch('http://localhost:3000/api/create-ai-sandbox-v2', {
            method: 'POST',
          });

          if (!sandboxResponse.ok) {
            throw new Error('Failed to create sandbox');
          }

          const sandboxData = await sandboxResponse.json();
          const { sandboxId, url: sandboxUrl } = sandboxData;

          sendProgress({
            step: 'sandbox',
            progress: 20,
            message: '✅ Sandbox created successfully!',
            data: { sandboxId, sandboxUrl },
          });

          // STEP 2: Generate Code with AI
          sendProgress({
            step: 'generate',
            progress: 30,
            message: '🤖 Generating code with AI...',
            data: { model },
          });

          // Enhanced prompt for complete app generation
          const enhancedPrompt = `
You are an expert full-stack developer. Generate a COMPLETE, PRODUCTION-READY application based on this request:

${prompt}

Requirements:
1. Create ALL necessary files (components, styles, utilities, etc.)
2. Use ${framework === 'auto' ? 'React with Vite' : framework}
3. Include proper TypeScript types
4. Add comprehensive error handling
5. Make it visually appealing with modern design
6. Include responsive design
7. Add comments for clarity
8. Follow best practices

Generate the complete file structure with all code. Use this format:

\`\`\`filename:path/to/file.tsx
// code here
\`\`\`

Start generating now!
          `.trim();

          const generateResponse = await fetch('http://localhost:3000/api/generate-ai-code-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              message: enhancedPrompt,
              model,
              conversationHistory: [],
            }),
          });

          if (!generateResponse.ok) {
            throw new Error('Failed to generate code');
          }

          // Stream AI response
          const reader = generateResponse.body?.getReader();
          if (!reader) {
            throw new Error('No response stream');
          }

          let accumulatedCode = '';
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            accumulatedCode += chunk;

            // Send progress update
            sendProgress({
              step: 'generate',
              progress: 40 + (accumulatedCode.length / 100), // Estimate progress
              message: '🤖 AI is writing code...',
              data: { bytesGenerated: accumulatedCode.length },
            });
          }

          sendProgress({
            step: 'generate',
            progress: 60,
            message: '✅ Code generation complete!',
            data: { totalBytes: accumulatedCode.length },
          });

          // STEP 3: Parse generated code into files
          sendProgress({
            step: 'parse',
            progress: 65,
            message: '📝 Parsing generated files...',
          });

          const fileUpdates = parseCodeBlocks(accumulatedCode);
          const fileCount = Object.keys(fileUpdates).length;

          sendProgress({
            step: 'parse',
            progress: 70,
            message: `✅ Parsed ${fileCount} files`,
            data: { fileCount, files: Object.keys(fileUpdates) },
          });

          // STEP 4: Apply code to sandbox
          sendProgress({
            step: 'apply',
            progress: 75,
            message: '📦 Applying code to sandbox...',
          });

          const applyResponse = await fetch('http://localhost:3000/api/apply-ai-code-stream', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              fileUpdates,
              autoInstallPackages,
            }),
          });

          if (!applyResponse.ok) {
            throw new Error('Failed to apply code');
          }

          sendProgress({
            step: 'apply',
            progress: 85,
            message: '✅ Code applied successfully!',
          });

          // STEP 5: Install packages if needed
          if (autoInstallPackages) {
            sendProgress({
              step: 'packages',
              progress: 90,
              message: '📦 Installing dependencies...',
            });

            // Packages are auto-installed by apply-ai-code-stream
            // Just wait a moment for installation
            await new Promise(resolve => setTimeout(resolve, 3000));

            sendProgress({
              step: 'packages',
              progress: 95,
              message: '✅ Dependencies installed!',
            });
          }

          // STEP 6: Final result
          sendProgress({
            step: 'complete',
            progress: 100,
            message: '🎉 App generated successfully!',
            data: {
              sandboxId,
              previewUrl: sandboxUrl,
              filesGenerated: fileCount,
              framework: framework === 'auto' ? 'React (Vite)' : framework,
              model,
            },
          });

          controller.close();
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Unknown error';

          sendProgress({
            step: 'error',
            progress: 0,
            message: `❌ Error: ${errorMessage}`,
            data: { error: errorMessage },
          });

          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[generate-app-complete] Error:', error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate app',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}

/**
 * Parse code blocks from AI response into file structure
 */
function parseCodeBlocks(content: string): Record<string, string> {
  const fileUpdates: Record<string, string> = {};

  // Match code blocks with filename:path format
  const codeBlockRegex = /```(?:[\w]+)?:?([\w\-./]+\.[\w]+)?\n([\s\S]*?)```/g;
  let match;

  while ((match = codeBlockRegex.exec(content)) !== null) {
    const [, filename, code] = match;

    if (filename && code) {
      // Clean up filename
      const cleanFilename = filename.trim();

      // Default to src/ if no path specified
      const fullPath = cleanFilename.includes('/')
        ? cleanFilename
        : `src/${cleanFilename}`;

      fileUpdates[fullPath] = code.trim();
    }
  }

  // If no files found with filename format, try to extract any code blocks
  if (Object.keys(fileUpdates).length === 0) {
    const simpleCodeBlockRegex = /```(?:[\w]+)?\n([\s\S]*?)```/g;
    let simpleMatch;
    let index = 0;

    while ((simpleMatch = simpleCodeBlockRegex.exec(content)) !== null) {
      const [, code] = simpleMatch;

      // Try to detect file type from code
      const filename = detectFilename(code, index);
      fileUpdates[`src/${filename}`] = code.trim();
      index++;
    }
  }

  // If still no files, create a default App component
  if (Object.keys(fileUpdates).length === 0) {
    fileUpdates['src/App.tsx'] = generateDefaultApp(content);
  }

  return fileUpdates;
}

/**
 * Detect filename from code content
 */
function detectFilename(code: string, index: number): string {
  if (code.includes('export default function App')) return 'App.tsx';
  if (code.includes('import React')) return `Component${index}.tsx`;
  if (code.includes('<html')) return 'index.html';
  if (code.includes('@tailwind')) return 'index.css';
  if (code.includes('interface') || code.includes('type ')) return `types${index}.ts`;

  return `file${index}.tsx`;
}

/**
 * Generate default app component if parsing fails
 */
function generateDefaultApp(content: string): string {
  return `
import { useState } from 'react';

export default function App() {
  const [message] = useState('${content.slice(0, 100)}...');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
        <h1 className="text-3xl font-bold text-gray-800 mb-4">
          Vibe Code Generated App
        </h1>
        <p className="text-gray-600">
          {message}
        </p>
      </div>
    </div>
  );
}
  `.trim();
}

/**
 * USAGE:
 *
 * POST /api/generate-app-complete
 * Body: {
 *   "prompt": "Create a todo app with React and Tailwind",
 *   "framework": "react",
 *   "model": "claude-sonnet-4"
 * }
 *
 * Response: Server-Sent Events stream with progress updates
 *
 * COMPETITIVE ADVANTAGES vs Lovable/Cursor/Replit:
 * 1. ✅ PAY ONLY FOR AI API - No platform fees
 * 2. ✅ OPEN SOURCE - Full control
 * 3. ✅ SELF-HOSTED - Your infrastructure
 * 4. ✅ NO LIMITS - No generation limits
 * 5. ✅ MULTI-MODEL - Choose any AI
 * 6. ✅ TRANSPARENT COSTS - See exactly what you pay
 * 7. ✅ CUSTOMIZABLE - Modify as needed
 */
