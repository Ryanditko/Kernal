import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, ChannelType } from "discord.js";

// Simulated database
const serverConfigs = new Map<string, { welcomeChannel?: string, welcomeMessage?: string }>();

createCommand({
    name: "set-welcome",
    description: "Set the welcome channel and message",
    type: ApplicationCommandType.ChatInput,
    defaultMemberPermissions: ["ManageGuild"],
    options: [
        {
            name: "channel",
            description: "The channel to send welcome messages",
            type: ApplicationCommandOptionType.Channel,
            channelTypes: [ChannelType.GuildText],
            required: true
        },
        {
            name: "message",
            description: "The welcome message (use {user} for mention, {server} for server name)",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async run(interaction) {
        if (!interaction.guild) {
            await interaction.reply({ content: "❌ This command only works in servers.", ephemeral: true });
            return;
        }

        const channel = interaction.options.getChannel("channel", true);
        const message = interaction.options.getString("message", true);

        serverConfigs.set(interaction.guild.id, {
            welcomeChannel: channel.id,
            welcomeMessage: message
        });

        await interaction.reply({
            content: `✅ Welcome messages will now be sent to ${channel} with the message: \`${message}\``,
            ephemeral: true
        });
    }
});