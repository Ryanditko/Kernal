import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType, 
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    ComponentType
} from "discord.js";

createCommand({
    name: "admin-central",
    description: "🎛️ Central de Administração - Painel principal de controle",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "servidor",
            description: "ID do servidor (opcional)",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        // Verificar se é o owner
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Acesso Ultra-Restrito")
                .setDescription("Esta central é exclusiva para o proprietário supremo do bot.")
                .setColor(0xFF0000)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const servidorId = interaction.options.getString("servidor");
        const guild = servidorId ? 
            interaction.client.guilds.cache.get(servidorId) :
            interaction.client.guilds.cache.first();

        if (!guild) {
            await interaction.reply({ content: "❌ Servidor não encontrado! Use `/admin-dm` para listar servidores.", ephemeral: true });
            return;
        }

        // Criar embed principal
        const embed = new EmbedBuilder()
            .setTitle("🎛️ Central de Administração Kernal")
            .setDescription(`**Servidor Selecionado:** ${guild.name}\n**ID:** \`${guild.id}\`\n\n🎯 **Sistema de Administração Completo**\nTodas as funções de um administrador Discord em suas mãos.`)
            .addFields(
                {
                    name: "📝 Gerenciamento de Canais",
                    value: "• Criar/Editar/Deletar canais\n• Texto, Voz, Categoria, Fórum\n• Configurações avançadas",
                    inline: true
                },
                {
                    name: "🎭 Gerenciamento de Cargos",
                    value: "• Criar/Editar/Deletar cargos\n• Atribuir/Remover de membros\n• Configurar hierarquia",
                    inline: true
                },
                {
                    name: "👥 Gerenciamento de Membros",
                    value: "• Ban/Kick/Timeout\n• Alterar nicknames\n• Mover em canais de voz",
                    inline: true
                },
                {
                    name: "🚨 Moderação Avançada",
                    value: "• Sistema de infrações\n• Histórico de punições\n• Análise comportamental",
                    inline: true
                },
                {
                    name: "📊 Monitoramento",
                    value: "• Logs em tempo real\n• Gravação de calls\n• Analytics detalhados",
                    inline: true
                },
                {
                    name: "🔒 Segurança",
                    value: "• Controle de acesso\n• Auto-moderação IA\n• Detecção de spam",
                    inline: true
                }
            )
            .setColor(0x7C3AED)
            .setTimestamp()
            .setFooter({ text: "Kernal Bot - Administração Suprema" });

        // Criar botões de navegação
        const row1 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`admin_channels_${guild.id}`)
                    .setLabel("📝 Canais")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`admin_roles_${guild.id}`)
                    .setLabel("🎭 Cargos")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`admin_members_${guild.id}`)
                    .setLabel("👥 Membros")
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId(`admin_moderation_${guild.id}`)
                    .setLabel("🚨 Moderação")
                    .setStyle(ButtonStyle.Danger)
            );

        const row2 = new ActionRowBuilder<ButtonBuilder>()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId(`admin_monitoring_${guild.id}`)
                    .setLabel("📊 Monitoramento")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`admin_security_${guild.id}`)
                    .setLabel("🔒 Segurança")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`admin_server_${guild.id}`)
                    .setLabel("⚙️ Servidor")
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId(`admin_help_${guild.id}`)
                    .setLabel("❓ Ajuda")
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({ 
            embeds: [embed], 
            components: [row1, row2], 
            ephemeral: true 
        });

        // Collector para interações com botões
        const collector = interaction.channel?.createMessageComponentCollector({
            componentType: ComponentType.Button,
            time: 300000 // 5 minutos
        });

        collector?.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.user.id !== config.OWNER_ID) {
                await buttonInteraction.reply({ content: "❌ Apenas o owner pode usar esta central!", ephemeral: true });
                return;
            }

            await buttonInteraction.deferUpdate();
            
            const [category] = buttonInteraction.customId.split('_').slice(1);
            
            switch (category) {
                case 'channels':
                    await showChannelsPanel(buttonInteraction, guild);
                    break;
                case 'roles':
                    await showRolesPanel(buttonInteraction, guild);
                    break;
                case 'members':
                    await showMembersPanel(buttonInteraction, guild);
                    break;
                case 'moderation':
                    await showModerationPanel(buttonInteraction, guild);
                    break;
                case 'monitoring':
                    await showMonitoringPanel(buttonInteraction, guild);
                    break;
                case 'security':
                    await showSecurityPanel(buttonInteraction, guild);
                    break;
                case 'server':
                    await showServerPanel(buttonInteraction, guild);
                    break;
                case 'help':
                    await showHelpPanel(buttonInteraction, guild);
                    break;
            }
        });

        collector?.on('end', () => {
            // Desabilitar botões após timeout
        });
    }
});

