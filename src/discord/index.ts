import { setupCreators } from "#base";
import { GuildMember } from "discord.js";

export const { createCommand, createEvent, createResponder } = setupCreators({
    commands: {
        defaultMemberPermissions: ['Administrator'],
        guilds: [process.env.MAIN_GUILD_ID  as string],
        onNotFound(interaction) {
            interaction.reply(`Olá! ${GuildMember} Este comando não foi encontrado, contate nosso suporte para mais informações.`)
        },
    }
})