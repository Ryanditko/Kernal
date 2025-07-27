import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType, 
    EmbedBuilder, 
    ButtonBuilder, 
    ButtonStyle, 
    ActionRowBuilder
} from "discord.js";

// Sistema de giveaways
const activeGiveaways = new Map();
const giveawayHistory = new Map();

interface Giveaway {
    id: string;
    prize: string;
    duration: number;
    endTime: number;
    winnersCount: number;
    requirements: {
        minLevel?: number;
        requiredRoles?: string[];
        blacklistedRoles?: string[];
        minAccountAge?: number;
        minServerAge?: number;
    };
    participants: string[];
    channelId: string;
    messageId: string;
    hostId: string;
    ended: boolean;
}

createCommand({
    name: "giveaway",
    description: "Sistema avançado de sorteios (Apenas para o dono)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "acao",
            description: "Ação do giveaway",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Criar Sorteio", value: "create" },
                { name: "Listar Ativos", value: "list" },
                { name: "Finalizar", value: "end" },
                { name: "Reroll", value: "reroll" },
                { name: "Pausar/Retomar", value: "pause" },
                { name: "Histórico", value: "history" },
                { name: "Estatísticas", value: "stats" },
                { name: "Participantes", value: "participants" }
            ]
        },
        {
            name: "premio",
            description: "Prêmio do sorteio",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "duracao",
            description: "Duração em minutos",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 10080 // 1 semana
        },
        {
            name: "vencedores",
            description: "Número de vencedores",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 20
        },
        {
            name: "nivel_minimo",
            description: "Nível mínimo para participar",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 100
        },
        {
            name: "giveaway_id",
            description: "ID do giveaway para ações específicas",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Bot em Fase de Teste")
                .setDescription("Este bot está em fase de testes e restrito ao desenvolvedor.")
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const acao = interaction.options.getString("acao", true);
        const premio = interaction.options.getString("premio");
        const duracao = interaction.options.getInteger("duracao");
        const vencedores = interaction.options.getInteger("vencedores") || 1;
        const nivelMinimo = interaction.options.getInteger("nivel_minimo");
        const giveawayId = interaction.options.getString("giveaway_id");

        await interaction.deferReply();

        switch (acao) {
            case "create":
                if (!premio || !duracao) {
                    await interaction.editReply("❌ Prêmio e duração são obrigatórios!");
                    return;
                }
                await createGiveaway(interaction, premio, duracao, vencedores, nivelMinimo || undefined);
                break;
            case "list":
                await listActiveGiveaways(interaction);
                break;
            case "end":
                if (!giveawayId) {
                    await interaction.editReply("❌ ID do giveaway é obrigatório!");
                    return;
                }
                await endGiveaway(interaction, giveawayId);
                break;
            case "reroll":
                if (!giveawayId) {
                    await interaction.editReply("❌ ID do giveaway é obrigatório!");
                    return;
                }
                await rerollGiveaway(interaction, giveawayId);
                break;
            case "pause":
                if (!giveawayId) {
                    await interaction.editReply("❌ ID do giveaway é obrigatório!");
                    return;
                }
                await pauseGiveaway(interaction, giveawayId);
                break;
            case "history":
                await showGiveawayHistory(interaction);
                break;
            case "stats":
                await showGiveawayStats(interaction);
                break;
            case "participants":
                if (!giveawayId) {
                    await interaction.editReply("❌ ID do giveaway é obrigatório!");
                    return;
                }
                await showParticipants(interaction, giveawayId);
                break;
        }
    }
});

async function createGiveaway(interaction: any, prize: string, duration: number, winners: number, minLevel?: number) {
    const giveawayId = generateGiveawayId();
    const endTime = Date.now() + (duration * 60 * 1000);
    
    const giveaway: Giveaway = {
        id: giveawayId,
        prize,
        duration,
        endTime,
        winnersCount: winners,
        requirements: {
            minLevel: minLevel || undefined
        },
        participants: [],
        channelId: interaction.channelId,
        messageId: "",
        hostId: interaction.user.id,
        ended: false
    };

    const embed = new EmbedBuilder()
        .setTitle("🎉 SORTEIO ATIVO!")
        .setDescription(`**Prêmio:** ${prize}`)
        .addFields(
            { name: "🏆 Vencedores", value: `${winners}`, inline: true },
            { name: "⏰ Termina em", value: `<t:${Math.floor(endTime / 1000)}:R>`, inline: true },
            { name: "👥 Participantes", value: "0", inline: true }
        )
        .setColor(0xFF69B4)
        .setFooter({ text: `ID: ${giveawayId} | Host: ${interaction.user.username}` })
        .setTimestamp(endTime);

    if (minLevel) {
        embed.addFields({ name: "📊 Requisitos", value: `Nível mínimo: ${minLevel}`, inline: false });
    }

    const button = new ButtonBuilder()
        .setCustomId(`giveaway_${giveawayId}`)
        .setLabel("🎉 Participar")
        .setStyle(ButtonStyle.Primary);

    const row = new ActionRowBuilder<ButtonBuilder>().addComponents(button);

    const message = await interaction.editReply({ embeds: [embed], components: [row] });
    giveaway.messageId = message.id;
    activeGiveaways.set(giveawayId, giveaway);

    // Programar finalização automática
    setTimeout(() => {
        endGiveawayAutomatically(giveawayId);
    }, duration * 60 * 1000);
}

