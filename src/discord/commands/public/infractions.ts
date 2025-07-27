import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import * as fs from 'fs';
import * as path from 'path';

// Sistema de infrações
const infractionsDir = path.join(process.cwd(), 'infractions');
if (!fs.existsSync(infractionsDir)) {
    fs.mkdirSync(infractionsDir, { recursive: true });
}

interface Infraction {
    id: string;
    userId: string;
    guildId: string;
    type: 'ban' | 'kick' | 'timeout' | 'warn' | 'mute' | 'unban' | 'note';
    reason: string;
    moderator: string;
    timestamp: number;
    duration?: number; // para timeouts/mutes
    active: boolean;
}

function saveInfraction(infraction: Infraction) {
    const filePath = path.join(infractionsDir, `infractions_${infraction.guildId}.json`);
    let infractions: Infraction[] = [];
    
    if (fs.existsSync(filePath)) {
        infractions = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    }
    
    infractions.push(infraction);
    fs.writeFileSync(filePath, JSON.stringify(infractions, null, 2));
}

function getInfractions(userId: string, guildId: string): Infraction[] {
    const filePath = path.join(infractionsDir, `infractions_${guildId}.json`);
    if (!fs.existsSync(filePath)) return [];
    
    const infractions: Infraction[] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return infractions.filter(inf => inf.userId === userId);
}

