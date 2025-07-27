import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    EmbedBuilder,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "musicinfo",
    description: "Mostra informações sobre o sistema de música do bot",
    type: ApplicationCommandType.ChatInput,
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const totalQueues = musicManager.getAllQueues().length;
        const hasQueue = musicManager.hasQueue(interaction.guildId!);
        let queueInfo = "Nenhuma música tocando";
        
        if (hasQueue) {
            const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);
            queueInfo = `**Música atual:** ${queue.currentSong?.title || 'Nenhuma'}\n`;
            queueInfo += `**Músicas na fila:** ${queue.songs.length}\n`;
            queueInfo += `**Volume:** ${queue.volume}%\n`;
            queueInfo += `**Repetir:** ${queue.repeat === 'off' ? 'Desabilitado' : queue.repeat === 'song' ? 'Música' : 'Fila'}\n`;
            queueInfo += `**Embaralhar:** ${queue.shuffle ? 'Ativado' : 'Desativado'}\n`;
            queueInfo += `**Status:** ${queue.isPlaying ? (queue.isPaused ? 'Pausado' : 'Tocando') : 'Parado'}`;
        }

        const embed = new EmbedBuilder()
            .setTitle("🎵 Informações do Sistema de Música")
            .setDescription("Sistema de música avançado integrado ao Kernal Bot")
            .addFields(
                {
                    name: "📊 Estatísticas Globais",
                    value: `**Filas ativas:** ${totalQueues}\n**Servidores com música:** ${totalQueues}`,
                    inline: true
                },
                {
                    name: "🎧 Status deste Servidor",
                    value: queueInfo,
                    inline: false
                },
                {
                    name: "🎼 Funcionalidades Disponíveis",
                    value: "• Reprodução de YouTube e Spotify\n• Sistema de filas avançado\n• Controle de volume\n• Modos de repetição\n• Embaralhamento\n• Busca de músicas\n• Controle de reprodução completo",
                    inline: false
                },
                {
                    name: "🔧 Comandos Principais",
                    value: "`/play` - Tocar música\n`/queue` - Ver fila\n`/skip` - Pular música\n`/volume` - Ajustar volume\n`/loop` - Modo repetição\n`/search` - Buscar músicas",
                    inline: false
                }
            )
            .setColor(0x0099FF)
            .setFooter({ text: "Kernal Bot • Sistema de Música v2.0" })
            .setTimestamp();

        await interaction.reply({
            embeds: [embed]
        });
    }
});
