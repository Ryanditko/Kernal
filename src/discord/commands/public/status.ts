import { createCommand } from "#base";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";

export default createCommand({
    name: "status",
    description: "Show bot status and statistics",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        const embed = new EmbedBuilder()
            .setTitle("📊 Bot Status")
            .setColor(0x7289DA)
            .addFields(
                {
                    name: "🖥️ Servers",
                    value: `${interaction.client.guilds.cache.size}`,
                    inline: true
                },
                {
                    name: "👥 Users",
                    value: `${interaction.client.guilds.cache.reduce((a, g) => a + g.memberCount, 0)}`,
                    inline: true
                },
                {
                    name: "⏳ Uptime",
                    value: formatUptime(interaction.client.uptime),
                    inline: true
                },
                {
                    name: "🏓 Ping",
                    value: `${interaction.client.ws.ping}ms`,
                    inline: true
                }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});

function formatUptime(ms: number | null): string {
    if (!ms) return "Unknown";
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    return `${days}d ${hours % 24}h ${minutes % 60}m ${seconds % 60}s`;
}