import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "nowplaying",
    description: "Mostra informações da música atual",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        if (!musicManager.hasQueue(interaction.guildId!)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🎵 Nenhuma música tocando")
                        .setDescription("Não há música tocando no momento!")
                        .setColor(0xFF9900)
                ],
                ephemeral: true
            });
            return;
        }

        const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);
        const nowPlayingEmbed = queue.getCurrentEmbed();

        await interaction.reply({ embeds: [nowPlayingEmbed] });
    }
});
