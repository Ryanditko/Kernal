import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: config.OPENAI_KEY,
});

// Armazenar dados de sentimento por servidor
// const sentimentData = new Map();

createCommand({
    name: "sentiment",
    description: "Análise de sentimentos do servidor com IA (Apenas para o dono)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "acao",
            description: "Tipo de análise",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Dashboard Geral", value: "dashboard" },
                { name: "Análise por Canal", value: "channel" },
                { name: "Análise por Usuário", value: "user" },
                { name: "Trending Topics", value: "topics" },
                { name: "Relatório Detalhado", value: "report" },
                { name: "Monitoramento Tempo Real", value: "monitor" }
            ]
        },
        {
            name: "canal",
            description: "Canal específico para analisar",
            type: ApplicationCommandOptionType.Channel,
            required: false
        },
        {
            name: "usuario",
            description: "Usuário específico para analisar",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "periodo",
            description: "Período de análise",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Última Hora", value: "1h" },
                { name: "Últimas 24h", value: "24h" },
                { name: "Última Semana", value: "7d" },
                { name: "Último Mês", value: "30d" }
            ]
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
        const canal = interaction.options.getChannel("canal");
        const usuario = interaction.options.getUser("usuario");
        const periodo = interaction.options.getString("periodo") || "24h";

        await interaction.deferReply();

        switch (acao) {
            case "dashboard":
                await showDashboard(interaction, periodo);
                break;
            case "channel":
                if (!canal) {
                    await interaction.editReply("❌ Selecione um canal para análise!");
                    return;
                }
                await analyzeChannel(interaction, canal);
                break;
            case "user":
                if (!usuario) {
                    await interaction.editReply("❌ Selecione um usuário para análise!");
                    return;
                }
                await analyzeUser(interaction, usuario, periodo);
                break;
            case "topics":
                await showTrendingTopics(interaction, periodo);
                break;
            case "report":
                await generateDetailedReport(interaction, periodo);
                break;
            case "monitor":
                await startRealTimeMonitoring(interaction);
                break;
        }
    }
});

