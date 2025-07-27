import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: config.OPENAI_KEY,
});

createCommand({
    name: "gerar-texto",
    description: "Gere textos criativos usando IA",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "tipo",
            description: "Tipo de texto para gerar",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "História", value: "historia" },
                { name: "Poema", value: "poema" },
                { name: "Artigo", value: "artigo" },
                { name: "Email", value: "email" },
                { name: "Código", value: "codigo" },
                { name: "Resumo", value: "resumo" }
            ]
        },
        {
            name: "topico",
            description: "Tópico ou tema do texto",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 500
        },
        {
            name: "tamanho",
            description: "Tamanho do texto",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Curto", value: "curto" },
                { name: "Médio", value: "medio" },
                { name: "Longo", value: "longo" }
            ]
        },
        {
            name: "tom",
            description: "Tom do texto",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "Formal", value: "formal" },
                { name: "Casual", value: "casual" },
                { name: "Humorístico", value: "humor" },
                { name: "Profissional", value: "profissional" }
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

        const tipo = interaction.options.getString("tipo", true);
        const topico = interaction.options.getString("topico", true);
        const tamanho = interaction.options.getString("tamanho") || "medio";
        const tom = interaction.options.getString("tom") || "casual";

        await interaction.deferReply();

        // Construir prompt baseado no tipo
        let systemPrompt = "";
        let maxTokens = 300;

        switch (tipo) {
            case "historia":
                systemPrompt = `Escreva uma história criativa e envolvente sobre: ${topico}. Tom: ${tom}. Tamanho: ${tamanho}.`;
                break;
            case "poema":
                systemPrompt = `Escreva um poema belo e expressivo sobre: ${topico}. Tom: ${tom}. Tamanho: ${tamanho}.`;
                break;
            case "artigo":
                systemPrompt = `Escreva um artigo informativo e bem estruturado sobre: ${topico}. Tom: ${tom}. Tamanho: ${tamanho}.`;
                break;
            case "email":
                systemPrompt = `Escreva um email profissional sobre: ${topico}. Tom: ${tom}. Tamanho: ${tamanho}.`;
                break;
            case "codigo":
                systemPrompt = `Escreva código bem comentado e funcional para: ${topico}. Inclua explicações.`;
                break;
            case "resumo":
                systemPrompt = `Faça um resumo claro e conciso sobre: ${topico}. Tom: ${tom}. Tamanho: ${tamanho}.`;
                break;
        }

        if (tamanho === "longo") maxTokens = 2000;
        if (tamanho === "curto") maxTokens = 500;

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Você é um escritor eficiente que cria conteúdo direto e objetivo."
                    },
                    {
                        role: "user",
                        content: systemPrompt
                    }
                ],
                max_tokens: maxTokens,
                temperature: 0.5
            });

            const generatedText = response.choices[0]?.message?.content || "Não foi possível gerar o texto.";

            const embed = new EmbedBuilder()
                .setTitle(`📝 ${tipo.charAt(0).toUpperCase() + tipo.slice(1)} Gerado`)
                .setDescription(generatedText)
                .setColor(0x1E90FF)
                .addFields(
                    { name: "Tópico", value: topico, inline: true },
                    { name: "Tom", value: tom, inline: true },
                    { name: "Tamanho", value: tamanho, inline: true }
                )
                .setFooter({ 
                    text: `Gerado por: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erro na geração de texto:", error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle("❌ Erro na Geração")
                .setDescription("Ocorreu um erro ao gerar o texto. Tente novamente mais tarde.")
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});