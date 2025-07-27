import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    GuildMember,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "stop",
    description: "Para a música e limpa a fila",
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
        queue.clear();
        queue.disconnect();
        musicManager.deleteQueue(interaction.guildId!);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle("⏹️ Música Parada")
                    .setDescription("A música foi parada e a fila foi limpa!")
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
