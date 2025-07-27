import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

// Sistema de monitoramento silencioso
const monitoringData = new Map();
// const voiceRecordings = new Map();

// Criar diretório para logs se não existir
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

interface MonitoringSession {
    guildId: string;
    channelId: string;
    startTime: number;
    participants: string[];
    transcript: Array<{
        userId: string;
        username: string;
        message: string;
        timestamp: number;
        type: 'join' | 'leave' | 'speak' | 'mute' | 'unmute';
    }>;
    status: 'active' | 'stopped' | 'paused';
}

createCommand({
    name: "monitor",
    description: "Sistema de monitoramento para moderação",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Ação de monitoramento",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Iniciar Monitoramento", value: "start" },
                { name: "Parar Monitoramento", value: "stop" },
                { name: "Status Ativo", value: "status" },
                { name: "Histórico", value: "history" },
                { name: "Exportar Logs", value: "export" },
                { name: "Limpar Dados", value: "clear" }
            ]
        },
        {
            name: "servidor_id",
            description: "ID do servidor para monitorar",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "canal_id",
            description: "ID do canal de voz para monitorar",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "modo",
            description: "Modo de monitoramento",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Texto", value: "text" },
                { name: "Voz", value: "voice" },
                { name: "Completo", value: "full" }
            ]
        }
    ],
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("Acesso Negado")
                .setDescription("Sistema de monitoramento restrito ao administrador.")
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const acao = interaction.options.getString("acao", true);
        const servidorId = interaction.options.getString("servidor_id");
        const canalId = interaction.options.getString("canal_id");
        const modo = interaction.options.getString("modo") || "full";

        await interaction.deferReply({ ephemeral: true });

        try {
            switch (acao) {
                case "start":
                    await iniciarMonitoramento(interaction, servidorId, canalId, modo);
                    break;
                case "stop":
                    await pararMonitoramento(interaction, servidorId);
                    break;
                case "status":
                    await mostrarStatus(interaction);
                    break;
                case "history":
                    await mostrarHistorico(interaction, servidorId);
                    break;
                case "export":
                    await exportarLogs(interaction, servidorId);
                    break;
                case "clear":
                    await limparDados(interaction, servidorId);
                    break;
                default:
                    await interaction.editReply("Ação não reconhecida.");
            }
        } catch (error) {
            console.error("Erro no sistema de monitoramento:", error);
            await interaction.editReply("Erro interno no sistema de monitoramento.");
        }
    }
});

