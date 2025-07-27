import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    GuildMember,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "shuffle",
    description: "Liga/desliga o modo aleatório",
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
        const newShuffleState = !queue.shuffle;
        queue.setShuffle(newShuffleState);

        const emoji = newShuffleState ? "🔀" : "➡️";
        const status = newShuffleState ? "Ligado" : "Desligado";

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${emoji} Modo Aleatório`)
                    .setDescription(`Shuffle foi **${status}**!`)
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
