import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";

createCommand({
    name: "kick",
    description: "Kick a member from the server",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["KickMembers"],
    options: [
        {
            name: "user",
            description: "The user to kick",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "reason",
            description: "Reason for the kick",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";

        try {
            await interaction.guild?.members.kick(user, reason);
            await interaction.reply({
                content: `✅ ${user.tag} has been kicked. Reason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to kick ${user.tag}. Error: ${error}`,
                ephemeral: true
            });
        }
    }
});