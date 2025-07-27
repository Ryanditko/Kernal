import {
    VoiceConnection,
    VoiceConnectionStatus,
    createAudioPlayer,
    createAudioResource,
    joinVoiceChannel,
    AudioPlayerStatus,
    AudioPlayer,
    AudioResource,
    entersState,
    NoSubscriberBehavior
} from '@discordjs/voice';
import { GuildMember, VoiceBasedChannel, EmbedBuilder } from 'discord.js';
import { stream, video_basic_info, spotify } from 'play-dl';
import { YouTube } from 'youtube-sr';
import prettyMs from 'pretty-ms';

export interface Song {
    title: string;
    url: string;
    duration: number;
    thumbnail: string;
    requester: GuildMember;
    isLive?: boolean;
    source: 'youtube' | 'spotify' | 'soundcloud';
}

export interface QueueOptions {
    repeat: 'off' | 'song' | 'queue';
    volume: number;
    shuffle: boolean;
}

export class MusicQueue {
    public readonly guildId: string;
    public readonly textChannelId: string;
    public voiceChannelId: string | null = null;
    public connection: VoiceConnection | null = null;
    public player: AudioPlayer;
    public songs: Song[] = [];
    public volume: number = 50;
    public repeat: 'off' | 'song' | 'queue' = 'off';
    public shuffle: boolean = false;
    public currentSong: Song | null = null;
    public previousSongs: Song[] = [];
    public isPlaying: boolean = false;
    public isPaused: boolean = false;

    constructor(guildId: string, textChannelId: string) {
        this.guildId = guildId;
        this.textChannelId = textChannelId;
        
        this.player = createAudioPlayer({
            behaviors: {
                noSubscriber: NoSubscriberBehavior.Pause,
            },
        });

        this.player.on(AudioPlayerStatus.Playing, () => {
            this.isPlaying = true;
            this.isPaused = false;
            console.log(`🎵 Tocando: ${this.currentSong?.title}`);
        });

        this.player.on(AudioPlayerStatus.Paused, () => {
            this.isPaused = true;
            console.log(`⏸️ Pausado: ${this.currentSong?.title}`);
        });

        this.player.on(AudioPlayerStatus.Idle, () => {
            this.isPlaying = false;
            this.isPaused = false;
            console.log(`⭐ Música finalizada: ${this.currentSong?.title}`);
            this.handleSongEnd();
        });

        this.player.on('error', (error) => {
            console.error(`❌ Erro no player:`, error);
            this.skip();
        });
    }

    public async connect(voiceChannel: VoiceBasedChannel): Promise<VoiceConnection> {
        try {
            this.voiceChannelId = voiceChannel.id;
            
            this.connection = joinVoiceChannel({
                channelId: voiceChannel.id,
                guildId: voiceChannel.guildId,
                adapterCreator: voiceChannel.guild.voiceAdapterCreator,
                selfDeaf: true,
            });

            this.connection.on(VoiceConnectionStatus.Disconnected, async () => {
                try {
                    await Promise.race([
                        entersState(this.connection!, VoiceConnectionStatus.Signalling, 5_000),
                        entersState(this.connection!, VoiceConnectionStatus.Connecting, 5_000),
                    ]);
                } catch (error) {
                    console.log('🔌 Conexão perdida, tentando reconectar...');
                    this.connection?.destroy();
                }
            });

            this.connection.on('error', (error) => {
                console.error('❌ Erro na conexão de voz:', error);
            });

            this.connection.subscribe(this.player);
            
            await entersState(this.connection, VoiceConnectionStatus.Ready, 30_000);
            console.log(`🎤 Conectado ao canal de voz: ${voiceChannel.name}`);
            
            return this.connection;
        } catch (error) {
            console.error('❌ Erro ao conectar no canal de voz:', error);
            throw error;
        }
    }

    public async addSong(query: string, requester: GuildMember): Promise<Song[]> {
        try {
            console.log(`🔍 Buscando: ${query}`);
            const addedSongs: Song[] = [];

            // Detectar se é URL do Spotify
            if (query.includes('spotify.com')) {
                const spotifyData = await this.handleSpotifyUrl(query, requester);
                if (spotifyData) {
                    addedSongs.push(...spotifyData);
                }
            }
            // Detectar se é URL do YouTube
            else if (query.includes('youtube.com') || query.includes('youtu.be')) {
                const youtubeData = await this.handleYouTubeUrl(query, requester);
                if (youtubeData) {
                    addedSongs.push(youtubeData);
                }
            }
            // Busca por texto
            else {
                const searchData = await this.searchYouTube(query, requester);
                if (searchData) {
                    addedSongs.push(searchData);
                }
            }

            this.songs.push(...addedSongs);
            console.log(`✅ ${addedSongs.length} música(s) adicionada(s) à fila`);
            
            return addedSongs;
        } catch (error) {
            console.error('❌ Erro ao adicionar música:', error);
            throw error;
        }
    }

