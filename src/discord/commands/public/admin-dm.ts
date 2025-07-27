import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from "discord.js";
import { createCommand } from "#base";

createCommand({
    name: "admin-dm",
    description: "🎮 Administração completa via DM - Controle total dos servidores",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Escolha a ação administrativa",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "🏠 Listar Servidores", value: "servers" },
                { name: "👥 Listar Membros", value: "members" },
                { name: "📝 Listar Canais", value: "channels" },
                { name: "🎭 Listar Cargos", value: "roles" },
                { name: "📊 Estatísticas", value: "stats" },
                { name: "🚫 Banir Usuário", value: "ban" },
                { name: "👢 Expulsar", value: "kick" },
                { name: "📢 Enviar Mensagem", value: "message" }
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
            name: "canal",
            description: "ID ou nome do canal",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "texto",
            description: "Texto da mensagem ou motivo",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        // Verificar se é o owner
        if (interaction.user.id !== "819954175173328906") {
            await interaction.reply({ 
                content: "❌ **Acesso Negado** - Apenas o proprietário pode usar este comando.",
                ephemeral: true 
            });
            return;
        }

        const acao = interaction.options.getString("acao", true);
        const servidorId = interaction.options.getString("servidor");
        const usuarioId = interaction.options.getString("usuario");
        const canalId = interaction.options.getString("canal");
        const texto = interaction.options.getString("texto");

        try {
            await interaction.deferReply({ ephemeral: true });

            switch (acao) {
                case "servers": {
                    const servers = interaction.client.guilds.cache.map(guild => 
                        `**${guild.name}**\n` +
                        `├ 🆔 ID: \`${guild.id}\`\n` +
                        `├ 👥 Membros: ${guild.memberCount}\n` +
                        `├ 📝 Canais: ${guild.channels.cache.size}\n` +
                        `└ 👑 Owner: <@${guild.ownerId}>`
                    );

                    const embed = new EmbedBuilder()
                        .setTitle("🏠 Servidores Administrados")
                        .setDescription(servers.join("\n\n") || "Nenhum servidor encontrado")
                        .setColor(0x00ff00)
                        .setFooter({ text: `Total: ${interaction.client.guilds.cache.size} servidores` })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    return;
                }

                case "members": {
                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        interaction.client.guilds.cache.first();
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado! Use `/admin-dm acao:Listar Servidores` primeiro." });
                        return;
                    }

                    await guild.members.fetch();
                    const members = guild.members.cache
                        .sort((a, b) => (b.joinedTimestamp || 0) - (a.joinedTimestamp || 0))
                        .first(15)
                        .map(member => {
                            const status = member.presence?.status === "online" ? "🟢" :
                                          member.presence?.status === "idle" ? "🟡" :
                                          member.presence?.status === "dnd" ? "🔴" : "⚫";
                            
                            return `${status} **${member.displayName}** \`${member.id}\``;
                        });

                    const embed = new EmbedBuilder()
                        .setTitle(`👥 Membros de ${guild.name}`)
                        .setDescription(members.join("\n"))
                        .addFields({ 
                            name: "📊 Total", 
                            value: `${guild.memberCount} membros` 
                        })
                        .setColor(0x0099ff)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    return;
                }

                case "channels": {
                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        interaction.client.guilds.cache.first();
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                        return;
                    }

                    const channels = guild.channels.cache
                        .map((channel: any) => {
                            const icon = channel.type === 0 ? "📝" :  // Text
                                        channel.type === 2 ? "🔊" :  // Voice
                                        channel.type === 4 ? "📁" :  // Category
                                        channel.type === 5 ? "📢" :  // Announcement
                                        "📄";
                            
                            return `${icon} **${channel.name}** \`${channel.id}\``;
                        });

                    const embed = new EmbedBuilder()
                        .setTitle(`📝 Canais de ${guild.name}`)
                        .setDescription(channels.join("\n") || "Nenhum canal encontrado")
                        .setColor(0x0099ff)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    return;
                }

                case "ban": {
                    if (!usuarioId || !servidorId) {
                        await interaction.editReply({ content: "❌ Servidor e usuário são obrigatórios!" });
                        return;
                    }

                    const guild = interaction.client.guilds.cache.get(servidorId);
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                        return;
                    }

                    try {
                        const user = await interaction.client.users.fetch(usuarioId);
                        await guild.members.ban(usuarioId, { reason: texto || "Banimento via DM" });

                        await interaction.editReply({ 
                            content: `✅ **${user.username}** foi banido do servidor **${guild.name}**!\n` +
                                    `📝 Motivo: ${texto || "Banimento via DM"}`
                        });
                        return;
                    } catch (error) {
                        await interaction.editReply({ content: "❌ Erro ao banir usuário!" });
                        return;
                    }
                }

                case "message": {
                    if (!canalId || !texto || !servidorId) {
                        await interaction.editReply({ content: "❌ Servidor, canal e texto são obrigatórios!" });
                        return;
                    }

                    const guild = interaction.client.guilds.cache.get(servidorId);
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                        return;
                    }

                    const channel = guild.channels.cache.get(canalId);
                    if (!channel || !channel.isTextBased()) {
                        await interaction.editReply({ content: "❌ Canal de texto não encontrado!" });
                        return;
                    }

                    await channel.send(texto);

                    await interaction.editReply({ 
                        content: `✅ Mensagem enviada para **#${channel.name}** em **${guild.name}**!\n` +
                                `💬 Conteúdo: ${texto.substring(0, 100)}${texto.length > 100 ? "..." : ""}`
                    });
                    return;
                }

                case "stats": {
                    const guilds = interaction.client.guilds.cache;
                    const totalMembers = guilds.reduce((sum: number, guild: any) => sum + guild.memberCount, 0);
                    const totalChannels = guilds.reduce((sum: number, guild: any) => sum + guild.channels.cache.size, 0);
                    
                    const embed = new EmbedBuilder()
                        .setTitle("📊 Estatísticas Globais - Administração via DM")
                        .addFields(
                            { name: "🏠 Servidores", value: guilds.size.toString(), inline: true },
                            { name: "👥 Membros Totais", value: totalMembers.toString(), inline: true },
                            { name: "📝 Canais Totais", value: totalChannels.toString(), inline: true }
                        )
                        .setColor(0x00ff00)
                        .setFooter({ text: "Administração completa via DM ativa!" })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    return;
                }

                default:
                    await interaction.editReply({ content: "❌ Ação não implementada!" });
                    return;
            }

        } catch (error) {
            console.error("Erro em admin-dm:", error);
            await interaction.editReply({ 
                content: `❌ **Erro:** ${error instanceof Error ? error.message : "Erro desconhecido"}` 
            });
            return;
        }
    }
});
