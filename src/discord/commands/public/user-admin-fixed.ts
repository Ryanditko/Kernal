import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "#base";

createCommand({
    name: "user-admin",
    description: "👥 Gerenciamento completo de usuários via DM - Moderação avançada",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Escolha a ação de moderação",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "👥 Listar Membros", value: "list_members" },
                { name: "🔍 Info do Usuário", value: "user_info" },
                { name: "⚡ Dar Cargo", value: "add_role" },
                { name: "🔒 Remover Cargo", value: "remove_role" },
                { name: "🚫 Banir", value: "ban" },
                { name: "👢 Expulsar", value: "kick" },
                { name: "🔇 Timeout", value: "timeout" },
                { name: "🔊 Remover Timeout", value: "remove_timeout" },
                { name: "📝 Alterar Nick", value: "change_nick" },
                { name: "🎭 Listar Cargos", value: "list_roles" },
                { name: "➕ Criar Cargo", value: "create_role" },
                { name: "❌ Deletar Cargo", value: "delete_role" },
                { name: "🔄 Mover Canal Voz", value: "move_voice" },
                { name: "📊 Histórico de Ações", value: "action_history" },
                { name: "📢 Enviar Mensagem", value: "send_message" },
                { name: "🗑️ Limpar Canal", value: "clear_channel" },
                { name: "🔐 Bloquear Canal", value: "lock_channel" },
                { name: "🔓 Desbloquear Canal", value: "unlock_channel" },
                { name: "👑 Dar Admin", value: "give_admin" },
                { name: "🚪 Desconectar Voz", value: "disconnect_voice" }
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
            name: "motivo",
            description: "Motivo da ação",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "tempo",
            description: "Tempo para timeout (em minutos)",
            type: ApplicationCommandOptionType.Integer,
            required: false
        },
        {
            name: "nick",
            description: "Novo nickname",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "canal",
            description: "ID do canal",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "mensagem",
            description: "Mensagem para enviar",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "quantidade",
            description: "Quantidade de mensagens para limpar",
            type: ApplicationCommandOptionType.Integer,
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
        const usuarioInput = interaction.options.getString("usuario");
        const cargoInput = interaction.options.getString("cargo");
        const motivo = interaction.options.getString("motivo") || "Ação administrativa via DM";
        const tempo = interaction.options.getInteger("tempo");
        const nick = interaction.options.getString("nick");
        const canalId = interaction.options.getString("canal");
        const mensagem = interaction.options.getString("mensagem");
        const quantidade = interaction.options.getInteger("quantidade") || 10;

        try {
            await interaction.deferReply({ ephemeral: true });

            // Selecionar servidor
            const guild = servidorId ? 
                interaction.client.guilds.cache.get(servidorId) :
                interaction.client.guilds.cache.first();
            
            if (!guild) {
                await interaction.editReply({ content: "❌ Servidor não encontrado!" });
                return;
            }

            switch (acao) {
                case "list_members": {
                    await guild.members.fetch();
                    const members = guild.members.cache
                        .sort((a, b) => (b.joinedTimestamp || 0) - (a.joinedTimestamp || 0))
                        .first(20)
                        .map(member => {
                            const status = member.presence?.status === "online" ? "🟢" :
                                          member.presence?.status === "idle" ? "🟡" :
                                          member.presence?.status === "dnd" ? "🔴" : "⚫";
                            
                            const roles = member.roles.cache
                                .filter(r => r.id !== guild.id)
                                .map(r => r.name)
                                .slice(0, 3)
                                .join(", ");
                            
                            return `${status} **${member.displayName}** \`${member.id}\`\n` +
                                   `├ Entrou: <t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:R>\n` +
                                   `└ Cargos: ${roles || "Nenhum"}`;
                        });

                    const embed = new EmbedBuilder()
                        .setTitle(`👥 Membros de ${guild.name}`)
                        .setDescription(members.join("\n\n"))
                        .addFields({ 
                            name: "📊 Estatísticas", 
                            value: `**Total:** ${guild.memberCount} membros\n**Online:** ${guild.members.cache.filter(m => m.presence?.status === "online").size}` 
                        })
                        .setColor(0x0099ff)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "user_info": {
                    if (!usuarioInput) {
                        await interaction.editReply({ content: "❌ ID do usuário é obrigatório!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado no servidor!" });
                        return;
                    }

                    const roles = member.roles.cache
                        .filter(r => r.id !== guild.id)
                        .map(r => `<@&${r.id}>`)
                        .join(" ") || "Nenhum";

                    const permissions = member.permissions.toArray().slice(0, 10).join(", ");

                    const embed = new EmbedBuilder()
                        .setTitle(`🔍 Informações: ${member.displayName}`)
                        .setThumbnail(member.displayAvatarURL())
                        .addFields(
                            { name: "🆔 ID", value: member.id, inline: true },
                            { name: "📛 Username", value: member.user.username, inline: true },
                            { name: "🏷️ Nickname", value: member.nickname || "Nenhum", inline: true },
                            { name: "📅 Conta Criada", value: `<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`, inline: true },
                            { name: "📥 Entrou no Servidor", value: `<t:${Math.floor((member.joinedTimestamp || 0) / 1000)}:F>`, inline: true },
                            { name: "🎭 Cargos", value: roles, inline: false },
                            { name: "⚡ Permissões", value: permissions || "Nenhuma especial", inline: false }
                        )
                        .setColor(member.displayHexColor)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "add_role": {
                    if (!usuarioInput || !cargoInput) {
                        await interaction.editReply({ content: "❌ Usuário e cargo são obrigatórios!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    const role = guild.roles.cache.find(r => 
                        r.name.toLowerCase() === cargoInput.toLowerCase() ||
                        r.id === cargoInput ||
                        r.id === cargoInput.replace(/[<@&>]/g, "")
                    );

                    if (!role) {
                        await interaction.editReply({ content: "❌ Cargo não encontrado!" });
                        return;
                    }

                    await member.roles.add(role, motivo);

                    await interaction.editReply({ 
                        content: `✅ Cargo **${role.name}** adicionado a **${member.displayName}**!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📝 Motivo: ${motivo}`
                    });
                    break;
                }

                case "remove_role": {
                    if (!usuarioInput || !cargoInput) {
                        await interaction.editReply({ content: "❌ Usuário e cargo são obrigatórios!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    const role = guild.roles.cache.find(r => 
                        r.name.toLowerCase() === cargoInput.toLowerCase() ||
                        r.id === cargoInput ||
                        r.id === cargoInput.replace(/[<@&>]/g, "")
                    );

                    if (!role) {
                        await interaction.editReply({ content: "❌ Cargo não encontrado!" });
                        return;
                    }

                    await member.roles.remove(role, motivo);

                    await interaction.editReply({ 
                        content: `✅ Cargo **${role.name}** removido de **${member.displayName}**!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📝 Motivo: ${motivo}`
                    });
                    break;
                }

                case "ban": {
                    if (!usuarioInput) {
                        await interaction.editReply({ content: "❌ ID do usuário é obrigatório!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    
                    try {
                        const user = await interaction.client.users.fetch(userId);
                        await guild.members.ban(userId, { reason: motivo });

                        await interaction.editReply({ 
                            content: `✅ **${user.username}** foi banido!\n` +
                                    `📍 Servidor: **${guild.name}**\n` +
                                    `📝 Motivo: ${motivo}`
                        });
                    } catch (error) {
                        await interaction.editReply({ content: "❌ Erro ao banir usuário!" });
                    }
                    break;
                }

                case "kick": {
                    if (!usuarioInput) {
                        await interaction.editReply({ content: "❌ ID do usuário é obrigatório!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    await member.kick(motivo);

                    await interaction.editReply({ 
                        content: `✅ **${member.displayName}** foi expulso!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📝 Motivo: ${motivo}`
                    });
                    break;
                }

                case "timeout": {
                    if (!usuarioInput || !tempo) {
                        await interaction.editReply({ content: "❌ Usuário e tempo são obrigatórios!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    const timeoutUntil = Date.now() + (tempo * 60 * 1000);
                    await member.timeout(timeoutUntil, motivo);

                    await interaction.editReply({ 
                        content: `✅ **${member.displayName}** foi silenciado por **${tempo} minutos**!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📝 Motivo: ${motivo}`
                    });
                    break;
                }

                case "remove_timeout": {
                    if (!usuarioInput) {
                        await interaction.editReply({ content: "❌ ID do usuário é obrigatório!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    await member.timeout(null, motivo);

                    await interaction.editReply({ 
                        content: `✅ Timeout removido de **${member.displayName}**!\n` +
                                `📍 Servidor: **${guild.name}**`
                    });
                    break;
                }

                case "change_nick": {
                    if (!usuarioInput || !nick) {
                        await interaction.editReply({ content: "❌ Usuário e nickname são obrigatórios!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    const oldNick = member.nickname || member.user.username;
                    await member.setNickname(nick, motivo);

                    await interaction.editReply({ 
                        content: `✅ Nickname alterado!\n` +
                                `👤 Usuário: **${member.user.username}**\n` +
                                `🔄 De: **${oldNick}** → **${nick}**\n` +
                                `📍 Servidor: **${guild.name}**`
                    });
                    break;
                }

                case "send_message": {
                    if (!canalId || !mensagem) {
                        await interaction.editReply({ content: "❌ Canal e mensagem são obrigatórios!" });
                        return;
                    }

                    const channel = guild.channels.cache.get(canalId);
                    
                    if (!channel || !channel.isTextBased()) {
                        await interaction.editReply({ content: "❌ Canal não encontrado ou não é de texto!" });
                        return;
                    }

                    await channel.send(mensagem);

                    await interaction.editReply({ 
                        content: `✅ Mensagem enviada!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📢 Canal: <#${canalId}>\n` +
                                `💬 Mensagem: ${mensagem.substring(0, 100)}${mensagem.length > 100 ? '...' : ''}`
                    });
                    break;
                }

                case "clear_channel": {
                    if (!canalId) {
                        await interaction.editReply({ content: "❌ ID do canal é obrigatório!" });
                        return;
                    }

                    const channel = guild.channels.cache.get(canalId);
                    
                    if (!channel || !channel.isTextBased()) {
                        await interaction.editReply({ content: "❌ Canal não encontrado ou não é de texto!" });
                        return;
                    }

                    const messages = await channel.messages.fetch({ limit: quantidade });
                    await channel.bulkDelete(messages);

                    await interaction.editReply({ 
                        content: `✅ **${messages.size}** mensagens deletadas!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📢 Canal: <#${canalId}>`
                    });
                    break;
                }

                case "lock_channel": {
                    if (!canalId) {
                        await interaction.editReply({ content: "❌ ID do canal é obrigatório!" });
                        return;
                    }

                    const channel = guild.channels.cache.get(canalId);
                    
                    if (!channel || !('permissionOverwrites' in channel)) {
                        await interaction.editReply({ content: "❌ Canal não encontrado ou não suporta permissões!" });
                        return;
                    }

                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: false
                    });

                    await interaction.editReply({ 
                        content: `🔐 Canal bloqueado!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📢 Canal: <#${canalId}>`
                    });
                    break;
                }

                case "unlock_channel": {
                    if (!canalId) {
                        await interaction.editReply({ content: "❌ ID do canal é obrigatório!" });
                        return;
                    }

                    const channel = guild.channels.cache.get(canalId);
                    
                    if (!channel || !('permissionOverwrites' in channel)) {
                        await interaction.editReply({ content: "❌ Canal não encontrado ou não suporta permissões!" });
                        return;
                    }

                    await channel.permissionOverwrites.edit(guild.roles.everyone, {
                        SendMessages: null
                    });

                    await interaction.editReply({ 
                        content: `🔓 Canal desbloqueado!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📢 Canal: <#${canalId}>`
                    });
                    break;
                }

                case "give_admin": {
                    if (!usuarioInput) {
                        await interaction.editReply({ content: "❌ ID do usuário é obrigatório!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    // Procurar por cargo de admin ou criar um
                    let adminRole = guild.roles.cache.find(r => r.permissions.has("Administrator"));
                    
                    if (!adminRole) {
                        adminRole = await guild.roles.create({
                            name: "👑 Admin",
                            permissions: ["Administrator"],
                            color: "Red",
                            reason: "Cargo admin criado via DM"
                        });
                    }

                    await member.roles.add(adminRole, motivo);

                    await interaction.editReply({ 
                        content: `👑 **${member.displayName}** agora é administrador!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `🎭 Cargo: **${adminRole.name}**`
                    });
                    break;
                }

                case "disconnect_voice": {
                    if (!usuarioInput) {
                        await interaction.editReply({ content: "❌ ID do usuário é obrigatório!" });
                        return;
                    }

                    const userId = usuarioInput.replace(/[<@!>]/g, "");
                    const member = await guild.members.fetch(userId).catch(() => null);
                    
                    if (!member) {
                        await interaction.editReply({ content: "❌ Usuário não encontrado!" });
                        return;
                    }

                    if (!member.voice.channel) {
                        await interaction.editReply({ content: "❌ Usuário não está em canal de voz!" });
                        return;
                    }

                    await member.voice.disconnect(motivo);

                    await interaction.editReply({ 
                        content: `🚪 **${member.displayName}** foi desconectado do canal de voz!\n` +
                                `📍 Servidor: **${guild.name}**`
                    });
                    break;
                }

                case "list_roles": {
                    const roles = guild.roles.cache
                        .filter(r => r.id !== guild.id)
                        .sort((a, b) => b.position - a.position)
                        .first(20)
                        .map(role => {
                            const members = role.members.size;
                            const color = role.hexColor !== "#000000" ? role.hexColor : "Sem cor";
                            const permissions = role.permissions.has("Administrator") ? "👑 Admin" : 
                                              role.permissions.has("ManageGuild") ? "🛡️ Mod" : "👤 Normal";
                            return `**${role.name}** \`${role.id}\`\n` +
                                   `├ Membros: ${members}\n` +
                                   `├ Cor: ${color}\n` +
                                   `├ Posição: ${role.position}\n` +
                                   `└ Tipo: ${permissions}`;
                        });

                    const embed = new EmbedBuilder()
                        .setTitle(`🎭 Cargos de ${guild.name}`)
                        .setDescription(roles.join("\n\n") || "Nenhum cargo encontrado")
                        .setColor(0x0099ff)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [embed] });
                    break;
                }

                case "create_role": {
                    if (!cargoInput) {
                        await interaction.editReply({ content: "❌ Nome do cargo é obrigatório!" });
                        return;
                    }

                    const newRole = await guild.roles.create({
                        name: cargoInput,
                        reason: motivo
                    });

                    await interaction.editReply({ 
                        content: `✅ Cargo **${newRole.name}** criado!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `🆔 ID: \`${newRole.id}\`\n` +
                                `📝 Motivo: ${motivo}`
                    });
                    break;
                }

                case "delete_role": {
                    if (!cargoInput) {
                        await interaction.editReply({ content: "❌ Nome/ID do cargo é obrigatório!" });
                        return;
                    }

                    const role = guild.roles.cache.find(r => 
                        r.name.toLowerCase() === cargoInput.toLowerCase() ||
                        r.id === cargoInput ||
                        r.id === cargoInput.replace(/[<@&>]/g, "")
                    );

                    if (!role) {
                        await interaction.editReply({ content: "❌ Cargo não encontrado!" });
                        return;
                    }

                    const roleName = role.name;
                    await role.delete(motivo);

                    await interaction.editReply({ 
                        content: `✅ Cargo **${roleName}** deletado!\n` +
                                `📍 Servidor: **${guild.name}**\n` +
                                `📝 Motivo: ${motivo}`
                    });
                    break;
                }

                default:
                    await interaction.editReply({ content: "❌ Ação não encontrada!" });
                    break;
            }

        } catch (error) {
            console.error("Erro em user-admin:", error);
            await interaction.editReply({ 
                content: `❌ **Erro:** ${error instanceof Error ? error.message : "Erro desconhecido"}` 
            });
        }
    }
});
