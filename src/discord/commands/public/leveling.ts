import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

// Sistema de XP avançado
// const userXP = new Map();
// const guildSettings = new Map();

interface UserData {
    xp: number;
    level: number;
    totalMessages: number;
    voiceTime: number;
    streak: number;
    achievements: string[];
    customTitle: string;
    prestige: number;
    lastActive: number;
}

createCommand({
    name: "leveling",
    description: "Sistema avançado de level e XP (Apenas para o dono)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "acao",
            description: "Ação do sistema de leveling",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Ranking Global", value: "ranking" },
                { name: "Perfil Detalhado", value: "profile" },
                { name: "Conquistas", value: "achievements" },
                { name: "Loja de Recompensas", value: "shop" },
                { name: "Configurar Sistema", value: "config" },
                { name: "Eventos de XP", value: "events" },
                { name: "Estatísticas", value: "stats" },
                { name: "Prestígio", value: "prestige" }
            ]
        },
        {
            name: "usuario",
            description: "Usuário para análise",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "valor",
            description: "Valor para configurações",
            type: ApplicationCommandOptionType.Integer,
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
        const usuario = interaction.options.getUser("usuario") || interaction.user;
        // const valor = interaction.options.getInteger("valor");

        await interaction.deferReply();

        switch (acao) {
            case "ranking":
                await showGlobalRanking(interaction);
                break;
            case "profile":
                await showDetailedProfile(interaction, usuario);
                break;
            case "achievements":
                await showAchievements(interaction, usuario);
                break;
            case "shop":
                await showRewardShop(interaction);
                break;
            case "config":
                await configureSystem(interaction);
                break;
            case "events":
                await showXPEvents(interaction);
                break;
            case "stats":
                await showServerStats(interaction);
                break;
            case "prestige":
                await showPrestigeSystem(interaction, usuario);
                break;
        }
    }
});

async function showGlobalRanking(interaction: any) {
    // Simular dados de ranking
    const mockRanking = [
        { username: "PowerUser", level: 127, xp: 2456789, prestige: 3, title: "🏆 Lenda Viva" },
        { username: "ChatMaster", level: 98, xp: 1876543, prestige: 2, title: "💎 Mestre dos Chats" },
        { username: "VoiceKing", level: 89, xp: 1654321, prestige: 1, title: "🎤 Rei da Conversa" },
        { username: "ActivityBot", level: 76, xp: 1234567, prestige: 1, title: "⚡ Sempre Ativo" },
        { username: "HelpfulUser", level: 65, xp: 987654, prestige: 0, title: "🤝 Prestativo" }
    ];

    const embed = new EmbedBuilder()
        .setTitle("🏆 Ranking Global - Top Usuários")
        .setDescription("Os membros mais ativos do servidor")
        .setColor(0xFFD700)
        .setTimestamp();

    let rankingText = "";
    mockRanking.forEach((user, index) => {
        const medal = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : `${index + 1}.`;
        const prestigeStars = "⭐".repeat(user.prestige);
        rankingText += `${medal} **${user.username}** ${prestigeStars}\n`;
        rankingText += `└ Nível ${user.level} | ${user.xp.toLocaleString()} XP\n`;
        rankingText += `└ ${user.title}\n\n`;
    });

    embed.addFields({
        name: "🏅 Top 5 Usuários",
        value: rankingText,
        inline: false
    });

    embed.addFields(
        { name: "📊 Total de Usuários", value: "1,247", inline: true },
        { name: "🎯 Nível Médio", value: "23.4", inline: true },
        { name: "⚡ XP Total Distribuído", value: "15.7M", inline: true }
    );

    await interaction.editReply({ embeds: [embed] });
}

