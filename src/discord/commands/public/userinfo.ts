import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from "discord.js";

createCommand({
    name: "userinfo",
    description: "Get information about a user",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "user",
            description: "The user to get info about",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async run(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;
        const member = interaction.guild?.members.cache.get(user.id);

        if (!member) {
            await interaction.reply({ content: "❌ User not found in this server.", ephemeral: true });
            return;
        }

        const embed = new EmbedBuilder()
            .setColor(member.displayColor || "Random")
            .setTitle(`${user.username}'s Information`)
            .setThumbnail(user.displayAvatarURL())
            .addFields(
                { name: "Username", value: user.username, inline: true },
                { name: "Discriminator", value: user.discriminator, inline: true },
                { name: "ID", value: user.id, inline: true },
                { name: "Joined Server", value: member.joinedAt?.toLocaleString() || "Unknown", inline: true },
                { name: "Account Created", value: user.createdAt.toLocaleString(), inline: true },
                { name: "Roles", value: member.roles.cache.size.toString(), inline: true },
                { name: "Highest Role", value: member.roles.highest.toString(), inline: true },
                { name: "Is Bot", value: user.bot ? "Yes" : "No", inline: true }
            )
            .setFooter({ text: `Requested by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});