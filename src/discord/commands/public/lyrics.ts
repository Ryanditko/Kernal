import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType,
    EmbedBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "lyrics",
    description: "Exibe a letra da música atual ou de uma música específica",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "song",
            description: "Nome da música para buscar a letra (opcional)",
            type: ApplicationCommandOptionType.String,
            required: false,
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        await interaction.deferReply();

        const songQuery = interaction.options.getString("song");
        let searchQuery = "";

        if (songQuery) {
            searchQuery = songQuery;
        } else {
            // Usar música atual da fila
            if (!musicManager.hasQueue(interaction.guildId!)) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Erro")
                            .setDescription("Não há música tocando no momento! Especifique o nome de uma música.")
                            .setColor(0xFF0000)
                    ]
                });
                return;
            }

            const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);
            const currentTrack = queue.currentSong;

            if (!currentTrack) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Erro")
                            .setDescription("Não há música tocando no momento! Especifique o nome de uma música.")
                            .setColor(0xFF0000)
                    ]
                });
                return;
            }

            searchQuery = currentTrack.title;
        }

        try {
            // Simulação de busca de letra (você pode integrar com APIs como Genius, LyricFind, etc.)
            // Por enquanto, retornamos uma mensagem informativa
            const embed = new EmbedBuilder()
                .setTitle("🎵 Letra da Música")
                .setDescription(`**Música:** ${searchQuery}\n\n⚠️ **Funcionalidade em desenvolvimento**\n\nEsta funcionalidade está sendo implementada. Em breve você poderá visualizar as letras das músicas aqui!\n\nPara implementar completamente, seria necessário integrar com APIs como:\n• Genius API\n• LyricFind API\n• MusixMatch API`)
                .setColor(0x0099FF)
                .setFooter({ text: "Funcionalidade será implementada em breve" })
                .setTimestamp();

            await interaction.editReply({
                embeds: [embed]
            });

        } catch (error) {
            console.error('Erro ao buscar letra:', error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro")
                        .setDescription("Ocorreu um erro ao buscar a letra da música.")
                        .setColor(0xFF0000)
                ]
            });
        }
    }
});
