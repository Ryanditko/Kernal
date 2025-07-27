import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import { 
    joinVoiceChannel, 
    VoiceConnectionStatus,
    EndBehaviorType
} from "@discordjs/voice";
import * as fs from 'fs';
import * as path from 'path';

// Sistema de gravação de áudio
const activeRecordings = new Map();
const recordingsDir = path.join(process.cwd(), 'recordings');

// Criar diretório para gravações se não existir
if (!fs.existsSync(recordingsDir)) {
    fs.mkdirSync(recordingsDir, { recursive: true });
}

interface AudioRecording {
    guildId: string;
    channelId: string;
    startTime: number;
    endTime?: number;
    filePath: string;
    participants: string[];
    connection?: any;
    receiver?: any;
    status: 'recording' | 'stopped' | 'error';
}

createCommand({
    name: "record-call",
    description: "Sistema de gravação de calls (Apenas para o dono)",
    type: ApplicationCommandType.ChatInput,
    dmPermission: true,
    defaultMemberPermissions: [],
    options: [
        {
            name: "acao",
            description: "Ação de gravação",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Iniciar Gravação", value: "start" },
                { name: "Parar Gravação", value: "stop" },
                { name: "Status", value: "status" },
                { name: "Listar Gravações", value: "list" },
                { name: "Baixar Gravação", value: "download" },
                { name: "Deletar Gravação", value: "delete" }
            ]
        },
        {
            name: "canal_voz",
            description: "Canal de voz para gravar",
            type: ApplicationCommandOptionType.Channel,
            required: false
        },
        {
            name: "arquivo",
            description: "Nome do arquivo de gravação",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("Acesso Negado")
                .setDescription("Sistema de gravação restrito ao administrador.")
                .setColor(0xFF0000)
                .setTimestamp();
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const acao = interaction.options.getString("acao", true);
        const canalVoz = interaction.options.getChannel("canal_voz");
        const arquivo = interaction.options.getString("arquivo");

        await interaction.deferReply({ ephemeral: true });

        try {
            switch (acao) {
                case "start":
                    await iniciarGravacao(interaction, canalVoz, arquivo);
                    break;
                case "stop":
                    await pararGravacao(interaction);
                    break;
                case "status":
                    await mostrarStatusGravacao(interaction);
                    break;
                case "list":
                    await listarGravacoes(interaction);
                    break;
                case "download":
                    await baixarGravacao(interaction, arquivo);
                    break;
                case "delete":
                    await deletarGravacao(interaction, arquivo);
                    break;
                default:
                    await interaction.editReply("Ação não reconhecida.");
            }
        } catch (error) {
            console.error("Erro no sistema de gravação:", error);
            await interaction.editReply("Erro interno no sistema de gravação.");
        }
    }
});

