import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    GuildMember,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "clear",
    description: "Limpa a fila de música",
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
                        .setDescription("Não há música na fila no momento!")
                        .setColor(0xFF0000)
                ],
                ephemeral: true
            });
            return;
        }

        const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);
        const queueSize = queue.songs.length;

        if (queueSize === 0) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("📭 Fila Vazia")
                        .setDescription("A fila já está vazia!")
                        .setColor(0xFF9900)
                ],
                ephemeral: true
            });
            return;
        }

        queue.songs = [];

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("🧹 Fila Limpa")
                    .setDescription(`**${queueSize}** música(s) foram removidas da fila!`)
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
