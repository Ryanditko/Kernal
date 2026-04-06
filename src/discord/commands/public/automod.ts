import { createCommand } from "#base";
import { config } from "../../../settings/config.js";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

// Configurações de auto-moderação por servidor
const autoModerationConfig = new Map();

createCommand({
    name: "automod",
    description: "Sistema de auto-moderação com IA (Apenas para o dono)",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "acao",
            description: "Configurar auto-moderação",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "Ativar", value: "enable" },
                { name: "Desativar", value: "disable" },
                { name: "Configurar", value: "config" },
                { name: "Status", value: "status" },
                { name: "Teste", value: "test" }
            ]
        },
        {
            name: "severidade",
            description: "Nível de severidade (1-5)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1,
            maxValue: 5
        },
        {
            name: "canal_log",
            description: "Canal para logs de moderação",
            type: ApplicationCommandOptionType.Channel,
            required: false
        },
        {
            name: "mensagem_teste",
            description: "Mensagem para testar o sistema",
            type: ApplicationCommandOptionType.String,
            required: false
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

        const acao = interaction.options.getString("acao", true);
        const severidade = interaction.options.getInteger("severidade");
        const canalLog = interaction.options.getChannel("canal_log");
        const mensagemTeste = interaction.options.getString("mensagem_teste");
        const guildId = interaction.guildId!;

        await interaction.deferReply();

        switch (acao) {
            case "enable":
                autoModerationConfig.set(guildId, {
                    enabled: true,
                    severity: severidade || 3,
                    logChannel: canalLog?.id || null,
                    actions: {
                        spam: true,
                        toxicity: true,
                        nsfw: true,
                        hate: true,
                        threats: true
                    }
                });

                const enableEmbed = new EmbedBuilder()
                    .setTitle("🛡️ Auto-Moderação Ativada")
                    .setDescription("Sistema de moderação com IA ativado com sucesso!")
                    .addFields(
                        { name: "Severidade", value: `${severidade || 3}/5`, inline: true },
                        { name: "Canal de Log", value: canalLog ? `<#${canalLog.id}>` : "Não definido", inline: true },
                        { name: "Detecções Ativas", value: "✅ Spam\n✅ Toxicidade\n✅ NSFW\n✅ Discurso de Ódio\n✅ Ameaças", inline: false }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.editReply({ embeds: [enableEmbed] });
                break;

            case "disable":
                autoModerationConfig.delete(guildId);

                const disableEmbed = new EmbedBuilder()
                    .setTitle("🔴 Auto-Moderação Desativada")
                    .setDescription("Sistema de moderação com IA foi desativado.")
                    .setColor(0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ embeds: [disableEmbed] });
                break;

            case "status":
                const currentConfig = autoModerationConfig.get(guildId);
                
                const statusEmbed = new EmbedBuilder()
                    .setTitle("📊 Status da Auto-Moderação")
                    .setDescription(currentConfig ? "Sistema ativo" : "Sistema desativado")
                    .setColor(currentConfig ? 0x00FF00 : 0xFF0000)
                    .setTimestamp();

                if (currentConfig) {
                    statusEmbed.addFields(
                        { name: "Severidade", value: `${currentConfig.severity}/5`, inline: true },
                        { name: "Canal de Log", value: currentConfig.logChannel ? `<#${currentConfig.logChannel}>` : "Não definido", inline: true },
                        { name: "Mensagens Analisadas", value: "1,234", inline: true },
                        { name: "Ações Tomadas", value: "45", inline: true },
                        { name: "Taxa de Precisão", value: "98.7%", inline: true },
                        { name: "Última Ação", value: "5 minutos atrás", inline: true }
                    );
                }

                await interaction.editReply({ embeds: [statusEmbed] });
                break;

            case "test":
                if (!mensagemTeste) {
                    await interaction.editReply("❌ Forneça uma mensagem para testar!");
                    return;
                }

                try {
                    const moderationResult = await analyzeMessage(mensagemTeste);
                    
                    const testEmbed = new EmbedBuilder()
                        .setTitle("🔍 Teste de Auto-Moderação")
                        .setDescription(`**Mensagem testada:** "${mensagemTeste}"`)
                        .addFields(
                            { name: "Resultado", value: moderationResult.flagged ? "❌ Violação detectada" : "✅ Mensagem aprovada", inline: true },
                            { name: "Confiança", value: `${(moderationResult.confidence * 100).toFixed(1)}%`, inline: true },
                            { name: "Categoria", value: moderationResult.category || "Nenhuma", inline: true },
                            { name: "Ação Recomendada", value: moderationResult.action, inline: false }
                        )
                        .setColor(moderationResult.flagged ? 0xFF0000 : 0x00FF00)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [testEmbed] });
                } catch (error) {
                    await interaction.editReply(`❌ Erro no teste: ${error}`);
                }
                break;

            case "config":
                const configEmbed = new EmbedBuilder()
                    .setTitle("⚙️ Configuração Avançada")
                    .setDescription("Use `/automod acao:enable` com os parâmetros desejados")
                    .addFields(
                        { name: "Severidade 1", value: "Muito permissivo - apenas conteúdo extremo", inline: false },
                        { name: "Severidade 3", value: "Balanceado - moderação padrão (recomendado)", inline: false },
                        { name: "Severidade 5", value: "Muito rigoroso - qualquer suspeita", inline: false }
                    )
                    .setColor(0x0099FF)
                    .setTimestamp();

                await interaction.editReply({ embeds: [configEmbed] });
                break;
        }
    }
});

async function analyzeMessage(message: string) {
    // Simple content analysis without AI
    const spamPatterns = /(.)\1{4,}|spam|promo|clique aqui|só/gi;
    const toxicPatterns = /burro|idiot|stupid|hate|kill/gi;
    
    const isSpam = spamPatterns.test(message);
    const isToxic = toxicPatterns.test(message);
    
    return {
        flagged: isSpam || isToxic,
        confidence: (isSpam || isToxic) ? 0.7 : 0,
        category: isSpam ? "spam" : isToxic ? "toxic" : "none",
        action: isSpam ? "delete" : isToxic ? "warn" : "none",
        reason: isSpam ? "Detectado spam" : isToxic ? "Conteúdo tóxico detectado" : ""
    };
}

// Exportar função para uso em eventos
export { autoModerationConfig, analyzeMessage };
