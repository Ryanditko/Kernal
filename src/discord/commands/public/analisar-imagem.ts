import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: config.OPENAI_KEY,
});

createCommand({
    name: "analisar-imagem",
    description: "Analise uma imagem usando IA",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "imagem",
            description: "Anexe uma imagem para análise",
            type: ApplicationCommandOptionType.Attachment,
            required: true
        },
        {
            name: "pergunta",
            description: "Pergunta específica sobre a imagem (opcional)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 1000
        },
        {
            name: "privado",
            description: "Resposta visível apenas para você",
            type: ApplicationCommandOptionType.Boolean,
            required: false
        }
    ],
    async run(interaction) {
        const attachment = interaction.options.getAttachment("imagem", true);
        const question = interaction.options.getString("pergunta") || "Descreva esta imagem em detalhes.";
        const isPrivate = interaction.options.getBoolean("privado") || false;

        // Verificar se é uma imagem
        if (!attachment.contentType?.startsWith("image/")) {
            await interaction.reply({
                content: "Por favor, anexe apenas arquivos de imagem válidos.",
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply({ ephemeral: isPrivate });

        try {
            const response = await openai.chat.completions.create({
                model: "gpt-4o-mini",
                messages: [
                    {
                        role: "user",
                        content: [
                            {
                                type: "text",
                                text: question
                            },
                            {
                                type: "image_url",
                                image_url: {
                                    url: attachment.url
                                }
                            }
                        ]
                    }
                ],
                max_tokens: 300
            });

            const analysis = response.choices[0]?.message?.content || "Não consegui analisar a imagem.";

            const embed = new EmbedBuilder()
                .setTitle("Análise de Imagem")
                .setDescription(analysis)
                .setColor(0x9932CC)
                .setImage(attachment.url)
                .setFooter({ 
                    text: `Analisado por: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erro na análise de imagem:", error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle("Erro na Análise")
                .setDescription("Ocorreu um erro ao analisar a imagem. Verifique se a imagem é válida e tente novamente.")
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});