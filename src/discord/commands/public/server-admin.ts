import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType, EmbedBuilder, TextChannel, ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "#base";

createCommand({
    name: "server-admin",
    description: "🔧 Administração avançada de servidores via DM - Controle total",
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
                { name: "🏠 Listar Servidores", value: "list_servers" },
                { name: "📊 Info do Servidor", value: "server_info" },
                { name: "📝 Criar Canal", value: "create_channel" },
                { name: "🗑️ Deletar Canal", value: "delete_channel" },
                { name: "📋 Listar Canais", value: "list_channels" },
                { name: "🎭 Criar Cargo", value: "create_role" },
                { name: "❌ Deletar Cargo", value: "delete_role" },
                { name: "👥 Listar Membros", value: "list_members" },
                { name: "⚡ Dar Cargo", value: "give_role" },
                { name: "🔒 Remover Cargo", value: "remove_role" },
                { name: "🚫 Banir Usuário", value: "ban_user" },
                { name: "👢 Expulsar Usuário", value: "kick_user" },
                { name: "📢 Enviar Mensagem", value: "send_message" },
                { name: "🔧 Configurar Servidor", value: "configure_server" }
            ]
        },
        {
            name: "servidor",
            description: "ID do servidor (deixe vazio para selecionar)",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "canal",
            description: "Nome, ID ou menção do canal",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "usuario",
            description: "ID, nome ou menção do usuário",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "cargo",
            description: "Nome, ID ou menção do cargo",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "nome",
            description: "Nome para criação de canal/cargo",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "tipo",
            description: "Tipo de canal",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "📝 Texto", value: "text" },
                { name: "🔊 Voz", value: "voice" },
                { name: "📁 Categoria", value: "category" },
                { name: "📰 Anúncios", value: "announcement" },
                { name: "🧵 Fórum", value: "forum" },
                { name: "🎪 Palco", value: "stage" }
            ]
        },
        {
            name: "mensagem",
            description: "Mensagem para enviar",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "motivo",
            description: "Motivo da ação",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
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
        const canalNome = interaction.options.getString("canal");
        const nome = interaction.options.getString("nome");
        const tipo = interaction.options.getString("tipo");
        const mensagem = interaction.options.getString("mensagem");
        const motivo = interaction.options.getString("motivo") || "Ação administrativa via DM";

        try {
            await interaction.deferReply({ ephemeral: true });

            switch (acao) {
                case "list_servers": {
                    const servers = interaction.client.guilds.cache.map((guild: any) => 
                        `**${guild.name}**\n` +
                        `├ ID: \`${guild.id}\`\n` +
                        `├ Membros: ${guild.memberCount}\n` +
                        `├ Canais: ${guild.channels.cache.size}\n` +
                        `└ Owner: <@${guild.ownerId}>`
                    );

                    const embed = new EmbedBuilder()
                        .setTitle("🏠 Servidores Administrados")
                        .setDescription(servers.join("\n\n") || "Nenhum servidor encontrado")
                        .setColor(0x00ff00)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "server_info": {
                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        await selectServer(interaction);
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                        return;
                    }

                    const embed = new EmbedBuilder()
                        .setTitle(`📊 Informações: ${guild.name}`)
                        .setThumbnail(guild.iconURL())
                        .addFields(
                            { name: "🆔 ID", value: guild.id, inline: true },
                            { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
                            { name: "👥 Membros", value: guild.memberCount.toString(), inline: true },
                            { name: "📝 Canais Texto", value: guild.channels.cache.filter((c: any) => c.type === ChannelType.GuildText).size.toString(), inline: true },
                            { name: "🔊 Canais Voz", value: guild.channels.cache.filter((c: any) => c.type === ChannelType.GuildVoice).size.toString(), inline: true },
                            { name: "🎭 Cargos", value: guild.roles.cache.size.toString(), inline: true },
                            { name: "📅 Criado", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
                        )
                        .setColor(0x0099ff)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "create_channel": {
                    if (!nome) {
                        await interaction.editReply({ content: "❌ Nome do canal é obrigatório!" });
                        return;
                    }

                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        await selectServer(interaction);
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                    }

                    const channelType = tipo === "voice" ? ChannelType.GuildVoice :
                                      tipo === "category" ? ChannelType.GuildCategory :
                                      tipo === "announcement" ? ChannelType.GuildAnnouncement :
                                      tipo === "forum" ? ChannelType.GuildForum :
                                      tipo === "stage" ? ChannelType.GuildStageVoice :
                                      ChannelType.GuildText;

                    const channel = await guild.channels.create({
                        name: nome,
                        type: channelType,
                        reason: motivo
                    });

                    await interaction.editReply({ 
                        content: `✅ Canal **#${channel.name}** criado com sucesso!\n` +
                                `🆔 ID: \`${channel.id}\`\n` +
                                `📍 Servidor: **${guild.name}**`
                    });
                }

                case "delete_channel": {
                    if (!canalNome) {
                        await interaction.editReply({ content: "❌ Nome ou ID do canal é obrigatório!" });
                    }

                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        await selectServer(interaction);
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                    }

                    const channel = guild.channels.cache.find((c: any) => 
                        c.name === canalNome || 
                        c.id === canalNome ||
                        c.id === canalNome?.replace(/[<#>]/g, "")
                    );

                    if (!channel) {
                        await interaction.editReply({ content: "❌ Canal não encontrado!" });
                        return;
                    }

                    await channel.delete(motivo);

                    await interaction.editReply({ 
                        content: `✅ Canal **#${channel.name}** deletado com sucesso!\n` +
                                `📍 Servidor: **${guild.name}**`
                    });
                }

                case "list_channels": {
                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        await selectServer(interaction);
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                    }

                    const channels = guild.channels.cache
                        .filter((c: any) => c.type !== ChannelType.GuildCategory)
                        .map((channel: any) => {
                            const icon = channel.type === ChannelType.GuildText ? "📝" :
                                        channel.type === ChannelType.GuildVoice ? "🔊" :
                                        channel.type === ChannelType.GuildAnnouncement ? "📢" :
                                        channel.type === ChannelType.GuildForum ? "🧵" :
                                        channel.type === ChannelType.GuildStageVoice ? "🎪" : "📁";
                            
                            return `${icon} **${channel.name}** \`${channel.id}\``;
                        });

                    const embed = new EmbedBuilder()
                        .setTitle(`📋 Canais de ${guild.name}`)
                        .setDescription(channels.join("\n") || "Nenhum canal encontrado")
                        .setColor(0x0099ff)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                }

                case "send_message": {
                    if (!canalNome || !mensagem) {
                        await interaction.editReply({ content: "❌ Canal e mensagem são obrigatórios!" });
                    }

                    const guild = servidorId ? 
                        interaction.client.guilds.cache.get(servidorId) :
                        await selectServer(interaction);
                    
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                        return;
                    }

                    if (!canalNome || !mensagem) {
                        await interaction.editReply({ content: "❌ Canal e mensagem são obrigatórios!" });
                        return;
                    }

                    const channel = guild.channels.cache.find((c: any) => 
                        c.name === canalNome || 
                        c.id === canalNome ||
                        c.id === canalNome?.replace(/[<#>]/g, "")
                    ) as TextChannel;

                    if (!channel || !channel.isTextBased()) {
                        await interaction.editReply({ content: "❌ Canal de texto não encontrado!" });
                        return;
                    }

                    await channel.send(mensagem);

                    await interaction.editReply({ 
                        content: `✅ Mensagem enviada para **#${channel.name}**!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `💬 Conteúdo: ${mensagem.substring(0, 100)}${mensagem.length > 100 ? "..." : ""}`
                    });
                    break;
                }

                // Adicionar casos para cargos, membros, etc.
                default:
                    await interaction.editReply({ content: "❌ Ação não implementada ainda!" });
            }

        } catch (error) {
            console.error("Erro em server-admin:", error);
            await interaction.editReply({ 
                content: `❌ **Erro:** ${error instanceof Error ? error.message : "Erro desconhecido"}` 
            });
        }
    }
});

async function selectServer(interaction: any) {
    // Por enquanto pega o primeiro servidor
    // Futuramente implementar seleção interativa
    return interaction.client.guilds.cache.first();
}
