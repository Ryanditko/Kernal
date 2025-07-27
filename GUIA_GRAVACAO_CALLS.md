# 🎙️ GUIA COMPLETO DE GRAVAÇÃO DE CALLS

## 📍 ONDE FICAM AS GRAVAÇÕES DE ÁUDIO

### Localização Principal:
```
c:\Users\Administrador\Kernal-Bot\recordings\
```

### Estrutura dos Arquivos de Áudio:
```
recordings/
├── call_748720691645251716_1753592033016.pcm      # Gravação principal
├── call_748720691645251716_1753592033016.json     # Metadados da gravação
├── call_748720691645251716_1753592033016_819954175173328906.pcm  # Áudio do usuário 1
├── call_748720691645251716_1753592033016_627875320770330624.pcm  # Áudio do usuário 2
└── ...
```

## 🎧 DIFERENÇA ENTRE OS SISTEMAS

### Sistema Atual (Monitor):
- ✅ **Localização:** `c:\Users\Administrador\Kernal-Bot\logs\`
- ✅ **Conteúdo:** Mensagens de texto, eventos de voz (entrada/saída)
- ✅ **Formato:** JSON com texto
- ✅ **Comando:** `/monitor` e `/logs`

### Novo Sistema (Gravação de Áudio):
- 🎙️ **Localização:** `c:\Users\Administrador\Kernal-Bot\recordings\`
- 🎙️ **Conteúdo:** Áudio real das conversas de voz
- 🎙️ **Formato:** PCM (áudio bruto) + JSON (metadados)
- 🎙️ **Comando:** `/record-call`

## 🔧 COMANDOS DE GRAVAÇÃO DE ÁUDIO

### 1. Iniciar Gravação
```
/record-call acao:Iniciar Gravação canal_voz:#nome-do-canal
```
- Conecta ao canal de voz especificado
- Inicia gravação de todos os participantes
- Grava cada usuário em arquivo separado

### 2. Parar Gravação
```
/record-call acao:Parar Gravação
```
- Encerra a gravação ativa
- Salva arquivos de áudio
- Desconecta do canal de voz

### 3. Ver Status
```
/record-call acao:Status
```
- Mostra gravações ativas
- Exibe duração e participantes
- Status de cada gravação

### 4. Listar Gravações
```
/record-call acao:Listar Gravações
```
- Lista todos os arquivos de áudio
- Mostra tamanho dos arquivos
- Exibe metadados disponíveis

### 5. Baixar Gravação
```
/record-call acao:Baixar Gravação arquivo:call_748720691645251716_1753592033016
```
- Informações sobre localização do arquivo
- Verificação de tamanho
- Instruções para acesso

### 6. Deletar Gravação
```
/record-call acao:Deletar Gravação arquivo:call_748720691645251716_1753592033016
```
- Remove arquivo principal
- Remove arquivos individuais dos usuários
- Remove metadados

## 📂 ACESSANDO ARQUIVOS DE ÁUDIO

### Localização Física:
```
c:\Users\Administrador\Kernal-Bot\recordings\
```

### Tipos de Arquivo:

#### 1. Arquivo Principal (.pcm):
- **Nome:** `call_[SERVIDOR_ID]_[TIMESTAMP].pcm`
- **Conteúdo:** Áudio mixado de todos os participantes
- **Formato:** PCM (áudio bruto)

#### 2. Arquivos Individuais (.pcm):
- **Nome:** `call_[SERVIDOR_ID]_[TIMESTAMP]_[USER_ID].pcm`
- **Conteúdo:** Áudio apenas de um usuário específico
- **Formato:** PCM (áudio bruto)

#### 3. Metadados (.json):
- **Nome:** `call_[SERVIDOR_ID]_[TIMESTAMP].json`
- **Conteúdo:** Informações da gravação
- **Formato:** JSON com dados da sessão

### Exemplo de Metadados:
```json
{
  "guildId": "748720691645251716",
  "channelId": "1321547786549723177",
  "startTime": 1753592033016,
  "endTime": 1753592333016,
  "participants": [
    "819954175173328906",
    "627875320770330624"
  ],
  "status": "stopped",
  "filePath": "c:\\...\\call_748720691645251716_1753592033016.pcm"
}
```

## 🎵 CONVERTENDO ARQUIVOS PCM

### Para Ouvir os Arquivos:
Os arquivos .pcm são áudio bruto. Para converter para formatos usuais:

#### Usando FFmpeg:
```cmd
# Converter PCM para WAV
ffmpeg -f s16le -ar 48000 -ac 2 -i arquivo.pcm arquivo.wav