    private async handleSpotifyUrl(url: string, requester: GuildMember): Promise<Song[]> {
        try {
            const spotifyData = await spotify(url) as any;
            const songs: Song[] = [];

            if (spotifyData.type === 'track') {
                // Buscar a música no YouTube
                const query = `${spotifyData.artists?.[0]?.name || ''} ${spotifyData.name || spotifyData.title}`;
                const youtubeResult = await this.searchYouTube(query, requester);
                if (youtubeResult) {
                    songs.push(youtubeResult);
                }
            } else if (spotifyData.type === 'playlist' || spotifyData.type === 'album') {
                // Buscar todas as músicas da playlist/album
                const tracks = spotifyData.tracks || spotifyData.page?.tracks || [];
                for (const track of tracks) {
                    const query = `${track.artists?.[0]?.name || ''} ${track.name || track.title}`;
                    const youtubeResult = await this.searchYouTube(query, requester);
                    if (youtubeResult) {
                        songs.push(youtubeResult);
                    }
                }
            }

            return songs;
        } catch (error) {
            console.error('❌ Erro ao processar URL do Spotify:', error);
            return [];
        }
    }

    private async handleYouTubeUrl(url: string, requester: GuildMember): Promise<Song | null> {
        try {
            const info = await video_basic_info(url);
            
            return {
                title: info.video_details.title || 'Título Desconhecido',
                url: info.video_details.url,
                duration: info.video_details.durationInSec * 1000,
                thumbnail: info.video_details.thumbnails?.[0]?.url || '',
                requester,
                isLive: info.video_details.live,
                source: 'youtube'
            };
        } catch (error) {
            console.error('❌ Erro ao processar URL do YouTube:', error);
            return null;
        }
    }

    private async searchYouTube(query: string, requester: GuildMember): Promise<Song | null> {
        try {
            const results = await YouTube.searchOne(query, 'video');
            
            if (!results) {
                console.log('❌ Nenhum resultado encontrado');
                return null;
            }
            
            return {
                title: results.title || 'Título Desconhecido',
                url: results.url,
                duration: results.duration || 0,
                thumbnail: results.thumbnail?.url || '',
                requester,
                isLive: results.live || false,
                source: 'youtube'
            };
        } catch (error) {
            console.error('❌ Erro na busca do YouTube:', error);
            return null;
        }
    }

    public async play(): Promise<void> {
        if (!this.connection) {
            throw new Error('Não conectado ao canal de voz');
        }

        if (this.songs.length === 0) {
            console.log('📭 Fila vazia');
            return;
        }

        try {
            this.currentSong = this.songs.shift()!;
            console.log(`🎵 Preparando para tocar: ${this.currentSong.title}`);

            const streamData = await stream(this.currentSong.url, {
                quality: 2,
                seek: 0,
                discordPlayerCompatibility: true
            });

            const resource: AudioResource = createAudioResource(streamData.stream, {
                inputType: streamData.type,
                inlineVolume: true
            });

            if (resource.volume) {
                resource.volume.setVolume(this.volume / 100);
            }

            this.player.play(resource);
            console.log(`▶️ Tocando agora: ${this.currentSong.title}`);
        } catch (error) {
            console.error('❌ Erro ao reproduzir música:', error);
            this.skip();
        }
    }

    private handleSongEnd(): void {
        if (!this.currentSong) return;

        // Adicionar à lista de músicas anteriores
        this.previousSongs.push(this.currentSong);
        if (this.previousSongs.length > 10) {
            this.previousSongs.shift();
        }

        // Lógica de repetição
        switch (this.repeat) {
            case 'song':
                this.songs.unshift(this.currentSong);
                break;
            case 'queue':
                this.songs.push(this.currentSong);
                break;
        }

        // Tocar próxima música
        if (this.songs.length > 0) {
            this.play().catch(console.error);
        } else {
            this.currentSong = null;
            console.log('🏁 Fila finalizada');
        }
    }

    public skip(): void {
        this.player.stop();
    }

    public previous(): boolean {
        if (this.previousSongs.length === 0) {
            return false;
        }

        // Mover música atual de volta para o início da fila
        if (this.currentSong) {
            this.songs.unshift(this.currentSong);
        }

        // Pegar a música anterior e colocá-la no início da fila
        const previousSong = this.previousSongs.pop()!;
        this.songs.unshift(previousSong);

        // Parar a música atual para começar a anterior
        this.player.stop();
        return true;
    }

    public pause(): boolean {
        if (this.isPlaying) {
            this.player.pause();
            return true;
        }
        return false;
    }

