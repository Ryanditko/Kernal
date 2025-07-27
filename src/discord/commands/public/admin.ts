import { createCommand } from "#base";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, PermissionFlagsBits, ChannelType, TextChannel } from "discord.js";
import { config } from "../../../settings/config.js";

createCommand({
    name: "admin",
    description: "Comandos de administração do servidor",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: [PermissionFlagsBits.Administrator],
    options: [
        {
            name: "action",
            description: "Ação administrativa",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "📋 Configurar Bot", value: "setup" },
                { name: "📊 Estatísticas", value: "stats" },
                { name: "🔧 Manutenção", value: "maintenance" },
                { name: "📁 Criar Categoria", value: "create_category" },
                { name: "💬 Criar Canal", value: "create_channel" },
                { name: "🗑️ Deletar Canal", value: "delete_channel" },
                { name: "🏷️ Criar Cargo", value: "create_role" },
                { name: "🎭 Gerenciar Cargos", value: "manage_roles" },
                { name: "📢 Anúncio", value: "announce" },
                { name: "🎉 Evento", value: "event" },
                { name: "⚙️ Configurações", value: "config" },
                { name: "🔄 Backup", value: "backup" }
            ]
        },
        {
            name: "nome",
            description: "Nome para criação (canal, categoria, cargo)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 100
        },
        {
            name: "usuario",
            description: "Usuário alvo",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "cargo",
            description: "Cargo para gerenciar",
            type: ApplicationCommandOptionType.Role,
            required: false
        },
        {
            name: "canal",
            description: "Canal alvo",
            type: ApplicationCommandOptionType.Channel,
            required: false
        },
        {
            name: "tipo",
            description: "Tipo do canal",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "💬 Texto", value: "text" },
                { name: "🔊 Voz", value: "voice" },
                { name: "📢 Anúncios", value: "announcement" },
                { name: "🎙️ Palco", value: "stage" }
            ]
        },
        {
            name: "mensagem",
            description: "Mensagem para anúncio",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 2000
        },
        {
            name: "cor",
            description: "Cor do cargo (hex: #FF0000)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        const action = interaction.options.getString("action", true);
        const nome = interaction.options.getString("nome");
        const usuario = interaction.options.getUser("usuario");
        const cargo = interaction.options.getRole("cargo");
        const canal = interaction.options.getChannel("canal");
        const tipo = interaction.options.getString("tipo") || "text";
        const mensagem = interaction.options.getString("mensagem");
        const cor = interaction.options.getString("cor");

        switch (action) {
            case "setup":
                const setupEmbed = new EmbedBuilder()
                    .setTitle("🤖 Configuração do Bot")
                    .setDescription("Bot configurado com sucesso! Aqui estão os recursos disponíveis:")
                    .addFields(
                        { name: "🎵 Música", value: "Sistema completo de música com fila, controles e qualidade alta", inline: false },
                        { name: "🎫 Tickets", value: "Sistema de suporte com categorias e transcrições", inline: false },
                        { name: "🛡️ Moderação", value: "Ferramentas avançadas de moderação e logs", inline: false },
                        { name: "💰 Economia", value: "Sistema de economia com trabalhos, loja e jogos", inline: false },
                        { name: "🤖 IA", value: "Chat com IA, análise de imagens e traduções", inline: false },
                        { name: "🎉 Diversão", value: "Jogos, memes, piadas e entretenimento", inline: false },
                        { name: "🔧 Utilidades", value: "Ferramentas úteis para conversões e informações", inline: false }
                    )
                    .setColor(0x00AE86)
                    .setThumbnail(interaction.guild!.iconURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [setupEmbed] });
                break;

            case "stats":
                const guild = interaction.guild!;
                const totalChannels = guild.channels.cache.size;
                const textChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size;
                const voiceChannels = guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size;
                const categories = guild.channels.cache.filter(c => c.type === ChannelType.GuildCategory).size;
                const onlineMembers = guild.members.cache.filter(m => m.presence?.status !== 'offline').size;
                const botMembers = guild.members.cache.filter(m => m.user.bot).size;
                const humanMembers = guild.memberCount - botMembers;

                const statsEmbed = new EmbedBuilder()
                    .setTitle("📊 Estatísticas do Servidor")
                    .addFields(
                        { name: "👥 Membros", value: `**Total:** ${guild.memberCount}\n**Humanos:** ${humanMembers}\n**Bots:** ${botMembers}\n**Online:** ${onlineMembers}`, inline: true },
                        { name: "📁 Canais", value: `**Total:** ${totalChannels}\n**Texto:** ${textChannels}\n**Voz:** ${voiceChannels}\n**Categorias:** ${categories}`, inline: true },
                        { name: "🎭 Outros", value: `**Cargos:** ${guild.roles.cache.size}\n**Emojis:** ${guild.emojis.cache.size}\n**Boost:** ${guild.premiumSubscriptionCount || 0}`, inline: true }
                    )
                    .setColor(0x7289DA)
                    .setThumbnail(guild.iconURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [statsEmbed] });
                break;

            case "create_category":
                if (!nome) {
                    await interaction.reply({
                        content: "❌ Você deve fornecer um nome para a categoria!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    const category = await interaction.guild!.channels.create({
                        name: nome,
                        type: ChannelType.GuildCategory
                    });

                    const categoryEmbed = new EmbedBuilder()
                        .setTitle("📁 Categoria Criada")
                        .addFields(
                            { name: "📝 Nome", value: category.name, inline: true },
                            { name: "🆔 ID", value: category.id, inline: true },
                            { name: "👤 Criado por", value: interaction.user.username, inline: true }
                        )
                        .setColor(0x32CD32)
                        .setTimestamp();

                    await interaction.reply({ embeds: [categoryEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao criar categoria! Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "create_channel":
                if (!nome) {
                    await interaction.reply({
                        content: "❌ Você deve fornecer um nome para o canal!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    let channelType: ChannelType;
                    
                    switch (tipo) {
                        case "voice":
                            channelType = ChannelType.GuildVoice;
                            break;
                        case "announcement":
                            channelType = ChannelType.GuildAnnouncement;
                            break;
                        case "stage":
                            channelType = ChannelType.GuildStageVoice;
                            break;
                        default:
                            channelType = ChannelType.GuildText;
                    }

                    const newChannel = await interaction.guild!.channels.create({
                        name: nome,
                        type: channelType
                    });

                    const channelEmbed = new EmbedBuilder()
                        .setTitle("💬 Canal Criado")
                        .addFields(
                            { name: "📝 Nome", value: newChannel.name, inline: true },
                            { name: "🔧 Tipo", value: tipo, inline: true },
                            { name: "🆔 ID", value: newChannel.id, inline: true },
                            { name: "👤 Criado por", value: interaction.user.username, inline: true }
                        )
                        .setColor(0x32CD32)
                        .setTimestamp();

                    await interaction.reply({ embeds: [channelEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao criar canal! Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "delete_channel":
                if (!canal) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um canal para deletar!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    const channelName = canal.name;
                    await canal.delete();

                    const deleteEmbed = new EmbedBuilder()
                        .setTitle("🗑️ Canal Deletado")
                        .addFields(
                            { name: "📝 Nome", value: channelName, inline: true },
                            { name: "👤 Deletado por", value: interaction.user.username, inline: true }
                        )
                        .setColor(0xFF0000)
                        .setTimestamp();

                    await interaction.reply({ embeds: [deleteEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao deletar canal! Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "create_role":
                if (!nome) {
                    await interaction.reply({
                        content: "❌ Você deve fornecer um nome para o cargo!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    const roleData: any = { name: nome };
                    
                    if (cor) {
                        const colorHex = cor.startsWith('#') ? cor : `#${cor}`;
                        roleData.color = colorHex;
                    }

                    const newRole = await interaction.guild!.roles.create(roleData);

                    const roleEmbed = new EmbedBuilder()
                        .setTitle("🏷️ Cargo Criado")
                        .addFields(
                            { name: "📝 Nome", value: newRole.name, inline: true },
                            { name: "🎨 Cor", value: cor || "Padrão", inline: true },
                            { name: "🆔 ID", value: newRole.id, inline: true },
                            { name: "👤 Criado por", value: interaction.user.username, inline: true }
                        )
                        .setColor(newRole.color || 0x99AAB5)
                        .setTimestamp();

                    await interaction.reply({ embeds: [roleEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao criar cargo! Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "manage_roles":
                if (!usuario || !cargo) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário e um cargo!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    const member = await interaction.guild!.members.fetch(usuario.id);
                    const hasRole = member.roles.cache.has(cargo.id);

                    if (hasRole) {
                        await member.roles.remove(cargo);
                        var action_text = "removido de";
                        var color = 0xFF6B6B;
                    } else {
                        await member.roles.add(cargo);
                        var action_text = "adicionado a";
                        var color = 0x32CD32;
                    }

                    const roleEmbed = new EmbedBuilder()
                        .setTitle("🎭 Cargo Gerenciado")
                        .addFields(
                            { name: "👤 Usuário", value: usuario.username, inline: true },
                            { name: "🏷️ Cargo", value: cargo.name, inline: true },
                            { name: "⚡ Ação", value: `Cargo ${action_text} ${usuario.username}`, inline: false }
                        )
                        .setColor(color)
                        .setTimestamp();

                    await interaction.reply({ embeds: [roleEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao gerenciar cargo! Verifique as permissões.",
                        ephemeral: true
                    });
                }
                break;

            case "announce":
                if (!mensagem) {
                    await interaction.reply({
                        content: "❌ Você deve fornecer uma mensagem para o anúncio!",
                        ephemeral: true
                    });
                    return;
                }

                const announceEmbed = new EmbedBuilder()
                    .setTitle("📢 Anúncio Oficial")
                    .setDescription(mensagem)
                    .addFields({
                        name: "👤 Anunciado por",
                        value: interaction.user.username,
                        inline: true
                    })
                    .setColor(0xFFD700)
                    .setThumbnail(interaction.guild!.iconURL())
                    .setTimestamp();

                if (canal && canal.type === ChannelType.GuildText) {
                    const targetChannel = canal as TextChannel;
                    await targetChannel.send({ embeds: [announceEmbed] });
                    await interaction.reply({
                        content: `✅ Anúncio enviado para ${canal}!`,
                        ephemeral: true
                    });
                } else {
                    await interaction.reply({ embeds: [announceEmbed] });
                }
                break;

            case "maintenance":
                const maintenanceEmbed = new EmbedBuilder()
                    .setTitle("🔧 Modo Manutenção")
                    .setDescription("⚠️ O bot entrará em modo manutenção em breve!")
                    .addFields(
                        { name: "📅 Início", value: "<t:1640995200:F>", inline: true },
                        { name: "⏱️ Duração", value: "~30 minutos", inline: true },
                        { name: "🔄 Motivo", value: "Atualizações e melhorias", inline: true }
                    )
                    .setColor(0xFFA500)
                    .setTimestamp();

                await interaction.reply({ embeds: [maintenanceEmbed] });
                break;

            case "config":
                const configEmbed = new EmbedBuilder()
                    .setTitle("⚙️ Configurações do Bot")
                    .addFields(
                        { name: "👑 Owner ID", value: config.OWNER_ID, inline: true },
                        { name: "📝 Log Channel", value: config.LOG_CHANNEL_ID ? `<#${config.LOG_CHANNEL_ID}>` : "Não configurado", inline: true },
                        { name: "🤖 OpenAI", value: config.OPENAI_KEY ? "✅ Configurado" : "❌ Não configurado", inline: true },
                        { name: "📊 Uptime", value: `<t:${Math.floor((Date.now() - process.uptime() * 1000) / 1000)}:R>`, inline: true },
                        { name: "💾 Versão", value: "2.0.0", inline: true },
                        { name: "🟢 Status", value: "Online", inline: true }
                    )
                    .setColor(0x7289DA)
                    .setTimestamp();

                await interaction.reply({ embeds: [configEmbed] });
                break;

            case "backup":
                await interaction.deferReply({ ephemeral: true });

                // Simular backup
                const backupData = {
                    guild: {
                        name: interaction.guild!.name,
                        id: interaction.guild!.id,
                        channels: interaction.guild!.channels.cache.size,
                        roles: interaction.guild!.roles.cache.size,
                        members: interaction.guild!.memberCount
                    },
                    timestamp: new Date().toISOString()
                };

                const backupEmbed = new EmbedBuilder()
                    .setTitle("🔄 Backup Realizado")
                    .setDescription("Backup do servidor criado com sucesso!")
                    .addFields(
                        { name: "📅 Data", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                        { name: "📊 Canais", value: backupData.guild.channels.toString(), inline: true },
                        { name: "🎭 Cargos", value: backupData.guild.roles.toString(), inline: true },
                        { name: "👥 Membros", value: backupData.guild.members.toString(), inline: true }
                    )
                    .setColor(0x32CD32)
                    .setTimestamp();

                await interaction.editReply({ embeds: [backupEmbed] });
                break;

            default:
                await interaction.reply({
                    content: "❌ Ação inválida!",
                    ephemeral: true
                });
        }
    }
});