// ===== PAINEL DE CANAIS =====
async function showChannelsPanel(interaction: any, guild: any) {
    const channels = guild.channels.cache;
    const textChannels = channels.filter((c: any) => c.type === 0).size;
    const voiceChannels = channels.filter((c: any) => c.type === 2).size;
    const categories = channels.filter((c: any) => c.type === 4).size;

    const embed = new EmbedBuilder()
        .setTitle("📝 Gerenciamento de Canais")
        .setDescription(`**Servidor:** ${guild.name}\n\n📊 **Estatísticas:**\n• 📝 Texto: ${textChannels}\n• 🔊 Voz: ${voiceChannels}\n• 📁 Categorias: ${categories}`)
        .addFields(
            {
                name: "🛠️ Comandos Disponíveis",
                value: "```\n/super-admin categoria:📝 Gerenciar Canais acao:criar-texto parametro1:nome-canal\n/super-admin categoria:📝 Gerenciar Canais acao:criar-voz parametro1:nome-canal\n/super-admin categoria:📝 Gerenciar Canais acao:deletar alvo:ID_DO_CANAL\n/super-admin categoria:📝 Gerenciar Canais acao:listar```",
                inline: false
            },
            {
                name: "📋 Ações Rápidas",
                value: "• **criar-texto** - Criar canal de texto\n• **criar-voz** - Criar canal de voz\n• **criar-categoria** - Criar categoria\n• **deletar** - Deletar canal\n• **editar** - Editar canal\n• **listar** - Listar todos os canais",
                inline: false
            }
        )
        .setColor(0x0099ff)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DE CARGOS =====
async function showRolesPanel(interaction: any, guild: any) {
    const roles = guild.roles.cache.filter((r: any) => r.id !== guild.id);
    
    const embed = new EmbedBuilder()
        .setTitle("🎭 Gerenciamento de Cargos")
        .setDescription(`**Servidor:** ${guild.name}\n\n📊 **Total de Cargos:** ${roles.size}`)
        .addFields(
            {
                name: "🛠️ Comandos Disponíveis",
                value: "```\n/super-admin categoria:🎭 Gerenciar Cargos acao:criar parametro1:nome-cargo\n/super-admin categoria:🎭 Gerenciar Cargos acao:dar alvo:ID_USUARIO parametro1:ID_CARGO\n/super-admin categoria:🎭 Gerenciar Cargos acao:deletar alvo:ID_CARGO```",
                inline: false
            },
            {
                name: "📋 Ações Disponíveis",
                value: "• **criar** - Criar novo cargo\n• **deletar** - Deletar cargo\n• **dar** - Dar cargo a usuário\n• **remover** - Remover cargo de usuário\n• **editar** - Editar cargo\n• **listar** - Listar todos os cargos",
                inline: false
            }
        )
        .setColor(0xFF8800)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DE MEMBROS =====
async function showMembersPanel(interaction: any, guild: any) {
    const embed = new EmbedBuilder()
        .setTitle("👥 Gerenciamento de Membros")
        .setDescription(`**Servidor:** ${guild.name}\n\n📊 **Total de Membros:** ${guild.memberCount}`)
        .addFields(
            {
                name: "🛠️ Comandos de Punição",
                value: "```\n/super-admin categoria:👥 Gerenciar Membros acao:banir alvo:ID_USUARIO parametro1:motivo\n/super-admin categoria:👥 Gerenciar Membros acao:expulsar alvo:ID_USUARIO parametro1:motivo\n/super-admin categoria:👥 Gerenciar Membros acao:timeout alvo:ID_USUARIO parametro1:minutos```",
                inline: false
            },
            {
                name: "📋 Todas as Ações",
                value: "• **banir** - Banir membro\n• **desbanir** - Desbanir usuário\n• **expulsar** - Expulsar membro\n• **timeout** - Silenciar temporariamente\n• **nick** - Alterar nickname\n• **mover** - Mover em canal de voz\n• **info** - Ver informações do usuário",
                inline: false
            }
        )
        .setColor(0xFF0000)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DE MODERAÇÃO =====
async function showModerationPanel(interaction: any, guild: any) {
    const embed = new EmbedBuilder()
        .setTitle("🚨 Sistema de Moderação Avançada")
        .setDescription(`**Servidor:** ${guild.name}\n\n⚡ **Sistema Integrado de Infrações**`)
        .addFields(
            {
                name: "📊 Sistema de Infrações",
                value: "```\n/infractions acao:Visualizar_usuário alvo:ID_USUARIO\n/infractions acao:Listar_todas\n/infractions acao:Estatísticas```",
                inline: false
            },
            {
                name: "🎯 Recursos Avançados",
                value: "• **Histórico Completo** - Todas as punições aplicadas\n• **Análise Comportamental** - Padrões de infrações\n• **Usuários Problemáticos** - Identificação automática\n• **Estatísticas Detalhadas** - Métricas de moderação",
                inline: false
            },
            {
                name: "🔗 Comandos Relacionados",
                value: "• `/monitor` - Ativar monitoramento\n• `/logs` - Visualizar logs\n• `/automod` - Auto-moderação IA",
                inline: false
            }
        )
        .setColor(0xFF0000)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DE MONITORAMENTO =====
async function showMonitoringPanel(interaction: any, guild: any) {
    const embed = new EmbedBuilder()
        .setTitle("📊 Sistema de Monitoramento")
        .setDescription(`**Servidor:** ${guild.name}\n\n🔍 **Vigilância 24/7 Ativa**`)
        .addFields(
            {
                name: "📹 Recursos de Monitoramento",
                value: "• `/monitor` - Ativar/Desativar monitoramento\n• `/logs` - Visualizar logs detalhados\n• `/record-call` - Gravar conversas de voz\n• `/analytics` - Análises e estatísticas",
                inline: false
            },
            {
                name: "📈 Dados Coletados",
                value: "• **Mensagens** - Conteúdo e metadados\n• **Comandos** - Uso e frequência\n• **Eventos** - Entradas/saídas, mudanças\n• **Áudio** - Gravações de calls\n• **Comportamento** - Padrões de uso",
                inline: false
            }
        )
        .setColor(0x00FF00)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DE SEGURANÇA =====
async function showSecurityPanel(interaction: any, guild: any) {
    const embed = new EmbedBuilder()
        .setTitle("🔒 Sistema de Segurança")
        .setDescription(`**Servidor:** ${guild.name}\n\n🛡️ **Proteção Avançada Ativa**`)
        .addFields(
            {
                name: "🤖 Auto-Moderação IA",
                value: "• `/automod` - Configurar auto-moderação\n• Detecção de spam automática\n• Análise de sentimento\n• Filtro de conteúdo impróprio",
                inline: false
            },
            {
                name: "🔐 Controle de Acesso",
                value: "• Verificação de owner única\n• Comandos restritos por DM\n• Logs de todas as ações\n• Rastreamento de atividades",
                inline: false
            }
        )
        .setColor(0x8B00FF)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DO SERVIDOR =====
async function showServerPanel(interaction: any, guild: any) {
    const embed = new EmbedBuilder()
        .setTitle("⚙️ Configurações do Servidor")
        .setDescription(`**Servidor:** ${guild.name}\n\n🏰 **Informações e Configurações**`)
        .addFields(
            {
                name: "📊 Informações",
                value: "```\n/super-admin categoria:⚙️ Configurar Servidor acao:info```",
                inline: false
            },
            {
                name: "🎮 Comandos Úteis",
                value: "• `/serverinfo` - Informações detalhadas\n• `/admin-dm` - Administração via DM\n• `/remote` - Controle remoto\n• `/status` - Status do bot",
                inline: false
            }
        )
        .setColor(0x0099ff)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}

// ===== PAINEL DE AJUDA =====
async function showHelpPanel(interaction: any, guild: any) {
    const embed = new EmbedBuilder()
        .setTitle("❓ Guia de Administração")
        .setDescription(`**Sistema Kernal - Administração Completa**\n\n🎯 Você tem acesso a TODAS as funções de um administrador Discord!`)
        .addFields(
            {
                name: "📚 Comandos Principais",
                value: "• `/super-admin` - Comando universal de administração\n• `/admin-central` - Esta central de controle\n• `/admin-dm` - Administração via DM\n• `/infractions` - Sistema de infrações",
                inline: false
            },
            {
                name: "🔍 Como Usar",
                value: "1. Use `/admin-central` para navegar\n2. Use `/super-admin` para ações específicas\n3. Todos os comandos funcionam na DM\n4. Acesso restrito ao seu ID",
                inline: false
            },
            {
                name: "📖 Documentação",
                value: "• `GUIA_ADMINISTRACAO_VIA_DM.md`\n• `FUNCIONALIDADES_COMPLETAS.md`\n• `GUIA_LOGS.md`",
                inline: false
            }
        )
        .setColor(0x00FF00)
        .setTimestamp();

    const backButton = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
            new ButtonBuilder()
                .setCustomId(`admin_back_${guild.id}`)
                .setLabel("◀️ Voltar")
                .setStyle(ButtonStyle.Secondary)
        );

    await interaction.editReply({ embeds: [embed], components: [backButton] });
}