# Converter PCM para MP3
ffmpeg -f s16le -ar 48000 -ac 2 -i arquivo.pcm arquivo.mp3
```

#### Usando Audacity:
1. Abrir Audacity
2. File → Import → Raw Data
3. Selecionar arquivo .pcm
4. Configurar: Signed 16-bit PCM, 48000 Hz, Stereo
5. Exportar no formato desejado

## ⚠️ IMPORTANTES CONSIDERAÇÕES

### Legalidade:
- ⚠️ **Aviso Legal:** Gravação de conversas pode ser ilegal sem consentimento
- ⚠️ **Use apenas para moderação legítima**
- ⚠️ **Informe participantes quando apropriado**
- ⚠️ **Respeite leis locais de privacidade**

### Armazenamento:
- 📁 Arquivos de áudio ocupam muito espaço
- 📁 1 minuto ≈ 5-10MB por usuário
- 📁 Faça limpeza regular
- 📁 Considere backup em storage externo

### Performance:
- 🔧 Gravação consome recursos do servidor
- 🔧 Pode afetar qualidade de voz do bot
- 🔧 Limite gravações simultâneas
- 🔧 Monitore uso de RAM/CPU

### Segurança:
- 🔒 Arquivos ficam no seu computador local
- 🔒 Acesso restrito ao seu ID apenas
- 🔒 Criptografe arquivos sensíveis
- 🔒 Delete gravações desnecessárias

## 🎯 CASOS DE USO

### 1. Evidência de Comportamento:
```
/record-call acao:Iniciar Gravação canal_voz:#problema-channel
# ... aguardar incident ...
/record-call acao:Parar Gravação
/record-call acao:Baixar Gravação arquivo:call_xxx
```

### 2. Backup de Reuniões:
```
/record-call acao:Iniciar Gravação canal_voz:#meeting-room arquivo:reuniao_2025_01_27
# ... reunião acontece ...
/record-call acao:Parar Gravação
```

### 3. Monitoramento Contínuo:
```
/record-call acao:Iniciar Gravação canal_voz:#general
# Sistema grava automaticamente
# Verificar periodicamente:
/record-call acao:Status
```

## 🔧 SOLUÇÃO DE PROBLEMAS

### "Erro ao conectar ao canal de voz":
- Verificar permissões do bot no canal
- Bot precisa de permissão "Connect" e "Speak"
- Canal não pode estar lotado

### "Arquivo muito grande":
- Arquivos >8MB não podem ser enviados via Discord
- Acesse diretamente via explorer
- Use ferramentas de compressão

### "Gravação não funciona":
- Verificar se @discordjs/voice está instalado
- Conferir se FFmpeg está no PATH
- Reiniciar bot após instalação

### Performance ruim:
- Parar gravações desnecessárias
- Limpar arquivos antigos
- Verificar espaço em disco

## 📊 COMPARAÇÃO DOS SISTEMAS

| Recurso | Monitor (/logs) | Gravação (/record-call) |
|---------|----------------|------------------------|
| **Conteúdo** | Texto e eventos | Áudio real |
| **Tamanho** | Pequeno (KB) | Grande (MB/GB) |
| **Localização** | `/logs/` | `/recordings/` |
| **Formato** | JSON | PCM + JSON |
| **Performance** | Baixo impacto | Alto impacto |
| **Legalidade** | Menos sensível | Muito sensível |

---
**🎯 Agora você tem um sistema completo de gravação de calls para moderação avançada!**

**Arquivos de áudio ficam em:** `c:\Users\Administrador\Kernal-Bot\recordings\`
**Use com responsabilidade e respeite a privacidade!**
