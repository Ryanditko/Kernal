import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ComponentType, ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "#base";

createCommand({
    name: "dm-control",
    description: "🎮 Controle total dos servidores via DM - Interface completa",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Escolha o tipo de controle",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "🏠 Selecionar Servidor", value: "select_server" },
                { name: "⚡ Painel de Controle", value: "control_panel" },
                { name: "📊 Dashboard Completo", value: "dashboard" },
                { name: "🔧 Configurações Avançadas", value: "advanced_config" },
                { name: "📝 Comandos Rápidos", value: "quick_commands" },
                { name: "🚨 Moderação de Emergência", value: "emergency_mod" },
                { name: "📈 Estatísticas em Tempo Real", value: "live_stats" },
                { name: "🔍 Busca Global", value: "global_search" }
            ]
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

        try {
            await interaction.deferReply({ ephemeral: true });

            switch (acao) {
                case "select_server": {
                    const guilds = interaction.client.guilds.cache.map(guild => ({
                        label: guild.name,
                        description: `${guild.memberCount} membros • ID: ${guild.id}`,
                        value: guild.id,
                        emoji: "🏠"
                    }));

                    if (guilds.length === 0) {
                        await interaction.editReply({ content: "❌ Nenhum servidor encontrado!" });
                    }

                    const selectMenu = new StringSelectMenuBuilder()
                        .setCustomId("server_select")
                        .setPlaceholder("Selecione um servidor para administrar...")
                        .addOptions(guilds.slice(0, 25)); // Discord limit

                    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
                        .addComponents(selectMenu);

                    const embed = new EmbedBuilder()
                        .setTitle("🏠 Seleção de Servidor")
                        .setDescription("Escolha um servidor para administrar via DM:")
                        .setColor(0x0099ff)
                        .setTimestamp();

                    const response = await interaction.editReply({ 
                        embeds: [embed], 
                        components: [row] 
                    });

                    // Collector para o menu
                    const collector = response.createMessageComponentCollector({
                        componentType: ComponentType.StringSelect,
                        time: 60000
                    });

                    collector.on("collect", async (selectInteraction: any) => {
                        if (selectInteraction.user.id !== interaction.user.id) {
                            await selectInteraction.reply({ 
                                content: "❌ Apenas quem executou o comando pode usar este menu!", 
                                ephemeral: true 
                            });
                            return;
                        }

                        const guildId = selectInteraction.values[0];
                        const guild = interaction.client.guilds.cache.get(guildId);

                        if (!guild) {
                            await selectInteraction.reply({ 
                                content: "❌ Servidor não encontrado!", 
                                ephemeral: true 
                            });
                            return;
                        }

                        await selectInteraction.deferUpdate();
                        
                        // Criar painel de controle para o servidor selecionado
                        const controlPanel = await createControlPanel(guild);
                        await selectInteraction.editReply(controlPanel);
                    });

                    collector.on("end", () => {
                        interaction.editReply({ components: [] });
                    });

                    break;
                }

                case "control_panel": {
                    const guild = interaction.client.guilds.cache.first();
                    if (!guild) {
                        await interaction.editReply({ content: "❌ Nenhum servidor encontrado!" });
                    }

                    const controlPanel = await createControlPanel(guild);
                    await interaction.editReply(controlPanel);
                }

                case "dashboard": {
                    const guilds = interaction.client.guilds.cache;
                    const totalMembers = guilds.reduce((sum, guild) => sum + guild.memberCount, 0);
                    const totalChannels = guilds.reduce((sum, guild) => sum + guild.channels.cache.size, 0);
                    
                    const serverStats = guilds.map(guild => 
                        `**${guild.name}**\n` +
                        `├ 👥 ${guild.memberCount} membros\n` +
                        `├ 📝 ${guild.channels.cache.filter(c => c.isTextBased()).size} canais texto\n` +
                        `├ 🔊 ${guild.channels.cache.filter(c => c.isVoiceBased()).size} canais voz\n` +
                        `└ 🎭 ${guild.roles.cache.size} cargos`
                    );

                    const embed = new EmbedBuilder()
                        .setTitle("📊 Dashboard Completo - Controle via DM")
                        .setDescription(
                            `**🎯 Estatísticas Globais**\n` +
                            `├ 🏠 **${guilds.size}** servidores\n` +
                            `├ 👥 **${totalMembers}** membros totais\n` +
                            `├ 📝 **${totalChannels}** canais totais\n` +
                            `└ 🤖 Bot Online\n\n` +
                            `**📋 Servidores Administrados:**\n${serverStats.join("\n\n")}`
                        )
                        .addFields(
                            { 
                                name: "⚡ Comandos Disponíveis", 
                                value: "🏠 `/dm-control` - Painel principal\n" +
                                       "🔧 `/server-admin` - Administração de servidores\n" +
                                       "👥 `/user-admin` - Gerenciamento de usuários\n" +
                                       "📊 `/monitor` - Sistema de monitoramento\n" +
                                       "🎙️ `/record-call` - Gravação de calls",
                                inline: true 
                            },
                            { 
                                name: "🚨 Moderação Rápida", 
                                value: "Use `/user-admin` para:\n" +
                                       "• Banir/Expulsar usuários\n" +
                                       "• Gerenciar cargos\n" +
                                       "• Aplicar timeouts\n" +
                                       "• Ver informações detalhadas",
                                inline: true 
                            }
                        )
                        .setColor(0x00ff00)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                }

                case "quick_commands": {
                    const embed = new EmbedBuilder()
                        .setTitle("📝 Comandos Rápidos - Administração via DM")
                        .setDescription("Lista de comandos para controle total dos servidores:")
                        .addFields(
                            {
                                name: "🏠 Administração de Servidores",
                                value: "```\n" +
                                       "/server-admin acao:Listar Servidores\n" +
                                       "/server-admin acao:Info do Servidor\n" +
                                       "/server-admin acao:Criar Canal nome:nome-canal\n" +
                                       "/server-admin acao:Deletar Canal canal:nome-canal\n" +
                                       "/server-admin acao:Enviar Mensagem canal:geral mensagem:Olá!\n" +
                                       "```",
                                inline: false
                            },
                            {
                                name: "👥 Gerenciamento de Usuários",
                                value: "```\n" +
                                       "/user-admin acao:Listar Membros\n" +
                                       "/user-admin acao:Info do Usuário usuario:ID\n" +
                                       "/user-admin acao:Banir usuario:ID motivo:Spam\n" +
                                       "/user-admin acao:Dar Cargo usuario:ID cargo:Moderador\n" +
                                       "/user-admin acao:Timeout usuario:ID tempo:60\n" +
                                       "```",
                                inline: false
                            },
                            {
                                name: "📊 Monitoramento e Logs",
                                value: "```\n" +
                                       "/monitor acao:Iniciar Monitoramento\n" +
                                       "/logs acao:Listar Logs\n" +
                                       "/logs acao:Ver Log arquivo:monitor_123.json\n" +
                                       "/record-call acao:Iniciar Gravação\n" +
                                       "```",
                                inline: false
                            },
                            {
                                name: "🎮 Controle Avançado",
                                value: "```\n" +
                                       "/dm-control acao:Selecionar Servidor\n" +
                                       "/dm-control acao:Dashboard Completo\n" +
                                       "/dm-control acao:Painel de Controle\n" +
                                       "```",
                                inline: false
                            }
                        )
                        .setColor(0xff9900)
                        .setFooter({ text: "Use estes comandos diretamente nesta DM!" })
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                }

                case "emergency_mod": {
                    const guilds = interaction.client.guilds.cache;
                    
                    const embed = new EmbedBuilder()
                        .setTitle("🚨 Painel de Moderação de Emergência")
                        .setDescription("Ações rápidas para situações críticas:")
                        .addFields(
                            {
                                name: "⚡ Ações Rápidas por Servidor",
                                value: guilds.map(guild => 
                                    `**${guild.name}** \`${guild.id}\`\n` +
                                    `├ Membros: ${guild.memberCount}\n` +
                                    `└ Status: 🟢 Ativo`
                                ).join("\n"),
                                inline: false
                            },
                            {
                                name: "🚫 Comandos de Emergência",
                                value: "```\n" +
                                       "BANIR: /user-admin acao:Banir usuario:ID\n" +
                                       "TIMEOUT: /user-admin acao:Timeout usuario:ID tempo:1440\n" +
                                       "DELETAR CANAL: /server-admin acao:Deletar Canal\n" +
                                       "GRAVAR CALL: /record-call acao:Iniciar Gravação\n" +
                                       "```",
                                inline: false
                            }
                        )
                        .setColor(0xff0000)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                }

                case "live_stats": {
                    const guilds = interaction.client.guilds.cache;
                    const onlineMembers = guilds.reduce((sum, guild) => 
                        sum + guild.members.cache.filter(m => m.presence?.status === "online").size, 0
                    );
                    
                    const voiceChannels = guilds.reduce((sum, guild) => 
                        sum + guild.channels.cache.filter(c => c.isVoiceBased() && c.members?.size > 0).size, 0
                    );

                    const embed = new EmbedBuilder()
                        .setTitle("📈 Estatísticas em Tempo Real")
                        .addFields(
                            { name: "🟢 Membros Online", value: onlineMembers.toString(), inline: true },
                            { name: "🔊 Canais de Voz Ativos", value: voiceChannels.toString(), inline: true },
                            { name: "⏰ Última Atualização", value: `<t:${Math.floor(Date.now() / 1000)}:R>`, inline: true }
                        )
                        .setColor(0x00ff00)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                }

                default:
                    await interaction.editReply({ content: "❌ Ação não implementada ainda!" });
            }

        } catch (error) {
            console.error("Erro em dm-control:", error);
            await interaction.editReply({ 
                content: `❌ **Erro:** ${error instanceof Error ? error.message : "Erro desconhecido"}` 
            });
            return;
        }
    }
});