    public resume(): boolean {
        if (this.isPaused) {
            this.player.unpause();
            return true;
        }
        return false;
    }

    public setVolume(volume: number): void {
        this.volume = Math.max(0, Math.min(100, volume));
        // Aplicar volume se houver música tocando
        if (this.player.state.status === AudioPlayerStatus.Playing) {
            const resource = this.player.state.resource as AudioResource;
            if (resource.volume) {
                resource.volume.setVolume(this.volume / 100);
            }
        }
    }

    public setRepeat(mode: 'off' | 'song' | 'queue'): void {
        this.repeat = mode;
    }

    public setShuffle(enabled: boolean): void {
        this.shuffle = enabled;
        if (enabled && this.songs.length > 1) {
            // Embaralhar a fila
            for (let i = this.songs.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.songs[i], this.songs[j]] = [this.songs[j], this.songs[i]];
            }
        }
    }

    public clear(): void {
        this.songs = [];
        this.player.stop();
    }

    public remove(index: number): Song | null {
        if (index >= 0 && index < this.songs.length) {
            return this.songs.splice(index, 1)[0];
        }
        return null;
    }

    public disconnect(): void {
        this.player.stop();
        this.connection?.destroy();
        this.connection = null;
        this.voiceChannelId = null;
        this.songs = [];
        this.currentSong = null;
        this.previousSongs = [];
    }

    public getCurrentEmbed(): EmbedBuilder {
        if (!this.currentSong) {
            return new EmbedBuilder()
                .setTitle('🎵 Nenhuma música tocando')
                .setColor(0xFF0000);
        }

        const embed = new EmbedBuilder()
            .setTitle('🎵 Tocando Agora')
            .setDescription(`**${this.currentSong.title}**`)
            .setURL(this.currentSong.url)
            .setThumbnail(this.currentSong.thumbnail)
            .addFields(
                { name: '⏱️ Duração', value: prettyMs(this.currentSong.duration), inline: true },
                { name: '🔊 Volume', value: `${this.volume}%`, inline: true },
                { name: '🔁 Repetir', value: this.repeat === 'off' ? 'Desligado' : this.repeat === 'song' ? 'Música' : 'Fila', inline: true },
                { name: '👤 Solicitado por', value: this.currentSong.requester.toString(), inline: true },
                { name: '📋 Na fila', value: this.songs.length.toString(), inline: true },
                { name: '🔀 Shuffle', value: this.shuffle ? 'Ligado' : 'Desligado', inline: true }
            )
            .setColor(0x00FF00)
            .setTimestamp();

        return embed;
    }

    public getQueueEmbed(page: number = 1): EmbedBuilder {
        const itemsPerPage = 10;
        const start = (page - 1) * itemsPerPage;
        const end = start + itemsPerPage;
        const pageItems = this.songs.slice(start, end);

        const embed = new EmbedBuilder()
            .setTitle('📋 Fila de Música')
            .setColor(0x00FF00);

        if (this.currentSong) {
            embed.addFields({ 
                name: '🎵 Tocando Agora', 
                value: `**${this.currentSong.title}** - ${this.currentSong.requester}`,
                inline: false
            });
        }

        if (pageItems.length === 0) {
            embed.setDescription('Fila vazia');
        } else {
            const queueList = pageItems.map((song, index) => {
                const position = start + index + 1;
                const duration = prettyMs(song.duration);
                return `**${position}.** ${song.title} - \`${duration}\` - ${song.requester}`;
            }).join('\n');

            embed.setDescription(queueList);
        }

        const totalPages = Math.ceil(this.songs.length / itemsPerPage);
        embed.setFooter({ text: `Página ${page}/${totalPages || 1} • ${this.songs.length} música(s) na fila` });

        return embed;
    }

    public formatDuration(milliseconds: number): string {
        return prettyMs(milliseconds, { colonNotation: true });
    }
}

export class MusicManager {
    private queues: Map<string, MusicQueue> = new Map();

    public getQueue(guildId: string, textChannelId: string): MusicQueue {
        if (!this.queues.has(guildId)) {
            this.queues.set(guildId, new MusicQueue(guildId, textChannelId));
        }
        return this.queues.get(guildId)!;
    }

    public deleteQueue(guildId: string): boolean {
        const queue = this.queues.get(guildId);
        if (queue) {
            queue.disconnect();
            this.queues.delete(guildId);
            return true;
        }
        return false;
    }

    public hasQueue(guildId: string): boolean {
        return this.queues.has(guildId);
    }

    public getAllQueues(): MusicQueue[] {
        return Array.from(this.queues.values());
    }
}

// Instância global do gerenciador de música
export const musicManager = new MusicManager();