async function showDetailedProfile(interaction: any, usuario: any) {
    // Simular dados detalhados do usuário
    const userData: UserData = {
        xp: 456789,
        level: 67,
        totalMessages: 8934,
        voiceTime: 156780, // em minutos
        streak: 23,
        achievements: ["first_message", "voice_lover", "helper", "event_participant"],
        customTitle: "🌟 Estrela Crescente",
        prestige: 1,
        lastActive: Date.now() - 3600000 // 1 hora atrás
    };

    const nextLevelXP = calculateXPForLevel(userData.level + 1);
    const currentLevelXP = calculateXPForLevel(userData.level);
    const progressXP = userData.xp - currentLevelXP;
    const neededXP = nextLevelXP - currentLevelXP;
    const progressPercent = (progressXP / neededXP * 100).toFixed(1);

    const embed = new EmbedBuilder()
        .setTitle(`📊 Perfil Detalhado - ${usuario.username}`)
        .setDescription(userData.customTitle)
        .setThumbnail(usuario.displayAvatarURL({ size: 256 }))
        .setColor(0x00BFFF)
        .addFields(
            {
                name: "🎯 Progressão",
                value: `
                **Nível:** ${userData.level} ${"⭐".repeat(userData.prestige)}
                **XP Total:** ${userData.xp.toLocaleString()}
                **Progresso:** ${progressXP.toLocaleString()}/${neededXP.toLocaleString()} (${progressPercent}%)
                **Para próximo nível:** ${(neededXP - progressXP).toLocaleString()} XP
                `,
                inline: true
            },
            {
                name: "📈 Estatísticas",
                value: `
                **Mensagens:** ${userData.totalMessages.toLocaleString()}
                **Tempo em voz:** ${Math.floor(userData.voiceTime / 60)}h ${userData.voiceTime % 60}m
                **Streak atual:** ${userData.streak} dias
                **Conquistas:** ${userData.achievements.length}/50
                `,
                inline: true
            },
            {
                name: "🏆 Destaques",
                value: `
                **Ranking:** #12 no servidor
                **Categoria favorita:** 💬 Chat
                **Horário ativo:** 19h-23h
                **Última atividade:** <t:${Math.floor(userData.lastActive / 1000)}:R>
                `,
                inline: false
            }
        )
        .addFields({
            name: "🎁 Recompensas Disponíveis",
            value: "• 🎨 Cor personalizada (Nível 70)\n• 🏷️ Título customizado (Nível 75)\n• 🎭 Cargo especial (Nível 80)",
            inline: false
        })
        .setFooter({ text: `Membro desde: ${new Date().toLocaleDateString()}` })
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function showAchievements(interaction: any, usuario: any) {
    const achievements = [
        { id: "first_message", name: "🎯 Primeira Mensagem", description: "Enviou sua primeira mensagem", unlocked: true, date: "15/01/2024" },
        { id: "voice_lover", name: "🎤 Amante de Voz", description: "Passou 100 horas em canais de voz", unlocked: true, date: "20/02/2024" },
        { id: "helper", name: "🤝 Prestativo", description: "Ajudou 50 pessoas diferentes", unlocked: true, date: "10/03/2024" },
        { id: "event_participant", name: "🎉 Participativo", description: "Participou de 10 eventos", unlocked: true, date: "25/03/2024" },
        { id: "streak_master", name: "🔥 Mestre da Sequência", description: "Manteve 30 dias de streak", unlocked: false, progress: "23/30" },
        { id: "level_50", name: "⭐ Nível 50", description: "Alcançou o nível 50", unlocked: false, progress: "67/50" },
        { id: "social_butterfly", name: "🦋 Borboleta Social", description: "Conversou com 100 pessoas diferentes", unlocked: false, progress: "78/100" },
        { id: "night_owl", name: "🦉 Coruja Noturna", description: "Ativo após meia-noite por 20 dias", unlocked: false, progress: "12/20" }
    ];

    const unlockedCount = achievements.filter(a => a.unlocked).length;
    const totalCount = achievements.length;

    const embed = new EmbedBuilder()
        .setTitle(`🏆 Conquistas - ${usuario.username}`)
        .setDescription(`${unlockedCount}/${totalCount} conquistas desbloqueadas (${((unlockedCount/totalCount)*100).toFixed(1)}%)`)
        .setColor(0xFFD700)
        .setThumbnail(usuario.displayAvatarURL())
        .setTimestamp();

    // Conquistas desbloqueadas
    const unlockedAchievements = achievements.filter(a => a.unlocked);
    if (unlockedAchievements.length > 0) {
        embed.addFields({
            name: "✅ Conquistas Desbloqueadas",
            value: unlockedAchievements.map(a => 
                `${a.name}\n*${a.description}*\n📅 ${a.date}\n`
            ).join('\n'),
            inline: false
        });
    }

    // Conquistas em progresso
    const inProgressAchievements = achievements.filter(a => !a.unlocked);
    if (inProgressAchievements.length > 0) {
        embed.addFields({
            name: "🔄 Em Progresso",
            value: inProgressAchievements.map(a => 
                `${a.name}\n*${a.description}*\n📊 ${a.progress || '0/100'}\n`
            ).join('\n'),
            inline: false
        });
    }

    embed.addFields({
        name: "🎁 Próximas Recompensas",
        value: "• 🎨 **Cor personalizada** - Complete 'Mestre da Sequência'\n• 🏷️ **Título raro** - Alcance nível 75\n• 🎭 **Cargo exclusivo** - Desbloqueie 40 conquistas",
        inline: false
    });

    await interaction.editReply({ embeds: [embed] });
}

async function showRewardShop(interaction: any) {
    const rewards = [
        { name: "🎨 Cor Personalizada", cost: 5000, description: "Escolha a cor do seu nome", category: "visual" },
        { name: "🏷️ Título Customizado", cost: 10000, description: "Crie seu próprio título", category: "visual" },
        { name: "🎭 Cargo Temporário", cost: 15000, description: "Cargo especial por 30 dias", category: "role" },
        { name: "💎 XP Boost 2x", cost: 20000, description: "Dobra XP por 24 horas", category: "boost" },
        { name: "🎵 Bot de Música Privado", cost: 50000, description: "Canal de música exclusivo por 7 dias", category: "premium" },
        { name: "👑 Status VIP", cost: 100000, description: "Benefícios VIP permanentes", category: "premium" }
    ];

    const embed = new EmbedBuilder()
        .setTitle("🛒 Loja de Recompensas")
        .setDescription("Troque seu XP por recompensas incríveis!")
        .setColor(0x9932CC)
        .setTimestamp();

    const categories = {
        visual: "🎨 **Visuais**",
        role: "🎭 **Cargos**", 
        boost: "⚡ **Boosts**",
        premium: "👑 **Premium**"
    };

    for (const [catKey, catName] of Object.entries(categories)) {
        const categoryRewards = rewards.filter(r => r.category === catKey);
        if (categoryRewards.length > 0) {
            embed.addFields({
                name: catName,
                value: categoryRewards.map(r => 
                    `${r.name} - **${r.cost.toLocaleString()} XP**\n*${r.description}*`
                ).join('\n\n'),
                inline: false
            });
        }
    }

    embed.addFields({
        name: "💡 Como Comprar",
        value: "Use `/leveling shop buy <item>` para comprar\nSeu XP atual: **45,678 XP**",
        inline: false
    });

    await interaction.editReply({ embeds: [embed] });
}

async function showXPEvents(interaction: any) {
    const events = [
        { name: "🎉 Evento de Aniversário", bonus: "3x XP", duration: "24h", active: true },
        { name: "💬 Hora do Chat", bonus: "2x XP em texto", duration: "2h", active: false, nextStart: "20:00" },
        { name: "🎤 Noite da Conversa", bonus: "2x XP em voz", duration: "3h", active: false, nextStart: "21:00" },
        { name: "🏆 Desafio Semanal", bonus: "Conquista especial", duration: "7d", active: true },
        { name: "🌟 Weekend Boost", bonus: "1.5x XP", duration: "48h", active: false, nextStart: "Sexta 18:00" }
    ];

    const embed = new EmbedBuilder()
        .setTitle("🎊 Eventos de XP")
        .setDescription("Eventos especiais para ganhar mais XP!")
        .setColor(0xFF6347)
        .setTimestamp();

    const activeEvents = events.filter(e => e.active);
    const upcomingEvents = events.filter(e => !e.active);

    if (activeEvents.length > 0) {
        embed.addFields({
            name: "🔥 Eventos Ativos",
            value: activeEvents.map(e => 
                `${e.name}\n**Bônus:** ${e.bonus}\n**Duração:** ${e.duration}\n`
            ).join('\n'),
            inline: false
        });
    }

    if (upcomingEvents.length > 0) {
        embed.addFields({
            name: "⏰ Próximos Eventos",
            value: upcomingEvents.map(e => 
                `${e.name}\n**Bônus:** ${e.bonus}\n**Início:** ${e.nextStart}\n`
            ).join('\n'),
            inline: false
        });
    }

    embed.addFields({
        name: "📊 Suas Estatísticas de Eventos",
        value: "• Eventos participados: 12\n• XP bônus ganho: 45,670\n• Melhor evento: 🎉 Aniversário (+15,000 XP)",
        inline: false
    });

    await interaction.editReply({ embeds: [embed] });
}

async function showServerStats(interaction: any) {
    const embed = new EmbedBuilder()
        .setTitle("📊 Estatísticas do Servidor - Sistema de XP")
        .setDescription("Dados completos do sistema de leveling")
        .setColor(0x32CD32)
        .addFields(
            {
                name: "📈 Números Gerais",
                value: `
                **Usuários Ativos:** 1,247
                **XP Total Distribuído:** 15.7M
                **Nível Médio:** 23.4
                **Maior Nível:** 127 (PowerUser)
                **Mensagens com XP:** 89,456
                **Tempo de voz total:** 2,340h
                `,
                inline: true
            },
            {
                name: "🏆 Rankings",
                value: `
                **Mais Ativos Hoje:** 156 usuários
                **Longest Streak:** 67 dias
                **Mais Conquistas:** 48/50
                **Maior Prestígio:** ⭐⭐⭐ (3 estrelas)
                **XP em 24h:** 125,890
                `,
                inline: true
            },
            {
                name: "📊 Distribuição de Níveis",
                value: `
                **1-10:** 45% (561 usuários)
                **11-25:** 30% (374 usuários)
                **26-50:** 18% (225 usuários)
                **51-75:** 6% (75 usuários)
                **76-100:** 1% (12 usuários)
                `,
                inline: false
            },
            {
                name: "🎯 Metas do Servidor",
                value: `
                **Meta Semanal:** 500k XP ✅ (643k)
                **Meta Mensal:** 2M XP 📈 (1.8M)
                **Eventos Realizados:** 8 este mês
                **Satisfação:** 94% dos usuários ativos
                `,
                inline: false
            }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function showPrestigeSystem(interaction: any, usuario: any) {
    const embed = new EmbedBuilder()
        .setTitle("⭐ Sistema de Prestígio")
        .setDescription(`Sistema avançado de prestígio para ${usuario.username}`)
        .setColor(0xFFD700)
        .addFields(
            {
                name: "🌟 Seu Status Atual",
                value: `
                **Prestígio:** ⭐ Nível 1
                **Nível:** 67/100 (necessário para próximo prestígio)
                **Bônus Ativo:** +10% XP
                **Título Especial:** 🌟 Estrela Crescente
                `,
                inline: true
            },
            {
                name: "🎁 Benefícios do Prestígio",
                value: `
                **⭐ Prestígio 1:** +10% XP, título especial
                **⭐⭐ Prestígio 2:** +20% XP, cor dourada
                **⭐⭐⭐ Prestígio 3:** +30% XP, cargo VIP
                **⭐⭐⭐⭐ Prestígio 4:** +40% XP, bot privado
                **⭐⭐⭐⭐⭐ Prestígio 5:** +50% XP, acesso total
                `,
                inline: true
            },
            {
                name: "🏆 Hall da Fama",
                value: `
                **👑 PowerUser** - ⭐⭐⭐ Prestígio 3
                **💎 ChatMaster** - ⭐⭐ Prestígio 2  
                **🌟 VoiceKing** - ⭐ Prestígio 1
                **🔥 ActivityBot** - ⭐ Prestígio 1
                `,
                inline: false
            },
            {
                name: "💡 Como Fazer Prestígio",
                value: "1. Alcance o nível 100\n2. Use `/leveling prestige confirm`\n3. Seu nível volta para 1, mas ganha benefícios permanentes\n4. Mantenha todas as conquistas e XP total",
                inline: false
            }
        )
        .setThumbnail(usuario.displayAvatarURL())
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function configureSystem(interaction: any) {
    const embed = new EmbedBuilder()
        .setTitle("⚙️ Configuração do Sistema de XP")
        .setDescription("Configure o sistema de leveling do servidor")
        .setColor(0x4169E1)
        .addFields(
            {
                name: "📊 Configurações Atuais",
                value: `
                **XP por mensagem:** 15-25 (aleatório)
                **XP por minuto em voz:** 5-10
                **Cooldown de mensagem:** 60 segundos
                **Multiplicador de evento:** 2x
                **Sistema ativo:** ✅ Sim
                `,
                inline: true
            },
            {
                name: "🎯 Canais de XP",
                value: `
                **Permitidos:** Todos exceto #spam
                **Bônus 2x:** #geral, #jogos
                **Sem XP:** #comandos, #bot
                **Voz bônus:** Sala VIP (+50%)
                `,
                inline: true
            },
            {
                name: "🏆 Recompensas Automáticas",
                value: `
                **Nível 10:** Cargo @Membro
                **Nível 25:** Cargo @Ativo
                **Nível 50:** Cargo @Veterano
                **Nível 75:** Cargo @Elite
                **Nível 100:** Cargo @Lenda
                `,
                inline: false
            },
            {
                name: "⚡ Comandos de Admin",
                value: "`/xp add @user 1000` - Adicionar XP\n`/xp remove @user 500` - Remover XP\n`/xp reset @user` - Resetar usuário\n`/xp event start` - Iniciar evento",
                inline: false
            }
        )
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

function calculateXPForLevel(level: number): number {
    // Fórmula de XP progressiva
    return Math.floor(100 * Math.pow(level, 1.5));
}
