import { createResponder, ResponderType } from "#base";
import { EmbedBuilder } from "discord.js";

// Responder para botões de controle de música
createResponder({
    customId: "music_pause",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "⏸️ Música pausada!",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "music_skip",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "⏭️ Música pulada!",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "music_stop",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "⏹️ Música parada!",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "music_queue",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const queueEmbed = new EmbedBuilder()
            .setTitle("📃 Fila de Música")
            .setDescription("Fila está vazia!")
            .setColor(0x9932CC)
            .setTimestamp();

        await interaction.reply({
            embeds: [queueEmbed],
            ephemeral: true
        });
    }
});

// Responders para botões de ticket
createResponder({
    customId: "create_ticket_support",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "🎫 Criando ticket de suporte...",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "create_ticket_bug",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "🐛 Criando ticket para reportar bug...",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "create_ticket_suggestion",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "💡 Criando ticket de sugestão...",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "ticket_close",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const closeEmbed = new EmbedBuilder()
            .setTitle("🔒 Ticket Fechado")
            .setDescription(`Ticket fechado por ${interaction.user}`)
            .setColor(0xFF0000)
            .setTimestamp();

        await interaction.reply({ embeds: [closeEmbed] });
    }
});

createResponder({
    customId: "ticket_claim",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: `👥 ${interaction.user} assumiu este ticket!`,
            ephemeral: false
        });
    }
});

createResponder({
    customId: "ticket_transcript",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "📄 Gerando transcrição... (Em desenvolvimento)",
            ephemeral: true
        });
    }
});

createResponder({
    customId: "ticket_reopen",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        const reopenEmbed = new EmbedBuilder()
            .setTitle("🔓 Ticket Reaberto")
            .setDescription(`Ticket reaberto por ${interaction.user}`)
            .setColor(0x00FF00)
            .setTimestamp();

        await interaction.reply({ embeds: [reopenEmbed] });
    }
});

createResponder({
    customId: "ticket_delete",
    types: [ResponderType.Button],
    cache: "cached",
    async run(interaction) {
        await interaction.reply({
            content: "🗑️ Este ticket será deletado em 10 segundos...",
            ephemeral: false
        });

        setTimeout(async () => {
            try {
                await interaction.channel?.delete();
            } catch (error) {
                console.error("Erro ao deletar canal:", error);
            }
        }, 10000);
    }
});
