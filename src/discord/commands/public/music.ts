import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder, VoiceChannel, GuildMember } from "discord.js";
import { 
    joinVoiceChannel, 
    createAudioPlayer, 
    createAudioResource, 
    AudioPlayerStatus
} from "@discordjs/voice";
import { stream, video_basic_info, search } from "play-dl";
import { createRow } from "@magicyan/discord";
import { ButtonBuilder, ButtonStyle } from "discord.js";

interface Queue {
    guildId: string;
    voiceChannel: VoiceChannel;
    connection?: any;
    player?: any;
    songs: Song[];
    currentSong?: Song;
    isPlaying: boolean;
    volume: number;
}

interface Song {
    title: string;
    url: string;
    duration: string;
    thumbnail: string;
    requestedBy: string;
}

const queues = new Map<string, Queue>();

async function getSongInfo(query: string): Promise<Song | null> {
    try {
        console.log(`🔍 Processando query: ${query}`);
        
        // Se for uma URL do Spotify, extrair informações e buscar no YouTube
        if (query.includes('spotify.com')) {
            console.log(`🎵 URL do Spotify detectada, convertendo para busca...`);
            const spotifyQuery = await extractSpotifyInfo(query);
            if (spotifyQuery) {
                query = spotifyQuery;
            } else {
                console.log(`⚠️ Não foi possível converter Spotify, usando busca normal`);
                // Remover parâmetros da URL para busca mais limpa
                query = query.split('?')[0].split('/').pop() || query;
            }
        }
        
        // Se for uma URL do YouTube, usar diretamente
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            console.log(`▶️ URL do YouTube detectada: ${query}`);
            
            try {
                const info = await video_basic_info(query);
                console.log(`✅ Informações obtidas: ${info.video_details.title}`);
                
                return {
                    title: info.video_details.title || "Título desconhecido",
                    url: query,
                    duration: formatDuration(info.video_details.durationInSec || 0),
                    thumbnail: info.video_details.thumbnails?.[0]?.url || "",
                    requestedBy: ""
                };
            } catch (ytError) {
                console.error(`❌ Erro ao obter info do YouTube:`, ytError);
                return null;
            }
        }
        
        // Se não for URL, fazer busca no YouTube
        console.log(`🔍 Fazendo busca no YouTube por: ${query}`);
        const searchResults = await search(query, { 
            limit: 5,
            source: { youtube: "video" }
        });
        
        console.log(`📋 Resultados encontrados: ${searchResults.length}`);
        
        if (searchResults.length === 0) {
            console.log(`❌ Nenhum resultado encontrado`);
            return null;
        }
        
        // Pegar o primeiro resultado válido
        const youtubeResult = searchResults[0];
        
        if (!youtubeResult || !youtubeResult.url) {
            console.log(`❌ Resultado inválido`);
            return null;
        }
        
        console.log(`✅ Música encontrada: ${youtubeResult.title}`);
        
        return {
            title: youtubeResult.title || "Título desconhecido",
            url: youtubeResult.url,
            duration: formatDuration(youtubeResult.durationInSec || 0),
            thumbnail: youtubeResult.thumbnails?.[0]?.url || "",
            requestedBy: ""
        };
    } catch (error) {
        console.error("❌ Erro ao obter informações da música:", error);
        return null;
    }
}

async function extractSpotifyInfo(spotifyUrl: string): Promise<string | null> {
    try {
        // Extrair ID da track do Spotify
        const match = spotifyUrl.match(/track\/([a-zA-Z0-9]+)/);
        if (!match) return null;
        
        // Para simplificar, vamos apenas extrair informações básicas da URL
        // Em uma implementação mais completa, você usaria a Spotify Web API
        
        // Por enquanto, vamos tentar extrair o nome da música da URL
        // Uma implementação mais robusta exigiria chaves da API do Spotify
        
        return null; // Retornar null para que use a busca normal
    } catch (error) {
        console.error("Erro ao processar URL do Spotify:", error);
        return null;
    }
}

function formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

