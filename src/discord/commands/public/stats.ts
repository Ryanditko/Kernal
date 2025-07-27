import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "stats",
    description: "Mostra estatísticas gerais do Kernal Bot",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const client = interaction.client;
        const totalGuilds = client.guilds.cache.size;
        const totalUsers = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
        const totalChannels = client.channels.cache.size;
        const activeQueues = musicManager.getAllQueues().length;
        
        // Calcular uptime
        const uptime = process.uptime();
        const days = Math.floor(uptime / 86400);
        const hours = Math.floor((uptime % 86400) / 3600);
        const minutes = Math.floor((uptime % 3600) / 60);
        const seconds = Math.floor(uptime % 60);
        
        const uptimeString = `${days}d ${hours}h ${minutes}m ${seconds}s`;
        
        // Informações de memória
        const memoryUsage = process.memoryUsage();
        const memoryUsed = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryTotal = Math.round(memoryUsage.heapTotal / 1024 / 1024);
        
        const embed = new EmbedBuilder()
            .setTitle("📊 Estatísticas do Kernal Bot")
            .setDescription("Informações gerais sobre o desempenho e uso do bot")
            .addFields(
                {
                    name: "🏠 Servidores",
                    value: `**${totalGuilds}** servidores`,
                    inline: true
                },
                {
                    name: "👥 Usuários",
                    value: `**${totalUsers.toLocaleString()}** usuários`,
                    inline: true
                },
                {
                    name: "📺 Canais",
                    value: `**${totalChannels}** canais`,
                    inline: true
                },
                {
                    name: "🎵 Música Ativa",
                    value: `**${activeQueues}** filas tocando`,
                    inline: true
                },
                {
                    name: "⏱️ Uptime",
                    value: `**${uptimeString}**`,
                    inline: true
                },
                {
                    name: "💾 Memória",
                    value: `**${memoryUsed}MB** / ${memoryTotal}MB`,
                    inline: true
                },
                {
                    name: "🔧 Versão Node.js",
                    value: `**${process.version}**`,
                    inline: true
                },
                {
                    name: "📡 Ping",
                    value: `**${client.ws.ping}ms**`,
                    inline: true
                },
                {
                    name: "🤖 Bot ID",
                    value: `**${client.user?.id}**`,
                    inline: true
                }
            )
            .setColor(0x00FF00)
            .setThumbnail(client.user?.avatarURL() || null)
            .setFooter({ 
                text: `Kernal Bot • Online desde ${new Date(Date.now() - uptime * 1000).toLocaleDateString('pt-BR')}` 
            })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
});
