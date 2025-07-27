import { createCommand } from "#base";
import { 
    ApplicationCommandType, 
    ApplicationCommandOptionType,
    EmbedBuilder,
    ChatInputCommandInteraction,
    ActionRowBuilder,
    StringSelectMenuBuilder,
    ComponentType
} from "discord.js";

createCommand({
    name: "help",
    description: "Mostra ajuda completa sobre todos os comandos do Kernal Bot",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "categoria",
            description: "Categoria específica de comandos",
            type: ApplicationCommandOptionType.String,
            required: false,
            choices: [
                {
                    name: "🎵 Música - Comandos de reprodução",
                    value: "music"
                },
                {
                    name: "🛡️ Administração - Comandos de moderação",
                    value: "admin"
                },
                {
                    name: "📊 Utilidades - Comandos úteis",
                    value: "utility"
                },
                {
                    name: "🎮 Diversão - Comandos de entretenimento",
                    value: "fun"
                }
            ]
        }
    ],
    async run(interaction: ChatInputCommandInteraction): Promise<void> {
        const categoria = interaction.options.getString("categoria");

        if (categoria) {
            // Mostrar categoria específica
            await showSpecificCategory(interaction, categoria);
        } else {
            // Mostrar menu principal com seletor
            await showMainHelp(interaction);
        }
    }
});

async function showMainHelp(interaction: ChatInputCommandInteraction): Promise<void> {
    const mainEmbed = new EmbedBuilder()
        .setTitle("🤖 Kernal Bot - Central de Ajuda")
        .setDescription("**Bem-vindo ao sistema de ajuda do Kernal Bot!**\n\nEste bot oferece uma ampla gama de funcionalidades para aprimorar sua experiência no Discord. Escolha uma categoria abaixo para ver os comandos disponíveis.")
        .addFields(
            {
                name: "🎵 Sistema de Música",
                value: "Sistema completo de reprodução de música com suporte a YouTube e Spotify",
                inline: false
            },
            {
                name: "🛡️ Administração",
                value: "Ferramentas avançadas de moderação e gerenciamento do servidor",
                inline: false
            },
            {
                name: "📊 Utilidades",
                value: "Comandos úteis para informações e estatísticas",
                inline: false
            },
            {
                name: "🎮 Diversão",
                value: "Comandos de entretenimento e interação",
                inline: false
            }
        )
        .setColor(0x0099FF)
        .setThumbnail(interaction.client.user?.avatarURL() || null)
        .setFooter({ text: "Use o menu abaixo para navegar pelas categorias" })
        .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
        .setCustomId('help_category_select')
        .setPlaceholder('Escolha uma categoria para ver os comandos')
        .addOptions([
            {
                label: 'Sistema de Música',
                description: 'Comandos de reprodução de música',
                value: 'music',
                emoji: '🎵'
            },
            {
                label: 'Administração',
                description: 'Comandos de moderação',
                value: 'admin',
                emoji: '🛡️'
            },
            {
                label: 'Utilidades',
                description: 'Comandos úteis e informativos',
                value: 'utility',
                emoji: '📊'
            },
            {
                label: 'Diversão',
                description: 'Comandos de entretenimento',
                value: 'fun',
                emoji: '🎮'
            }
        ]);

    const row = new ActionRowBuilder<StringSelectMenuBuilder>()
        .addComponents(selectMenu);

    const response = await interaction.reply({
        embeds: [mainEmbed],
        components: [row]
    });

    // Collector para o menu de seleção
    const collector = response.createMessageComponentCollector({
        componentType: ComponentType.StringSelect,
        time: 300000 // 5 minutos
    });

    collector.on('collect', async (selectInteraction) => {
        if (selectInteraction.user.id !== interaction.user.id) {
            await selectInteraction.reply({
                content: "❌ Apenas quem executou o comando pode usar este menu!",
                ephemeral: true
            });
            return;
        }

        const selectedCategory = selectInteraction.values[0];
        await showSpecificCategory(selectInteraction, selectedCategory);
    });

    collector.on('end', async () => {
        try {
            await response.edit({
                components: []
            });
        } catch (error) {
            // Ignore errors when editing expired messages
        }
    });
}

