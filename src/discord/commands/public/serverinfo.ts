import { createCommand } from "#base";
import { ApplicationCommandType, EmbedBuilder } from "discord.js";

createCommand({
    name: "serverinfo",
    description: "Get information about the server",
    type: ApplicationCommandType.ChatInput,
    async run(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: "❌ This command can only be used in a server.", ephemeral: true });
            return;
        }

        const guild = interaction.guild;
        const owner = await guild.fetchOwner();

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle(`${guild.name}'s Information`)
            .setThumbnail(guild.iconURL())
            .addFields(
                { name: "Owner", value: owner.user.tag, inline: true },
                { name: "Server ID", value: guild.id, inline: true },
                { name: "Members", value: guild.memberCount.toString(), inline: true },
                { name: "Channels", value: guild.channels.cache.size.toString(), inline: true },
                { name: "Roles", value: guild.roles.cache.size.toString(), inline: true },
                { name: "Created At", value: guild.createdAt.toLocaleString(), inline: true },
                { name: "Verification Level", value: guild.verificationLevel.toString(), inline: true },
                { name: "Boost Level", value: guild.premiumTier.toString(), inline: true },
                { name: "Boosts", value: guild.premiumSubscriptionCount?.toString() || "0", inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});