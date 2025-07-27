import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType, 
    EmbedBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "queue",
    description: "Mostra a fila de música atual",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "pagina",
            description: "Página da fila para visualizar",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            min_value: 1
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const page = interaction.options.getInteger("pagina") || 1;

        if (!musicManager.hasQueue(interaction.guildId!)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("📭 Fila Vazia")
                        .setDescription("Não há músicas na fila no momento!")
                        .setColor(0xFF9900)
                ],
                ephemeral: true
            });
            return;
        }

        const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);
        const queueEmbed = queue.getQueueEmbed(page);

        await interaction.reply({ embeds: [queueEmbed] });
    }
});
