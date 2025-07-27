import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    GuildMember,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "pause",
    description: "Pausa ou resume a música atual",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;

        // Verificar se o usuário está em um canal de voz
        if (!member.voice.channel) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro")
                        .setDescription("Você precisa estar em um canal de voz!")
                        .setColor(0xFF0000)
                ],
                ephemeral: true
            });
            return;
        }

        if (!musicManager.hasQueue(interaction.guildId!)) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro")
                        .setDescription("Não há música tocando no momento!")
                        .setColor(0xFF0000)
                ],
                ephemeral: true
            });
            return;
        }

        const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);

        if (!queue.currentSong) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro")
                        .setDescription("Não há música tocando no momento!")
                        .setColor(0xFF0000)
                ],
                ephemeral: true
            });
            return;
        }

        let title: string;
        let description: string;

        if (queue.isPaused) {
            queue.resume();
            title = "▶️ Música Resumida";
            description = `**${queue.currentSong.title}** foi resumida!`;
        } else {
            queue.pause();
            title = "⏸️ Música Pausada";
            description = `**${queue.currentSong.title}** foi pausada!`;
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(title)
                    .setDescription(description)
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
