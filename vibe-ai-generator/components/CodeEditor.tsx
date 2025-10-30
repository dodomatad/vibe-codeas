"use client";

import { Editor } from "@monaco-editor/react";
import { useState } from "react";

interface CodeEditorProps {
  code: string;
  language: string;
}

export default function CodeEditor({ code, language }: CodeEditorProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMonacoLanguage = (lang: string) => {
    const langMap: Record<string, string> = {
      typescript: "typescript",
      javascript: "javascript",
      python: "python",
      html: "html",
    };
    return langMap[lang] || "typescript";
  };

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-300">
          📄 Código Gerado
        </span>
        <button
          onClick={handleCopy}
          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded transition-colors"
        >
          {copied ? "✅ Copiado!" : "📋 Copiar"}
        </button>
      </div>
      <div className="h-[400px]">
        <Editor
          height="100%"
          language={getMonacoLanguage(language)}
          value={code}
          theme="vs-dark"
          options={{
            readOnly: false,
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: "on",
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 2,
          }}
        />
      </div>
    </div>
  );
}