async function iniciarMonitoramento(interaction: any, servidorId: string | null, canalId: string | null, modo: string) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório para iniciar monitoramento.");
    }

    const guild = interaction.client.guilds.cache.get(servidorId);
    if (!guild) {
        return await interaction.editReply("Servidor não encontrado.");
    }

    // Verificar se já existe monitoramento ativo
    if (monitoringData.has(servidorId)) {
        return await interaction.editReply("Monitoramento já ativo neste servidor.");
    }

    const session: MonitoringSession = {
        guildId: servidorId,
        channelId: canalId || 'all',
        startTime: Date.now(),
        participants: [],
        transcript: [],
        status: 'active'
    };

    monitoringData.set(servidorId, session);

    // Configurar listeners para eventos
    await configurarListeners(interaction.client, session);

    const embed = new EmbedBuilder()
        .setTitle("Monitoramento Iniciado")
        .setDescription(`Monitoramento silencioso ativo no servidor: ${guild.name}`)
        .addFields(
            { name: "Servidor", value: guild.name, inline: true },
            { name: "Modo", value: modo.toUpperCase(), inline: true },
            { name: "Canal", value: canalId || "Todos", inline: true },
            { name: "Início", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: false }
        )
        .setColor(0x00FF00)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function pararMonitoramento(interaction: any, servidorId: string | null) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório.");
    }

    const session = monitoringData.get(servidorId);
    if (!session) {
        return await interaction.editReply("Nenhum monitoramento ativo neste servidor.");
    }

    session.status = 'stopped';
    
    // Salvar dados antes de remover
    await salvarDados(session);
    monitoringData.delete(servidorId);

    const embed = new EmbedBuilder()
        .setTitle("Monitoramento Encerrado")
        .setDescription("Dados salvos com segurança.")
        .addFields(
            { name: "Duração", value: `${Math.floor((Date.now() - session.startTime) / 60000)} minutos`, inline: true },
            { name: "Eventos Registrados", value: session.transcript.length.toString(), inline: true }
        )
        .setColor(0xFF0000)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function mostrarStatus(interaction: any) {
    const sessionsAtivas = Array.from(monitoringData.values());
    
    if (sessionsAtivas.length === 0) {
        return await interaction.editReply("Nenhum monitoramento ativo no momento.");
    }

    const embed = new EmbedBuilder()
        .setTitle("Status do Monitoramento")
        .setDescription(`${sessionsAtivas.length} sessão(ões) ativa(s)`)
        .setColor(0x0099FF)
        .setTimestamp();

    for (const session of sessionsAtivas) {
        const guild = interaction.client.guilds.cache.get(session.guildId);
        const duracao = Math.floor((Date.now() - session.startTime) / 60000);
        
        embed.addFields({
            name: guild?.name || "Servidor Desconhecido",
            value: `Duração: ${duracao}min\nEventos: ${session.transcript.length}\nStatus: ${session.status.toUpperCase()}`,
            inline: true
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function mostrarHistorico(interaction: any, servidorId: string | null) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório.");
    }

    const logFile = path.join(logsDir, `monitor_${servidorId}.json`);
    
    if (!fs.existsSync(logFile)) {
        return await interaction.editReply("Nenhum histórico encontrado para este servidor.");
    }

    try {
        const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const ultimasSessoes = data.sessions.slice(-5); // Últimas 5 sessões

        const embed = new EmbedBuilder()
            .setTitle("Histórico de Monitoramento")
            .setDescription(`Últimas ${ultimasSessoes.length} sessões`)
            .setColor(0x9B59B6)
            .setTimestamp();

        for (const session of ultimasSessoes) {
            const duracao = Math.floor((session.endTime - session.startTime) / 60000);
            embed.addFields({
                name: `Sessão ${new Date(session.startTime).toLocaleDateString()}`,
                value: `Duração: ${duracao}min\nEventos: ${session.transcript.length}`,
                inline: true
            });
        }

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply("Erro ao ler histórico.");
    }
}

async function exportarLogs(interaction: any, servidorId: string | null) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório.");
    }

    const logFile = path.join(logsDir, `monitor_${servidorId}.json`);
    
    if (!fs.existsSync(logFile)) {
        return await interaction.editReply("Nenhum log encontrado para este servidor.");
    }

    try {
        const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const exportFile = path.join(logsDir, `export_${servidorId}_${Date.now()}.txt`);
        
        let exportContent = `RELATÓRIO DE MONITORAMENTO\n`;
        exportContent += `Servidor ID: ${servidorId}\n`;
        exportContent += `Gerado em: ${new Date().toLocaleString()}\n\n`;

        for (const session of data.sessions) {
            exportContent += `SESSÃO: ${new Date(session.startTime).toLocaleString()}\n`;
            exportContent += `Duração: ${Math.floor((session.endTime - session.startTime) / 60000)} minutos\n\n`;
            
            for (const event of session.transcript) {
                exportContent += `[${new Date(event.timestamp).toLocaleTimeString()}] ${event.username} (${event.type}): ${event.message}\n`;
            }
            exportContent += "\n" + "=".repeat(50) + "\n\n";
        }

        fs.writeFileSync(exportFile, exportContent);
        
        await interaction.editReply(`Logs exportados para: ${path.basename(exportFile)}`);
    } catch (error) {
        await interaction.editReply("Erro ao exportar logs.");
    }
}

async function limparDados(interaction: any, servidorId: string | null) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório.");
    }

    const logFile = path.join(logsDir, `monitor_${servidorId}.json`);
    
    if (fs.existsSync(logFile)) {
        fs.unlinkSync(logFile);
    }

    monitoringData.delete(servidorId);

    await interaction.editReply("Dados de monitoramento limpos.");
}

async function configurarListeners(client: any, session: MonitoringSession) {
    // Listener para mensagens
    client.on('messageCreate', (message: any) => {
        if (message.guild?.id === session.guildId && !message.author.bot) {
            session.transcript.push({
                userId: message.author.id,
                username: message.author.username,
                message: message.content,
                timestamp: Date.now(),
                type: 'speak'
            });
        }
    });

    // Listener para voz
    client.on('voiceStateUpdate', (oldState: any, newState: any) => {
        if (newState.guild?.id === session.guildId) {
            if (!oldState.channel && newState.channel) {
                // Usuário entrou no canal
                session.transcript.push({
                    userId: newState.member.id,
                    username: newState.member.user.username,
                    message: `Entrou no canal: ${newState.channel.name}`,
                    timestamp: Date.now(),
                    type: 'join'
                });
                
                if (!session.participants.includes(newState.member.id)) {
                    session.participants.push(newState.member.id);
                }
            }
            
            if (oldState.channel && !newState.channel) {
                // Usuário saiu do canal
                session.transcript.push({
                    userId: oldState.member.id,
                    username: oldState.member.user.username,
                    message: `Saiu do canal: ${oldState.channel.name}`,
                    timestamp: Date.now(),
                    type: 'leave'
                });
            }
        }
    });
}

async function salvarDados(session: MonitoringSession) {
    const logFile = path.join(logsDir, `monitor_${session.guildId}.json`);
    
    let data: { sessions: any[] } = { sessions: [] };
    if (fs.existsSync(logFile)) {
        try {
            data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        } catch (error) {
            data = { sessions: [] };
        }
    }

    data.sessions.push({
        ...session,
        endTime: Date.now()
    });

    fs.writeFileSync(logFile, JSON.stringify(data, null, 2));
}

// Função para auto-salvar dados a cada 5 minutos
setInterval(() => {
    for (const session of monitoringData.values()) {
        if (session.status === 'active') {
            salvarDados(session);
        }
    }
}, 5 * 60 * 1000); // 5 minutos

export { monitoringData, salvarDados };
