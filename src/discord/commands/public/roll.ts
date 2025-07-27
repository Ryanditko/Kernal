import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType } from "discord.js";

createCommand({
    name: "roll",
    description: "Roll a dice with specified sides",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "sides",
            description: "Number of sides on the dice (default: 6)",
            type: ApplicationCommandOptionType.Integer,
            minValue: 2,
            maxValue: 100,
            required: false
        }
    ],
    async run(interaction) {
        const sides = interaction.options.getInteger("sides") || 6;
        const result = Math.floor(Math.random() * sides) + 1;

        await interaction.reply(`🎲 You rolled a **${result}** on a ${sides}-sided dice!`);
    }
});