import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType, 
    EmbedBuilder,
    GuildMember,
    VoiceBasedChannel,
    ChatInputCommandInteraction
} from "discord.js";
import { musicManager } from "#functions";

createCommand({
    name: "play",
    description: "Toca uma música ou adiciona à fila",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "musica",
            description: "Nome da música, URL do YouTube ou Spotify",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const member = interaction.member as GuildMember;
        const query = interaction.options.getString("musica", true);

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

        const voiceChannel = member.voice.channel as VoiceBasedChannel;

        // Verificar permissões do bot
        if (!voiceChannel.joinable) {
            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro")
                        .setDescription("Não tenho permissão para entrar neste canal de voz!")
                        .setColor(0xFF0000)
                ],
                ephemeral: true
            });
            return;
        }

        await interaction.deferReply();

        try {
            const queue = musicManager.getQueue(interaction.guildId!, interaction.channelId);

            // Conectar ao canal de voz se necessário
            if (!queue.connection) {
                await queue.connect(voiceChannel);
            }

            // Adicionar música(s) à fila
            const addedSongs = await queue.addSong(query, member);

            if (addedSongs.length === 0) {
                await interaction.editReply({
                    embeds: [
                        new EmbedBuilder()
                            .setTitle("❌ Erro")
                            .setDescription("Não foi possível encontrar a música solicitada!")
                            .setColor(0xFF0000)
                    ]
                });
                return;
            }

            // Se não há música tocando, começar a tocar
            if (!queue.isPlaying && !queue.isPaused) {
                await queue.play();
            }

            // Resposta baseada na quantidade de músicas adicionadas
            if (addedSongs.length === 1) {
                const song = addedSongs[0];
                const embed = new EmbedBuilder()
                    .setTitle(queue.currentSong?.title === song.title ? "🎵 Tocando Agora" : "✅ Adicionado à Fila")
                    .setDescription(`**${song.title}**`)
                    .setURL(song.url)
                    .setThumbnail(song.thumbnail)
                    .addFields(
                        { name: "⏱️ Duração", value: queue.formatDuration(song.duration), inline: true },
                        { name: "👤 Solicitado por", value: song.requester.toString(), inline: true },
                        { name: "📋 Posição na fila", value: queue.songs.length > 0 ? queue.songs.length.toString() : "Tocando agora", inline: true }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            } else {
                // Playlist adicionada
                const embed = new EmbedBuilder()
                    .setTitle("📋 Playlist Adicionada")
                    .setDescription(`**${addedSongs.length}** músicas foram adicionadas à fila!`)
                    .addFields(
                        { name: "👤 Solicitado por", value: member.toString(), inline: true },
                        { name: "📋 Total na fila", value: queue.songs.length.toString(), inline: true }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.editReply({ embeds: [embed] });
            }

        } catch (error) {
            console.error("Erro no comando play:", error);
            await interaction.editReply({
                embeds: [
                    new EmbedBuilder()
                        .setTitle("❌ Erro")
                        .setDescription("Ocorreu um erro ao tentar tocar a música!")
                        .setColor(0xFF0000)
                ]
            });
        }
    }
});
