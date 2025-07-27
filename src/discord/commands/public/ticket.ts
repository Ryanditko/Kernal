import { createCommand, createResponder, ResponderType } from "#base";
import { ActionRowBuilder, ApplicationCommandType, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder } from "discord.js";

export default createCommand({
    name: "ticket",
    description: "Create a support ticket",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        if (!interaction.guild) return;

        const ticketChannel = await interaction.guild.channels.create({
            name: `ticket-${interaction.user.username}`,
            type: ChannelType.GuildText,
            permissionOverwrites: [
                {
                    id: interaction.guild.id,
                    deny: [ "ViewChannel" ]
                },
                {
                    id: interaction.user.id,
                    allow: [ "ViewChannel", "SendMessages" ]
                }
            ]
        });

        const embed = new EmbedBuilder()
            .setTitle("✅ Ticket Created")
            .setDescription(`Support will be with you shortly.`)
            .setColor(0x00FF00);

        const closeButton = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
                .setCustomId("close_ticket")
                .setLabel("Close Ticket")
                .setStyle(ButtonStyle.Danger)
        );

        await ticketChannel.send({ 
            content: `${interaction.user}`, 
            embeds: [embed], 
            components: [closeButton] 
        });

        await interaction.reply({ 
            content: `Your ticket has been created: ${ticketChannel}`, 
            ephemeral: true 
        });
    }
});

createResponder({
    customId: "close_ticket",
    types: [ResponderType.Button], cache: "cached",
    async run(interaction) {
        if (!interaction.channel || !interaction.guild) return;

        if (!interaction.channel.name.startsWith("ticket-")) {
            await interaction.reply({ content: "This is not a ticket channel.", ephemeral: true });
            return;
        }

        await interaction.channel.delete();
    }
});