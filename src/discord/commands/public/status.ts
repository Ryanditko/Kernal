import { createCommand } from "#base";
import { ApplicationCommandType, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";

createCommand({
    name: "status",
    description: "📊 Status do bot e servidor",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const guild = interaction.guild;
        if (!guild) {
            await interaction.reply({ content: "❌ Este comando só pode ser usado em servidores!", ephemeral: true });
            return;
        }

        const botUptime = process.uptime();
        const botMemory = process.memoryUsage();
        
        const embed = new EmbedBuilder()
            .setTitle("📊 Status do Sistema")
            .addFields(
                {
                    name: "🤖 Bot",
                    value: `**Uptime:** ${Math.floor(botUptime / 3600)}h ${Math.floor((botUptime % 3600) / 60)}m\n` +
                           `**Ping:** ${interaction.client.ws.ping}ms\n` +
                           `**Memória:** ${Math.round(botMemory.heapUsed / 1024 / 1024)}MB`,
                    inline: true
                },
                {
                    name: "🏠 Servidor",
                    value: `**Membros:** ${guild.memberCount}\n` +
                           `**Canais:** ${guild.channels.cache.size}\n` +
                           `**Cargos:** ${guild.roles.cache.size}`,
                    inline: true
                },
                {
                    name: "🌐 Sistema",
                    value: `**Servidores:** ${interaction.client.guilds.cache.size}\n` +
                           `**Usuários:** ${interaction.client.users.cache.size}\n` +
                           `**Node.js:** ${process.version}`,
                    inline: true
                }
            )
            .setColor(0x00ff00)
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});
