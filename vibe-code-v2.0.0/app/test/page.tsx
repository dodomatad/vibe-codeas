export default function TestPage() {
  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui' }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>
        🚀 Vibe Code Ultimate
      </h1>
      <p style={{ fontSize: '24px', marginBottom: '10px' }}>
        O app está funcionando!
      </p>
      <ul style={{ fontSize: '18px', lineHeight: '1.8' }}>
        <li>✅ Next.js 15 rodando</li>
        <li>✅ React 19 funcionando</li>
        <li>✅ TypeScript compilando</li>
        <li>✅ Servidor de desenvolvimento ativo</li>
      </ul>
      <div style={{ marginTop: '40px', padding: '20px', background: '#f0f0f0', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '20px', marginBottom: '10px' }}>Próximos passos:</h2>
        <ol style={{ lineHeight: '1.8' }}>
          <li>Configurar APIs de IA (Anthropic, OpenAI)</li>
          <li>Configurar banco de dados (PostgreSQL)</li>
          <li>Ativar features avançadas (RAG, AutoFix, Agents)</li>
          <li>Testar componentes e funcionalidades</li>
        </ol>
      </div>
    </div>
  );
}