async function showSpecificCategory(interaction: ChatInputCommandInteraction | any, category: string): Promise<void> {
    let embed: EmbedBuilder;

    switch (category) {
        case 'music':
            embed = getMusicHelpEmbed();
            break;
        case 'admin':
            embed = getAdminHelpEmbed();
            break;
        case 'utility':
            embed = getUtilityHelpEmbed();
            break;
        case 'fun':
            embed = getFunHelpEmbed();
            break;
        default:
            embed = new EmbedBuilder()
                .setTitle("❌ Categoria não encontrada")
                .setDescription("A categoria solicitada não existe.")
                .setColor(0xFF0000);
    }

    if (interaction.replied || interaction.deferred) {
        await interaction.editReply({
            embeds: [embed],
            components: []
        });
    } else {
        await interaction.reply({
            embeds: [embed]
        });
    }
}

function getMusicHelpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("🎵 Comandos de Música")
        .setDescription("**Sistema completo de reprodução de música com suporte a YouTube e Spotify**")
        .addFields(
            {
                name: "▶️ Reprodução Básica",
                value: "`/play <música>` - Toca música do YouTube ou Spotify\n`/pause` - Pausa/retoma a reprodução\n`/stop` - Para completamente e desconecta\n`/skip` - Pula para a próxima música\n`/previous` - Volta para a música anterior",
                inline: false
            },
            {
                name: "📋 Gerenciamento de Fila",
                value: "`/queue [página]` - Mostra a fila de músicas\n`/clear` - Limpa toda a fila\n`/shuffle` - Ativa/desativa modo aleatório\n`/nowplaying` - Mostra música atual",
                inline: false
            },
            {
                name: "🔧 Controles Avançados",
                value: "`/volume <0-100>` - Ajusta o volume\n`/loop <modo>` - Repetição (off/song/queue)\n`/repeat <modo>` - Modo repetição alternativo",
                inline: false
            },
            {
                name: "🔍 Busca e Informações",
                value: "`/search <termo>` - Busca músicas no YouTube\n`/lyrics [música]` - Letra da música\n`/musicinfo` - Info do sistema de música",
                inline: false
            },
            {
                name: "📝 Como Usar",
                value: "1️⃣ Entre em um canal de voz\n2️⃣ Use `/play <nome da música>`\n3️⃣ O bot conectará automaticamente\n4️⃣ Use os outros comandos para controlar",
                inline: false
            },
            {
                name: "🎯 Formatos Aceitos",
                value: "• Links do YouTube\n• Links do Spotify (playlists e músicas)\n• Busca por texto\n• Links diretos de áudio",
                inline: false
            }
        )
        .setColor(0xFF6B6B)
        .setFooter({ text: "Todas as músicas são transmitidas em alta qualidade" });
}

function getAdminHelpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("🛡️ Comandos de Administração")
        .setDescription("**Ferramentas avançadas para moderação e gerenciamento do servidor**")
        .addFields(
            {
                name: "🔨 Moderação Básica",
                value: "`/kick <usuário> [motivo]` - Expulsa um usuário\n`/ban <usuário> [motivo]` - Bane um usuário\n`/unban <id> [motivo]` - Remove ban de usuário\n`/timeout <usuário> <tempo>` - Silencia temporariamente",
                inline: false
            },
            {
                name: "💬 Gerenciamento de Mensagens",
                value: "`/clear <quantidade>` - Apaga mensagens\n`/purge <usuário> [quantidade]` - Apaga mensagens de usuário específico\n`/announce <canal> <mensagem>` - Faz anúncio",
                inline: false
            },
            {
                name: "👥 Gerenciamento de Usuários",
                value: "`/role add <usuário> <cargo>` - Adiciona cargo\n`/role remove <usuário> <cargo>` - Remove cargo\n`/nickname <usuário> <nome>` - Altera apelido",
                inline: false
            },
            {
                name: "🔧 Configurações do Servidor",
                value: "`/config <opção> <valor>` - Configurações gerais\n`/automod <ativar/desativar>` - Auto moderação\n`/welcome <canal>` - Define canal de boas-vindas",
                inline: false
            },
            {
                name: "📊 Controle Remoto (Desenvolvedores)",
                value: "`/remote` - Acesso a controles avançados do bot (restrito a administradores autorizados)",
                inline: false
            },
            {
                name: "⚠️ Permissões Necessárias",
                value: "• **Gerenciar Servidor** - Para maioria dos comandos\n• **Banir Membros** - Para comandos de ban\n• **Gerenciar Cargos** - Para comandos de cargo\n• **Gerenciar Mensagens** - Para limpeza",
                inline: false
            }
        )
        .setColor(0x4ECDC4)
        .setFooter({ text: "Use com responsabilidade - ações são registradas" });
}

function getUtilityHelpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("📊 Comandos de Utilidades")
        .setDescription("**Comandos úteis para informações e estatísticas**")
        .addFields(
            {
                name: "📈 Informações do Bot",
                value: "`/stats` - Estatísticas completas do bot\n`/ping` - Latência do bot\n`/uptime` - Tempo online do bot\n`/botinfo` - Informações detalhadas",
                inline: false
            },
            {
                name: "🏠 Informações do Servidor",
                value: "`/serverinfo` - Info completa do servidor\n`/membercount` - Contagem de membros\n`/channelinfo <canal>` - Info de canal específico",
                inline: false
            },
            {
                name: "👤 Informações de Usuário",
                value: "`/userinfo [usuário]` - Perfil de usuário\n`/avatar [usuário]` - Avatar em alta resolução\n`/whois <usuário>` - Info detalhada de membro",
                inline: false
            },
            {
                name: "🔧 Ferramentas Úteis",
                value: "`/calculate <expressão>` - Calculadora\n`/remind <tempo> <mensagem>` - Lembrete\n`/translate <idioma> <texto>` - Tradutor",
                inline: false
            },
            {
                name: "🌐 Informações Externas",
                value: "`/weather <cidade>` - Clima da cidade\n`/crypto <moeda>` - Preço de criptomoeda\n`/github <repo>` - Info de repositório",
                inline: false
            },
            {
                name: "📝 Outros Utilitários",
                value: "`/help` - Este menu de ajuda\n`/invite` - Link de convite do bot\n`/support` - Servidor de suporte",
                inline: false
            }
        )
        .setColor(0x45B7D1)
        .setFooter({ text: "Comandos úteis para o dia a dia" });
}

function getFunHelpEmbed(): EmbedBuilder {
    return new EmbedBuilder()
        .setTitle("🎮 Comandos de Diversão")
        .setDescription("**Comandos de entretenimento e interação social**")
        .addFields(
            {
                name: "🎲 Jogos e Sorteios",
                value: "`/roll <lados>` - Rola um dado\n`/coin` - Cara ou coroa\n`/8ball <pergunta>` - Bola 8 mágica\n`/choose <opções>` - Escolhe uma opção",
                inline: false
            },
            {
                name: "💕 Interação Social",
                value: "`/hug <usuário>` - Abraça alguém\n`/pat <usuário>` - Faz carinho\n`/highfive <usuário>` - Cumprimenta\n`/kiss <usuário>` - Beija alguém",
                inline: false
            },
            {
                name: "😂 Memes e Imagens",
                value: "`/meme` - Meme aleatório\n`/cat` - Foto de gato\n`/dog` - Foto de cachorro\n`/gif <termo>` - GIF animado",
                inline: false
            },
            {
                name: "🏆 Rankings e Competições",
                value: "`/leaderboard` - Ranking do servidor\n`/level [usuário]` - Nível de XP\n`/daily` - Recompensa diária\n`/compete <usuário>` - Desafio",
                inline: false
            },
            {
                name: "🎯 Jogos Interativos",
                value: "`/trivia` - Quiz de perguntas\n`/wordle` - Jogo Wordle\n`/hangman` - Jogo da forca\n`/riddle` - Charadas",
                inline: false
            },
            {
                name: "✨ Geradores Divertidos",
                value: "`/quote` - Citação inspiradora\n`/joke` - Piada aleatória\n`/fact` - Fato curioso\n`/roast <usuário>` - Zoeira amigável",
                inline: false
            }
        )
        .setColor(0xF39C12)
        .setFooter({ text: "Divirta-se com responsabilidade!" });
}