async function createControlPanel(guild: any) {
    const embed = new EmbedBuilder()
        .setTitle(`🎮 Painel de Controle: ${guild.name}`)
        .setThumbnail(guild.iconURL())
        .setDescription(
            `**📊 Informações do Servidor:**\n` +
            `├ 🆔 ID: \`${guild.id}\`\n` +
            `├ 👥 Membros: ${guild.memberCount}\n` +
            `├ 📝 Canais: ${guild.channels.cache.size}\n` +
            `├ 🎭 Cargos: ${guild.roles.cache.size}\n` +
            `└ 👑 Owner: <@${guild.ownerId}>\n\n` +
            `**⚡ Comandos Disponíveis:**`
        )
        .addFields(
            {
                name: "🔧 Administração",
                value: "```\n" +
                       `/server-admin acao:Criar Canal servidor:${guild.id}\n` +
                       `/server-admin acao:Deletar Canal servidor:${guild.id}\n` +
                       `/server-admin acao:Listar Canais servidor:${guild.id}\n` +
                       "```",
                inline: false
            },
            {
                name: "👥 Usuários",
                value: "```\n" +
                       `/user-admin acao:Listar Membros servidor:${guild.id}\n` +
                       `/user-admin acao:Banir servidor:${guild.id}\n` +
                       `/user-admin acao:Dar Cargo servidor:${guild.id}\n` +
                       "```",
                inline: false
            }
        )
        .setColor(0x0099ff)
        .setTimestamp();

    return { embeds: [embed] };
}