function getAllInfractions(guildId: string): Infraction[] {
    const filePath = path.join(infractionsDir, `infractions_${guildId}.json`);
    if (!fs.existsSync(filePath)) return [];
    
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

createCommand({
    name: "infractions",
    description: "🚨 Sistema completo de infrações e punições",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Ação a ser executada",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "👤 Ver Infrações do Usuário", value: "view_user" },
                { name: "📋 Listar Todas Infrações", value: "list_all" },
                { name: "📊 Estatísticas", value: "stats" },
                { name: "🗑️ Limpar Infrações", value: "clear" },
                { name: "📝 Adicionar Nota", value: "add_note" },
                { name: "🔍 Buscar por Tipo", value: "search_type" },
                { name: "📅 Infrações Recentes", value: "recent" },
                { name: "⚠️ Usuários Problemáticos", value: "problematic" }
            ]
        },
        {
            name: "servidor",
            description: "ID do servidor",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "usuario",
            description: "ID do usuário",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "tipo",
            description: "Tipo de infração",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Ban", value: "ban" },
                { name: "Kick", value: "kick" },
                { name: "Timeout", value: "timeout" },
                { name: "Warn", value: "warn" },
                { name: "Mute", value: "mute" },
                { name: "Note", value: "note" }
            ]
        },
        {
            name: "nota",
            description: "Nota ou observação",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        // Verificar se é o owner
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Acesso Negado")
                .setDescription("Este comando é exclusivo para o proprietário do bot.")
                .setColor(0xFF0000)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const acao = interaction.options.getString("acao", true);
        const servidorId = interaction.options.getString("servidor");
        const usuarioId = interaction.options.getString("usuario");
        const nota = interaction.options.getString("nota");

        await interaction.deferReply({ ephemeral: true });

        try {
            // Se não forneceu servidor, usar o primeiro disponível
            const guildId = servidorId || interaction.client.guilds.cache.first()?.id;
            if (!guildId) {
                await interaction.editReply("❌ Servidor não encontrado!");
                return;
            }

            switch (acao) {
                case "view_user": {
                    if (!usuarioId) {
                        await interaction.editReply("❌ ID do usuário é obrigatório!");
                        return;
                    }

                    const infractions = getInfractions(usuarioId, guildId);
                    
                    if (infractions.length === 0) {
                        await interaction.editReply(`✅ Usuário \`${usuarioId}\` não possui infrações registradas.`);
                        return;
                    }

                    const user = await interaction.client.users.fetch(usuarioId).catch(() => null);
                    const userName = user ? user.username : "Usuário Desconhecido";

                    const embed = new EmbedBuilder()
                        .setTitle(`🚨 Infrações de ${userName}`)
                        .setDescription(`**Total:** ${infractions.length} infrações`)
                        .setColor(0xFF4444)
                        .setTimestamp();

                    const recentInfractions = infractions.slice(-10);
                    
                    for (const inf of recentInfractions) {
                        const mod = await interaction.client.users.fetch(inf.moderator).catch(() => null);
                        const modName = mod ? mod.username : "Moderador Desconhecido";
                        
                        const typeEmoji = inf.type === 'ban' ? '🔨' :
                                         inf.type === 'kick' ? '👢' :
                                         inf.type === 'timeout' ? '🔇' :
                                         inf.type === 'warn' ? '⚠️' :
                                         inf.type === 'mute' ? '🤐' :
                                         inf.type === 'note' ? '📝' : '❓';
                        
                        embed.addFields({
                            name: `${typeEmoji} ${inf.type.toUpperCase()} - ${inf.id}`,
                            value: `**Razão:** ${inf.reason}\n**Moderador:** ${modName}\n**Data:** <t:${Math.floor(inf.timestamp / 1000)}:R>`,
                            inline: false
                        });
                    }

                    if (infractions.length > 10) {
                        embed.setFooter({ text: `Mostrando 10 mais recentes de ${infractions.length} total` });
                    }

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "list_all": {
                    const allInfractions = getAllInfractions(guildId);
                    
                    if (allInfractions.length === 0) {
                        await interaction.editReply("✅ Nenhuma infração registrada neste servidor.");
                        return;
                    }

                    const guild = interaction.client.guilds.cache.get(guildId);
                    const guildName = guild ? guild.name : "Servidor Desconhecido";

                    const embed = new EmbedBuilder()
                        .setTitle(`📋 Todas as Infrações - ${guildName}`)
                        .setDescription(`**Total:** ${allInfractions.length} infrações registradas`)
                        .setColor(0xFF8800)
                        .setTimestamp();

                    // Agrupar por tipo
                    const typeCount = allInfractions.reduce((acc, inf) => {
                        acc[inf.type] = (acc[inf.type] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    let statsText = "";
                    for (const [type, count] of Object.entries(typeCount)) {
                        const emoji = type === 'ban' ? '🔨' :
                                     type === 'kick' ? '👢' :
                                     type === 'timeout' ? '🔇' :
                                     type === 'warn' ? '⚠️' :
                                     type === 'mute' ? '🤐' :
                                     type === 'note' ? '📝' : '❓';
                        statsText += `${emoji} **${type.toUpperCase()}:** ${count}\n`;
                    }

                    embed.addFields({ name: "📊 Estatísticas por Tipo", value: statsText });

                    // Mostrar infrações recentes
                    const recent = allInfractions.slice(-5);
                    let recentText = "";
                    
                    for (const inf of recent) {
                        const user = await interaction.client.users.fetch(inf.userId).catch(() => null);
                        const userName = user ? user.username : "Usuário Desconhecido";
                        recentText += `• **${userName}** - ${inf.type.toUpperCase()} - <t:${Math.floor(inf.timestamp / 1000)}:R>\n`;
                    }

                    embed.addFields({ name: "🕒 Infrações Recentes", value: recentText || "Nenhuma" });

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "stats": {
                    const allInfractions = getAllInfractions(guildId);
                    const guild = interaction.client.guilds.cache.get(guildId);
                    const guildName = guild ? guild.name : "Servidor Desconhecido";

                    // Estatísticas por período
                    const now = Date.now();
                    const day = 24 * 60 * 60 * 1000;
                    
                    const last24h = allInfractions.filter(inf => now - inf.timestamp < day).length;
                    const last7d = allInfractions.filter(inf => now - inf.timestamp < 7 * day).length;
                    const last30d = allInfractions.filter(inf => now - inf.timestamp < 30 * day).length;

                    const embed = new EmbedBuilder()
                        .setTitle(`📊 Estatísticas de Infrações - ${guildName}`)
                        .setColor(0x00AA00)
                        .addFields(
                            { name: "📈 Por Período", value: `**24h:** ${last24h}\n**7 dias:** ${last7d}\n**30 dias:** ${last30d}\n**Total:** ${allInfractions.length}`, inline: true },
                            { name: "🎯 Usuário Mais Punido", value: await getMostPunishedUser(allInfractions, interaction), inline: true },
                            { name: "⚡ Tipo Mais Comum", value: getMostCommonType(allInfractions), inline: true }
                        )
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "add_note": {
                    if (!usuarioId || !nota) {
                        await interaction.editReply("❌ ID do usuário e nota são obrigatórios!");
                        return;
                    }

                    const infraction: Infraction = {
                        id: `NOTE_${Date.now()}`,
                        userId: usuarioId,
                        guildId: guildId,
                        type: 'note',
                        reason: nota,
                        moderator: interaction.user.id,
                        timestamp: Date.now(),
                        active: true
                    };

                    saveInfraction(infraction);

                    const user = await interaction.client.users.fetch(usuarioId).catch(() => null);
                    const userName = user ? user.username : "Usuário Desconhecido";

                    await interaction.editReply(`✅ Nota adicionada para **${userName}**:\n📝 ${nota}`);
                    break;
                }

                case "problematic": {
                    const allInfractions = getAllInfractions(guildId);
                    
                    // Contar infrações por usuário
                    const userCounts = allInfractions.reduce((acc, inf) => {
                        acc[inf.userId] = (acc[inf.userId] || 0) + 1;
                        return acc;
                    }, {} as Record<string, number>);

                    // Pegar top 10 usuários com mais infrações
                    const topUsers = Object.entries(userCounts)
                        .sort(([,a], [,b]) => b - a)
                        .slice(0, 10);

                    if (topUsers.length === 0) {
                        await interaction.editReply("✅ Nenhum usuário problemático encontrado.");
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle("⚠️ Usuários Mais Problemáticos")
                        .setColor(0xFF0000)
                        .setTimestamp();

                    let description = "";
                    for (const [userId, count] of topUsers) {
                        const user = await interaction.client.users.fetch(userId).catch(() => null);
                        const userName = user ? user.username : "Usuário Desconhecido";
                        description += `**${userName}** - ${count} infrações\n`;
                    }

                    embed.setDescription(description);
                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                default:
                    await interaction.editReply("❌ Ação não implementada!");
            }

        } catch (error) {
            console.error("Erro no sistema de infrações:", error);
            await interaction.editReply(`❌ Erro: ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        }
    }
});

async function getMostPunishedUser(infractions: Infraction[], interaction: any): Promise<string> {
    const userCounts = infractions.reduce((acc, inf) => {
        acc[inf.userId] = (acc[inf.userId] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topUser = Object.entries(userCounts).sort(([,a], [,b]) => b - a)[0];
    if (!topUser) return "Nenhum";

    const user = await interaction.client.users.fetch(topUser[0]).catch(() => null);
    const userName = user ? user.username : "Usuário Desconhecido";
    return `${userName} (${topUser[1]})`;
}

function getMostCommonType(infractions: Infraction[]): string {
    const typeCounts = infractions.reduce((acc, inf) => {
        acc[inf.type] = (acc[inf.type] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    const topType = Object.entries(typeCounts).sort(([,a], [,b]) => b - a)[0];
    if (!topType) return "Nenhum";

    const emoji = topType[0] === 'ban' ? '🔨' :
                 topType[0] === 'kick' ? '👢' :
                 topType[0] === 'timeout' ? '🔇' :
                 topType[0] === 'warn' ? '⚠️' :
                 topType[0] === 'mute' ? '🤐' :
                 topType[0] === 'note' ? '📝' : '❓';

    return `${emoji} ${topType[0].toUpperCase()} (${topType[1]})`;
}

// Função auxiliar para registrar infrações automaticamente
export function registerInfraction(type: Infraction['type'], userId: string, guildId: string, reason: string, moderator: string, duration?: number) {
    const infraction: Infraction = {
        id: `${type.toUpperCase()}_${Date.now()}`,
        userId,
        guildId,
        type,
        reason,
        moderator,
        timestamp: Date.now(),
        duration,
        active: true
    };

    saveInfraction(infraction);
}
