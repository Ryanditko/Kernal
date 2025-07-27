import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";

createCommand({
    name: "help",
    description: "Guia completo do seu bot pessoal",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        // Verificar se é o dono do bot
        if (interaction.user.id !== config.OWNER_ID) {
            const errorEmbed = new EmbedBuilder()
                .setTitle("🚫 Bot em Fase de Teste")
                .setDescription("Este bot está em fase de testes e não está disponível para uso público no momento.")
                .setColor(0xFF0000)
                .setTimestamp();
            
            await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setTitle("🤖 Kernal Bot - Seu Bot Pessoal")
            .setDescription("Bot exclusivo em fase de teste. Comandos disponíveis:")
            .addFields(
                {
                    name: "🔧 Administração Remota",
                    value: `
                    \`/remote-admin\` - Controle total dos servidores
                    • Listar servidores, ver membros online
                    • Banir/kickar usuários remotamente  
                    • Criar/deletar canais
                    • Enviar mensagens anonimamente
                    • Limpar canais
                    `,
                    inline: false
                },
                {
                    name: "🤖 Inteligência Artificial",
                    value: `
                    \`/ai\` - Chat com GPT-4
                    \`/gerar-texto\` - Gerar histórias, poemas, códigos
                    \`/analisar-imagem\` - Análise de imagens com IA
                    \`/traduzir\` - Tradutor com 10+ idiomas
                    `,
                    inline: false
                },
                {
                    name: "🎵 Sistema de Música",
                    value: `
                    \`/music play\` - Tocar música do YouTube
                    \`/music pause\` - Pausar música
                    \`/music skip\` - Pular música
                    \`/music queue\` - Ver fila de músicas
                    \`/music shuffle\` - Embaralhar playlist
                    `,
                    inline: false
                },
                {
                    name: "🎫 Sistema de Tickets",
                    value: `
                    \`/ticket create\` - Criar ticket de suporte
                    \`/ticket close\` - Fechar ticket
                    \`/ticket stats\` - Estatísticas de tickets
                    `,
                    inline: false
                },
                {
                    name: "🛡️ Moderação",
                    value: `
                    \`/mod ban\` - Banir usuário
                    \`/mod kick\` - Remover usuário
                    \`/mod mute\` - Silenciar usuário
                    \`/mod clear\` - Limpar mensagens
                    \`/mod warn\` - Avisar usuário
                    `,
                    inline: false
                },
                {
                    name: "💰 Sistema de Economia",
                    value: `
                    \`/economy daily\` - Recompensa diária
                    \`/economy work\` - Trabalhar para ganhar moedas
                    \`/economy balance\` - Ver saldo
                    \`/economy shop\` - Loja virtual
                    \`/economy bet\` - Apostar moedas
                    `,
                    inline: false
                },
                {
                    name: "🎉 Entretenimento",
                    value: `
                    \`/fun 8ball\` - Bola mágica 8
                    \`/fun dice\` - Rolar dados
                    \`/fun coinflip\` - Cara ou coroa
                    \`/fun meme\` - Memes aleatórios
                    \`/fun joke\` - Piadas
                    `,
                    inline: false
                },
                {
                    name: "📊 Utilidades",
                    value: `
                    \`/utils serverinfo\` - Info do servidor
                    \`/utils userinfo\` - Info do usuário
                    \`/utils calculator\` - Calculadora
                    \`/utils qrcode\` - Gerar QR Code
                    \`/utils weather\` - Clima
                    `,
                    inline: false
                },
                {
                    name: "⚙️ Administração",
                    value: `
                    \`/admin setup\` - Configurar bot
                    \`/admin announce\` - Fazer anúncios
                    \`/admin backup\` - Backup do servidor
                    \`/admin stats\` - Estatísticas
                    `,
                    inline: false
                }
            )
            .setColor(0x00FF00)
            .setThumbnail(interaction.client.user.displayAvatarURL())
            .setFooter({ 
                text: `${interaction.client.guilds.cache.size} servidores conectados | Versão em teste exclusiva`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});
