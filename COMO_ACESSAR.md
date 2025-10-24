# 🚀 Como Acessar o Vibe Code Ultimate

## ✅ Status do Servidor

O servidor está **RODANDO** e funcional!

---

## 🌐 URLs de Acesso

### 1️⃣ **Acesso Local (no servidor)**
```
http://localhost:3000
```

### 2️⃣ **Página de Teste (recomendado para verificar)**
```
http://localhost:3000/test
```

---

## 💻 Se Você Está no Servidor

Se você está conectado diretamente ao servidor via terminal, pode testar com curl:

```bash
# Testar a página principal
curl http://localhost:3000

# Testar a página de teste
curl http://localhost:3000/test
```

---

## 🌍 Se Você Quer Acessar de Outra Máquina

Se o servidor está rodando em uma máquina remota e você quer acessar do seu computador:

### Opção 1: Acesso Direto por IP (se permitido)
```
http://[IP-DO-SERVIDOR]:3000
http://[IP-DO-SERVIDOR]:3000/test
```

### Opção 2: SSH Tunnel (recomendado)
Se você tem acesso SSH ao servidor, pode criar um tunnel:

```bash
# No seu computador local, execute:
ssh -L 3000:localhost:3000 usuario@[IP-DO-SERVIDOR]
```

Depois acesse no seu navegador:
```
http://localhost:3000
```

---

## 🔍 Verificar Status do Servidor

### Ver se está rodando:
```bash
ps aux | grep "next dev"
```

### Ver logs em tempo real:
```bash
tail -f /tmp/vibe-dev.log
```

### Testar se responde:
```bash
curl -I http://localhost:3000/test
```

---

## 🛑 Parar o Servidor

```bash
pkill -f "next dev"
```

---

## ▶️ Iniciar o Servidor Novamente

```bash
cd /home/user/vibe-codeas/vibe-code-v2.0.0
nohup pnpm dev > /tmp/vibe-dev.log 2>&1 &
```

Aguarde ~5 segundos e verifique:
```bash
tail /tmp/vibe-dev.log
```

---

## 🎯 Páginas Disponíveis

| URL | Status | Descrição |
|-----|--------|-----------|
| `/test` | ✅ Funcional | Página de teste simples |
| `/` | ⚠️ Em desenvolvimento | Página principal (pode ter erros) |
| `/builder` | ⚠️ Em desenvolvimento | Builder de código com IA |
| `/generation` | ⚠️ Em desenvolvimento | Geração de código |

---

## 🔧 Problemas Comuns

### "Não consigo acessar de outro computador"
- Verifique firewall do servidor
- Verifique se a porta 3000 está aberta
- Use SSH tunnel como alternativa

### "Servidor não inicia"
```bash
# Verificar se a porta está ocupada
lsof -i :3000

# Se estiver ocupada, matar o processo
pkill -f "next dev"

# Tentar novamente
cd /home/user/vibe-codeas/vibe-code-v2.0.0
pnpm dev
```

### "Página não carrega"
- Aguarde 5-10 segundos após iniciar (compilação inicial)
- Verifique os logs: `tail -f /tmp/vibe-dev.log`
- Tente a página de teste primeiro: `/test`

---

## 📝 Informações Técnicas

- **Framework:** Next.js 15.4.3
- **Runtime:** Node.js 22.20.0
- **Package Manager:** pnpm 10.18.3
- **Port:** 3000
- **Build Tool:** Turbopack
- **Hot Reload:** ✅ Ativo

---

## 🎉 Pronto!

O servidor está rodando e pronto para uso! Acesse `/test` primeiro para confirmar que tudo está funcionando.
