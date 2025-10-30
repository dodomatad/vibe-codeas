"use client";

import { useMemo } from "react";

interface PreviewProps {
  code: string;
  language: string;
}

export default function Preview({ code, language }: PreviewProps) {
  const htmlContent = useMemo(() => {
    if (language === "html") {
      // Para HTML, renderizar diretamente
      return code;
    } else if (language === "typescript" || language === "javascript") {
      // Para React/JSX, criar um wrapper HTML
      return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      padding: 20px;
      margin: 0;
      background: white;
    }
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="text/babel">
    try {
      ${code}

      // Se tiver um componente default exportado, renderizar
      if (typeof App !== 'undefined') {
        ReactDOM.render(<App />, document.getElementById('root'));
      }
    } catch (error) {
      document.body.innerHTML = '<div style="padding: 20px; color: red;">Erro no código: ' + error.message + '</div>';
    }
  </script>
</body>
</html>
      `;
    }
    return "";
  }, [code, language]);

  return (
    <div className="bg-gray-800/50 rounded-xl border border-gray-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-900 border-b border-gray-700">
        <span className="text-sm font-semibold text-gray-300">
          👁️ Preview Ao Vivo
        </span>
      </div>
      <div className="bg-white">
        <iframe
          srcDoc={htmlContent}
          className="w-full h-[400px] border-0"
          sandbox="allow-scripts"
          title="Code Preview"
        />
      </div>
    </div>
  );
}
