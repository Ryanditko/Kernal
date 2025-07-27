import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from "discord.js";

// Simulated database
const userBalances = new Map<string, { coins: number, bank: number }>();

createCommand({
    name: "balance",
    description: "Check your coin balance",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "user",
            description: "User to check balance of",
            type: ApplicationCommandOptionType.User,
            required: false
        }
    ],
    async run(interaction) {
        const user = interaction.options.getUser("user") || interaction.user;
        const balance = userBalances.get(user.id) || { coins: 0, bank: 0 };

        const embed = new EmbedBuilder()
            .setColor("Gold")
            .setTitle(`${user.username}'s Balance`)
            .addFields(
                { name: "Wallet", value: `${balance.coins} coins`, inline: true },
                { name: "Bank", value: `${balance.bank} coins`, inline: true },
                { name: "Total", value: `${balance.coins + balance.bank} coins`, inline: true }
            )
            .setThumbnail(user.displayAvatarURL())
            .setFooter({ text: `Requested by ${interaction.user.tag}` });

        await interaction.reply({ embeds: [embed] });
    }
});