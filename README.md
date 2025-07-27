# Kernal Bot

Bot Discord desenvolvido em TypeScript para administração e moderação de servidores.

## Funcionalidades Principais

### Sistema de Música
- **Comando:** `/music` 
- Reprodução do YouTube
- Sistema de fila
- Controles por botões
- Opções de loop e shuffle

### Sistema de Tickets
- **Comando:** `/ticket`
- Múltiplas categorias
- Canais privados automáticos
- Sistema de transcrições
- Estatísticas

### Moderação
- **Comando:** `/mod`
- Ban/Kick/Mute temporário
- Limpeza de mensagens
- Sistema de avisos
- Logs automáticos

### Sistema de Economia
- **Comando:** `/economy`
- Daily/Weekly rewards
- Sistema de trabalhos únicos
- Loja virtual com itens
- Apostas e jogos
- Ranking de usuários

### 🤖 Inteligência Artificial Integrada
- **Chat IA:** `/ai` - Converse com GPT-4
- **Análise de Imagens:** `/analisar-imagem` 
- **Geração de Texto:** `/gerar-texto`
- **Tradutor:** `/traduzir` - 10+ idiomas

### 🎉 Entretenimento
- **Comando:** `/fun`
- 8Ball mágico, dados, cara/coroa
- Calculadora do amor
- Piadas, memes e fatos
- Imagens de animais

### 🔧 Utilidades
- **Comando:** `/utils`
- Informações de servidor/usuário
- Calculadora e conversores
- QR Code generator
- Wikipedia search
- Base64 encoder/decoder

### ⚙️ Administração
- **Comando:** `/admin`
- Criação de canais/cargos
- Sistema de anúncios
- Backup do servidor
- Estatísticas detalhadas

## 🚀 Como Usar

1. **Configure o `.env`:**
   ```env
   BOT_TOKEN=seu_token_aqui
   OPENAI_API_KEY=sua_chave_openai
   ```

2. **Execute:**
   ```bash
   npm install
   npm run build
   npm start
   ```

3. **Configure no Discord:**
   ```
   /admin setup
   ```

## 📊 Comandos Mais Usados

- 🎵 `/music play <música>` - Tocar música
- 🤖 `/ai <pergunta>` - Chat com IA  
- 💰 `/economy daily` - Recompensa diária
- 🎫 `/ticket create` - Criar ticket
- 🛡️ `/mod clear <quantidade>` - Limpar chat

## ✨ Destaques

- **+50 comandos** únicos
- **100% TypeScript** com tipagem completa
- **Botões interativos** em todas as funcionalidades
- **Sistema modular** facilmente expansível
- **Tratamento de erros** robusto
- **Performance otimizada** para grandes servidores

## 🔧 Tecnologias

- Discord.js v14 + TypeScript
- OpenAI API (GPT-4)
- FFmpeg para áudio
- Axios para requisições

---


*Desenvolvido com ❤️ para a comunidade Discord*
