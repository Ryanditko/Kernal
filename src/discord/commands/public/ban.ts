import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";

createCommand({
    name: "ban",
    description: "Ban a member from the server",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["BanMembers"],
    options: [
        {
            name: "user",
            description: "The user to ban",
            type: ApplicationCommandOptionType.User,
            required: true
        },
        {
            name: "reason",
            description: "Reason for the ban",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "delete_messages",
            description: "Delete messages from the last days (0-365 days)",
            type: ApplicationCommandOptionType.Integer,
            minValue: 0,
            maxValue: 365,
            required: false
        }
    ],
    async run(interaction) {
        const user = interaction.options.getUser("user", true);
        const reason = interaction.options.getString("reason") || "No reason provided";
        const deleteDays = interaction.options.getInteger("delete_messages") || 0;

        try {
            await interaction.guild?.members.ban(user, { reason, deleteMessageDays: deleteDays });
            await interaction.reply({
                content: `✅ ${user.tag} has been banned. Reason: ${reason}`,
                ephemeral: true
            });
        } catch (error) {
            await interaction.reply({
                content: `❌ Failed to ban ${user.tag}. Error: ${error}`,
                ephemeral: true
            });
        }
    }
});