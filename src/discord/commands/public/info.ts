import { ApplicationCommandType, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "#base";

createCommand({
    name: "info",
    description: "ℹ️ Informações sobre o Kernal Bot",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle("🤖 Kernal Bot")
            .setDescription("**Bot de administração e entretenimento completo**")
            .addFields(
                {
                    name: "📈 Estatísticas",
                    value: `**Servidores:** ${interaction.client.guilds.cache.size}\n` +
                           `**Usuários:** ${interaction.client.users.cache.size}\n` +
                           `**Comandos:** 50+`,
                    inline: true
                },
                {
                    name: "⚡ Recursos",
                    value: "• Sistema de música completo\n• Administração avançada\n• Controle via DM\n• Sistema de tickets\n• Automoderação",
                    inline: true
                },
                {
                    name: "🔗 Links",
                    value: "[GitHub](https://github.com/CorwinDev/Discord-Bot)\n[Suporte](https://discord.gg/seu-servidor)",
                    inline: true
                }
            )
            .setColor(0x0099ff)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ 
                text: "Kernal Bot - Desenvolvido com ❤️",
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});
