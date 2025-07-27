import { createCommand } from "#base";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import axios from "axios";

// Simular canvas e outras funcionalidades que requerem bibliotecas nativas
// Estas funções criarão resultados mock para demonstração

createCommand({
    name: "fun",
    description: "Comandos de diversão e entretenimento",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "action",
            description: "Tipo de diversão",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "🎯 8Ball", value: "8ball" },
                { name: "🎲 Dados", value: "dice" },
                { name: "🪙 Cara ou Coroa", value: "coinflip" },
                { name: "🔮 Previsão", value: "prediction" },
                { name: "❤️ Amor", value: "love" },
                { name: "😂 Piada", value: "joke" },
                { name: "🐱 Gato", value: "cat" },
                { name: "🐕 Cachorro", value: "dog" },
                { name: "🎨 Meme", value: "meme" },
                { name: "🌎 Fato", value: "fact" },
                { name: "💬 Citação", value: "quote" },
                { name: "🎵 Letra Musical", value: "lyrics" }
            ]
        },
        {
            name: "pergunta",
            description: "Sua pergunta (para 8ball, previsão)",
            type: ApplicationCommandOptionType.String,
            required: false,
            maxLength: 200
        },
        {
            name: "usuario1",
            description: "Primeiro usuário (para amor)",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "usuario2",
            description: "Segundo usuário (para amor)",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "lados",
            description: "Número de lados do dado (2-100)",
            type: ApplicationCommandOptionType.Integer,
            required: false,
            minValue: 2,
            maxValue: 100
        },
        {
            name: "musica",
            description: "Nome da música e artista",
            type: ApplicationCommandOptionType.String,
            required: false
        }
    ],
    async run(interaction) {
        const action = interaction.options.getString("action", true);
        const pergunta = interaction.options.getString("pergunta");
        const usuario1 = interaction.options.getUser("usuario1");
        const usuario2 = interaction.options.getUser("usuario2");
        const lados = interaction.options.getInteger("lados") || 6;
        const musica = interaction.options.getString("musica");

        await interaction.deferReply();

        switch (action) {
            case "8ball":
                if (!pergunta) {
                    await interaction.editReply("❌ Você precisa fazer uma pergunta!");
                    return;
                }

                const respostas8ball = [
                    "🟢 Com certeza!",
                    "🟢 Definitivamente sim!",
                    "🟢 Sem dúvidas!",
                    "🟢 Sim, você pode contar com isso!",
                    "🟢 Provavelmente sim!",
                    "🟡 Talvez...",
                    "🟡 Não posso prever agora",
                    "🟡 Concentre-se e pergunte novamente",
                    "🟡 É melhor não te contar agora",
                    "🔴 Não conte com isso",
                    "🔴 Minha resposta é não",
                    "🔴 Muito duvidoso",
                    "🔴 Definitivamente não!"
                ];

                const resposta = respostas8ball[Math.floor(Math.random() * respostas8ball.length)];

                const eightBallEmbed = new EmbedBuilder()
                    .setTitle("🎯 Bola 8 Mágica")
                    .addFields(
                        { name: "❓ Pergunta", value: pergunta, inline: false },
                        { name: "🔮 Resposta", value: resposta, inline: false }
                    )
                    .setColor(0x8A2BE2)
                    .setTimestamp();

                await interaction.editReply({ embeds: [eightBallEmbed] });
                break;

            case "dice":
                const resultado = Math.floor(Math.random() * lados) + 1;
                
                const diceEmbed = new EmbedBuilder()
                    .setTitle("🎲 Dados")
                    .setDescription(`🎯 **${resultado}**`)
                    .addFields(
                        { name: "🎲 Lados do Dado", value: lados.toString(), inline: true },
                        { name: "🎯 Resultado", value: resultado.toString(), inline: true }
                    )
                    .setColor(0xFF6B6B)
                    .setTimestamp();

                await interaction.editReply({ embeds: [diceEmbed] });
                break;

            case "coinflip":
                const moeda = Math.random() < 0.5 ? "Cara" : "Coroa";
                const coinEmoji = moeda === "Cara" ? "🙂" : "👑";

                const coinEmbed = new EmbedBuilder()
                    .setTitle("🪙 Cara ou Coroa")
                    .setDescription(`${coinEmoji} **${moeda}**!`)
                    .setColor(moeda === "Cara" ? 0xFFD700 : 0xC0C0C0)
                    .setTimestamp();

                await interaction.editReply({ embeds: [coinEmbed] });
                break;

            case "prediction":
                if (!pergunta) {
                    await interaction.editReply("❌ Você precisa fazer uma pergunta!");
                    return;
                }

                const previsoes = [
                    "🌟 Em breve grandes mudanças virão!",
                    "💰 A fortuna sorrirá para você!",
                    "❤️ O amor está no ar!",
                    "🎯 Seus objetivos serão alcançados!",
                    "⚡ Energia positiva está vindo!",
                    "🌈 Dias melhores estão chegando!",
                    "🔥 Sua paixão será recompensada!",
                    "🎊 Uma surpresa agradável te aguarda!",
                    "🌙 Paciência será sua virtude!",
                    "⭐ Você brilhará em breve!"
                ];

                const predicao = previsoes[Math.floor(Math.random() * previsoes.length)];

                const predictionEmbed = new EmbedBuilder()
                    .setTitle("🔮 Previsão do Futuro")
                    .addFields(
                        { name: "❓ Sua Pergunta", value: pergunta, inline: false },
                        { name: "🌟 Previsão", value: predicao, inline: false }
                    )
                    .setColor(0x9932CC)
                    .setTimestamp();

                await interaction.editReply({ embeds: [predictionEmbed] });
                break;

            case "love":
                const user1 = usuario1 || interaction.user;
                const user2 = usuario2 || interaction.user;

                if (user1.id === user2.id) {
                    await interaction.editReply("❌ Você precisa mencionar dois usuários diferentes!");
                    return;
                }

                const compatibilidade = Math.floor(Math.random() * 101);
                let loveEmoji = "💔";
                let status = "Incompatíveis";

                if (compatibilidade >= 80) {
                    loveEmoji = "💖";
                    status = "Alma gêmeas!";
                } else if (compatibilidade >= 60) {
                    loveEmoji = "💕";
                    status = "Muito compatíveis!";
                } else if (compatibilidade >= 40) {
                    loveEmoji = "💝";
                    status = "Podem dar certo!";
                } else if (compatibilidade >= 20) {
                    loveEmoji = "💔";
                    status = "Complicado...";
                }

                const loveEmbed = new EmbedBuilder()
                    .setTitle("❤️ Calculadora do Amor")
                    .setDescription(`${user1} ${loveEmoji} ${user2}`)
                    .addFields(
                        { name: "💯 Compatibilidade", value: `${compatibilidade}%`, inline: true },
                        { name: "💖 Status", value: status, inline: true }
                    )
                    .setColor(0xFF1493)
                    .setTimestamp();

                await interaction.editReply({ embeds: [loveEmbed] });
                break;

            case "joke":
                const piadas = [
                    "Por que os pássaros voam para o sul no inverno?\nPorque é longe demais para ir andando! 😂",
                    "Por que o livro de matemática estava triste?\nPorque tinha muitos problemas! 📚😢",
                    "O que a impressora falou para a outra impressora?\nEssa folha é sua ou é impressão minha? 🖨️😂",
                    "Por que o computador foi ao médico?\nPorque estava com vírus! 💻🦠",
                    "O que o pato disse para a pata?\nVem quá! 🦆😂",
                    "Por que o café foi para a terapia?\nPorque ele estava passando por um momento difícil! ☕😔",
                    "O que o oceano disse para a praia?\nNada, ele apenas acenou! 🌊👋",
                    "Por que os esqueletos não brigam?\nPorque não têm estômago para isso! 💀😂"
                ];

                const piada = piadas[Math.floor(Math.random() * piadas.length)];

                const jokeEmbed = new EmbedBuilder()
                    .setTitle("😂 Piada do Dia")
                    .setDescription(piada)
                    .setColor(0xFFD700)
                    .setTimestamp();

                await interaction.editReply({ embeds: [jokeEmbed] });
                break;

            case "cat":
                try {
                    const response = await axios.get('https://api.thecatapi.com/v1/images/search');
                    const catUrl = response.data[0]?.url;

                    if (catUrl) {
                        const catEmbed = new EmbedBuilder()
                            .setTitle("🐱 Gatinho Fofo!")
                            .setImage(catUrl)
                            .setColor(0xFF69B4)
                            .setTimestamp();

                        await interaction.editReply({ embeds: [catEmbed] });
                    } else {
                        throw new Error("Não foi possível carregar a imagem");
                    }
                } catch (error) {
                    await interaction.editReply("❌ Erro ao buscar imagem de gato! 😿");
                }
                break;

            case "dog":
                try {
                    const response = await axios.get('https://dog.ceo/api/breeds/image/random');
                    const dogUrl = response.data?.message;

                    if (dogUrl) {
                        const dogEmbed = new EmbedBuilder()
                            .setTitle("🐕 Cachorrinho Fofo!")
                            .setImage(dogUrl)
                            .setColor(0x8B4513)
                            .setTimestamp();

                        await interaction.editReply({ embeds: [dogEmbed] });
                    } else {
                        throw new Error("Não foi possível carregar a imagem");
                    }
                } catch (error) {
                    await interaction.editReply("❌ Erro ao buscar imagem de cachorro! 🐕‍🦺");
                }
                break;

            case "meme":
                try {
                    const response = await axios.get('https://meme-api.com/gimme');
                    const meme = response.data;

                    if (meme && meme.url) {
                        const memeEmbed = new EmbedBuilder()
                            .setTitle(`🎨 ${meme.title || "Meme Aleatório"}`)
                            .setDescription(`📱 r/${meme.subreddit || "memes"}`)
                            .setImage(meme.url)
                            .setColor(0x00FF00)
                            .setTimestamp();

                        await interaction.editReply({ embeds: [memeEmbed] });
                    } else {
                        throw new Error("Não foi possível carregar o meme");
                    }
                } catch (error) {
                    // Fallback para memes locais
                    const memeTextos = [
                        "📱 Quando você vê que tem 0% de bateria",
                        "🍕 Quando alguém fala que pizza de abacaxi é ruim",
                        "😴 Eu: Vou dormir cedo hoje. 3h da manhã:",
                        "🤔 Quando você esquece o que ia fazer",
                        "💻 Quando o código funciona na primeira tentativa"
                    ];
                    
                    const memeTexto = memeTextos[Math.floor(Math.random() * memeTextos.length)];
                    
                    const fallbackEmbed = new EmbedBuilder()
                        .setTitle("🎨 Meme do Dia")
                        .setDescription(memeTexto)
                        .setColor(0x00FF00)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [fallbackEmbed] });
                }
                break;

            case "fact":
                const fatos = [
                    "🌍 A Terra é o único planeta conhecido com vida!",
                    "🐙 Polvos têm três corações e sangue azul!",
                    "🍯 O mel nunca estraga. Arqueólogos encontraram potes de mel comestível em tumbas egípcias!",
                    "🦒 As girafas têm a mesma quantidade de vértebras no pescoço que os humanos (7)!",
                    "🌙 A Lua está se afastando da Terra cerca de 3,8 cm por ano!",
                    "🐧 Os pinguins podem beber água salgada porque têm glândulas que filtram o sal!",
                    "💎 Os diamantes são formados a cerca de 150-200 km abaixo da superfície terrestre!",
                    "🧠 Seu cérebro usa cerca de 20% de toda a energia do seu corpo!"
                ];

                const fato = fatos[Math.floor(Math.random() * fatos.length)];

                const factEmbed = new EmbedBuilder()
                    .setTitle("🌎 Fato Interessante")
                    .setDescription(fato)
                    .setColor(0x4169E1)
                    .setTimestamp();

                await interaction.editReply({ embeds: [factEmbed] });
                break;

            case "quote":
                const citacoes = [
                    "💡 'A imaginação é mais importante que o conhecimento.' - Albert Einstein",
                    "🌟 'Seja a mudança que você quer ver no mundo.' - Mahatma Gandhi",
                    "🎯 'O sucesso é ir de fracasso em fracasso sem perder o entusiasmo.' - Winston Churchill",
                    "🚀 'A vida é o que acontece quando você está ocupado fazendo outros planos.' - John Lennon",
                    "⭐ 'Acredite que você pode e você já está no meio do caminho.' - Theodore Roosevelt",
                    "🌈 'A única forma de fazer um excelente trabalho é amar o que você faz.' - Steve Jobs",
                    "💪 'Não é o mais forte que sobrevive, mas o mais adaptável.' - Charles Darwin",
                    "🎊 'A felicidade não é algo pronto. Ela vem de suas próprias ações.' - Dalai Lama"
                ];

                const citacao = citacoes[Math.floor(Math.random() * citacoes.length)];

                const quoteEmbed = new EmbedBuilder()
                    .setTitle("💬 Citação Inspiradora")
                    .setDescription(citacao)
                    .setColor(0x9932CC)
                    .setTimestamp();

                await interaction.editReply({ embeds: [quoteEmbed] });
                break;

            case "lyrics":
                if (!musica) {
                    await interaction.editReply("❌ Você precisa especificar o nome da música e artista!");
                    return;
                }

                // Esta é uma implementação mock - em produção você usaria uma API real como Genius ou Musixmatch
                const lyricsEmbed = new EmbedBuilder()
                    .setTitle("🎵 Letra da Música")
                    .setDescription(`🔍 Buscando letra para: **${musica}**`)
                    .addFields({
                        name: "ℹ️ Informação",
                        value: "Este é um placeholder. Em produção, integraria com APIs como Genius ou Musixmatch para buscar letras reais.",
                        inline: false
                    })
                    .setColor(0x1DB954)
                    .setTimestamp();

                await interaction.editReply({ embeds: [lyricsEmbed] });
                break;

            default:
                await interaction.editReply("❌ Ação inválida!");
        }
    }
});
