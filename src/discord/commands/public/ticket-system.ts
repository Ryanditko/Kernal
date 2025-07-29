import { createCommand } from "#base";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, ChannelType, PermissionFlagsBits, ButtonBuilder, ButtonStyle, TextChannel, ChatInputCommandInteraction } from "discord.js";
import { createRow } from "@magicyan/discord";
import { config } from "../../../settings/config.js";

interface TicketData {
    userId: string;
    channelId: string;
    category: string;
    createdAt: number;
    status: 'open' | 'closed';
}

const activeTickets = new Map<string, TicketData>();

createCommand({
    name: "ticket",
    description: "Sistema de tickets",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "action",
            description: "Ação do sistema de tickets",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "🎫 Criar Ticket", value: "create" },
                { name: "🔒 Fechar Ticket", value: "close" },
                { name: "🔓 Reabrir Ticket", value: "reopen" },
                { name: "📋 Listar Tickets", value: "list" },
                { name: "⚙️ Configurar Sistema", value: "setup" },
                { name: "📊 Estatísticas", value: "stats" }
            ]
        },
        {
            name: "categoria",
            description: "Categoria do ticket",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "💬 Suporte Geral", value: "support" },
                { name: "🐛 Reportar Bug", value: "bug" },
                { name: "💡 Sugestão", value: "suggestion" },
                { name: "⚠️ Denúncia", value: "report" },
                { name: "💰 Financeiro", value: "payment" },
                { name: "🔧 Técnico", value: "technical" }
            ]
        },
        {
            name: "usuario",
            description: "Usuário para adicionar ao ticket",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "razao",
            description: "Razão para a ação",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 500
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const action = interaction.options.getString("action", true);
        const categoria = interaction.options.getString("categoria") || "support";
        const razao = interaction.options.getString("razao");

        switch (action) {
            case "create":
                // Verificar se o usuário já tem um ticket ativo
                const existingTicket = Array.from(activeTickets.values()).find(
                    ticket => ticket.userId === interaction.user.id && ticket.status === 'open'
                );

                if (existingTicket) {
                    await interaction.reply({
                        content: `❌ Você já tem um ticket ativo: <#${existingTicket.channelId}>`,
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferReply({ ephemeral: true });

                try {
                    // Criar canal do ticket
                    const ticketChannel = await interaction.guild!.channels.create({
                        name: `ticket-${interaction.user.username}-${Date.now().toString().slice(-4)}`,
                        type: ChannelType.GuildText,
                        parent: null, // Você pode definir uma categoria específica aqui
                        permissionOverwrites: [
                            {
                                id: interaction.guild!.roles.everyone.id,
                                deny: [PermissionFlagsBits.ViewChannel],
                            },
                            {
                                id: interaction.user.id,
                                allow: [
                                    PermissionFlagsBits.ViewChannel,
                                    PermissionFlagsBits.SendMessages,
                                    PermissionFlagsBits.ReadMessageHistory
                                ],
                            },
                            // Adicionar permissões para moderadores/admins
                            ...(interaction.guild!.roles.cache
                                .filter(role => role.permissions.has(PermissionFlagsBits.ManageChannels))
                                .map(role => ({
                                    id: role.id,
                                    allow: [
                                        PermissionFlagsBits.ViewChannel,
                                        PermissionFlagsBits.SendMessages,
                                        PermissionFlagsBits.ReadMessageHistory,
                                        PermissionFlagsBits.ManageMessages
                                    ],
                                }))
                            )
                        ],
                    });

                    // Adicionar ticket aos dados
                    const ticketData: TicketData = {
                        userId: interaction.user.id,
                        channelId: ticketChannel.id,
                        category: categoria,
                        createdAt: Date.now(),
                        status: 'open'
                    };

                    activeTickets.set(ticketChannel.id, ticketData);

                    // Embed de boas-vindas do ticket
                    const welcomeEmbed = new EmbedBuilder()
                        .setTitle("🎫 Ticket Criado")
                        .setDescription(`Olá ${interaction.user}, bem-vindo ao seu ticket de suporte!`)
                        .addFields(
                            { name: "Categoria", value: getCategoryName(categoria), inline: true },
                            { name: "Criado em", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true },
                            { name: "Status", value: "🟢 Aberto", inline: true }
                        )
                        .setColor(0x00AE86)
                        .setFooter({ 
                            text: "Nossa equipe responderá em breve. Use os botões abaixo para gerenciar o ticket.",
                            iconURL: interaction.guild!.iconURL() || undefined
                        })
                        .setTimestamp();

                    const ticketControls = createRow(
                        new ButtonBuilder()
                            .setCustomId("ticket_close")
                            .setLabel("🔒 Fechar Ticket")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId("ticket_claim")
                            .setLabel("👥 Assumir Ticket")
                            .setStyle(ButtonStyle.Primary),
                        new ButtonBuilder()
                            .setCustomId("ticket_transcript")
                            .setLabel("📄 Gerar Transcrição")
                            .setStyle(ButtonStyle.Secondary)
                    );

                    await ticketChannel.send({
                        content: `${interaction.user} | <@&${config.OWNER_ID}>`,
                        embeds: [welcomeEmbed],
                        components: [ticketControls]
                    });

                    await interaction.editReply({
                        content: `✅ Ticket criado com sucesso! ${ticketChannel}`
                    });

                } catch (error) {
                    console.error("Erro ao criar ticket:", error);
                    await interaction.editReply("❌ Erro ao criar o ticket. Tente novamente.");
                }
                break;

            case "close":
                const ticket = activeTickets.get(interaction.channelId);
                
                if (!ticket) {
                    await interaction.reply({
                        content: "❌ Este não é um canal de ticket válido!",
                        ephemeral: true
                    });
                    return;
                }

                if (ticket.status === 'closed') {
                    await interaction.reply({
                        content: "❌ Este ticket já está fechado!",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferReply();

                try {
                    // Atualizar status do ticket
                    ticket.status = 'closed';
                    
                    const closeEmbed = new EmbedBuilder()
                        .setTitle("🔒 Ticket Fechado")
                        .setDescription(`Ticket fechado por ${interaction.user}`)
                        .addFields(
                            { name: "Razão", value: razao || "Não especificada", inline: false },
                            { name: "Fechado em", value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                        )
                        .setColor(0xFF0000)
                        .setTimestamp();

                    const closedControls = createRow(
                        new ButtonBuilder()
                            .setCustomId("ticket_reopen")
                            .setLabel("🔓 Reabrir")
                            .setStyle(ButtonStyle.Success),
                        new ButtonBuilder()
                            .setCustomId("ticket_delete")
                            .setLabel("🗑️ Deletar")
                            .setStyle(ButtonStyle.Danger),
                        new ButtonBuilder()
                            .setCustomId("ticket_transcript")
                            .setLabel("📄 Transcrição")
                            .setStyle(ButtonStyle.Secondary)
                    );

                    // Remover permissões do usuário
                    const channel = interaction.channel as TextChannel;
                    await channel.permissionOverwrites.edit(ticket.userId, {
                        SendMessages: false,
                        ViewChannel: true
                    });

                    await interaction.editReply({
                        embeds: [closeEmbed],
                        components: [closedControls]
                    });

                } catch (error) {
                    console.error("Erro ao fechar ticket:", error);
                    await interaction.editReply("❌ Erro ao fechar o ticket.");
                }
                break;

            case "list":
                const allTickets = Array.from(activeTickets.values());
                const openTickets = allTickets.filter(t => t.status === 'open');
                const closedTickets = allTickets.filter(t => t.status === 'closed');

                const listEmbed = new EmbedBuilder()
                    .setTitle("📋 Lista de Tickets")
                    .setColor(0x9932CC)
                    .addFields(
                        { 
                            name: "🟢 Tickets Abertos", 
                            value: openTickets.length > 0 
                                ? openTickets.map(t => `<#${t.channelId}> - ${getCategoryName(t.category)}`).join('\n')
                                : "Nenhum ticket aberto",
                            inline: false 
                        },
                        { 
                            name: "🔴 Tickets Fechados (Últimos 5)", 
                            value: closedTickets.length > 0 
                                ? closedTickets.slice(-5).map(t => `<#${t.channelId}> - ${getCategoryName(t.category)}`).join('\n')
                                : "Nenhum ticket fechado",
                            inline: false 
                        }
                    )
                    .setFooter({ text: `Total: ${allTickets.length} tickets` })
                    .setTimestamp();

                await interaction.reply({ embeds: [listEmbed] });
                break;

            case "setup":
                if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
                    await interaction.reply({
                        content: "❌ Você não tem permissão para configurar o sistema de tickets!",
                        ephemeral: true
                    });
                    return;
                }

                const setupEmbed = new EmbedBuilder()
                    .setTitle("🎫 Sistema de Tickets")
                    .setDescription("Clique no botão abaixo para criar um ticket de suporte!")
                    .addFields(
                        { name: "📋 Categorias Disponíveis", value: "• Suporte Geral\n• Reportar Bug\n• Sugestão\n• Denúncia\n• Financeiro\n• Técnico", inline: false },
                        { name: "⏱️ Tempo de Resposta", value: "Nossa equipe responde em até 24 horas", inline: false }
                    )
                    .setColor(0x00AE86)
                    .setThumbnail(interaction.guild!.iconURL())
                    .setTimestamp();

                const createTicketButton = createRow(
                    new ButtonBuilder()
                        .setCustomId("create_ticket_support")
                        .setLabel("🎫 Criar Ticket")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("create_ticket_bug")
                        .setLabel("🐛 Reportar Bug")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("create_ticket_suggestion")
                        .setLabel("💡 Sugestão")
                        .setStyle(ButtonStyle.Success)
                );

                await interaction.reply({
                    embeds: [setupEmbed],
                    components: [createTicketButton]
                });
                break;

            case "stats":
                const stats = Array.from(activeTickets.values());
                const totalTickets = stats.length;
                const openCount = stats.filter(t => t.status === 'open').length;
                const closedCount = stats.filter(t => t.status === 'closed').length;
                
                const categoryStats = stats.reduce((acc, ticket) => {
                    acc[ticket.category] = (acc[ticket.category] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>);

                const statsEmbed = new EmbedBuilder()
                    .setTitle("📊 Estatísticas de Tickets")
                    .addFields(
                        { name: "📈 Total de Tickets", value: totalTickets.toString(), inline: true },
                        { name: "🟢 Abertos", value: openCount.toString(), inline: true },
                        { name: "🔴 Fechados", value: closedCount.toString(), inline: true },
                        { 
                            name: "📋 Por Categoria", 
                            value: Object.entries(categoryStats)
                                .map(([cat, count]) => `${getCategoryName(cat)}: ${count}`)
                                .join('\n') || "Nenhum ticket ainda",
                            inline: false 
                        }
                    )
                    .setColor(0x1E90FF)
                    .setTimestamp();

                await interaction.reply({ embeds: [statsEmbed] });
                break;

            default:
                await interaction.reply({
                    content: "❌ Ação inválida!",
                    ephemeral: true
                });
        }
    }
});

function getCategoryName(category: string): string {
    const categories = {
        'support': '💬 Suporte Geral',
        'bug': '🐛 Reportar Bug',
        'suggestion': '💡 Sugestão',
        'report': '⚠️ Denúncia',
        'payment': '💰 Financeiro',
        'technical': '🔧 Técnico'
    };
    return categories[category as keyof typeof categories] || '❓ Desconhecido';
}