async function iniciarGravacao(interaction: any, canal: any, nomeArquivo: string | null) {
    if (!canal || canal.type !== 2) { // ChannelType.GuildVoice
        return await interaction.editReply("Você deve especificar um canal de voz válido.");
    }

    const guildId = interaction.guild.id;
    const channelId = canal.id;

    // Verificar se já existe gravação ativa
    if (activeRecordings.has(guildId)) {
        return await interaction.editReply("Já existe uma gravação ativa neste servidor.");
    }

    try {
        // Conectar ao canal de voz
        const connection = joinVoiceChannel({
            channelId: channelId,
            guildId: guildId,
            adapterCreator: interaction.guild.voiceAdapterCreator,
            selfDeaf: false,
            selfMute: true
        });

        // Aguardar conexão
        await new Promise((resolve, reject) => {
            connection.on(VoiceConnectionStatus.Ready, resolve);
            connection.on(VoiceConnectionStatus.Disconnected, reject);
            setTimeout(reject, 10000); // timeout de 10s
        });

        // Configurar receptor de áudio
        const receiver = connection.receiver;
        const timestamp = Date.now();
        const fileName = nomeArquivo || `call_${guildId}_${timestamp}`;
        const filePath = path.join(recordingsDir, `${fileName}.pcm`);

        const recording: AudioRecording = {
            guildId,
            channelId,
            startTime: timestamp,
            filePath,
            participants: [],
            connection,
            receiver,
            status: 'recording'
        };

        activeRecordings.set(guildId, recording);

        // Configurar gravação de usuários
        receiver.speaking.on('start', (userId: string) => {
            if (!recording.participants.includes(userId)) {
                recording.participants.push(userId);
            }

            const audioStream = receiver.subscribe(userId, {
                end: {
                    behavior: EndBehaviorType.Manual
                }
            });

            const userFilePath = path.join(recordingsDir, `${fileName}_${userId}.pcm`);
            const writeStream = fs.createWriteStream(userFilePath, { flags: 'a' });
            
            audioStream.pipe(writeStream);
            
            audioStream.on('end', () => {
                writeStream.end();
            });
        });

        const embed = new EmbedBuilder()
            .setTitle("Gravação Iniciada")
            .setDescription(`Gravação ativa no canal: ${canal.name}`)
            .addFields(
                { name: "Servidor", value: interaction.guild.name, inline: true },
                { name: "Canal", value: canal.name, inline: true },
                { name: "Arquivo", value: fileName, inline: true },
                { name: "Início", value: `<t:${Math.floor(timestamp / 1000)}:F>`, inline: false }
            )
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

        // Salvar metadados
        await salvarMetadados(recording);

    } catch (error) {
        console.error("Erro ao iniciar gravação:", error);
        await interaction.editReply("Erro ao conectar ao canal de voz para gravação.");
    }
}

async function pararGravacao(interaction: any) {
    const guildId = interaction.guild.id;
    const recording = activeRecordings.get(guildId);

    if (!recording) {
        return await interaction.editReply("Nenhuma gravação ativa neste servidor.");
    }

    try {
        // Parar conexão
        if (recording.connection) {
            recording.connection.destroy();
        }

        recording.endTime = Date.now();
        recording.status = 'stopped';

        // Remover da lista ativa
        activeRecordings.delete(guildId);

        // Salvar metadados finais
        await salvarMetadados(recording);

        const duracao = Math.floor((recording.endTime - recording.startTime) / 60000);
        
        const embed = new EmbedBuilder()
            .setTitle("Gravação Encerrada")
            .setDescription("Gravação salva com sucesso.")
            .addFields(
                { name: "Duração", value: `${duracao} minutos`, inline: true },
                { name: "Participantes", value: recording.participants.length.toString(), inline: true },
                { name: "Arquivo", value: path.basename(recording.filePath), inline: true }
            )
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.editReply({ embeds: [embed] });

    } catch (error) {
        console.error("Erro ao parar gravação:", error);
        await interaction.editReply("Erro ao encerrar gravação.");
    }
}

async function mostrarStatusGravacao(interaction: any) {
    const gravacoesAtivas = Array.from(activeRecordings.values());
    
    if (gravacoesAtivas.length === 0) {
        return await interaction.editReply("Nenhuma gravação ativa no momento.");
    }

    const embed = new EmbedBuilder()
        .setTitle("Status das Gravações")
        .setColor(0xFF0000)
        .setTimestamp();

    for (const recording of gravacoesAtivas) {
        const guild = interaction.client.guilds.cache.get(recording.guildId);
        const channel = guild?.channels.cache.get(recording.channelId);
        const duracao = Math.floor((Date.now() - recording.startTime) / 60000);
        
        embed.addFields({
            name: guild?.name || "Servidor Desconhecido",
            value: `Canal: ${channel?.name || recording.channelId}\nDuração: ${duracao}min\nParticipantes: ${recording.participants.length}\nStatus: ${recording.status.toUpperCase()}`,
            inline: true
        });
    }

    await interaction.editReply({ embeds: [embed] });
}

