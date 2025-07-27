import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType, 
    EmbedBuilder, 
    ChannelType
} from "discord.js";
import { registerInfraction } from "./infractions.js";

createCommand({
    name: "super-admin",
    description: "🔱 Administração suprema - Todas as funções de administrador Discord",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "categoria",
            description: "Categoria de administração",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "📝 Gerenciar Canais", value: "channels" },
                { name: "🎭 Gerenciar Cargos", value: "roles" },
                { name: "👥 Gerenciar Membros", value: "members" },
                { name: "🔒 Gerenciar Permissões", value: "permissions" },
                { name: "⚙️ Configurar Servidor", value: "server" },
                { name: "🚨 Moderação Avançada", value: "moderation" },
                { name: "📊 Auditoria e Logs", value: "audit" },
                { name: "🤖 Gerenciar Bots", value: "bots" }
            ]
        },
        {
            name: "acao",
            description: "Ação específica a executar",
            type: ApplicationCommandOptionType.String,
            required: true
        },
        {
            name: "servidor",
            description: "ID do servidor",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "alvo",
            description: "ID do alvo (canal, cargo, usuário, etc)",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "parametro1",
            description: "Parâmetro adicional",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "parametro2",
            description: "Parâmetro adicional",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "parametro3",
            description: "Parâmetro adicional",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        // Verificar se é o owner
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Acesso Ultra-Restrito")
                .setDescription("Este comando é exclusivo para o proprietário supremo do bot.")
                .setColor(0xFF0000)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const categoria = interaction.options.getString("categoria", true);
        const acao = interaction.options.getString("acao", true);
        const servidorId = interaction.options.getString("servidor");
        const alvo = interaction.options.getString("alvo");
        const param1 = interaction.options.getString("parametro1");
        const param2 = interaction.options.getString("parametro2");
        const param3 = interaction.options.getString("parametro3");

        await interaction.deferReply({ ephemeral: true });

        try {
            const guild = servidorId ? 
                interaction.client.guilds.cache.get(servidorId) :
                interaction.client.guilds.cache.first();
            
            if (!guild) {
                await interaction.editReply("❌ Servidor não encontrado!");
                return;
            }

            switch (categoria) {
                case "channels":
                    await handleChannels(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                case "roles":
                    await handleRoles(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                case "members":
                    await handleMembers(interaction, acao, guild, alvo, param1, param2);
                    break;
                case "permissions":
                    await handlePermissions(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                case "server":
                    await handleServer(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                case "moderation":
                    await handleModeration(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                case "audit":
                    await handleAudit(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                case "bots":
                    await handleBots(interaction, acao, guild, alvo, param1, param2, param3);
                    break;
                default:
                    await interaction.editReply("❌ Categoria não reconhecida!");
            }

        } catch (error) {
            console.error("Erro no super-admin:", error);
            await interaction.editReply(`❌ **Erro:** ${error instanceof Error ? error.message : "Erro desconhecido"}`);
        }
    }
});

// ===== GERENCIAMENTO DE CANAIS =====
async function handleChannels(interaction: any, acao: string, guild: any, alvo: string | null, param1: string | null, param2: string | null, param3: string | null) {
    switch (acao) {
        case "criar-texto":
            if (!param1) {
                await interaction.editReply("❌ Nome do canal é obrigatório!");
                return;
            }
            const textChannel = await guild.channels.create({
                name: param1,
                type: ChannelType.GuildText,
                topic: param2 || undefined,
                parent: param3 || undefined
            });
            await interaction.editReply(`✅ Canal de texto **#${textChannel.name}** criado! ID: \`${textChannel.id}\``);
            break;

        case "criar-voz":
            if (!param1) {
                await interaction.editReply("❌ Nome do canal é obrigatório!");
                return;
            }
            const voiceChannel = await guild.channels.create({
                name: param1,
                type: ChannelType.GuildVoice,
                userLimit: param2 ? parseInt(param2) : undefined,
                parent: param3 || undefined
            });
            await interaction.editReply(`✅ Canal de voz **${voiceChannel.name}** criado! ID: \`${voiceChannel.id}\``);
            break;

        case "criar-categoria":
            if (!param1) {
                await interaction.editReply("❌ Nome da categoria é obrigatório!");
                return;
            }
            const category = await guild.channels.create({
                name: param1,
                type: ChannelType.GuildCategory
            });
            await interaction.editReply(`✅ Categoria **${category.name}** criada! ID: \`${category.id}\``);
            break;

        case "criar-anuncio":
            if (!param1) {
                await interaction.editReply("❌ Nome do canal é obrigatório!");
                return;
            }
            const announceChannel = await guild.channels.create({
                name: param1,
                type: ChannelType.GuildAnnouncement,
                topic: param2 || undefined
            });
            await interaction.editReply(`✅ Canal de anúncios **#${announceChannel.name}** criado! ID: \`${announceChannel.id}\``);
            break;

        case "criar-forum":
            if (!param1) {
                await interaction.editReply("❌ Nome do fórum é obrigatório!");
                return;
            }
            const forumChannel = await guild.channels.create({
                name: param1,
                type: ChannelType.GuildForum,
                topic: param2 || undefined
            });
            await interaction.editReply(`✅ Fórum **${forumChannel.name}** criado! ID: \`${forumChannel.id}\``);
            break;

        case "deletar":
            if (!alvo) {
                await interaction.editReply("❌ ID do canal é obrigatório!");
                return;
            }
            const channelToDelete = guild.channels.cache.get(alvo);
            if (!channelToDelete) {
                await interaction.editReply("❌ Canal não encontrado!");
                return;
            }
            const channelName = channelToDelete.name;
            await channelToDelete.delete(param1 || "Deletado via super-admin");
            await interaction.editReply(`✅ Canal **${channelName}** deletado!`);
            break;

        case "editar":
            if (!alvo || !param1) {
                await interaction.editReply("❌ ID do canal e novo nome são obrigatórios!");
                return;
            }
            const channelToEdit = guild.channels.cache.get(alvo);
            if (!channelToEdit) {
                await interaction.editReply("❌ Canal não encontrado!");
                return;
            }
            await channelToEdit.setName(param1);
            if (param2) await channelToEdit.setTopic(param2);
            await interaction.editReply(`✅ Canal editado! Novo nome: **${param1}**`);
            break;

        case "listar":
            const channels = guild.channels.cache
                .filter((c: any) => c.type !== ChannelType.GuildCategory)
                .map((channel: any) => {
                    const icon = channel.type === ChannelType.GuildText ? "📝" :
                                channel.type === ChannelType.GuildVoice ? "🔊" :
                                channel.type === ChannelType.GuildAnnouncement ? "📢" :
                                channel.type === ChannelType.GuildForum ? "🧵" : "📄";
                    return `${icon} **${channel.name}** \`${channel.id}\``;
                });

            const embed = new EmbedBuilder()
                .setTitle(`📝 Canais de ${guild.name}`)
                .setDescription(channels.join("\n") || "Nenhum canal encontrado")
                .setColor(0x0099ff)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            break;

        default:
            await interaction.editReply(`❌ Ação '${acao}' não disponível para canais!\n\n**Ações disponíveis:**\n• criar-texto\n• criar-voz\n• criar-categoria\n• criar-anuncio\n• criar-forum\n• deletar\n• editar\n• listar`);
    }
}

// ===== GERENCIAMENTO DE CARGOS =====
async function handleRoles(interaction: any, acao: string, guild: any, alvo: string | null, param1: string | null, param2: string | null, param3: string | null) {
    switch (acao) {
        case "criar":
            if (!param1) {
                await interaction.editReply("❌ Nome do cargo é obrigatório!");
                return;
            }
            const role = await guild.roles.create({
                name: param1,
                color: param2 || undefined,
                hoist: param3 === "true",
                mentionable: true
            });
            await interaction.editReply(`✅ Cargo **${role.name}** criado! ID: \`${role.id}\``);
            break;

        case "deletar":
            if (!alvo) {
                await interaction.editReply("❌ ID do cargo é obrigatório!");
                return;
            }
            const roleToDelete = guild.roles.cache.get(alvo);
            if (!roleToDelete) {
                await interaction.editReply("❌ Cargo não encontrado!");
                return;
            }
            const roleName = roleToDelete.name;
            await roleToDelete.delete(param1 || "Deletado via super-admin");
            await interaction.editReply(`✅ Cargo **${roleName}** deletado!`);
            break;

        case "editar":
            if (!alvo) {
                await interaction.editReply("❌ ID do cargo é obrigatório!");
                return;
            }
            const roleToEdit = guild.roles.cache.get(alvo);
            if (!roleToEdit) {
                await interaction.editReply("❌ Cargo não encontrado!");
                return;
            }
            
            const updates: any = {};
            if (param1) updates.name = param1;
            if (param2) updates.color = param2;
            if (param3 === "true" || param3 === "false") updates.hoist = param3 === "true";
            
            await roleToEdit.edit(updates);
            await interaction.editReply(`✅ Cargo **${roleToEdit.name}** editado!`);
            break;

        case "dar":
            if (!alvo || !param1) {
                await interaction.editReply("❌ ID do usuário e ID do cargo são obrigatórios!");
                return;
            }
            const member = await guild.members.fetch(alvo);
            const roleToGive = guild.roles.cache.get(param1);
            if (!member || !roleToGive) {
                await interaction.editReply("❌ Usuário ou cargo não encontrado!");
                return;
            }
            await member.roles.add(roleToGive, param2 || "Adicionado via super-admin");
            await interaction.editReply(`✅ Cargo **${roleToGive.name}** adicionado a **${member.displayName}**!`);
            break;

        case "remover":
            if (!alvo || !param1) {
                await interaction.editReply("❌ ID do usuário e ID do cargo são obrigatórios!");
                return;
            }
            const memberToRemove = await guild.members.fetch(alvo);
            const roleToRemove = guild.roles.cache.get(param1);
            if (!memberToRemove || !roleToRemove) {
                await interaction.editReply("❌ Usuário ou cargo não encontrado!");
                return;
            }
            await memberToRemove.roles.remove(roleToRemove, param2 || "Removido via super-admin");
            await interaction.editReply(`✅ Cargo **${roleToRemove.name}** removido de **${memberToRemove.displayName}**!`);
            break;

        case "listar":
            const roles = guild.roles.cache
                .filter((r: any) => r.id !== guild.id)
                .sort((a: any, b: any) => b.position - a.position)
                .map((role: any) => `🎭 **${role.name}** \`${role.id}\` - ${role.members.size} membros`);

            const roleEmbed = new EmbedBuilder()
                .setTitle(`🎭 Cargos de ${guild.name}`)
                .setDescription(roles.join("\n") || "Nenhum cargo encontrado")
                .setColor(0xFF8800)
                .setTimestamp();

            await interaction.editReply({ embeds: [roleEmbed] });
            break;

        default:
            await interaction.editReply(`❌ Ação '${acao}' não disponível para cargos!\n\n**Ações disponíveis:**\n• criar\n• deletar\n• editar\n• dar\n• remover\n• listar`);
    }
}

// ===== GERENCIAMENTO DE MEMBROS =====
async function handleMembers(interaction: any, acao: string, guild: any, alvo: string | null, param1: string | null, param2: string | null) {
    switch (acao) {
        case "banir":
            if (!alvo) {
                await interaction.editReply("❌ ID do usuário é obrigatório!");
                return;
            }
            try {
                const user = await interaction.client.users.fetch(alvo);
                await guild.members.ban(alvo, { 
                    reason: param1 || "Banido via super-admin",
                    deleteMessageDays: param2 ? parseInt(param2) : 0
                });
                
                // Registrar infração
                registerInfraction('ban', alvo, guild.id, param1 || "Banido via super-admin", interaction.user.id);
                
                await interaction.editReply(`✅ **${user.username}** foi banido!\n📝 Motivo: ${param1 || "Banido via super-admin"}`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao banir usuário!");
            }
            break;

        case "desbanir":
            if (!alvo) {
                await interaction.editReply("❌ ID do usuário é obrigatório!");
                return;
            }
            try {
                await guild.members.unban(alvo, param1 || "Desbanido via super-admin");
                
                // Registrar infração
                registerInfraction('unban', alvo, guild.id, param1 || "Desbanido via super-admin", interaction.user.id);
                
                await interaction.editReply(`✅ Usuário \`${alvo}\` foi desbanido!`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao desbanir usuário!");
            }
            break;

        case "expulsar":
            if (!alvo) {
                await interaction.editReply("❌ ID do usuário é obrigatório!");
                return;
            }
            try {
                const member = await guild.members.fetch(alvo);
                await member.kick(param1 || "Expulso via super-admin");
                
                // Registrar infração
                registerInfraction('kick', alvo, guild.id, param1 || "Expulso via super-admin", interaction.user.id);
                
                await interaction.editReply(`✅ **${member.displayName}** foi expulso!\n📝 Motivo: ${param1 || "Expulso via super-admin"}`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao expulsar usuário!");
            }
            break;

        case "timeout":
            if (!alvo || !param1) {
                await interaction.editReply("❌ ID do usuário e duração (minutos) são obrigatórios!");
                return;
            }
            try {
                const member = await guild.members.fetch(alvo);
                const duration = parseInt(param1) * 60 * 1000;
                await member.timeout(duration, param2 || "Timeout via super-admin");
                
                // Registrar infração
                registerInfraction('timeout', alvo, guild.id, param2 || "Timeout via super-admin", interaction.user.id, parseInt(param1));
                
                await interaction.editReply(`✅ **${member.displayName}** foi silenciado por **${param1} minutos**!\n📝 Motivo: ${param2 || "Timeout via super-admin"}`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao aplicar timeout!");
            }
            break;

        case "remover-timeout":
            if (!alvo) {
                await interaction.editReply("❌ ID do usuário é obrigatório!");
                return;
            }
            try {
                const member = await guild.members.fetch(alvo);
                await member.timeout(null, param1 || "Timeout removido via super-admin");
                await interaction.editReply(`✅ Timeout removido de **${member.displayName}**!`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao remover timeout!");
            }
            break;

        case "nick":
            if (!alvo || !param1) {
                await interaction.editReply("❌ ID do usuário e novo nickname são obrigatórios!");
                return;
            }
            try {
                const member = await guild.members.fetch(alvo);
                const oldNick = member.displayName;
                await member.setNickname(param1, param2 || "Nickname alterado via super-admin");
                await interaction.editReply(`✅ Nickname de **${oldNick}** alterado para **${param1}**!`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao alterar nickname!");
            }
            break;

        case "mover":
            if (!alvo || !param1) {
                await interaction.editReply("❌ ID do usuário e ID do canal de voz são obrigatórios!");
                return;
            }
            try {
                const member = await guild.members.fetch(alvo);
                const channel = guild.channels.cache.get(param1);
                if (!channel || channel.type !== ChannelType.GuildVoice) {
                    await interaction.editReply("❌ Canal de voz não encontrado!");
                    return;
                }
                await member.voice.setChannel(channel, param2 || "Movido via super-admin");
                await interaction.editReply(`✅ **${member.displayName}** movido para **${channel.name}**!`);
            } catch (error) {
                await interaction.editReply("❌ Erro ao mover usuário!");
            }
            break;

        case "info":
            if (!alvo) {
                await interaction.editReply("❌ ID do usuário é obrigatório!");
                return;
            }
            try {
                const member = await guild.members.fetch(alvo);
                const roles = member.roles.cache
                    .filter((r: any) => r.id !== guild.id)
                    .map((r: any) => `<@&${r.id}>`)
                    .join(" ") || "Nenhum";

                const embed = new EmbedBuilder()
                    .setTitle(`👤 Informações de ${member.displayName}`)
                    .setThumbnail(member.displayAvatarURL())
                    .addFields(
                        { name: "🆔 ID", value: member.id, inline: true },
                        { name: "📛 Username", value: member.user.username, inline: true },
                        { name: "🏷️ Nickname", value: member.nickname || "Nenhum", inline: true },
                        { name: "📅 Conta Criada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: "📥 Entrou no Servidor", value: `<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:F>`, inline: true },
                        { name: "🎭 Cargos", value: roles, inline: false }
                    )
                    .setColor(member.displayHexColor)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } catch (error) {
                await interaction.editReply("❌ Erro ao obter informações do usuário!");
            }
            break;

        default:
            await interaction.editReply(`❌ Ação '${acao}' não disponível para membros!\n\n**Ações disponíveis:**\n• banir\n• desbanir\n• expulsar\n• timeout\n• remover-timeout\n• nick\n• mover\n• info`);
    }
}

// ===== GERENCIAMENTO DE PERMISSÕES =====
async function handlePermissions(interaction: any, _acao: string, _guild: any, _alvo: string | null, _param1: string | null, _param2: string | null, _param3: string | null) {
    await interaction.editReply("🔒 **Sistema de Permissões**\n\nEsta funcionalidade estará disponível em breve!\n\n**Funcionalidades planejadas:**\n• Definir permissões de canal\n• Configurar overrides\n• Gerenciar permissões de cargo\n• Auditoria de permissões");
}

// ===== CONFIGURAÇÃO DE SERVIDOR =====
async function handleServer(interaction: any, acao: string, guild: any, _alvo: string | null, _param1: string | null, _param2: string | null, _param3: string | null) {
    switch (acao) {
        case "info":
            const embed = new EmbedBuilder()
                .setTitle(`🏰 ${guild.name}`)
                .setThumbnail(guild.iconURL())
                .addFields(
                    { name: "🆔 ID", value: guild.id, inline: true },
                    { name: "👑 Owner", value: `<@${guild.ownerId}>`, inline: true },
                    { name: "👥 Membros", value: guild.memberCount.toString(), inline: true },
                    { name: "📝 Canais", value: guild.channels.cache.size.toString(), inline: true },
                    { name: "🎭 Cargos", value: guild.roles.cache.size.toString(), inline: true },
                    { name: "📈 Boost Level", value: guild.premiumTier.toString(), inline: true },
                    { name: "📅 Criado", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: false }
                )
                .setColor(0x0099ff)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            break;

        default:
            await interaction.editReply(`❌ Ação '${acao}' não disponível para servidor!\n\n**Ações disponíveis:**\n• info`);
    }
}

// ===== MODERAÇÃO AVANÇADA =====
async function handleModeration(interaction: any, _acao: string, _guild: any, _alvo: string | null, _param1: string | null, _param2: string | null, _param3: string | null) {
    await interaction.editReply("🚨 **Sistema de Moderação Avançada**\n\nUse o comando `/infractions` para gerenciar infrações!\n\n**Comandos relacionados:**\n• `/infractions` - Sistema completo de infrações\n• `/monitor` - Monitoramento em tempo real\n• `/logs` - Visualizar logs\n• `/record-call` - Gravar conversas");
}

// ===== AUDITORIA E LOGS =====
async function handleAudit(interaction: any, _acao: string, _guild: any, _alvo: string | null, _param1: string | null, _param2: string | null, _param3: string | null) {
    await interaction.editReply("📊 **Sistema de Auditoria**\n\nUse os comandos específicos:\n\n• `/logs` - Sistema de logs completo\n• `/monitor` - Monitoramento ativo\n• `/infractions acao:Estatísticas` - Estatísticas de moderação");
}

// ===== GERENCIAMENTO DE BOTS =====
async function handleBots(interaction: any, acao: string, guild: any, _alvo: string | null, _param1: string | null, _param2: string | null, _param3: string | null) {
    switch (acao) {
        case "listar":
            const bots = guild.members.cache.filter((m: any) => m.user.bot);
            
            const botList = bots.map((bot: any) => 
                `🤖 **${bot.displayName}** \`${bot.id}\`\n` +
                `├ Status: ${bot.presence?.status || "offline"}\n` +
                `└ Criado: <t:${Math.floor(bot.user.createdTimestamp / 1000)}:R>`
            );

            const embed = new EmbedBuilder()
                .setTitle(`🤖 Bots em ${guild.name}`)
                .setDescription(botList.join("\n\n") || "Nenhum bot encontrado")
                .addFields({ name: "📊 Total", value: bots.size.toString() })
                .setColor(0x7289DA)
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });
            break;

        default:
            await interaction.editReply(`❌ Ação '${acao}' não disponível para bots!\n\n**Ações disponíveis:**\n• listar`);
    }
}
