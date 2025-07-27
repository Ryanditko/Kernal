import { createCommand } from "#base";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";

interface UserEconomy {
    balance: number;
    bank: number;
    lastDaily: number;
    lastWeekly: number;
    lastWork: number;
    level: number;
    xp: number;
    inventory: { [item: string]: number };
}

interface ShopItem {
    name: string;
    price: number;
    description: string;
    emoji: string;
    type: 'consumable' | 'collectible' | 'role';
}

const economy = new Map<string, UserEconomy>();
const shop: ShopItem[] = [
    { name: "Coffee", price: 50, description: "Uma xícara de café revigorante", emoji: "☕", type: "consumable" },
    { name: "Pizza", price: 150, description: "Uma deliciosa pizza", emoji: "🍕", type: "consumable" },
    { name: "Diamond", price: 1000, description: "Um diamante brilhante", emoji: "💎", type: "collectible" },
    { name: "Crown", price: 5000, description: "Uma coroa real", emoji: "👑", type: "collectible" },
    { name: "VIP Role", price: 10000, description: "Cargo VIP no servidor", emoji: "⭐", type: "role" }
];

function getUser(userId: string): UserEconomy {
    if (!economy.has(userId)) {
        economy.set(userId, {
            balance: 1000,
            bank: 0,
            lastDaily: 0,
            lastWeekly: 0,
            lastWork: 0,
            level: 1,
            xp: 0,
            inventory: {}
        });
    }
    return economy.get(userId)!;
}

function addXP(userId: string, amount: number): { levelUp: boolean; newLevel: number } {
    const user = getUser(userId);
    user.xp += amount;
    
    const newLevel = Math.floor(user.xp / 100) + 1;
    const levelUp = newLevel > user.level;
    
    if (levelUp) {
        user.level = newLevel;
        user.balance += newLevel * 100; // Bonus por subir de nível
    }
    
    return { levelUp, newLevel };
}

