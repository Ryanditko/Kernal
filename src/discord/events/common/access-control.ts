import { createEvent } from "#base";
import { config } from "../../../settings/config.js";
import { EmbedBuilder, Events } from "discord.js";

createEvent({
    name: "Access Control",
    event: Events.InteractionCreate,
    async run(interaction) {
        if (!interaction.isChatInputCommand()) return;

        // Se não for o dono, negar acesso
        if (interaction.user.id !== config.OWNER_ID) {
            const embed = new EmbedBuilder()
                .setTitle("🚫 Bot em Fase de Teste")
                .setDescription("Este bot está em fase de testes e restrito ao desenvolvedor.")
                .setColor(0xFF0000)
                .setFooter({ text: "Aguarde a versão pública!" })
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed], ephemeral: true });
            }
            return;
        }

        // Se for DM e for o dono, mostrar guia de administração remota
        if (!interaction.guild && interaction.user.id === config.OWNER_ID) {
            const embed = new EmbedBuilder()
                .setTitle("🤖 Administração Remota Ativa")
                .setDescription("Você está usando o bot na DM! Use os comandos de administração remota:")
                .addFields(
                    { 
                        name: "📋 Comandos Principais", 
                        value: `
                        \`/remote-admin\` - Administração completa de servidores
                        \`/ai\` - Chat com IA
                        \`/gerar-texto\` - Geração de textos
                        \`/traduzir\` - Tradutor IA
                        `, 
                        inline: false 
                    },
                    { 
                        name: "🎛️ Ações do Remote Admin", 
                        value: `
                        • \`list_servers\` - Ver todos os servidores
                        • \`server_info\` - Info detalhada de um servidor  
                        • \`ban_user\` - Banir usuário de qualquer servidor
                        • \`send_message\` - Enviar mensagem em qualquer canal
                        • \`create_channel\` - Criar canais remotamente
                        `, 
                        inline: false 
                    },
                    { 
                        name: "📖 Exemplo de Uso", 
                        value: `
                        \`/remote-admin acao:list_servers\`
                        \`/remote-admin acao:server_info servidor_id:123456789\`
                        \`/remote-admin acao:ban_user servidor_id:123 parametro1:user_id parametro2:razao\`
                        `, 
                        inline: false 
                    }
                )
                .setColor(0x00FF00)
                .setThumbnail(interaction.client.user.displayAvatarURL())
                .setFooter({ text: "Administração 100% anônima e remota" })
                .setTimestamp();

            if (interaction.replied || interaction.deferred) {
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.reply({ embeds: [embed] });
            }
        }
    }
});