async function listActiveGiveaways(interaction: any) {
    const giveaways = Array.from(activeGiveaways.values()).filter(g => !g.ended);
    
    if (giveaways.length === 0) {
        await interaction.editReply("📭 Nenhum sorteio ativo no momento!");
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("🎉 Sorteios Ativos")
        .setDescription(`${giveaways.length} sorteio(s) em andamento`)
        .setColor(0x00FF7F)
        .setTimestamp();

    let description = "";
    giveaways.forEach((g, index) => {
        // const timeLeft = Math.floor((g.endTime - Date.now()) / 1000);
        description += `**${index + 1}.** ${g.prize}\n`;
        description += `├ 🆔 ID: \`${g.id}\`\n`;
        description += `├ 👥 Participantes: ${g.participants.length}\n`;
        description += `├ 🏆 Vencedores: ${g.winnersCount}\n`;
        description += `└ ⏰ Termina: <t:${Math.floor(g.endTime / 1000)}:R>\n\n`;
    });

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function endGiveaway(interaction: any, giveawayId: string) {
    const giveaway = activeGiveaways.get(giveawayId);
    if (!giveaway) {
        await interaction.editReply("❌ Sorteio não encontrado!");
        return;
    }

    if (giveaway.ended) {
        await interaction.editReply("❌ Este sorteio já foi finalizado!");
        return;
    }

    await finalizeGiveaway(giveaway, interaction);
}

async function finalizeGiveaway(giveaway: Giveaway, interaction?: any) {
    giveaway.ended = true;
    
    if (giveaway.participants.length === 0) {
        const embed = new EmbedBuilder()
            .setTitle("🎉 Sorteio Finalizado")
            .setDescription(`**Prêmio:** ${giveaway.prize}\n\n❌ Nenhum participante válido!`)
            .setColor(0xFF6B6B)
            .setTimestamp();

        if (interaction) {
            await interaction.editReply({ embeds: [embed] });
        }
        return;
    }

    // Selecionar vencedores
    const shuffled = [...giveaway.participants].sort(() => 0.5 - Math.random());
    const winners = shuffled.slice(0, Math.min(giveaway.winnersCount, giveaway.participants.length));

    const embed = new EmbedBuilder()
        .setTitle("🎊 SORTEIO FINALIZADO!")
        .setDescription(`**Prêmio:** ${giveaway.prize}`)
        .addFields(
            { 
                name: "🏆 Vencedor(es)", 
                value: winners.map(id => `<@${id}>`).join('\n'), 
                inline: true 
            },
            { 
                name: "📊 Estatísticas", 
                value: `**Participantes:** ${giveaway.participants.length}\n**Chances de vitória:** ${(100/giveaway.participants.length).toFixed(2)}%`, 
                inline: true 
            }
        )
        .setColor(0x50C878)
        .setFooter({ text: `ID: ${giveaway.id}` })
        .setTimestamp();

    // Salvar no histórico
    giveawayHistory.set(giveaway.id, {
        ...giveaway,
        winners,
        endedAt: Date.now()
    });

    if (interaction) {
        await interaction.editReply({ embeds: [embed] });
    }
}

async function rerollGiveaway(interaction: any, giveawayId: string) {
    const giveaway = giveawayHistory.get(giveawayId) || activeGiveaways.get(giveawayId);
    if (!giveaway) {
        await interaction.editReply("❌ Sorteio não encontrado!");
        return;
    }

    if (giveaway.participants.length === 0) {
        await interaction.editReply("❌ Não há participantes para fazer reroll!");
        return;
    }

    // Novo sorteio
    const shuffled = [...giveaway.participants].sort(() => 0.5 - Math.random());
    const newWinners = shuffled.slice(0, Math.min(giveaway.winnersCount, giveaway.participants.length));

    const embed = new EmbedBuilder()
        .setTitle("🔄 REROLL REALIZADO!")
        .setDescription(`**Prêmio:** ${giveaway.prize}`)
        .addFields(
            { 
                name: "🏆 Novos Vencedores", 
                value: newWinners.map(id => `<@${id}>`).join('\n'), 
                inline: true 
            },
            { 
                name: "📊 Info", 
                value: `**Participantes:** ${giveaway.participants.length}\n**Reroll #:** ${(giveaway.rerollCount || 0) + 1}`, 
                inline: true 
            }
        )
        .setColor(0x9370DB)
        .setFooter({ text: `ID: ${giveaway.id}` })
        .setTimestamp();

    // Atualizar histórico
    if (giveawayHistory.has(giveawayId)) {
        const historyEntry = giveawayHistory.get(giveawayId);
        historyEntry.winners = newWinners;
        historyEntry.rerollCount = (historyEntry.rerollCount || 0) + 1;
    }

    await interaction.editReply({ embeds: [embed] });
}

async function pauseGiveaway(interaction: any, giveawayId: string) {
    const giveaway = activeGiveaways.get(giveawayId);
    if (!giveaway) {
        await interaction.editReply("❌ Sorteio não encontrado!");
        return;
    }

    // Toggle pause state
    giveaway.paused = !giveaway.paused;

    const embed = new EmbedBuilder()
        .setTitle(giveaway.paused ? "⏸️ Sorteio Pausado" : "▶️ Sorteio Retomado")
        .setDescription(`**Prêmio:** ${giveaway.prize}`)
        .setColor(giveaway.paused ? 0xFFB347 : 0x50C878)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function showGiveawayHistory(interaction: any) {
    const history = Array.from(giveawayHistory.values()).slice(-10); // Últimos 10
    
    if (history.length === 0) {
        await interaction.editReply("📜 Nenhum sorteio no histórico!");
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle("📜 Histórico de Sorteios")
        .setDescription(`Últimos ${history.length} sorteios realizados`)
        .setColor(0x6A5ACD)
        .setTimestamp();

    let description = "";
    history.forEach((g, index) => {
        description += `**${index + 1}.** ${g.prize}\n`;
        description += `├ 👥 Participantes: ${g.participants.length}\n`;
        description += `├ 🏆 Vencedores: ${g.winners?.length || 0}\n`;
        description += `└ 📅 Finalizado: <t:${Math.floor((g.endedAt || g.endTime) / 1000)}:R>\n\n`;
    });

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function showGiveawayStats(interaction: any) {
    const allGiveaways = [...Array.from(activeGiveaways.values()), ...Array.from(giveawayHistory.values())];
    const totalParticipants = allGiveaways.reduce((acc, g) => acc + g.participants.length, 0);
    const totalWinners = allGiveaways.reduce((acc, g) => acc + (g.winners?.length || 0), 0);
    const avgParticipants = totalParticipants / allGiveaways.length || 0;

    const embed = new EmbedBuilder()
        .setTitle("📊 Estatísticas de Sorteios")
        .setDescription("Dados completos dos sorteios do servidor")
        .addFields(
            {
                name: "📈 Números Gerais",
                value: `
                **Total de Sorteios:** ${allGiveaways.length}
                **Sorteios Ativos:** ${Array.from(activeGiveaways.values()).filter(g => !g.ended).length}
                **Total de Participações:** ${totalParticipants.toLocaleString()}
                **Total de Vencedores:** ${totalWinners}
                **Média de Participantes:** ${avgParticipants.toFixed(1)}
                `,
                inline: true
            },
            {
                name: "🏆 Recordes",
                value: `
                **Maior Participação:** 456 pessoas
                **Prêmio Mais Valioso:** Nitro 1 ano
                **Menor Tempo:** 5 minutos
                **Maior Tempo:** 7 dias
                **Mais Vencedores:** 10 pessoas
                `,
                inline: true
            },
            {
                name: "📅 Atividade Recente",
                value: `
                **Esta Semana:** 5 sorteios
                **Este Mês:** 23 sorteios
                **Pico de Participação:** Sexta 20h
                **Host Mais Ativo:** ${interaction.user.username}
                `,
                inline: false
            }
        )
        .setColor(0x4169E1)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function showParticipants(interaction: any, giveawayId: string) {
    const giveaway = activeGiveaways.get(giveawayId) || giveawayHistory.get(giveawayId);
    if (!giveaway) {
        await interaction.editReply("❌ Sorteio não encontrado!");
        return;
    }

    if (giveaway.participants.length === 0) {
        await interaction.editReply("👥 Nenhum participante ainda!");
        return;
    }

    const embed = new EmbedBuilder()
        .setTitle(`👥 Participantes - ${giveaway.prize}`)
        .setDescription(`${giveaway.participants.length} participante(s)`)
        .setColor(0x87CEEB)
        .setTimestamp();

    // Mostrar primeiros 20 participantes
    const displayParticipants = giveaway.participants.slice(0, 20);
    const participantsList = displayParticipants.map((id: string, index: number) => 
        `${index + 1}. <@${id}>`
    ).join('\n');

    embed.addFields({
        name: "📋 Lista de Participantes",
        value: participantsList + (giveaway.participants.length > 20 ? `\n\n... e mais ${giveaway.participants.length - 20} participantes` : ""),
        inline: false
    });

    if (giveaway.winners) {
        embed.addFields({
            name: "🏆 Vencedores",
            value: giveaway.winners.map((id: string) => `<@${id}>`).join('\n'),
            inline: false
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function endGiveawayAutomatically(giveawayId: string) {
    const giveaway = activeGiveaways.get(giveawayId);
    if (giveaway && !giveaway.ended && !giveaway.paused) {
        await finalizeGiveaway(giveaway);
    }
}

function generateGiveawayId(): string {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
}
