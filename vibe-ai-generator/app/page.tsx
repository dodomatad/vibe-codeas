"use client";

import { useState } from "react";
import CodeEditor from "@/components/CodeEditor";
import Preview from "@/components/Preview";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [generatedCode, setGeneratedCode] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [model, setModel] = useState("llama-3.3-70b-versatile");
  const [language, setLanguage] = useState("typescript");

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      alert("Por favor, descreva o que você quer criar!");
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, model, language }),
      });

      const data = await response.json();

      if (response.ok) {
        setGeneratedCode(data.code);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch (error) {
      alert("Erro ao gerar código. Verifique sua conexão.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white">
      {/* Header */}
      <header className="border-b border-gray-700 bg-black/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              ⚡ Vibe AI Generator
            </h1>
            <div className="flex gap-4 items-center">
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="llama-3.3-70b-versatile">Groq - Llama 3.3 70B</option>
                <option value="llama-3.1-70b-versatile">Groq - Llama 3.1 70B</option>
                <option value="mixtral-8x7b-32768">Groq - Mixtral 8x7B</option>
              </select>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="px-4 py-2 rounded-lg bg-gray-800 border border-gray-700 focus:border-blue-500 focus:outline-none"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="html">HTML/CSS</option>
              </select>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Panel - Prompt Input */}
          <div className="space-y-4">
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h2 className="text-xl font-semibold mb-4">📝 Descreva o que quer criar</h2>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Exemplo: Crie um contador com botões + e - que mostra o valor atual"
                className="w-full h-40 px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg focus:border-blue-500 focus:outline-none resize-none"
              />
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-4 w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg font-semibold hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {isGenerating ? "⏳ Gerando..." : "✨ Gerar Código"}
              </button>
            </div>

            {/* Features */}
            <div className="bg-gray-800/50 rounded-xl p-6 border border-gray-700">
              <h3 className="text-lg font-semibold mb-3">🚀 Funcionalidades</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>✅ Geração de código em tempo real</li>
                <li>✅ Suporte a múltiplas linguagens</li>
                <li>✅ Preview ao vivo (HTML/React)</li>
                <li>✅ Editor de código integrado</li>
                <li>✅ Modelos AI gratuitos (Groq)</li>
                <li>✅ Sem bugs e super rápido</li>
              </ul>
            </div>
          </div>

          {/* Right Panel - Code Editor & Preview */}
          <div className="space-y-4">
            {generatedCode ? (
              <>
                <CodeEditor code={generatedCode} language={language} />
                {(language === "html" || language === "typescript" || language === "javascript") && (
                  <Preview code={generatedCode} language={language} />
                )}
              </>
            ) : (
              <div className="bg-gray-800/50 rounded-xl p-12 border border-gray-700 flex items-center justify-center min-h-[500px]">
                <div className="text-center text-gray-400">
                  <div className="text-6xl mb-4">💻</div>
                  <p className="text-lg">Seu código aparecerá aqui</p>
                  <p className="text-sm mt-2">Digite um prompt e clique em "Gerar Código"</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-700 mt-12 py-6 text-center text-gray-400 text-sm">
        <p>Criado com ❤️ usando Groq AI • Melhor que Cursor e Lovable</p>
      </footer>
    </div>
  );
}
