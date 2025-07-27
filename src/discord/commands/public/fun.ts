import { createCommand } from "#base";
import { ApplicationCommandOptionType, ApplicationCommandType, EmbedBuilder } from "discord.js";

const responses = [
    "It is certain.",
    "It is decidedly so.",
    "Without a doubt.",
    "Yes - definitely.",
    "You may rely on it.",
    "As I see it, yes.",
    "Most likely.",
    "Outlook good.",
    "Yes.",
    "Signs point to yes.",
    "Reply hazy, try again.",
    "Ask again later.",
    "Better not tell you now.",
    "Cannot predict now.",
    "Concentrate and ask again.",
    "Don't count on it.",
    "My reply is no.",
    "My sources say no.",
    "Outlook not so good.",
    "Very doubtful."
];

createCommand({
    name: "8ball",
    description: "Ask the magic 8-ball a question",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "question",
            description: "Your question for the 8-ball",
            type: ApplicationCommandOptionType.String,
            required: true
        }
    ],
    async run(interaction) {
        const question = interaction.options.getString("question", true);
        const response = responses[Math.floor(Math.random() * responses.length)];

        const embed = new EmbedBuilder()
            .setColor("Random")
            .setTitle("🎱 Magic 8-Ball 🎱")
            .addFields(
                { name: "Question", value: question },
                { name: "Answer", value: response }
            )
            .setFooter({ text: `Asked by ${interaction.user.tag}` })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    }
});