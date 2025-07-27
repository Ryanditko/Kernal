import { createCommand } from "#base";
import { ApplicationCommandType, ApplicationCommandOptionType, EmbedBuilder } from "discord.js";
import axios from "axios";

createCommand({
    name: "utils",
    description: "Comandos de utilidade",
    type: ApplicationCommandType.ChatInput,
    options: [
        {
            name: "action",
            description: "Tipo de utilidade",
            type: ApplicationCommandOptionType.String,
            required: true,
            choices: [
                { name: "📊 Info do Servidor", value: "serverinfo" },
                { name: "👤 Info do Usuário", value: "userinfo" },
                { name: "🏓 Ping", value: "ping" },
                { name: "📅 Tempo", value: "time" },
                { name: "🌍 IP Info", value: "ipinfo" },
                { name: "💱 Conversor", value: "convert" },
                { name: "🔗 Encurtar URL", value: "shorten" },
                { name: "📋 QR Code", value: "qrcode" },
                { name: "🔍 Wikipedia", value: "wikipedia" },
                { name: "🌤️ Clima", value: "weather" },
                { name: "📏 Calculadora", value: "calc" },
                { name: "🔤 Base64", value: "base64" }
            ]
        },
        {
            name: "usuario",
            description: "Usuário para informações",
            type: ApplicationCommandOptionType.User,
            required: false
        },
        {
            name: "entrada",
            description: "Texto/URL/IP/Cálculo para processar",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "de",
            description: "Unidade de origem para conversão",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "para",
            description: "Unidade de destino para conversão",
            type: ApplicationCommandOptionType.String,
            required: false
        },
        {
            name: "valor",
            description: "Valor para conversão",
            type: ApplicationCommandOptionType.Number,
            required: false
        }
    ],
    async run(interaction) {
        const action = interaction.options.getString("action", true);
        const usuario = interaction.options.getUser("usuario");
        const entrada = interaction.options.getString("entrada");
        const de = interaction.options.getString("de");
        const para = interaction.options.getString("para");
        const valor = interaction.options.getNumber("valor");

        switch (action) {
            case "serverinfo":
                const guild = interaction.guild!;
                const owner = await guild.fetchOwner();
                
                const serverEmbed = new EmbedBuilder()
                    .setTitle(`📊 ${guild.name}`)
                    .setThumbnail(guild.iconURL())
                    .addFields(
                        { name: "👑 Dono", value: owner.user.username, inline: true },
                        { name: "🆔 ID", value: guild.id, inline: true },
                        { name: "📅 Criado em", value: `<t:${Math.floor(guild.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: "👥 Membros", value: guild.memberCount.toString(), inline: true },
                        { name: "📁 Canais", value: guild.channels.cache.size.toString(), inline: true },
                        { name: "🎭 Cargos", value: guild.roles.cache.size.toString(), inline: true },
                        { name: "😀 Emojis", value: guild.emojis.cache.size.toString(), inline: true },
                        { name: "🛡️ Nível de Verificação", value: guild.verificationLevel.toString(), inline: true },
                        { name: "🔞 Filtro de Conteúdo", value: guild.explicitContentFilter.toString(), inline: true }
                    )
                    .setColor(0x7289DA)
                    .setTimestamp();

                if (guild.description) {
                    serverEmbed.setDescription(guild.description);
                }

                await interaction.reply({ embeds: [serverEmbed] });
                break;

            case "userinfo":
                const targetUser = usuario || interaction.user;
                const member = interaction.guild!.members.cache.get(targetUser.id);

                const userEmbed = new EmbedBuilder()
                    .setTitle(`👤 ${targetUser.username}`)
                    .setThumbnail(targetUser.displayAvatarURL({ size: 512 }))
                    .addFields(
                        { name: "🆔 ID", value: targetUser.id, inline: true },
                        { name: "📅 Conta Criada", value: `<t:${Math.floor(targetUser.createdTimestamp / 1000)}:F>`, inline: true },
                        { name: "🤖 Bot", value: targetUser.bot ? "Sim" : "Não", inline: true }
                    )
                    .setColor(targetUser.accentColor || 0x7289DA)
                    .setTimestamp();

                if (member) {
                    userEmbed.addFields(
                        { name: "📥 Entrou em", value: `<t:${Math.floor(member.joinedTimestamp! / 1000)}:F>`, inline: true },
                        { name: "🎭 Cargos", value: member.roles.cache.size.toString(), inline: true },
                        { name: "🏆 Maior Cargo", value: member.roles.highest.name, inline: true }
                    );

                    if (member.nickname) {
                        userEmbed.addFields({ name: "📝 Apelido", value: member.nickname, inline: true });
                    }
                }

                await interaction.reply({ embeds: [userEmbed] });
                break;

            case "ping":
                const sent = await interaction.reply({ content: "🏓 Calculando ping...", fetchReply: true });
                const timeDiff = sent.createdTimestamp - interaction.createdTimestamp;

                const pingEmbed = new EmbedBuilder()
                    .setTitle("🏓 Pong!")
                    .addFields(
                        { name: "⚡ Latência", value: `${timeDiff}ms`, inline: true },
                        { name: "💓 Heartbeat", value: `${Math.round(interaction.client.ws.ping)}ms`, inline: true },
                        { name: "📊 Status", value: timeDiff < 100 ? "🟢 Excelente" : timeDiff < 200 ? "🟡 Bom" : "🔴 Alto", inline: true }
                    )
                    .setColor(timeDiff < 100 ? 0x00FF00 : timeDiff < 200 ? 0xFFFF00 : 0xFF0000)
                    .setTimestamp();

                await interaction.editReply({ content: "", embeds: [pingEmbed] });
                break;

            case "time":
                const now = new Date();
                const timeZones = [
                    { name: "🇧🇷 Brasília", tz: "America/Sao_Paulo" },
                    { name: "🇺🇸 Nova York", tz: "America/New_York" },
                    { name: "🇬🇧 Londres", tz: "Europe/London" },
                    { name: "🇯🇵 Tóquio", tz: "Asia/Tokyo" },
                    { name: "🇦🇺 Sydney", tz: "Australia/Sydney" }
                ];

                const timeEmbed = new EmbedBuilder()
                    .setTitle("📅 Horários Mundiais")
                    .setColor(0x00AE86)
                    .setTimestamp();

                timeZones.forEach(tz => {
                    const localTime = now.toLocaleString("pt-BR", { 
                        timeZone: tz.tz,
                        hour12: false,
                        day: "2-digit",
                        month: "2-digit", 
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit"
                    });
                    timeEmbed.addFields({
                        name: tz.name,
                        value: localTime,
                        inline: true
                    });
                });

                await interaction.reply({ embeds: [timeEmbed] });
                break;

            case "calc":
                if (!entrada) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer uma expressão matemática!\nExemplo: `2 + 2`, `10 * 5`, `sqrt(16)`",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    // Sanitizar entrada para segurança
                    const sanitized = entrada.replace(/[^0-9+\-*/().,\s]/g, '');
                    
                    // Simular cálculo (em produção, use uma biblioteca como math.js)
                    let resultado: string;
                    
                    if (sanitized.includes('+')) {
                        const nums = sanitized.split('+').map(n => parseFloat(n.trim()));
                        resultado = nums.reduce((a, b) => a + b, 0).toString();
                    } else if (sanitized.includes('-')) {
                        const nums = sanitized.split('-').map(n => parseFloat(n.trim()));
                        resultado = nums.reduce((a, b) => a - b).toString();
                    } else if (sanitized.includes('*')) {
                        const nums = sanitized.split('*').map(n => parseFloat(n.trim()));
                        resultado = nums.reduce((a, b) => a * b, 1).toString();
                    } else if (sanitized.includes('/')) {
                        const nums = sanitized.split('/').map(n => parseFloat(n.trim()));
                        resultado = nums.reduce((a, b) => a / b).toString();
                    } else {
                        resultado = "Operação não suportada nesta versão demo";
                    }

                    const calcEmbed = new EmbedBuilder()
                        .setTitle("📏 Calculadora")
                        .addFields(
                            { name: "➡️ Entrada", value: `\`${entrada}\``, inline: false },
                            { name: "✅ Resultado", value: `\`${resultado}\``, inline: false }
                        )
                        .setColor(0x32CD32)
                        .setTimestamp();

                    await interaction.reply({ embeds: [calcEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro no cálculo! Verifique a expressão matemática.",
                        ephemeral: true
                    });
                }
                break;

            case "base64":
                if (!entrada) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer um texto para codificar/decodificar!",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    let resultado: string;
                    let operacao: string;

                    // Tentar decodificar primeiro
                    try {
                        const decoded = Buffer.from(entrada, 'base64').toString('utf-8');
                        if (Buffer.from(decoded).toString('base64') === entrada) {
                            resultado = decoded;
                            operacao = "Decodificado";
                        } else {
                            throw new Error("Não é base64 válido");
                        }
                    } catch {
                        // Se falhar, codificar
                        resultado = Buffer.from(entrada).toString('base64');
                        operacao = "Codificado";
                    }

                    const base64Embed = new EmbedBuilder()
                        .setTitle("🔤 Base64")
                        .addFields(
                            { name: "➡️ Entrada", value: `\`\`\`${entrada}\`\`\``, inline: false },
                            { name: `✅ ${operacao}`, value: `\`\`\`${resultado}\`\`\``, inline: false }
                        )
                        .setColor(0x1E90FF)
                        .setTimestamp();

                    await interaction.reply({ embeds: [base64Embed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro ao processar Base64!",
                        ephemeral: true
                    });
                }
                break;

            case "qrcode":
                if (!entrada) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer um texto ou URL para gerar o QR Code!",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferReply();

                try {
                    // Usar API gratuita para gerar QR Code
                    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(entrada)}`;

                    const qrEmbed = new EmbedBuilder()
                        .setTitle("📋 QR Code Gerado")
                        .setDescription(`\`\`\`${entrada}\`\`\``)
                        .setImage(qrUrl)
                        .setColor(0x000000)
                        .setTimestamp();

                    await interaction.editReply({ embeds: [qrEmbed] });

                } catch (error) {
                    await interaction.editReply("❌ Erro ao gerar QR Code!");
                }
                break;

            case "wikipedia":
                if (!entrada) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer um termo para pesquisar na Wikipedia!",
                        ephemeral: true
                    });
                    return;
                }

                await interaction.deferReply();

                try {
                    const searchUrl = `https://pt.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(entrada)}`;
                    const response = await axios.get(searchUrl);
                    const data = response.data;

                    if (data.type === 'disambiguation') {
                        await interaction.editReply("🔍 Termo ambíguo. Tente ser mais específico!");
                        return;
                    }

                    const wikiEmbed = new EmbedBuilder()
                        .setTitle(`📖 ${data.title}`)
                        .setDescription(data.extract || "Sem descrição disponível")
                        .setURL(data.content_urls?.desktop?.page || `https://pt.wikipedia.org/wiki/${encodeURIComponent(entrada)}`)
                        .setColor(0x000000)
                        .setTimestamp();

                    if (data.thumbnail?.source) {
                        wikiEmbed.setThumbnail(data.thumbnail.source);
                    }

                    await interaction.editReply({ embeds: [wikiEmbed] });

                } catch (error) {
                    await interaction.editReply("❌ Não foi possível encontrar informações na Wikipedia!");
                }
                break;

            case "convert":
                if (!valor || !de || !para) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer: valor, unidade de origem e unidade de destino!\nExemplo: `valor:100 de:celsius para:fahrenheit`",
                        ephemeral: true
                    });
                    return;
                }

                try {
                    let resultado: number;
                    let unidadeResultado: string;

                    // Conversões de temperatura
                    if (de.toLowerCase() === "celsius" && para.toLowerCase() === "fahrenheit") {
                        resultado = (valor * 9/5) + 32;
                        unidadeResultado = "°F";
                    } else if (de.toLowerCase() === "fahrenheit" && para.toLowerCase() === "celsius") {
                        resultado = (valor - 32) * 5/9;
                        unidadeResultado = "°C";
                    } else if (de.toLowerCase() === "celsius" && para.toLowerCase() === "kelvin") {
                        resultado = valor + 273.15;
                        unidadeResultado = "K";
                    } else if (de.toLowerCase() === "kelvin" && para.toLowerCase() === "celsius") {
                        resultado = valor - 273.15;
                        unidadeResultado = "°C";
                    }
                    // Conversões de distância
                    else if (de.toLowerCase() === "metros" && para.toLowerCase() === "feet") {
                        resultado = valor * 3.28084;
                        unidadeResultado = "ft";
                    } else if (de.toLowerCase() === "feet" && para.toLowerCase() === "metros") {
                        resultado = valor / 3.28084;
                        unidadeResultado = "m";
                    } else if (de.toLowerCase() === "km" && para.toLowerCase() === "milhas") {
                        resultado = valor * 0.621371;
                        unidadeResultado = "mi";
                    } else if (de.toLowerCase() === "milhas" && para.toLowerCase() === "km") {
                        resultado = valor / 0.621371;
                        unidadeResultado = "km";
                    }
                    // Conversões de peso
                    else if (de.toLowerCase() === "kg" && para.toLowerCase() === "libras") {
                        resultado = valor * 2.20462;
                        unidadeResultado = "lbs";
                    } else if (de.toLowerCase() === "libras" && para.toLowerCase() === "kg") {
                        resultado = valor / 2.20462;
                        unidadeResultado = "kg";
                    } else {
                        await interaction.reply({
                            content: "❌ Conversão não suportada!\nUnidades disponíveis: celsius, fahrenheit, kelvin, metros, feet, km, milhas, kg, libras",
                            ephemeral: true
                        });
                        return;
                    }

                    const convertEmbed = new EmbedBuilder()
                        .setTitle("💱 Conversão")
                        .addFields(
                            { name: "➡️ Valor Original", value: `${valor} ${de}`, inline: true },
                            { name: "✅ Resultado", value: `${resultado.toFixed(2)} ${unidadeResultado}`, inline: true }
                        )
                        .setColor(0xFF6B6B)
                        .setTimestamp();

                    await interaction.reply({ embeds: [convertEmbed] });

                } catch (error) {
                    await interaction.reply({
                        content: "❌ Erro na conversão!",
                        ephemeral: true
                    });
                }
                break;

            case "shorten":
                if (!entrada) {
                    await interaction.reply({
                        content: "❌ Você precisa fornecer uma URL para encurtar!",
                        ephemeral: true
                    });
                    return;
                }

                // Esta é uma implementação mock - em produção você usaria uma API real
                const shortenEmbed = new EmbedBuilder()
                    .setTitle("🔗 URL Encurtada")
                    .addFields(
                        { name: "🔗 URL Original", value: entrada, inline: false },
                        { name: "✂️ URL Encurtada", value: `https://short.ly/${Math.random().toString(36).substr(2, 8)}`, inline: false },
                        { name: "ℹ️ Nota", value: "Este é um exemplo. Em produção, integraria com serviços como bit.ly ou tinyurl.", inline: false }
                    )
                    .setColor(0x1E90FF)
                    .setTimestamp();

                await interaction.reply({ embeds: [shortenEmbed] });
                break;

            default:
                await interaction.reply({
                    content: "❌ Ação inválida!",
                    ephemeral: true
                });
        }
    }
});
