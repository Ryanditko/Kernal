import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType,
    EmbedBuilder,
    GuildMember,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "volume",
    description: "Ajusta o volume da música",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "nivel",
            description: "Nível do volume (0-100)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            min_value: 0,
            max_value: 100
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        const volume = interaction.options.getInteger("nivel");

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

        // Se não foi especificado volume, mostrar o atual
        if (volume === null) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("🔊 Volume Atual")
                        .setDescription(`O volume está em **${queue.volume}%**`)
                        .setColor(0x00FF00)
                ]
            });
            return;
        }

        // Definir novo volume
        queue.setVolume(volume);

        let emoji = "🔇";
        if (volume > 0 && volume <= 30) emoji = "🔈";
        else if (volume > 30 && volume <= 60) emoji = "🔉";
        else if (volume > 60) emoji = "🔊";

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${emoji} Volume Ajustado`)
                    .setDescription(`Volume definido para **${volume}%**`)
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