createCommand({
    name: "economy",
    description: "Sistema completo de economia",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "action",
            description: "Ação da economia",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "💰 Saldo", value: "balance" },
                { name: "🎁 Daily", value: "daily" },
                { name: "📅 Weekly", value: "weekly" },
                { name: "💼 Trabalhar", value: "work" },
                { name: "🏪 Loja", value: "shop" },
                { name: "🛒 Comprar", value: "buy" },
                { name: "🎒 Inventário", value: "inventory" },
                { name: "💸 Transferir", value: "transfer" },
                { name: "🏦 Banco", value: "bank" },
                { name: "🎲 Apostar", value: "gamble" },
                { name: "📊 Ranking", value: "leaderboard" },
                { name: "📈 Perfil", value: "profile" }
            ]
        },
        {
            name: "usuario",
            description: "Usuário alvo",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "quantidade",
            description: "Quantidade/valor",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 1
        },
        {
            name: "item",
            description: "Item da loja",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        const action = interaction.options.getString("action", true);
        const targetUser = interaction.options.getUser("usuario");
        const amount = interaction.options.getInteger("quantidade");
        const item = interaction.options.getString("item");

        const userId = targetUser?.id || interaction.user.id;
        const user = getUser(userId);

        switch (action) {
            case "balance":
                const total = user.balance + user.bank;
                const balanceEmbed = new EmbedBuilder()
                    .setTitle(`💰 Saldo de ${targetUser?.username || interaction.user.username}`)
                    .addFields(
                        { name: "💵 Carteira", value: `$${user.balance.toLocaleString()}`, inline: true },
                        { name: "🏦 Banco", value: `$${user.bank.toLocaleString()}`, inline: true },
                        { name: "💎 Total", value: `$${total.toLocaleString()}`, inline: true },
                        { name: "🏆 Nível", value: user.level.toString(), inline: true },
                        { name: "⭐ XP", value: `${user.xp}/100`, inline: true }
                    )
                    .setColor(0x00AE86)
                    .setThumbnail((targetUser || interaction.user).displayAvatarURL())
                    .setTimestamp();

                await interaction.reply({ embeds: [balanceEmbed] });
                break;

            case "daily":
                const now = Date.now();
                const dayInMs = 24 * 60 * 60 * 1000;
                
                if (now - user.lastDaily < dayInMs) {
                    const timeLeft = dayInMs - (now - user.lastDaily);
                    const hours = Math.floor(timeLeft / (60 * 60 * 1000));
                    const minutes = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));
                    
                    await interaction.reply({
                        content: `⏰ Você já coletou seu daily hoje! Volte em ${hours}h ${minutes}m`,
                        ephemeral: true
                    });
                    return;
                }

                const dailyAmount = Math.floor(Math.random() * 500) + 200; // 200-700
                user.balance += dailyAmount;
                user.lastDaily = now;

                const { levelUp, newLevel } = addXP(userId, 25);

                const dailyEmbed = new EmbedBuilder()
                    .setTitle("🎁 Daily Coletado!")
                    .setDescription(`Você ganhou **$${dailyAmount.toLocaleString()}**!`)
                    .addFields(
                        { name: "💰 Novo Saldo", value: `$${user.balance.toLocaleString()}`, inline: true },
                        { name: "⭐ XP Ganho", value: "+25 XP", inline: true }
                    )
                    .setColor(0xFFD700)
                    .setTimestamp();

                if (levelUp) {
                    dailyEmbed.addFields({
                        name: "🎉 Level Up!",
                        value: `Parabéns! Você subiu para o nível ${newLevel}!\nBônus: $${newLevel * 100}`,
                        inline: false
                    });
                }

                await interaction.reply({ embeds: [dailyEmbed] });
                break;

            case "work":
                const workCooldown = 60 * 60 * 1000; // 1 hora
                const workNow = Date.now();
                
                if (workNow - user.lastWork < workCooldown) {
                    const timeLeft = workCooldown - (workNow - user.lastWork);
                    const minutes = Math.floor(timeLeft / (60 * 1000));
                    
                    await interaction.reply({
                        content: `💼 Você está cansado! Descanse por mais ${minutes} minutos.`,
                        ephemeral: true
                    });
                    return;
                }

                const jobs = [
                    { name: "Programador", pay: [300, 600], emoji: "💻" },
                    { name: "Chef", pay: [200, 400], emoji: "👨‍🍳" },
                    { name: "Médico", pay: [400, 700], emoji: "👨‍⚕️" },
                    { name: "Professor", pay: [250, 450], emoji: "👨‍🏫" },
                    { name: "Artista", pay: [150, 500], emoji: "🎨" }
                ];

                const randomJob = jobs[Math.floor(Math.random() * jobs.length)];
                const workPay = Math.floor(Math.random() * (randomJob.pay[1] - randomJob.pay[0] + 1)) + randomJob.pay[0];
                
                user.balance += workPay;
                user.lastWork = workNow;

                const workResult = addXP(userId, 15);

                const workEmbed = new EmbedBuilder()
                    .setTitle(`💼 Trabalho Completo!`)
                    .setDescription(`Você trabalhou como ${randomJob.emoji} **${randomJob.name}** e ganhou **$${workPay.toLocaleString()}**!`)
                    .addFields(
                        { name: "💰 Novo Saldo", value: `$${user.balance.toLocaleString()}`, inline: true },
                        { name: "⭐ XP Ganho", value: "+15 XP", inline: true }
                    )
                    .setColor(0x32CD32)
                    .setTimestamp();

                if (workResult.levelUp) {
                    workEmbed.addFields({
                        name: "🎉 Level Up!",
                        value: `Parabéns! Você subiu para o nível ${workResult.newLevel}!`,
                        inline: false
                    });
                }

                await interaction.reply({ embeds: [workEmbed] });
                break;

            case "shop":
                const shopEmbed = new EmbedBuilder()
                    .setTitle("🏪 Loja")
                    .setDescription("Use `/economy buy item:<nome>` para comprar!")
                    .setColor(0x9932CC);

                shop.forEach((shopItem) => {
                    shopEmbed.addFields({
                        name: `${shopItem.emoji} ${shopItem.name}`,
                        value: `💰 $${shopItem.price.toLocaleString()}\n${shopItem.description}`,
                        inline: true
                    });
                });

                await interaction.reply({ embeds: [shopEmbed] });
                break;

            case "buy":
                if (!item) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um item para comprar!",
                        ephemeral: true
                    });
                    return;
                }

                const shopItem = shop.find(s => s.name.toLowerCase() === item.toLowerCase());
                if (!shopItem) {
                    await interaction.reply({
                        content: "❌ Item não encontrado na loja!",
                        ephemeral: true
                    });
                    return;
                }

                if (user.balance < shopItem.price) {
                    await interaction.reply({
                        content: `❌ Você não tem dinheiro suficiente! Você precisa de $${shopItem.price.toLocaleString()}`,
                        ephemeral: true
                    });
                    return;
                }

                user.balance -= shopItem.price;
                user.inventory[shopItem.name] = (user.inventory[shopItem.name] || 0) + 1;

                const buyEmbed = new EmbedBuilder()
                    .setTitle("✅ Compra Realizada!")
                    .setDescription(`Você comprou **${shopItem.emoji} ${shopItem.name}**!`)
                    .addFields(
                        { name: "💰 Preço", value: `$${shopItem.price.toLocaleString()}`, inline: true },
                        { name: "💵 Saldo Restante", value: `$${user.balance.toLocaleString()}`, inline: true }
                    )
                    .setColor(0x00FF00)
                    .setTimestamp();

                await interaction.reply({ embeds: [buyEmbed] });
                break;

            case "inventory":
                const inventoryItems = Object.entries(user.inventory);
                
                if (inventoryItems.length === 0) {
                    await interaction.reply({
                        content: "🎒 Seu inventário está vazio!",
                        ephemeral: true
                    });
                    return;
                }

                const inventoryEmbed = new EmbedBuilder()
                    .setTitle(`🎒 Inventário de ${targetUser?.username || interaction.user.username}`)
                    .setColor(0x8A2BE2);

                inventoryItems.forEach(([itemName, quantity]) => {
                    const shopItem = shop.find(s => s.name === itemName);
                    if (shopItem) {
                        inventoryEmbed.addFields({
                            name: `${shopItem.emoji} ${itemName}`,
                            value: `Quantidade: ${quantity}`,
                            inline: true
                        });
                    }
                });

                await interaction.reply({ embeds: [inventoryEmbed] });
                break;

            case "transfer":
                if (!targetUser || !amount) {
                    await interaction.reply({
                        content: "❌ Você deve especificar um usuário e quantidade para transferir!",
                        ephemeral: true
                    });
                    return;
                }

                if (targetUser.id === interaction.user.id) {
                    await interaction.reply({
                        content: "❌ Você não pode transferir dinheiro para si mesmo!",
                        ephemeral: true
                    });
                    return;
                }

                const senderUser = getUser(interaction.user.id);
                if (senderUser.balance < amount) {
                    await interaction.reply({
                        content: "❌ Você não tem dinheiro suficiente!",
                        ephemeral: true
                    });
                    return;
                }

                const receiverUser = getUser(targetUser.id);
                senderUser.balance -= amount;
                receiverUser.balance += amount;

                const transferEmbed = new EmbedBuilder()
                    .setTitle("💸 Transferência Realizada")
                    .addFields(
                        { name: "👤 De", value: interaction.user.username, inline: true },
                        { name: "👤 Para", value: targetUser.username, inline: true },
                        { name: "💰 Valor", value: `$${amount.toLocaleString()}`, inline: true }
                    )
                    .setColor(0x1E90FF)
                    .setTimestamp();

                await interaction.reply({ embeds: [transferEmbed] });
                break;

            case "gamble":
                if (!amount) {
                    await interaction.reply({
                        content: "❌ Você deve especificar uma quantidade para apostar!",
                        ephemeral: true
                    });
                    return;
                }

                if (user.balance < amount) {
                    await interaction.reply({
                        content: "❌ Você não tem dinheiro suficiente!",
                        ephemeral: true
                    });
                    return;
                }

                const gambleChance = Math.random();
                let result: string;
                let winAmount = 0;

                if (gambleChance < 0.45) { // 45% chance de ganhar
                    winAmount = Math.floor(amount * 1.5);
                    user.balance += winAmount;
                    result = "🎉 Você GANHOU!";
                } else { // 55% chance de perder
                    user.balance -= amount;
                    result = "😢 Você perdeu...";
                }

                const gambleEmbed = new EmbedBuilder()
                    .setTitle("🎲 Resultado da Aposta")
                    .setDescription(result)
                    .addFields(
                        { name: "💰 Apostado", value: `$${amount.toLocaleString()}`, inline: true },
                        { name: "💵 Novo Saldo", value: `$${user.balance.toLocaleString()}`, inline: true }
                    )
                    .setColor(winAmount > 0 ? 0x00FF00 : 0xFF0000)
                    .setTimestamp();

                if (winAmount > 0) {
                    gambleEmbed.addFields({
                        name: "🏆 Ganhos",
                        value: `$${winAmount.toLocaleString()}`,
                        inline: true
                    });
                }

                await interaction.reply({ embeds: [gambleEmbed] });
                break;

            case "leaderboard":
                const topUsers = Array.from(economy.entries())
                    .map(([id, data]) => ({ id, total: data.balance + data.bank, level: data.level }))
                    .sort((a, b) => b.total - a.total)
                    .slice(0, 10);

                const leaderboardEmbed = new EmbedBuilder()
                    .setTitle("🏆 Ranking de Economia")
                    .setColor(0xFFD700);

                topUsers.forEach((userData, index) => {
                    const user = interaction.client.users.cache.get(userData.id);
                    const medals = ["🥇", "🥈", "🥉"];
                    const medal = medals[index] || `${index + 1}.`;
                    
                    leaderboardEmbed.addFields({
                        name: `${medal} ${user?.username || "Usuário Desconhecido"}`,
                        value: `💰 $${userData.total.toLocaleString()} | 🏆 Nível ${userData.level}`,
                        inline: false
                    });
                });

                await interaction.reply({ embeds: [leaderboardEmbed] });
                break;

            case "profile":
                const profileUser = targetUser || interaction.user;
                const profileData = getUser(profileUser.id);
                const profileTotal = profileData.balance + profileData.bank;
                
                const profileEmbed = new EmbedBuilder()
                    .setTitle(`👤 Perfil de ${profileUser.username}`)
                    .addFields(
                        { name: "💰 Carteira", value: `$${profileData.balance.toLocaleString()}`, inline: true },
                        { name: "🏦 Banco", value: `$${profileData.bank.toLocaleString()}`, inline: true },
                        { name: "💎 Patrimônio", value: `$${profileTotal.toLocaleString()}`, inline: true },
                        { name: "🏆 Nível", value: profileData.level.toString(), inline: true },
                        { name: "⭐ XP", value: `${profileData.xp}/${profileData.level * 100}`, inline: true },
                        { name: "🎒 Itens", value: Object.keys(profileData.inventory).length.toString(), inline: true }
                    )
                    .setThumbnail(profileUser.displayAvatarURL())
                    .setColor(0x9932CC)
                    .setTimestamp();

                await interaction.reply({ embeds: [profileEmbed] });
                break;

            default:
                await interaction.reply({
                    content: "❌ Ação inválida!",
                    ephemeral: true
                });
        }
    }
});