async function playNext(queue: Queue) {
    if (queue.songs.length === 0) {
        queue.isPlaying = false;
        queue.currentSong = undefined;
        return;
    }

    const song = queue.songs.shift()!;
    queue.currentSong = song;
    queue.isPlaying = true;

    try {
        console.log(`🎵 Tentando tocar: ${song.title}`);
        console.log(`🔗 URL: ${song.url}`);
        
        // Criar stream de áudio com play-dl
        const audioStream = await stream(song.url, { 
            quality: 2,
            seek: 0,
            htmldata: false
        });
        
        console.log(`📡 Stream criado com tipo: ${audioStream.type}`);
        
        // Criar resource de áudio
        const resource = createAudioResource(audioStream.stream, {
            inputType: audioStream.type,
            inlineVolume: true
        });
        
        // Definir volume se disponível
        if (resource.volume) {
            resource.volume.setVolume(queue.volume / 100);
        }
        
        console.log(`🔊 Iniciando reprodução...`);
        
        // Tocar o resource
        queue.player.play(resource);
        
        // Remover listeners antigos para evitar duplicatas
        queue.player.removeAllListeners(AudioPlayerStatus.Idle);
        queue.player.removeAllListeners(AudioPlayerStatus.Playing);
        queue.player.removeAllListeners(AudioPlayerStatus.Paused);
        queue.player.removeAllListeners('error');
        
        // Adicionar listeners de evento
        queue.player.once(AudioPlayerStatus.Playing, () => {
            console.log(`▶️ Música tocando: ${song.title}`);
        });
        
        queue.player.once(AudioPlayerStatus.Idle, () => {
            console.log(`⏭️ Música terminou: ${song.title}`);
            setTimeout(() => playNext(queue), 1000); // Pequeno delay antes da próxima música
        });
        
        queue.player.on('error', (error: any) => {
            console.error(`❌ Erro no player:`, error);
            setTimeout(() => playNext(queue), 1000);
        });

    } catch (error) {
        console.error(`❌ Erro ao reproduzir música:`, error);
        console.error(`📋 Detalhes do erro:`, error instanceof Error ? error.message : 'Erro desconhecido');
        
        // Tentar próxima música após erro
        setTimeout(() => playNext(queue), 1000);
    }
}

