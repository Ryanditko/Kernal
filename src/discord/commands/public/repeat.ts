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
    name: "repeat",
    description: "Define o modo de repetição",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "modo",
            description: "Modo de repetição",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Desligado", value: "off" },
                { name: "Música Atual", value: "song" },
                { name: "Fila Inteira", value: "queue" }
            ]
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        const mode = interaction.options.getString("modo", true) as 'off' | 'song' | 'queue';

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
        queue.setRepeat(mode);

        let emoji = "🔁";
        let modeText = "Desligado";

        switch (mode) {
            case "off":
                emoji = "▶️";
                modeText = "Desligado";
                break;
            case "song":
                emoji = "🔂";
                modeText = "Música Atual";
                break;
            case "queue":
                emoji = "🔁";
                modeText = "Fila Inteira";
                break;
        }

        await interaction.reply({
            embeds: [
                new EmbedBuilder()
                    .setTitle(`${emoji} Modo de Repetição`)
                    .setDescription(`Repetição definida para: **${modeText}**`)
                    .setColor(0x00FF00)
                    .setTimestamp()
            ]
        });
    }
});
