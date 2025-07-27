import { createCommand } from "#base";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, TextChannel } from "discord.js";
import { config, moderationData, saveData } from "../../../settings/config.js";

createCommand({
    name: "mod",
    description: "Sistema completo de moderação",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.ModerateMembers],
    options: [
        {
            name: "action",
            description: "Ação de moderação",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "⚠️ Avisar", value: "warn" },
                { name: "🔇 Mutar", value: "mute" },
                { name: "🔊 Desmutar", value: "unmute" },
                { name: "👢 Expulsar", value: "kick" },
                { name: "🔨 Banir", value: "ban" },
                { name: "🔓 Desbanir", value: "unban" },
                { name: "🧹 Limpar Chat", value: "clear" },
                { name: "🔒 Bloquear Canal", value: "lock" },
                { name: "🔓 Desbloquear Canal", value: "unlock" },
                { name: "📊 Histórico", value: "history" },
                { name: "⏰ Timeout", value: "timeout" }
            ]
        },
        {
            name: "usuario",
            description: "Usuário alvo da ação",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "razao",
            description: "Razão da ação",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 500
        },
        {
            name: "duracao",
            description: "Duração (ex: 1h, 30m, 7d)",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "quantidade",
            description: "Quantidade de mensagens para limpar (1-100)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 100
        },
        {
            name: "silencioso",
            description: "Executar ação silenciosamente",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],
    async run(interaction) {
        const action = interaction.options.getString("action", true);
        const targetUser = interaction.options.getUser("usuario");
        const reason = interaction.options.getString("razao") || "Não especificada";
        const duration = interaction.options.getString("duracao");
        const amount = interaction.options.getInteger("quantidade");

        const guildId = interaction.guildId!;
        if (!moderationData[guildId]) {
            moderationData[guildId] = { bans: [], mutes: [], kicks: [] };
        }

        switch (action) {
            case "warn":
                if (!targetUser) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário para avisar!",
                        ephemeral: true
                    });
                    return;
                }

                const warnEmbed = new EmbedBuilder()
                    .setTitle("⚠️ Usuário Avisado")
                    .addFields(
                        { name: "Usuário", value: `${targetUser} (${targetUser.id})`, inline: true },
                        { name: "Moderador", value: `${interaction.user}`, inline: true },
                        { name: "Razão", value: reason, inline: false }
                    )
                    .setColor(0xFFA500)
                    .setTimestamp();

                await interaction.reply({ embeds: [warnEmbed] });

                // Enviar DM para o usuário
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setTitle("⚠️ Você recebeu um aviso")
                        .setDescription(`**Servidor:** ${interaction.guild!.name}`)
                        .addFields(
                            { name: "Moderador", value: interaction.user.username, inline: true },
                            { name: "Razão", value: reason, inline: false }
                        )
                        .setColor(0xFFA500)
                        .setTimestamp();

                    await targetUser.send({ embeds: [dmEmbed] });
                } catch {
                    await interaction.followUp({
                        content: "⚠️ Não foi possível enviar DM para o usuário.",
                        ephemeral: true
                    });
                }
                break;

            case "mute":
                if (!targetUser || !duration) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário e duração para mutar!",
                        ephemeral: true
                    });
                    return;
                }

                const member = await interaction.guild!.members.fetch(targetUser.id).catch(() => null);
                if (!member) {
                    await interaction.reply({
                        content: "❌ Usuário não encontrado no servidor!",
                        ephemeral: true
                    });
                    return;
                }

                // Converter duração manualmente
                let muteDuration = 0;
                if (duration) {
                    const timeValue = parseInt(duration);
                    if (duration.includes('h')) muteDuration = timeValue * 60 * 60 * 1000;
                    else if (duration.includes('m')) muteDuration = timeValue * 60 * 1000;
                    else if (duration.includes('d')) muteDuration = timeValue * 24 * 60 * 60 * 1000;
                    else muteDuration = timeValue * 1000; // segundos por padrão
                }
                if (!muteDuration || muteDuration > (28 * 24 * 60 * 60 * 1000)) {
                    await interaction.reply({
                        content: "❌ Duração inválida! Use formato como: 1h, 30m, 7d (máximo 28 dias)",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    await member.timeout(muteDuration, reason);
                    
                    moderationData[guildId].mutes.push({
                        userId: targetUser.id,
                        duration: muteDuration,
                        timestamp: Date.now()
                    });
                    saveData();

                    const muteEmbed = new EmbedBuilder()
                        .setTitle("🔇 Usuário Mutado")
                        .addFields(
                            { name: "Usuário", value: `${targetUser} (${targetUser.id})`, inline: true },
                            { name: "Moderador", value: `${interaction.user}`, inline: true },
                            { name: "Duração", value: duration, inline: true },
                            { name: "Razão", value: reason, inline: false }
                        )
                        .setColor(0xFF6B6B)
                        .setTimestamp();

                    await interaction.reply({ embeds: [muteEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao mutar o usuário. Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "unmute":
                if (!targetUser) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário para desmutar!",
                        ephemeral: true
                    });
                    return;
                }

                const mutedMember = await interaction.guild!.members.fetch(targetUser.id).catch(() => null);
                if (!mutedMember) {
                    await interaction.reply({
                        content: "❌ Usuário não encontrado no servidor!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    await mutedMember.timeout(null, reason);

                    const unmuteEmbed = new EmbedBuilder()
                        .setTitle("🔊 Usuário Desmutado")
                        .addFields(
                            { name: "Usuário", value: `${targetUser} (${targetUser.id})`, inline: true },
                            { name: "Moderador", value: `${interaction.user}`, inline: true },
                            { name: "Razão", value: reason, inline: false }
                        )
                        .setColor(0x4ECDC4)
                        .setTimestamp();

                    await interaction.reply({ embeds: [unmuteEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao desmutar o usuário.",
                        ephemeral: true
                    });
                }
                break;

            case "kick":
                if (!targetUser) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário para expulsar!",
                        ephemeral: true
                    });
                    return;
                }

                const kickMember = await interaction.guild!.members.fetch(targetUser.id).catch(() => null);
                if (!kickMember) {
                    await interaction.reply({
                        content: "❌ Usuário não encontrado no servidor!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    await kickMember.kick(reason);
                    
                    moderationData[guildId].kicks.push({
                        userId: targetUser.id,
                        reason: reason,
                        timestamp: Date.now()
                    });
                    saveData();

                    const kickEmbed = new EmbedBuilder()
                        .setTitle("👢 Usuário Expulso")
                        .addFields(
                            { name: "Usuário", value: `${targetUser} (${targetUser.id})`, inline: true },
                            { name: "Moderador", value: `${interaction.user}`, inline: true },
                            { name: "Razão", value: reason, inline: false }
                        )
                        .setColor(0xFF9500)
                        .setTimestamp();

                    await interaction.reply({ embeds: [kickEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao expulsar o usuário. Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "ban":
                if (!targetUser) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário para banir!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    await interaction.guild!.members.ban(targetUser.id, { 
                        reason: reason,
                        deleteMessageSeconds: 86400 // Delete messages from last 24h
                    });
                    
                    moderationData[guildId].bans.push({
                        userId: targetUser.id,
                        reason: reason,
                        timestamp: Date.now()
                    });
                    saveData();

                    const banEmbed = new EmbedBuilder()
                        .setTitle("🔨 Usuário Banido")
                        .addFields(
                            { name: "Usuário", value: `${targetUser} (${targetUser.id})`, inline: true },
                            { name: "Moderador", value: `${interaction.user}`, inline: true },
                            { name: "Razão", value: reason, inline: false }
                        )
                        .setColor(0xFF0000)
                        .setTimestamp();

                    await interaction.reply({ embeds: [banEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao banir o usuário. Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "clear":
                if (!amount) {
                    await interaction.reply({
                        content: "❌ Você deve especificar a quantidade de mensagens para limpar!",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferReply({ ephemeral: true });

                try {
                    const channel = interaction.channel as TextChannel;
                    const messages = await channel.bulkDelete(amount, true);

                    const clearEmbed = new EmbedBuilder()
                        .setTitle("🧹 Chat Limpo")
                        .addFields(
                            { name: "Mensagens Deletadas", value: messages.size.toString(), inline: true },
                            { name: "Moderador", value: `${interaction.user}`, inline: true },
                            { name: "Canal", value: `${channel}`, inline: true }
                        )
                        .setColor(0x95A5A6)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [clearEmbed] });

                    // Log no canal de logs se configurado
                    if (config.LOG_CHANNEL_ID) {
                        const logChannel = interaction.guild!.channels.cache.get(config.LOG_CHANNEL_ID) as TextChannel;
                        if (logChannel) {
                            await logChannel.send({ embeds: [clearEmbed] });
                        }
                    }

                } catch (error) {
                    await interaction.editReply({
                        content: "❌ Erro ao limpar mensagens. Mensagens muito antigas não podem ser deletadas."
                    });
                }
                break;

            case "history":
                if (!targetUser) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário para ver o histórico!",
                        ephemeral: true
                    });
                    return;
                }

                const userBans = moderationData[guildId].bans.filter(b => b.userId === targetUser.id);
                const userKicks = moderationData[guildId].kicks.filter(k => k.userId === targetUser.id);
                const userMutes = moderationData[guildId].mutes.filter(m => m.userId === targetUser.id);

                const historyEmbed = new EmbedBuilder()
                    .setTitle(`📊 Histórico de Moderação - ${targetUser.username}`)
                    .addFields(
                        { name: "🔨 Banimentos", value: userBans.length.toString(), inline: true },
                        { name: "👢 Expulsões", value: userKicks.length.toString(), inline: true },
                        { name: "🔇 Mutes", value: userMutes.length.toString(), inline: true }
                    )
                    .setColor(0x9932CC)
                    .setThumbnail(targetUser.displayAvatarURL())
                    .setTimestamp();

                if (userBans.length > 0) {
                    const recentBans = userBans.slice(-3).map(ban => 
                        `<t:${Math.floor(ban.timestamp / 1000)}:R> - ${ban.reason}`
                    ).join('\n');
                    historyEmbed.addFields({ name: "Banimentos Recentes", value: recentBans, inline: false });
                }

                await interaction.reply({ embeds: [historyEmbed] });
                break;

            case "lock":
                try {
                    const channel = interaction.channel as TextChannel;
                    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
                        SendMessages: false
                    });

                    const lockEmbed = new EmbedBuilder()
                        .setTitle("🔒 Canal Bloqueado")
                        .setDescription(`Canal bloqueado por ${interaction.user}`)
                        .addFields({ name: "Razão", value: reason, inline: false })
                        .setColor(0xFF0000)
                        .setTimestamp();

                    await interaction.reply({ embeds: [lockEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao bloquear o canal.",
                        ephemeral: true
                    });
                }
                break;

            case "unlock":
                try {
                    const channel = interaction.channel as TextChannel;
                    await channel.permissionOverwrites.edit(interaction.guild!.roles.everyone, {
                        SendMessages: null
                    });

                    const unlockEmbed = new EmbedBuilder()
                        .setTitle("🔓 Canal Desbloqueado")
                        .setDescription(`Canal desbloqueado por ${interaction.user}`)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await interaction.reply({ embeds: [unlockEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao desbloquear o canal.",
                        ephemeral: true
                    });
                }
                break;

            default:
                await interaction.reply({
                    content: "❌ Ação inválida!",
                    ephemeral: true
                });
        }
    }
});
