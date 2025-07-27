import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import OpenAI from "openai";

const openai = new OpenAI({
    apiKey: config.OPENAI_KEY,
});

const idiomas = [
    { name: "Português", value: "pt" },
    { name: "Inglês", value: "en" },
    { name: "Espanhol", value: "es" },
    { name: "Francês", value: "fr" },
    { name: "Alemão", value: "de" },
    { name: "Italiano", value: "it" },
    { name: "Japonês", value: "ja" },
    { name: "Chinês", value: "zh" },
    { name: "Russo", value: "ru" },
    { name: "Árabe", value: "ar" }
];

createCommand({
    name: "traduzir",
    description: "Traduza textos entre diferentes idiomas",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "texto",
            description: "Texto para traduzir",
            type: ApplicationCommandOptionType.String,
            required: true,
            maxLength: 1500
        },
        {
            name: "para",
            description: "Idioma de destino",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: idiomas
        },
        {
            name: "de",
            description: "Idioma de origem (auto-detectar se não especificado)",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: idiomas
        }
    ],
    async run(interaction) {
        const texto = interaction.options.getString("texto", true);
        const idiomaDestino = interaction.options.getString("para", true);
        const idiomaOrigem = interaction.options.getString("de");

        await interaction.deferReply();

        const nomeIdiomaDestino = idiomas.find(i => i.value === idiomaDestino)?.name || idiomaDestino;
        const nomeIdiomaOrigem = idiomaOrigem ? idiomas.find(i => i.value === idiomaOrigem)?.name : "Auto-detectar";

        try {
            let prompt = `Traduza o seguinte texto para ${nomeIdiomaDestino}:\n\n"${texto}"`;
            
            if (idiomaOrigem) {
                prompt = `Traduza o seguinte texto de ${nomeIdiomaOrigem} para ${nomeIdiomaDestino}:\n\n"${texto}"`;
            }

            const response = await openai.chat.completions.create({
                model: "gpt-3.5-turbo",
                messages: [
                    {
                        role: "system",
                        content: "Você é um tradutor profissional. Forneça traduções precisas e naturais. Responda apenas com a tradução, sem explicações adicionais."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                max_tokens: 1000,
                temperature: 0.3
            });

            const traducao = response.choices[0]?.message?.content || "Não foi possível traduzir o texto.";

            const embed = new EmbedBuilder()
                .setTitle("Tradução")
                .setColor(0x32CD32)
                .addFields(
                    { 
                        name: `📥 Original (${nomeIdiomaOrigem})`, 
                        value: `\`\`\`\n${texto}\n\`\`\``,
                        inline: false 
                    },
                    { 
                        name: `📤 Tradução (${nomeIdiomaDestino})`, 
                        value: `\`\`\`\n${traducao}\n\`\`\``,
                        inline: false 
                    }
                )
                .setFooter({ 
                    text: `Traduzido por: ${interaction.user.username}`,
                    iconURL: interaction.user.displayAvatarURL()
                })
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

        } catch (error) {
            console.error("Erro na tradução:", error);
            
            const errorEmbed = new EmbedBuilder()
                .setTitle("Erro na Tradução")
                .setDescription("Ocorreu um erro ao traduzir o texto. Tente novamente mais tarde.")
                .setColor(0xFF0000)
                .setTimestamp();

            await interaction.editReply({ embeds: [errorEmbed] });
        }
    }
});