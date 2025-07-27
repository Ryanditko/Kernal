# 📋 GUIA COMPLETO DO SISTEMA DE LOGS

## 🎯 ONDE SÃO SALVOS OS LOGS

### Localização dos Arquivos:
```
c:\Users\Administrador\Kernal-Bot\logs\
├── monitor_[SERVIDOR_ID].json    # Logs de monitoramento por servidor
└── export_[SERVIDOR_ID]_[TIMESTAMP].txt  # Exportações em texto
```

### Exemplo de Estrutura:
```
logs/
├── monitor_748720691645251716.json  # Logs do seu servidor
├── export_748720691645251716_1753592033016.txt  # Exportação
└── monitor_987654321098765432.json  # Logs de outro servidor
```

## 🔧 COMANDOS PARA GERENCIAR LOGS

### 1. `/logs` - Comando Principal
**Opções disponíveis:**

#### 📋 Listar Todos os Logs
```
/logs acao:Listar Todos
```
- Mostra todos os logs disponíveis
- Exibe data de modificação
- Lista arquivos de exportação

#### 👁️ Ver Log Específico
```
/logs acao:Ver Específico servidor_id:748720691645251716
```
- Mostra resumo das últimas 3 sessões
- Exibe duração e eventos
- Lista participantes

#### 📥 Baixar Arquivo
```
/logs acao:Baixar Arquivo servidor_id:748720691645251716
```
- Gera arquivo TXT formatado
- Baixa automaticamente via Discord
- Remove arquivo temporário após 1 minuto

#### 🔍 Pesquisar nos Logs
```
/logs acao:Pesquisar termo:teste servidor_id:748720691645251716
```
- Busca por palavras-chave
- Pesquisa em mensagens e usernames
- Pode pesquisar em todos os servidores (omitir servidor_id)

#### 📊 Estatísticas
```
/logs acao:Estatísticas dias:7
```
- Análise dos últimos X dias
- Total de eventos registrados
- Servidores monitorados
- Usuários únicos

#### 🧹 Limpar Logs Antigos
```
/logs acao:Limpar Antigos dias:30
```
- Remove logs mais antigos que X dias
- Libera espaço em disco
- Irreversível!

## 📊 ESTRUTURA DOS LOGS JSON

### Formato do Arquivo:
```json
{
  "sessions": [
    {
      "guildId": "748720691645251716",
      "channelId": "1321547786549723177",
      "startTime": 1753591833974,
      "endTime": 1753592033016,
      "participants": ["819954175173328906", "627875320770330624"],
      "transcript": [
        {
          "userId": "819954175173328906",
          "username": "ryanditko",
          "message": "teste",
          "timestamp": 1753591850157,
          "type": "speak"
        }
      ],
      "status": "stopped"
    }
  ]
}
```

### Tipos de Eventos Registrados:
- **speak** - Mensagem enviada
- **join** - Usuário entrou no canal de voz
- **leave** - Usuário saiu do canal de voz
- **mute** - Usuário se mutou
- **unmute** - Usuário desmutou

## 🚀 USANDO O SISTEMA DE MONITORAMENTO

### 1. Iniciar Monitoramento
```
/monitor acao:Iniciar Monitoramento servidor_id:748720691645251716
```

### 2. Verificar Status
```
/monitor acao:Status Ativo
```

### 3. Parar Monitoramento
```
/monitor acao:Parar Monitoramento servidor_id:748720691645251716
```

### 4. Ver Histórico
```
/monitor acao:Histórico servidor_id:748720691645251716
```

## 📁 ACESSANDO LOGS MANUALMENTE

### Via Explorador de Arquivos:
1. Navegue até: `c:\Users\Administrador\Kernal-Bot\logs\`
2. Abra o arquivo `monitor_[SERVIDOR_ID].json`
3. Use um editor de texto ou visualizador JSON

### Via Linha de Comando:
```cmd
cd c:\Users\Administrador\Kernal-Bot\logs
dir *.json  # Listar todos os logs
type monitor_748720691645251716.json  # Ver conteúdo
```

## 🔍 EXEMPLOS PRÁTICOS

### Buscar Todas as Mensagens de um Usuário:
```
/logs acao:Pesquisar termo:ryanditko
```

### Ver Atividade dos Últimos 3 Dias:
```
/logs acao:Estatísticas dias:3
```

### Exportar Log Completo:
```
/logs acao:Baixar Arquivo servidor_id:748720691645251716
```

### Monitorar Canal Específico:
```
/monitor acao:Iniciar Monitoramento servidor_id:748720691645251716 canal_id:1321547786549723177
```

## ⚠️ IMPORTANTES CONSIDERAÇÕES

### Privacidade:
- Logs contêm conversas completas
- Mantenha arquivos seguros
- Use apenas para moderação legítima

### Espaço em Disco:
- Logs crescem rapidamente
- Limpe regularmente com `/logs acao:Limpar Antigos`
- Monitore o tamanho da pasta

### Performance:
- Muitos logs podem afetar performance
- Auto-salva a cada 5 minutos
- Pare monitoramento quando não precisar

### Backup:
- Faça backup dos logs importantes
- Logs são locais (não na nuvem)
- Perda de arquivo = perda de dados

## 🎯 CASOS DE USO COMUNS

### 1. Investigação de Problemas:
```
/logs acao:Pesquisar termo:problema servidor_id:748720691645251716
```

### 2. Análise de Atividade:
```
/logs acao:Estatísticas dias:7
```

### 3. Backup Semanal:
```
/logs acao:Baixar Arquivo servidor_id:748720691645251716
/logs acao:Limpar Antigos dias:30
```

### 4. Monitoramento Ativo:
```
/monitor acao:Iniciar Monitoramento servidor_id:748720691645251716
# ... depois ...
/monitor acao:Status Ativo
```

## 📞 SOLUÇÃO DE PROBLEMAS

### "Nenhum log encontrado":
- Verifique se o monitoramento foi iniciado
- Confirme o ID do servidor
- Verifique se a pasta `logs` existe

### Arquivo muito grande:
- Use `/logs acao:Limpar Antigos`
- Exporte antes de limpar
- Monitore apenas quando necessário

### Performance lenta:
- Pare monitoramentos desnecessários
- Limpe logs antigos
- Reinicie o bot se necessário

---
*Sistema de logs completamente implementado e funcional*
*Use com responsabilidade e respeite a privacidade dos usuários*
