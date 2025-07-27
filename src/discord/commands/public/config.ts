export const config = {
    OWNER_ID: "819954175173328906",
    LOG_CHANNEL_ID: "1337986478868926474",
    OPENAI_KEY: "API_OPENAI_KEY" // Substitua pela sua chave
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

