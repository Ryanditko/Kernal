import { ApplicationCommandType, EmbedBuilder, ChatInputCommandInteraction } from "discord.js";
import { createCommand } from "#base";

createCommand({
    name: "help",
    description: "📋 Sistema de ajuda do Kernal Bot",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const embed = new EmbedBuilder()
            .setTitle("🤖 Kernal Bot - Comandos")
            .setDescription("**Sistema completo de administração e entretenimento**")
            .addFields(
                {
                    name: "🎵 **Música**",
                    value: "`/music` - Sistema completo de música\n`/play` - Tocar música\n`/pause` - Pausar/despausar\n`/skip` - Pular música\n`/queue` - Ver fila\n`/volume` - Ajustar volume",
                    inline: false
                },
                {
                    name: "👮 **Administração**",
                    value: "`/user-admin` - Controle total de usuários\n`/server-admin` - Administração de servidores\n`/dm-control` - Painel de controle via DM\n`/infractions` - Sistema de infrações",
                    inline: false
                },
                {
                    name: "🎫 **Sistemas**",
                    value: "`/ticket` - Sistema de tickets\n`/automod` - Automoderação\n`/giveaways` - Sorteios\n`/economy` - Sistema econômico",
                    inline: false
                },
                {
                    name: "🎮 **Diversão**",
                    value: "`/fun` - Comandos divertidos\n`/ai` - Inteligência artificial\n`/analisar-imagem` - Análise de imagens",
                    inline: false
                },
                {
                    name: "📊 **Utilidades**",
                    value: "`/analytics` - Estatísticas do servidor\n`/config` - Configurações\n`/clear` - Limpar mensagens",
                    inline: false
                }
            )
            .setColor(0x0099ff)
            .setFooter({ 
                text: "Use os comandos acima para explorar todas as funcionalidades",
                iconURL: interaction.client.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});
