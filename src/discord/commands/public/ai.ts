import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: config.OPENAI_KEY,
});

createCommand({
    name: "ai",
    description: "Converse com uma IA avançada",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "prompt",
            description: "Sua pergunta ou mensagem para a IA",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 2000
        },
        {
            name: "modelo",
            description: "Escolha o modelo de IA",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                { name: "GPT-3.5 Turbo (Econômico)", value: "gpt-3.5-turbo" },
                { name: "GPT-4o Mini (Básico)", value: "gpt-4o-mini" }
            ]
        },
        {
            name: "privado",
            description: "Resposta visível apenas para você",
            type: ApplicationCommandOptionType.Boolean,
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

        const prompt = interaction.options.getString("prompt", true);
        const model = interaction.options.getString("modelo") || "gpt-3.5-turbo";
        const isPrivate = interaction.options.getBoolean("privado") || false;

        await interaction.deferReply({ ephemeral: isPrivate });

        try {
            const response = await openai.chat.completions.create({
                model: model,
                messages: [
                    {
                        role: "system",
                        content: "Você é um assistente direto e eficiente. Responda de forma clara e concisa."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 500,
                temperature: 0.3
            });

            const aiResponse = response.choices[0]?.message?.content || "Desculpe, não consegui gerar uma resposta.";

            const embed = new EmbedBuilder()
                .setTitle("Resposta da IA")
                .setDescription(aiResponse)
                .setColor(0x00AE86)
                .setFooter({ 
                    text: `Modelo: ${model} | Solicitado por: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erro na API OpenAI:", error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle("Erro")
                .setDescription("Ocorreu um erro ao processar sua solicitação. Tente novamente mais tarde.")
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});