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
    name: "loop",
    description: "Configura o modo de repetição da música",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "mode",
            description: "Modo de repetição",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                {
                    name: "Off - Desabilitar repetição",
                    value: "off"
                },
                {
                    name: "Song - Repetir música atual",
                    value: "song"
                },
                {
                    name: "Queue - Repetir toda a fila",
                    value: "queue"
                }
            ]
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        const mode = interaction.options.getString("mode", true);

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

        let repeatMode: 'off' | 'song' | 'queue' = 'off';
        let description = "";
        let emoji = "";

        switch (mode) {
            case 'off':
                repeatMode = 'off';
                description = "Repetição desabilitada";
                emoji = "⏹️";
                break;
            case 'song':
                repeatMode = 'song';
                description = "Repetindo a música atual";
                emoji = "🔂";
                break;
            case 'queue':
                repeatMode = 'queue';
                description = "Repetindo toda a fila";
                emoji = "🔁";
                break;
        }

        queue.setRepeat(repeatMode);

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${emoji} Modo de Repetição`)
                    .setDescription(description)
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
