import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType,
    EmbedBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import { search } from "play-dl";

createCommand({
    name: "search",
    description: "Busca músicas no YouTube",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "query",
            description: "Termo de busca",
            type: ApplicationCommandOptionType.String,
            required: true,
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const query = interaction.options.getString("query", true);

        await interaction.deferReply();

        try {
            const searchResults = await search(query, {
                limit: 10,
                source: { youtube: "video" }
            });

            if (!searchResults || searchResults.length === 0) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Nenhum resultado encontrado")
                            .setDescription(`Nenhuma música encontrada para: **${query}**`)
                            .setColor(0xFF0000)
                    ]
                });
                return;
            }

            const embed = new EmbedBuilder()
                .setTitle("🔍 Resultados da Busca")
                .setDescription(`Mostrando ${searchResults.length} resultados para: **${query}**`)
                .setColor(0x0099FF)
                .setTimestamp();

            searchResults.forEach((track, index) => {
                const duration = track.durationInSec 
                    ? `${Math.floor(track.durationInSec / 60)}:${(track.durationInSec % 60).toString().padStart(2, '0')}`
                    : 'N/A';

                embed.addFields({
                    name: `${index + 1}. ${track.title}`,
                    value: `**Canal:** ${track.channel?.name || 'Desconhecido'}\n**Duração:** ${duration}\n**URL:** [Link](${track.url})`,
                    inline: false
                });
            });

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('Erro na busca:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro na busca")
                        .setDescription("Ocorreu um erro ao buscar músicas. Tente novamente.")
                        .setColor(0xFF0000)
                ]
            });
        }
    }
});