createCommand({
    name: "music",
    description: "Sistema completo de música",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "action",
            description: "Ação a ser executada",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "🎵 Tocar", value: "play" },
                { name: "⏸️ Pausar", value: "pause" },
                { name: "▶️ Retomar", value: "resume" },
                { name: "⏭️ Pular", value: "skip" },
                { name: "⏹️ Parar", value: "stop" },
                { name: "📃 Fila", value: "queue" },
                { name: "🔀 Embaralhar", value: "shuffle" },
                { name: "🔁 Loop", value: "loop" },
                { name: "🔊 Volume", value: "volume" },
                { name: "🎵 Tocando Agora", value: "nowplaying" }
            ]
        },
        {
            name: "query",
            description: "URL do YouTube/Spotify ou termo de busca",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "volume",
            description: "Volume (1-100)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 100
        }
    ],
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Bot em Fase de Teste")
                .setDescription("Este bot está em fase de testes e restrito ao desenvolvedor.")
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const action = interaction.options.getString("action", true);
        const query = interaction.options.getString("query");

        const member = interaction.member as GuildMember;
        const voiceChannel = member.voice.channel;

        if (!voiceChannel) {
            await interaction.reply({
                content: "❌ Você precisa estar em um canal de voz!",
                ephemeral: true
            });
            return;
        }

        let queue = queues.get(interaction.guildId!);

        switch (action) {
            case "play":
                if (!query) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer uma URL ou termo de busca!",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferReply();

                if (!queue) {
                    console.log(`🔌 Conectando ao canal de voz: ${voiceChannel.name}`);
                    
                    const connection = joinVoiceChannel({
                        channelId: voiceChannel.id,
                        guildId: interaction.guildId!,
                        adapterCreator: interaction.guild!.voiceAdapterCreator,
                    });

                    console.log(`🎵 Criando audio player...`);
                    const player = createAudioPlayer();
                    
                    console.log(`🔗 Conectando player à conexão...`);
                    const subscription = connection.subscribe(player);
                    
                    if (!subscription) {
                        console.error(`❌ Falha ao conectar player à conexão de voz!`);
                        await interaction.editReply("❌ Erro ao conectar ao canal de voz!");
                        return;
                    }
                    
                    console.log(`✅ Player conectado com sucesso!`);

                    // Aguardar conexão estar pronta
                    connection.on('stateChange', (oldState, newState) => {
                        console.log(`🔄 Conexão mudou de ${oldState.status} para ${newState.status}`);
                    });

                    queue = {
                        guildId: interaction.guildId!,
                        voiceChannel: voiceChannel as VoiceChannel,
                        connection,
                        player,
                        songs: [],
                        isPlaying: false,
                        volume: 50
                    };

                    queues.set(interaction.guildId!, queue);
                    console.log(`📋 Queue criada para guild: ${interaction.guildId}`);
                }

                console.log(`🎵 Obtendo informações da música...`);
                const songInfo = await getSongInfo(query);
                if (!songInfo) {
                    console.log(`❌ Não foi possível obter informações da música`);
                    await interaction.editReply("❌ Não foi possível encontrar essa música!");
                    return;
                }

                console.log(`✅ Música encontrada: ${songInfo.title}`);
                songInfo.requestedBy = interaction.user.username;
                queue.songs.push(songInfo);

                const embed = new EmbedBuilder()
                    .setTitle("🎵 Música Adicionada à Fila")
                    .setDescription(`**${songInfo.title}**`)
                    .addFields(
                        { name: "Duração", value: songInfo.duration, inline: true },
                        { name: "Posição na Fila", value: queue.songs.length.toString(), inline: true },
                        { name: "Solicitado por", value: songInfo.requestedBy, inline: true }
                    )
                    .setThumbnail(songInfo.thumbnail)
                    .setColor(0x00AE86)
                    .setTimestamp();

                const musicControls = createRow(
                    new ButtonBuilder()
                        .setCustomId("music_pause")
                        .setLabel("⏸️ Pausar")
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId("music_skip")
                        .setLabel("⏭️ Pular")
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId("music_stop")
                        .setLabel("⏹️ Parar")
                        .setStyle(ButtonStyle.Danger),
                    new ButtonBuilder()
                        .setCustomId("music_queue")
                        .setLabel("📃 Fila")
                        .setStyle(ButtonStyle.Success)
                );

                await interaction.editReply({ 
                    embeds: [embed],
                    components: [musicControls]
                });

                console.log(`📋 Status da queue - Tocando: ${queue.isPlaying}, Músicas na fila: ${queue.songs.length}`);
                
                if (!queue.isPlaying) {
                    console.log(`▶️ Iniciando reprodução...`);
                    await playNext(queue);
                } else {
                    console.log(`🎵 Música adicionada à fila, player já tocando`);
                }
                break;

            case "queue":
                if (!queue || queue.songs.length === 0) {
                    await interaction.reply("📃 A fila está vazia!");
                    return;
                }

                const queueEmbed = new EmbedBuilder()
                    .setTitle("📃 Fila de Música")
                    .setColor(0x9932CC);

                if (queue.currentSong) {
                    queueEmbed.addFields({
                        name: "🎵 Tocando Agora",
                        value: `**${queue.currentSong.title}**\nSolicitado por: ${queue.currentSong.requestedBy}`,
                        inline: false
                    });
                }

                const queueList = queue.songs.slice(0, 10).map((song, index) => 
                    `${index + 1}. **${song.title}** - ${song.duration}\nSolicitado por: ${song.requestedBy}`
                ).join('\n\n');

                if (queueList) {
                    queueEmbed.addFields({
                        name: "⏭️ Próximas",
                        value: queueList,
                        inline: false
                    });
                }

                if (queue.songs.length > 10) {
                    queueEmbed.setFooter({ text: `E mais ${queue.songs.length - 10} música(s)...` });
                }

                await interaction.reply({ embeds: [queueEmbed] });
                break;

            case "skip":
                if (!queue || !queue.isPlaying) {
                    await interaction.reply("❌ Não há música tocando!");
                    return;
                }

                queue.player.stop();
                await interaction.reply("⏭️ Música pulada!");
                break;

            case "pause":
                if (!queue || !queue.isPlaying) {
                    await interaction.reply("❌ Não há música tocando!");
                    return;
                }

                queue.player.pause();
                await interaction.reply("⏸️ Música pausada!");
                break;

            case "resume":
                if (!queue) {
                    await interaction.reply("❌ Não há música na fila!");
                    return;
                }

                queue.player.unpause();
                await interaction.reply("▶️ Música retomada!");
                break;

            case "stop":
                if (!queue) {
                    await interaction.reply("❌ Não há música tocando!");
                    return;
                }

                queue.songs = [];
                queue.player.stop();
                queue.connection?.destroy();
                queues.delete(interaction.guildId!);
                await interaction.reply("⏹️ Música parada e fila limpa!");
                break;

            case "nowplaying":
                if (!queue || !queue.currentSong) {
                    await interaction.reply("❌ Não há música tocando!");
                    return;
                }

                const npEmbed = new EmbedBuilder()
                    .setTitle("🎵 Tocando Agora")
                    .setDescription(`**${queue.currentSong.title}**`)
                    .addFields(
                        { name: "Duração", value: queue.currentSong.duration, inline: true },
                        { name: "Solicitado por", value: queue.currentSong.requestedBy, inline: true },
                        { name: "Volume", value: `${queue.volume}%`, inline: true }
                    )
                    .setThumbnail(queue.currentSong.thumbnail)
                    .setColor(0x1E90FF)
                    .setTimestamp();

                await interaction.reply({ embeds: [npEmbed] });
                break;

            case "shuffle":
                if (!queue || queue.songs.length < 2) {
                    await interaction.reply("❌ Não há músicas suficientes na fila para embaralhar!");
                    return;
                }

                for (let i = queue.songs.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [queue.songs[i], queue.songs[j]] = [queue.songs[j], queue.songs[i]];
                }

                await interaction.reply("🔀 Fila embaralhada!");
                break;

            default:
                await interaction.reply("❌ Ação inválida!");
        }
    }
});
