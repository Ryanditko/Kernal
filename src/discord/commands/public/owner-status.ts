import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";

createCommand({
    name: "owner-status",
    description: "Status completo do bot (Apenas para o dono)",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Acesso Negado")
                .setDescription("Este comando é exclusivo para o desenvolvedor do bot.")
                .setColor(0xFF0000)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const client = interaction.client;
        const guilds = client.guilds.cache;
        const totalMembers = guilds.reduce((acc, guild) => acc + guild.memberCount, 0);
        const uptime = process.uptime();
        const uptimeHours = Math.floor(uptime / 3600);
        const uptimeMinutes = Math.floor((uptime % 3600) / 60);

        // Top 5 maiores servidores
        const topGuilds = Array.from(guilds.values())
            .sort((a, b) => b.memberCount - a.memberCount)
            .slice(0, 5);

        let topGuildsText = "";
        topGuilds.forEach((guild, index) => {
            topGuildsText += `**${index + 1}.** ${guild.name} - ${guild.memberCount} membros\n`;
        });

        const embed = new EmbedBuilder()
            .setTitle("👑 Status do Seu Bot Pessoal")
            .setDescription("Dashboard completo de administração")
            .addFields(
                {
                    name: "📊 Estatísticas Gerais",
                    value: `
                    🏰 **Servidores:** ${guilds.size}
                    👥 **Usuários Total:** ${totalMembers.toLocaleString()}
                    ⏱️ **Uptime:** ${uptimeHours}h ${uptimeMinutes}m
                    💾 **Uso de RAM:** ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB
                    `,
                    inline: false
                },
                {
                    name: "🏆 Top 5 Maiores Servidores",
                    value: topGuildsText || "Nenhum servidor encontrado",
                    inline: false
                },
                {
                    name: "🔧 Funcionalidades Ativas",
                    value: `
                    ✅ Sistema de Música
                    ✅ IA com OpenAI
                    ✅ Administração Remota
                    ✅ Sistema de Tickets
                    ✅ Moderação Avançada
                    ✅ Sistema de Economia
                    ✅ Entretenimento
                    ✅ Utilities
                    `,
                    inline: true
                },
                {
                    name: "🛡️ Segurança",
                    value: `
                    🔒 **Acesso Restrito:** Apenas você
                    🕵️ **Modo Anônimo:** DM ativo
                    🛡️ **Admin Remoto:** Funcional
                    📡 **Monitoramento:** Ativo
                    `,
                    inline: true
                }
            )
            .setColor(0x00FF00)
            .setThumbnail(client.user.displayAvatarURL())
            .setFooter({ 
                text: `Bot exclusivo de ${interaction.user.username}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});