async function listarGravacoes(interaction: any) {
    if (!fs.existsSync(recordingsDir)) {
        return await interaction.editReply("Nenhuma gravação encontrada.");
    }

    const files = fs.readdirSync(recordingsDir);
    const audioFiles = files.filter(file => file.endsWith('.pcm') && !file.includes('_'));
    const metadataFiles = files.filter(file => file.endsWith('.json'));

    const embed = new EmbedBuilder()
        .setTitle("Gravações Disponíveis")
        .setColor(0x9B59B6)
        .setTimestamp();

    let description = `**Total:** ${audioFiles.length} gravações\n\n`;

    for (const file of audioFiles.slice(0, 10)) { // Mostrar apenas as primeiras 10
        const stats = fs.statSync(path.join(recordingsDir, file));
        const metadataFile = file.replace('.pcm', '.json');
        
        let info = `• ${file}\n  └ Tamanho: ${Math.round(stats.size / 1024 / 1024)}MB\n`;
        
        if (metadataFiles.includes(metadataFile)) {
            try {
                const metadata = JSON.parse(fs.readFileSync(path.join(recordingsDir, metadataFile), 'utf8'));
                const duracao = metadata.endTime ? 
                    Math.floor((metadata.endTime - metadata.startTime) / 60000) : 'Em andamento';
                info += `  └ Duração: ${duracao}min, Participantes: ${metadata.participants.length}\n`;
            } catch (error) {
                info += `  └ Metadados corrompidos\n`;
            }
        }
        
        description += info;
    }

    embed.setDescription(description);
    await interaction.editReply({ embeds: [embed] });
}

async function baixarGravacao(interaction: any, nomeArquivo: string | null) {
    if (!nomeArquivo) {
        return await interaction.editReply("Nome do arquivo é obrigatório para download.");
    }

    const filePath = path.join(recordingsDir, `${nomeArquivo}.pcm`);
    
    if (!fs.existsSync(filePath)) {
        return await interaction.editReply(`Arquivo de gravação não encontrado: ${nomeArquivo}`);
    }

    try {
        const stats = fs.statSync(filePath);
        const tamanhoMB = Math.round(stats.size / 1024 / 1024);

        if (tamanhoMB > 8) { // Limite do Discord
            return await interaction.editReply(`Arquivo muito grande (${tamanhoMB}MB). Limite: 8MB. Use ferramentas externas para acessar.`);
        }

        // Para envio via Discord, seria necessário converter PCM para um formato suportado
        await interaction.editReply(`Arquivo localizado: ${filePath}\nTamanho: ${tamanhoMB}MB\n\nPara acessar o arquivo de áudio bruto (PCM), navegue até:\n\`${filePath}\``);

    } catch (error) {
        await interaction.editReply("Erro ao acessar arquivo de gravação.");
    }
}

async function deletarGravacao(interaction: any, nomeArquivo: string | null) {
    if (!nomeArquivo) {
        return await interaction.editReply("Nome do arquivo é obrigatório para deletar.");
    }

    const filePath = path.join(recordingsDir, `${nomeArquivo}.pcm`);
    const metadataPath = path.join(recordingsDir, `${nomeArquivo}.json`);
    
    let deletados = 0;
    
    if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        deletados++;
    }
    
    if (fs.existsSync(metadataPath)) {
        fs.unlinkSync(metadataPath);
        deletados++;
    }

    // Deletar arquivos individuais dos usuários
    const files = fs.readdirSync(recordingsDir);
    const userFiles = files.filter(file => file.startsWith(`${nomeArquivo}_`) && file.endsWith('.pcm'));
    
    for (const userFile of userFiles) {
        fs.unlinkSync(path.join(recordingsDir, userFile));
        deletados++;
    }

    if (deletados === 0) {
        return await interaction.editReply(`Nenhum arquivo encontrado para: ${nomeArquivo}`);
    }

    await interaction.editReply(`${deletados} arquivo(s) deletado(s) para: ${nomeArquivo}`);
}

async function salvarMetadados(recording: AudioRecording) {
    const metadataPath = path.join(recordingsDir, `${path.basename(recording.filePath, '.pcm')}.json`);
    
    const metadata = {
        guildId: recording.guildId,
        channelId: recording.channelId,
        startTime: recording.startTime,
        endTime: recording.endTime,
        participants: recording.participants,
        status: recording.status,
        filePath: recording.filePath
    };

    fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2));
}

export { activeRecordings, recordingsDir };
