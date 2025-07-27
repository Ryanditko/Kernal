import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, AttachmentBuilder } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

const logsDir = path.join(process.cwd(), 'logs');

createCommand({
    name: "logs",
    description: "Gerenciar e visualizar logs de monitoramento",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Ação para os logs",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Listar Todos", value: "list" },
                { name: "Ver Específico", value: "view" },
                { name: "Baixar Arquivo", value: "download" },
                { name: "Pesquisar", value: "search" },
                { name: "Estatísticas", value: "stats" },
                { name: "Limpar Antigos", value: "cleanup" }
            ]
        },
        {
            name: "servidor_id",
            description: "ID do servidor para filtrar logs",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "termo",
            description: "Termo para pesquisar nos logs",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "dias",
            description: "Últimos X dias para análise",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 365
        }
    ],
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("Acesso Negado")
                .setDescription("Sistema de logs restrito ao administrador.")
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const acao = interaction.options.getString("acao", true);
        const servidorId = interaction.options.getString("servidor_id");
        const termo = interaction.options.getString("termo");
        const dias = interaction.options.getInteger("dias") || 7;

        await interaction.deferReply({ ephemeral: true });

        try {
            switch (acao) {
                case "list":
                    await listarLogs(interaction);
                    break;
                case "view":
                    await visualizarLog(interaction, servidorId);
                    break;
                case "download":
                    await baixarLog(interaction, servidorId);
                    break;
                case "search":
                    await pesquisarLogs(interaction, termo, servidorId);
                    break;
                case "stats":
                    await estatisticasLogs(interaction, dias);
                    break;
                case "cleanup":
                    await limparLogs(interaction, dias);
                    break;
                default:
                    await interaction.editReply("Ação não reconhecida.");
            }
        } catch (error) {
            console.error("Erro no sistema de logs:", error);
            await interaction.editReply("Erro interno no sistema de logs.");
        }
    }
});

async function listarLogs(interaction: any) {
    if (!fs.existsSync(logsDir)) {
        return await interaction.editReply("Nenhum log encontrado. Pasta de logs não existe.");
    }

    const files = fs.readdirSync(logsDir);
    const logFiles = files.filter(file => file.endsWith('.json'));
    const exportFiles = files.filter(file => file.endsWith('.txt'));

    const embed = new EmbedBuilder()
        .setTitle("📁 Logs Disponíveis")
        .setColor(0x0099FF)
        .setTimestamp();

    let description = `**Total:** ${logFiles.length} logs ativos, ${exportFiles.length} exportações\n\n`;

    if (logFiles.length > 0) {
        description += "**📋 Logs de Monitoramento:**\n";
        for (const file of logFiles.slice(0, 10)) { // Mostrar apenas os primeiros 10
            const filePath = path.join(logsDir, file);
            const stats = fs.statSync(filePath);
            const serverId = file.replace('monitor_', '').replace('.json', '');
            description += `• ${serverId}\n  └ Modificado: <t:${Math.floor(stats.mtime.getTime() / 1000)}:R>\n`;
        }
    }

    if (exportFiles.length > 0) {
        description += "\n**📤 Exportações:**\n";
        for (const file of exportFiles.slice(0, 5)) { // Mostrar apenas as primeiras 5
            const stats = fs.statSync(path.join(logsDir, file));
            description += `• ${file}\n  └ Criado: <t:${Math.floor(stats.birthtime.getTime() / 1000)}:R>\n`;
        }
    }

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function visualizarLog(interaction: any, servidorId: string | null) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório para visualizar logs específicos.");
    }

    const logFile = path.join(logsDir, `monitor_${servidorId}.json`);
    
    if (!fs.existsSync(logFile)) {
        return await interaction.editReply(`Nenhum log encontrado para o servidor: ${servidorId}`);
    }

    try {
        const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const sessions = data.sessions || [];
        const ultimasSessoes = sessions.slice(-3); // Últimas 3 sessões

        const embed = new EmbedBuilder()
            .setTitle(`📊 Logs do Servidor: ${servidorId}`)
            .setColor(0x9B59B6)
            .setTimestamp();

        let description = `**Total de sessões:** ${sessions.length}\n\n`;

        for (const [index, session] of ultimasSessoes.entries()) {
            const inicio = new Date(session.startTime).toLocaleString();
            const fim = session.endTime ? new Date(session.endTime).toLocaleString() : "Em andamento";
            const duracao = session.endTime ? 
                Math.floor((session.endTime - session.startTime) / 60000) : 
                Math.floor((Date.now() - session.startTime) / 60000);

            description += `**Sessão ${sessions.length - ultimasSessoes.length + index + 1}:**\n`;
            description += `• Início: ${inicio}\n`;
            description += `• Fim: ${fim}\n`;
            description += `• Duração: ${duracao} minutos\n`;
            description += `• Eventos: ${session.transcript.length}\n`;
            description += `• Participantes: ${session.participants.length}\n\n`;
        }

        embed.setDescription(description);
        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply("Erro ao ler arquivo de log.");
    }
}

