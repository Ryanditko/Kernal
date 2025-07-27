export const config = {
    OWNER_ID: "819954175173328906",
    BOT_TOKEN: process.env.BOT_TOKEN || "",
    LOG_CHANNEL_ID: "893147212748558360",
    OPENAI_KEY: process.env.OPENAI_API_KEY || "sua-chave-aqui" // Coloque sua chave da OpenAI aqui
};

export interface ModerationData {
    [guildId: string]: {
        bans: Array<{ userId: string, reason: string, timestamp: number }>,
        mutes: Array<{ userId: string, duration: number, timestamp: number }>,
        kicks: Array<{ userId: string, reason: string, timestamp: number }>
    };
}

export let moderationData: ModerationData = {};

export function loadData() {
    try {
        const data = require('../../moderation.json');
        moderationData = data;
    } catch {
        moderationData = {};
    }
}

export function saveData() {
    require('fs').writeFileSync('moderation.json', JSON.stringify(moderationData, null, 4));
}