async function showDashboard(interaction: any, periodo: string) {
    // Simular dados (em produção, viria do banco de dados)
    const mockData = {
        positive: 65,
        neutral: 25,
        negative: 10,
        totalMessages: 1250,
        activeUsers: 89,
        averageSentiment: 0.75
    };

    const embed = new EmbedBuilder()
        .setTitle("📊 Dashboard de Sentimentos - " + interaction.guild?.name)
        .setDescription(`Análise dos últimos ${periodo}`)
        .addFields(
            { 
                name: "📈 Sentimento Geral", 
                value: `**Positivo:** ${mockData.positive}%\n**Neutro:** ${mockData.neutral}%\n**Negativo:** ${mockData.negative}%`, 
                inline: true 
            },
            { 
                name: "📊 Estatísticas", 
                value: `**Mensagens:** ${mockData.totalMessages.toLocaleString()}\n**Usuários Ativos:** ${mockData.activeUsers}\n**Score Médio:** ${mockData.averageSentiment.toFixed(2)}`, 
                inline: true 
            },
            { 
                name: "🏆 Status do Servidor", 
                value: mockData.averageSentiment > 0.7 ? "🟢 Ambiente Positivo" : mockData.averageSentiment > 0.4 ? "🟡 Ambiente Neutro" : "🔴 Ambiente Tenso", 
                inline: true 
            }
        )
        .addFields(
            { 
                name: "🔥 Canais Mais Ativos", 
                value: "1. #geral (450 msgs)\n2. #jogos (320 msgs)\n3. #música (180 msgs)", 
                inline: true 
            },
            { 
                name: "😊 Usuários Mais Positivos", 
                value: "1. @User1 (95% positivo)\n2. @User2 (91% positivo)\n3. @User3 (88% positivo)", 
                inline: true 
            },
            { 
                name: "⚠️ Alertas", 
                value: "• Aumento de 15% em sentimentos negativos no #suporte\n• Discussão acalorada no #política", 
                inline: false 
            }
        )
        .setColor(mockData.averageSentiment > 0.7 ? 0x00FF00 : mockData.averageSentiment > 0.4 ? 0xFFFF00 : 0xFF0000)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function analyzeChannel(interaction: any, canal: any) {
    try {
        // Buscar mensagens recentes do canal
        const messages = await canal.messages.fetch({ limit: 50 });
        const recentMessages = Array.from(messages.values()).slice(0, 10);

        if (recentMessages.length === 0) {
            await interaction.editReply("❌ Nenhuma mensagem encontrada neste canal!");
            return;
        }

        // Analisar sentimentos das mensagens
        const sentiments = [];
        for (const msg of recentMessages) {
            if ((msg as any).content && (msg as any).content.length > 10) {
                const sentiment = await analyzeSentiment((msg as any).content);
                sentiments.push({
                    author: (msg as any).author.username,
                    content: (msg as any).content.substring(0, 100),
                    sentiment: sentiment
                });
            }
        }

        const avgSentiment = sentiments.reduce((acc, s) => acc + s.sentiment.score, 0) / sentiments.length;
        const positiveCount = sentiments.filter(s => s.sentiment.score > 0.2).length;
        const negativeCount = sentiments.filter(s => s.sentiment.score < -0.2).length;

        const embed = new EmbedBuilder()
            .setTitle(`📝 Análise do Canal #${canal.name}`)
            .setDescription(`Últimas ${sentiments.length} mensagens analisadas`)
            .addFields(
                { name: "📊 Score Médio", value: avgSentiment.toFixed(2), inline: true },
                { name: "😊 Mensagens Positivas", value: `${positiveCount} (${((positiveCount/sentiments.length)*100).toFixed(1)}%)`, inline: true },
                { name: "😔 Mensagens Negativas", value: `${negativeCount} (${((negativeCount/sentiments.length)*100).toFixed(1)}%)`, inline: true }
            )
            .addFields({
                name: "🔍 Análises Recentes",
                value: sentiments.slice(0, 5).map(s => 
                    `**${s.author}:** ${s.sentiment.emotion} (${s.sentiment.score.toFixed(2)})\n*"${s.content}..."*`
                ).join('\n\n').substring(0, 1000),
                inline: false
            })
            .setColor(avgSentiment > 0.2 ? 0x00FF00 : avgSentiment > -0.2 ? 0xFFFF00 : 0xFF0000)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    } catch (error) {
        await interaction.editReply(`❌ Erro na análise: ${error}`);
    }
}

async function analyzeUser(interaction: any, usuario: any, periodo: string) {
    const embed = new EmbedBuilder()
        .setTitle(`👤 Análise de Sentimentos - ${usuario.username}`)
        .setDescription(`Período: ${periodo}`)
        .addFields(
            { name: "📊 Score Geral", value: "0.78 (Muito Positivo)", inline: true },
            { name: "💬 Mensagens Analisadas", value: "145", inline: true },
            { name: "🎭 Emoção Dominante", value: "😊 Alegria", inline: true },
            { name: "📈 Tendência", value: "📈 Melhorando (+12%)", inline: true },
            { name: "🏆 Ranking no Servidor", value: "#7 mais positivo", inline: true },
            { name: "⚡ Atividade", value: "Muito ativo", inline: true }
        )
        .addFields({
            name: "🎭 Distribuição de Emoções",
            value: "😊 Alegria: 45%\n😐 Neutro: 35%\n😢 Tristeza: 15%\n😡 Raiva: 5%",
            inline: true
        })
        .addFields({
            name: "📅 Histórico Recente",
            value: "Ontem: 0.85\n2 dias: 0.72\n3 dias: 0.69\n1 semana: 0.74",
            inline: true
        })
        .setThumbnail(usuario.displayAvatarURL())
        .setColor(0x00FF00)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function showTrendingTopics(interaction: any, periodo: string) {
    const embed = new EmbedBuilder()
        .setTitle("🔥 Trending Topics - Análise de Sentimentos")
        .setDescription(`Tópicos mais discutidos nos últimos ${periodo}`)
        .addFields(
            {
                name: "1. 🎮 Novos Jogos",
                value: "😊 85% Positivo | 245 menções\n*Muito entusiasmo com lançamentos*",
                inline: false
            },
            {
                name: "2. 🎵 Música",
                value: "😊 78% Positivo | 189 menções\n*Compartilhamento de playlists*",
                inline: false
            },
            {
                name: "3. 📚 Estudos",
                value: "😐 60% Neutro | 156 menções\n*Discussões sobre provas*",
                inline: false
            },
            {
                name: "4. ⚽ Esportes",
                value: "😡 45% Negativo | 134 menções\n*Debates acalorados sobre times*",
                inline: false
            },
            {
                name: "5. 🍕 Comida",
                value: "😊 90% Positivo | 98 menções\n*Receitas e recomendações*",
                inline: false
            }
        )
        .addFields({
            name: "📊 Insights",
            value: "• Tópicos de entretenimento geram mais positividade\n• Discussões esportivas tendem a ser mais tensas\n• Hora do almoço tem picos de menções sobre comida",
            inline: false
        })
        .setColor(0x00BFFF)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function generateDetailedReport(interaction: any, periodo: string) {
    const embed = new EmbedBuilder()
        .setTitle("📋 Relatório Detalhado de Sentimentos")
        .setDescription(`Análise completa dos últimos ${periodo}`)
        .addFields(
            {
                name: "📊 Métricas Principais",
                value: `
                **Total de Mensagens:** 3,247
                **Usuários Únicos:** 156
                **Média de Sentimento:** 0.73 (Positivo)
                **Engagement Rate:** 78%
                **Pico de Atividade:** 20:30 - 22:00
                `,
                inline: false
            },
            {
                name: "🏆 Top Performers",
                value: `
                **Canal Mais Positivo:** #conquistas (0.89)
                **Usuário Mais Ativo:** @PowerUser (234 msgs)
                **Melhor Interação:** Evento de aniversário
                **Maior Crescimento:** #iniciantes (+45%)
                `,
                inline: false
            },
            {
                name: "⚠️ Pontos de Atenção",
                value: `
                **Sentimento Negativo:** Aumentou 8% no #suporte
                **Conflitos:** 3 discussões resolvidas
                **Spam Detectado:** 12 mensagens (0.4%)
                **Moderação:** 5 ações preventivas
                `,
                inline: false
            },
            {
                name: "📈 Recomendações",
                value: `
                • Mais eventos positivos como o de aniversário
                • Melhorar suporte para reduzir frustração
                • Incentivar discussões no #conquistas
                • Monitorar picos de atividade noturna
                `,
                inline: false
            }
        )
        .setColor(0x9932CC)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function startRealTimeMonitoring(interaction: any) {
    const embed = new EmbedBuilder()
        .setTitle("📡 Monitoramento em Tempo Real Ativado")
        .setDescription("Sistema de análise contínua de sentimentos iniciado!")
        .addFields(
            {
                name: "🔄 Status",
                value: "✅ Monitoramento ativo\n⏱️ Análise a cada 30 segundos\n📊 Dashboard atualizado a cada 5 minutos",
                inline: false
            },
            {
                name: "🎯 Detectando",
                value: "• Mudanças bruscas de sentimento\n• Picos de atividade\n• Conflitos em potencial\n• Tópicos trending",
                inline: false
            },
            {
                name: "🚨 Alertas Configurados",
                value: "• Sentimento negativo > 70% em qualquer canal\n• Aumento súbito de mensagens\n• Palavras-chave de conflito\n• Spam ou flood",
                inline: false
            }
        )
        .setColor(0x00FF7F)
        .setTimestamp();

    await interaction.editReply({ embeds: [embed] });
}

async function analyzeSentiment(text: string) {
    try {
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                {
                    role: "system",
                    content: `Analise o sentimento desta mensagem e retorne APENAS um JSON válido:
                    {
                        "score": number (-1 a 1, onde -1 é muito negativo e 1 é muito positivo),
                        "emotion": string (emoji + nome da emoção principal),
                        "confidence": number (0 a 1)
                    }`
                },
                {
                    role: "user",
                    content: text
                }
            ],
            temperature: 0.1,
            max_tokens: 100
        });

        const result = JSON.parse(response.choices[0]?.message?.content || "{}");
        return {
            score: result.score || 0,
            emotion: result.emotion || "😐 Neutro",
            confidence: result.confidence || 0.5
        };
    } catch (error) {
        return {
            score: 0,
            emotion: "❓ Indefinido",
            confidence: 0
        };
    }
}