async function baixarLog(interaction: any, servidorId: string | null) {
    if (!servidorId) {
        return await interaction.editReply("ID do servidor é obrigatório para baixar logs.");
    }

    const logFile = path.join(logsDir, `monitor_${servidorId}.json`);
    
    if (!fs.existsSync(logFile)) {
        return await interaction.editReply(`Nenhum log encontrado para o servidor: ${servidorId}`);
    }

    try {
        const data = JSON.parse(fs.readFileSync(logFile, 'utf8'));
        const timestamp = Date.now();
        const exportFileName = `log_${servidorId}_${timestamp}.txt`;
        const exportPath = path.join(logsDir, exportFileName);
        
        let content = `RELATÓRIO DE MONITORAMENTO\n`;
        content += `=========================\n`;
        content += `Servidor ID: ${servidorId}\n`;
        content += `Gerado em: ${new Date().toLocaleString()}\n`;
        content += `Total de sessões: ${data.sessions.length}\n\n`;

        for (const [sessionIndex, session] of data.sessions.entries()) {
            content += `SESSÃO ${sessionIndex + 1}\n`;
            content += `----------\n`;
            content += `Início: ${new Date(session.startTime).toLocaleString()}\n`;
            content += `Fim: ${session.endTime ? new Date(session.endTime).toLocaleString() : 'Em andamento'}\n`;
            content += `Canal: ${session.channelId}\n`;
            content += `Participantes: ${session.participants.length}\n\n`;
            
            content += `EVENTOS:\n`;
            for (const event of session.transcript) {
                const timestamp = new Date(event.timestamp).toLocaleTimeString();
                content += `[${timestamp}] ${event.username} (${event.type}): ${event.message}\n`;
            }
            content += "\n" + "=".repeat(50) + "\n\n";
        }

        fs.writeFileSync(exportPath, content);

        const attachment = new AttachmentBuilder(exportPath, { name: exportFileName });
        
        await interaction.editReply({ 
            content: `📁 Log exportado com sucesso!`,
            files: [attachment]
        });

        // Remover arquivo temporário após 1 minuto
        setTimeout(() => {
            try {
                if (fs.existsSync(exportPath)) {
                    fs.unlinkSync(exportPath);
                }
            } catch (error) {
                console.error("Erro ao remover arquivo temporário:", error);
            }
        }, 60000);

    } catch (error) {
        await interaction.editReply("Erro ao gerar arquivo de exportação.");
    }
}

