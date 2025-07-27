# 🚀 GUIA COMPLETO DE DEPLOY NA DISCLOUD - KERNAL BOT

## 📋 PRÉ-REQUISITOS

Antes de fazer o deploy, certifique-se de que você tem:

✅ **Conta na Discloud** - Registre-se em https://discloud.app
✅ **Token do Discord Bot** - Salvo no arquivo `.env`
✅ **API Key da OpenAI** - Para funcionalidades de IA
✅ **Projeto compilado** - Execute `npm run build` antes do deploy

---

## 🔧 CONFIGURAÇÃO DO DISCLOUD.CONFIG

O arquivo `discloud.config` já está configurado otimizado para o Kernal Bot:

```ini
NAME=Kernal Bot
TYPE=bot
MAIN=build/index.js
RAM=512
VERSION=latest
AUTORESTART=true
START=npm run start
AVATAR=https://i.imgur.com/vCmpTqL.png
```

### 📊 **Configurações Explicadas:**

- **NAME**: Nome do bot na plataforma
- **TYPE**: Tipo de aplicação (bot)
- **MAIN**: Arquivo principal compilado
- **RAM**: 512MB (recomendado para as funcionalidades avançadas)
- **VERSION**: Versão do Node.js (latest = mais recente)
- **AUTORESTART**: Reinício automático em caso de crash
- **START**: Comando para iniciar o bot
- **AVATAR**: Imagem do bot na plataforma

---

## 📁 PREPARAÇÃO DOS ARQUIVOS

### 1️⃣ **Arquivos Necessários para Upload:**

```
📦 Arquivos para ZIP:
├── 📁 build/ (pasta compilada)
├── 📁 node_modules/ (dependências)
├── 📄 package.json
├── 📄 package-lock.json
├── 📄 discloud.config
├── 📄 .env (com suas variáveis)
└── 📁 logs/ (pasta de logs - opcional)
```

### 2️⃣ **Compilar o Projeto:**

```bash
# Execute no terminal:
npm run build
```

### 3️⃣ **Verificar Variáveis de Ambiente (.env):**

Certifique-se que seu arquivo `.env` contém:

```env
DISCORD_TOKEN=seu_token_aqui
OPENAI_API_KEY=sua_chave_openai_aqui
OWNER_ID=819954175173328906
```

---

## 📦 PROCESSO DE DEPLOY

### **Método 1: Upload via Site (Recomendado)**

1. **Acesse**: https://discloud.app
2. **Faça Login** na sua conta
3. **Vá para**: Dashboard → Upload App
4. **Crie um ZIP** com os arquivos necessários:
   - Selecione todos os arquivos EXCETO `src/` e `tsconfig.json`
   - Inclua obrigatoriamente: `build/`, `node_modules/`, `package.json`, `discloud.config`, `.env`
5. **Upload do ZIP** na plataforma
6. **Aguarde** o processamento

### **Método 2: CLI da Discloud**

```bash
# Instalar CLI da Discloud
npm install -g discloud

# Login
discloud login

# Deploy
discloud upload
```

---

## ⚙️ CONFIGURAÇÕES AVANÇADAS

### 🔧 **Otimizações de Performance:**

**RAM Recomendada**: 512MB ou superior
- O Kernal Bot tem muitas funcionalidades (IA, música, monitoramento)
- 512MB garante performance estável
- Para servidores grandes, considere 1GB

**AutoRestart**: Ativado
- Reinicia automaticamente em caso de erro
- Mantém o bot sempre online
- Essencial para monitoramento 24/7

### 📊 **Monitoramento:**

Após o deploy, você pode:
- Ver logs em tempo real no dashboard
- Monitorar uso de RAM e CPU
- Reiniciar o bot remotamente
- Atualizar arquivos sem recriar

---

## 🔐 VARIÁVEIS DE AMBIENTE SEGURAS

### **No arquivo .env (local):**
```env
DISCORD_TOKEN=seu_token_do_discord
OPENAI_API_KEY=sua_chave_da_openai
OWNER_ID=819954175173328906
```

### **Na Discloud (opcional):**
Você pode definir variáveis diretamente na plataforma:
1. Dashboard → Sua App → Environment Variables
2. Adicione as variáveis uma por uma
3. Reinicie a aplicação

---

## 🎯 CHECKLIST DE DEPLOY

### ✅ **Pré-Deploy:**
- [ ] Projeto compilado (`npm run build`)
- [ ] Arquivo `.env` configurado
- [ ] `discloud.config` otimizado
- [ ] Dependências instaladas (`node_modules/`)
- [ ] Bot testado localmente

### ✅ **Durante o Deploy:**
- [ ] ZIP criado com arquivos corretos
- [ ] Upload realizado com sucesso
- [ ] Logs verificados no dashboard
- [ ] Bot aparece como "Online"

### ✅ **Pós-Deploy:**
- [ ] Comandos funcionando
- [ ] Acesso via DM operacional
- [ ] Monitoramento ativo
- [ ] Logs sendo gerados

---

## 🚨 TROUBLESHOOTING

### **Bot não inicia:**
```bash
# Verifique se o arquivo principal existe
MAIN=build/index.js

# Verifique se o comando start está correto
START=npm run start
```

### **Erro de RAM:**
```bash
# Aumente a RAM no discloud.config
RAM=512
# ou
RAM=1024
```

### **Erro de Dependências:**
```bash
# Certifique-se que node_modules está no ZIP
# Ou use package-lock.json para instalação automática
```

### **Token Inválido:**
```bash
# Verifique o arquivo .env
# Regenere o token no Discord Developer Portal se necessário
```

---

## 📱 COMANDOS PÓS-DEPLOY

### **Teste Inicial:**
```bash
# No Discord (DM com o bot):
/ping
/status
/admin-central
```

### **Verificar Logs:**
```bash
# No dashboard da Discloud:
Dashboard → Sua App → Logs
```

### **Restart Remoto:**
```bash
# No dashboard da Discloud:
Dashboard → Sua App → Actions → Restart
```

---

## 🎊 RESULTADO FINAL

Após o deploy bem-sucedido, seu **Kernal Bot** estará:

✅ **Online 24/7** na Discloud
✅ **Todos os 35 comandos** funcionando
✅ **Administração via DM** operacional
✅ **Monitoramento ativo** em todos os servidores
✅ **IA e música** funcionando perfeitamente
✅ **Sistema de infrações** registrando tudo
✅ **Segurança ultra-restrita** mantida

---

## 💡 DICAS IMPORTANTES

### 🔒 **Segurança:**
- Nunca compartilhe seu arquivo `.env`
- Mantenha o token do Discord secreto
- Use variáveis de ambiente da Discloud para dados sensíveis

### ⚡ **Performance:**
- Monitor o uso de RAM regularmente
- Mantenha logs organizados
- Faça backups das configurações

### 🔄 **Atualizações:**
- Para atualizar: recompile e faça novo upload
- Mantenha backup das configurações importantes
- Teste mudanças localmente antes do deploy

---

**🚀 Agora seu Kernal Bot estará hospedado profissionalmente na Discloud, operando 24/7 com máxima segurança e performance!**