async function pesquisarLogs(interaction: any, termo: string | null, servidorId: string | null) {
    if (!termo) {
        return await interaction.editReply("Termo de pesquisa é obrigatório.");
    }

    const files = fs.readdirSync(logsDir).filter(file => file.endsWith('.json'));
    let resultados: any[] = [];

    for (const file of files) {
        const currentServerId = file.replace('monitor_', '').replace('.json', '');
        
        // Se um servidor específico foi fornecido, pular outros
        if (servidorId && currentServerId !== servidorId) continue;

        try {
            const data = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
            
            for (const session of data.sessions) {
                for (const event of session.transcript) {
                    if (event.message.toLowerCase().includes(termo.toLowerCase()) ||
                        event.username.toLowerCase().includes(termo.toLowerCase())) {
                        resultados.push({
                            servidor: currentServerId,
                            evento: event,
                            sessao: session.startTime
                        });
                    }
                }
            }
        } catch (error) {
            continue;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`🔍 Resultados da Pesquisa: "${termo}"`)
        .setColor(0xFFD700)
        .setTimestamp();

    if (resultados.length === 0) {
        embed.setDescription("Nenhum resultado encontrado.");
    } else {
        let description = `**${resultados.length} resultado(s) encontrado(s):**\n\n`;
        
        for (const resultado of resultados.slice(0, 10)) { // Mostrar apenas os primeiros 10
            const timestamp = new Date(resultado.evento.timestamp).toLocaleString();
            description += `**${resultado.evento.username}** (${resultado.servidor})\n`;
            description += `└ ${timestamp}: ${resultado.evento.message.substring(0, 100)}\n\n`;
        }

        if (resultados.length > 10) {
            description += `\n...e mais ${resultados.length - 10} resultado(s).`;
        }

        embed.setDescription(description);
    }

    await interaction.editReply({ embeds: [embed] });
}

async function estatisticasLogs(interaction: any, dias: number) {
    const files = fs.readdirSync(logsDir).filter(file => file.endsWith('.json'));
    const cutoffTime = Date.now() - (dias * 24 * 60 * 60 * 1000);
    
    let totalSessoes = 0;
    let totalEventos = 0;
    let servidoresAtivos = 0;
    let usuariosUnicos = new Set();

    for (const file of files) {
        try {
            const data = JSON.parse(fs.readFileSync(path.join(logsDir, file), 'utf8'));
            
            const sessoesRecentes = data.sessions.filter((s: any) => s.startTime > cutoffTime);
            if (sessoesRecentes.length > 0) {
                servidoresAtivos++;
                totalSessoes += sessoesRecentes.length;
                
                for (const session of sessoesRecentes) {
                    totalEventos += session.transcript.length;
                    session.participants.forEach((p: string) => usuariosUnicos.add(p));
                }
            }
        } catch (error) {
            continue;
        }
    }

    const embed = new EmbedBuilder()
        .setTitle(`📈 Estatísticas dos Últimos ${dias} Dias`)
        .setColor(0x00FF7F)
        .addFields(
            { name: "Servidores Monitorados", value: servidoresAtivos.toString(), inline: true },
            { name: "Sessões Totais", value: totalSessoes.toString(), inline: true },
            { name: "Eventos Registrados", value: totalEventos.toString(), inline: true },
            { name: "Usuários Únicos", value: usuariosUnicos.size.toString(), inline: true },
            { name: "Média de Eventos/Sessão", value: totalSessoes > 0 ? Math.round(totalEventos / totalSessoes).toString() : "0", inline: true },
            { name: "Total de Arquivos", value: files.length.toString(), inline: true }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function limparLogs(interaction: any, dias: number) {
    const files = fs.readdirSync(logsDir);
    const cutoffTime = Date.now() - (dias * 24 * 60 * 60 * 1000);
    let removidos = 0;

    for (const file of files) {
        const filePath = path.join(logsDir, file);
        const stats = fs.statSync(filePath);
        
        if (stats.mtime.getTime() < cutoffTime) {
            try {
                fs.unlinkSync(filePath);
                removidos++;
            } catch (error) {
                console.error(`Erro ao remover ${file}:`, error);
            }
        }
    }

    const embed = new EmbedBuilder()
        .setTitle("🧹 Limpeza de Logs")
        .setDescription(`${removidos} arquivo(s) antigo(s) removido(s).`)
        .setColor(removidos > 0 ? 0x00FF00 : 0xFFFF00)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}
