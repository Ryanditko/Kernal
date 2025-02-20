import discord
from discord.ext import commands, tasks
import asyncio
import json
import datetime
import openai

# Configuração do bot
intents = discord.Intents.all()
bot = commands.Bot(command_prefix='k!', intents=intents)

# Minha chave de API do OpenAI
openai.api_key = 'API_OPENAI_KEY'  # Substituir pela minha chave de API

# Armazenamento de dados
user_data = {}
moderation_data = {}
OWNER_ID = 819954175173328906  # Meu ID
LOG_CHANNEL_ID = 1337986478868926474  # ID do canal de logs

# Carregar dados
def load_data():
    global user_data, moderation_data
    try:
        with open('moderation.json', 'r') as f:
            moderation_data = json.load(f)
    except FileNotFoundError:
        moderation_data = {}

def save_data():
    with open('moderation.json', 'w') as f:
        json.dump(moderation_data, f, indent=4)

@bot.event
async def on_ready():
    owner = bot.get_user(OWNER_ID)
    if owner:
        embed = discord.Embed(title='✅ Bot iniciado com sucesso!',
                              description=f'Online desde {datetime.datetime.now().strftime("%d/%m/%Y %H:%M:%S")}',
                              color=discord.Color.green())
        await owner.send(embed=embed)
    print(f'Bot {bot.user.name} está online!')
    daily_status.start()

# Comando para interagir com o ChatGPT
@bot.command()
async def chatgpt(ctx, *, prompt: str):
    """Interage com o ChatGPT."""
    try:
        response = openai.Completion.create(
            model="text-davinci-003",  # Modelo mais antigo
            prompt=prompt,
            max_tokens=100  # Limite de tokens para a resposta
        )
        answer = response['choices'][0]['text'].strip()
        await ctx.send(answer)
    except Exception as e:
        await ctx.send(f"Ocorreu um erro: {str(e)}")

# Verifica se o usuário é o dono do bot
def is_owner(ctx):
    return ctx.author.id == OWNER_ID

# Envia logs para o canal de logs
async def send_log(message):
    log_channel = bot.get_channel(LOG_CHANNEL_ID)
    if log_channel:
        await log_channel.send(message)

# Comandos de Moderação
@bot.command()
@commands.check(is_owner)
async def lock(ctx, channel: discord.TextChannel = None):
    """Bloqueia um canal para que ninguém possa enviar mensagens."""
    if channel is None:
        channel = ctx.channel  # Usa o canal atual se nenhum canal for especificado

    await channel.set_permissions(ctx.guild.default_role, send_messages=False)
    await ctx.send(f'O canal {channel.mention} foi bloqueado.')
    await send_log(f'O canal {channel.name} foi bloqueado por {ctx.author.name}.')

@bot.command()
@commands.check(is_owner)
async def unlock(ctx, channel: discord.TextChannel = None):
    """Desbloqueia um canal para que todos possam enviar mensagens."""
    if channel is None:
        channel = ctx.channel  # Usa o canal atual se nenhum canal for especificado

    await channel.set_permissions(ctx.guild.default_role, send_messages=True)
    await ctx.send(f'O canal {channel.mention} foi desbloqueado.')
    await send_log(f'O canal {channel.name} foi desbloqueado por {ctx.author.name}.')

@bot.command()
@commands.check(is_owner)
async def ban(ctx, server_id: int, member: discord.Member, *, reason='Não especificado'):
    """Bane um usuário do servidor especificado."""
    guild = bot.get_guild(server_id)
    if guild:
        await member.ban(reason=reason)
        embed = discord.Embed(title='🚨 Usuário Banido',
                              description=f'**Usuário:** {member.mention}\n**Motivo:** {reason}',
                              color=discord.Color.red())
        embed.set_footer(text=f'Banido por: {ctx.author.name}', icon_url=ctx.author.avatar_url)
        await ctx.send(embed=embed)
        await send_log(f'Usuário {member} foi banido no servidor {guild.name}. Motivo: {reason}')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def remote_ban(ctx, server_id: int, user_id: int, *, reason='Não especificado'):
    """Bane um usuário remotamente via DM usando o ID do usuário e do servidor."""
    guild = bot.get_guild(server_id)
    if guild:
        member = guild.get_member(user_id)
        if member:
            await member.ban(reason=reason)
            await ctx.send(f'Usuário {member.mention} banido com sucesso no servidor {guild.name}. Motivo: {reason}')
            await send_log(f'Usuário {member} foi banido remotamente no servidor {guild.name}. Motivo: {reason}')
        else:
            await ctx.send('Usuário não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def unban(ctx, server_id: int, user_id: int):
    """Desbane um usuário do servidor especificado."""
    guild = bot.get_guild(server_id)
    if guild:
        user = await bot.fetch_user(user_id)
        await guild.unban(user)
        embed = discord.Embed(title='🔓 Usuário Desbanido',
                              description=f'**Usuário:** {user.mention}',
                              color=discord.Color.green())
        await ctx.send(embed=embed)
        await send_log(f'Usuário {user} foi desbanido no servidor {guild.name}.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def kick(ctx, server_id: int, user_id: int, *, reason='Não especificado'):
    """Expulsa um usuário do servidor usando o ID do usuário."""
    guild = bot.get_guild(server_id)
    if guild:
        member = guild.get_member(user_id)
        if member:
            await member.kick(reason=reason)
            embed = discord.Embed(title='👢 Usuário Expulso',
                                  description=f'**Usuário:** {member.mention}\n**Motivo:** {reason}',
                                  color=discord.Color.orange())
            await ctx.send(embed=embed)
            await send_log(f'Usuário {member} foi expulso no servidor {guild.name}. Motivo: {reason}')
        else:
            await ctx.send('Usuário não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def mute(ctx, server_id: int, user_id: int, minutes: int):
    """Silencia um usuário por um tempo determinado usando o ID do usuário."""
    guild = bot.get_guild(server_id)
    if guild:
        member = guild.get_member(user_id)
        if member:
            mute_role = discord.utils.get(guild.roles, name='Muted')
            if not mute_role:
                mute_role = await guild.create_role(name='Muted')
                for channel in guild.channels:
                    await channel.set_permissions(mute_role, send_messages=False)
            await member.add_roles(mute_role)
            embed = discord.Embed(title='🔇 Usuário Silenciado',
                                  description=f'**Usuário:** {member.mention}\n**Duração:** {minutes} minutos',
                                  color=discord.Color.blue())
            await ctx.send(embed=embed)
            await send_log(f'Usuário {member} foi silenciado por {minutes} minutos no servidor {guild.name}.')
            await asyncio.sleep(minutes * 60)
            await member.remove_roles(mute_role)
            embed = discord.Embed(title='🔊 Usuário Dessilenciado',
                                  description=f'**Usuário:** {member.mention} agora pode falar novamente.',
                                  color=discord.Color.green())
            await ctx.send(embed=embed)
        else:
            await ctx.send('Usuário não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def unmute(ctx, server_id: int, user_id: int):
    """Remove o silêncio de um usuário usando o ID do usuário."""
    guild = bot.get_guild(server_id)
    if guild:
        member = guild.get_member(user_id)
        if member:
            mute_role = discord.utils.get(guild.roles, name='Muted')
            if mute_role in member.roles:
                await member.remove_roles(mute_role)
                embed = discord.Embed(title='🔊 Usuário Dessilenciado',
                                      description=f'**Usuário:** {member.mention} pode falar novamente.',
                                      color=discord.Color.green())
                await ctx.send(embed=embed)
                await send_log(f'Usuário {member} foi dessilenciado no servidor {guild.name}.')
        else:
            await ctx.send('Usuário não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def tempmute(ctx, server_id: int, user_id: int, minutes: int):
    """Silencia um usuário por um tempo determinado usando o ID do usuário."""
    guild = bot.get_guild(server_id)
    if guild:
        member = guild.get_member(user_id)
        if member:
            mute_role = discord.utils.get(guild.roles, name='Muted')
            if not mute_role:
                mute_role = await guild.create_role(name='Muted')
                for channel in guild.channels:
                    await channel.set_permissions(mute_role, send_messages=False)
            await member.add_roles(mute_role)
            embed = discord.Embed(title='🔇 Usuário Temporariamente Silenciado',
                                  description=f'**Usuário:** {member.mention}\n**Duração:** {minutes} minutos',
                                  color=discord.Color.blue())
            await ctx.send(embed=embed)
            await send_log(f'Usuário {member} foi silenciado por {minutes} minutos no servidor {guild.name}.')
            await asyncio.sleep(minutes * 60)
            await member.remove_roles(mute_role)
            embed = discord.Embed(title='🔊 Usuário Dessilenciado',
                                  description=f'**Usuário:** {member.mention} agora pode falar novamente.',
                                  color=discord.Color.green())
            await ctx.send(embed=embed)
        else:
            await ctx.send('Usuário não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def tempban(ctx, server_id: int, user_id: int, minutes: int, *, reason='Não especificado'):
    """Bane um usuário por um tempo determinado usando o ID do usuário."""
    guild = bot.get_guild(server_id)
    if guild:
        member = guild.get_member(user_id)
        if member:
            await member.ban(reason=reason)
            embed = discord.Embed(title='🚨 Usuário Temporariamente Banido',
                                  description=f'**Usuário:** {member.mention}\n**Motivo:** {reason}\n**Duração:** {minutes} minutos',
                                  color=discord.Color.red())
            await ctx.send(embed=embed)
            await send_log(f'Usuário {member} foi banido temporariamente no servidor {guild.name}. Motivo: {reason}')
            
            await asyncio.sleep(minutes * 60)
            await guild.unban(member)
            embed = discord.Embed(title='🔓 Usuário Desbanido',
                                  description=f'**Usuário:** {member.mention} foi desbanido após {minutes} minutos.',
                                  color=discord.Color.green())
            await ctx.send(embed=embed)
        else:
            await ctx.send('Usuário não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def create_role(ctx, server_id: int, role_name: str, color: str = "FFFFFF"):
    """Cria um novo cargo no servidor especificado."""
    guild = bot.get_guild(server_id)
    if guild:
        color = discord.Color(int(color, 16))  # Converte a cor hexadecimal para um objeto Color
        role = await guild.create_role(name=role_name, color=color)
        embed = discord.Embed(title='🎉 Cargo Criado',
                              description=f'**Cargo:** {role.name}\n**Cor:** {color}',
                              color=color)
        await ctx.send(embed=embed)
        await send_log(f'Cargo {role.name} foi criado no servidor {guild.name}.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def delete_role(ctx, server_id: int, role_id: int):
    """Deleta um cargo do servidor especificado."""
    guild = bot.get_guild(server_id)
    if guild:
        role = guild.get_role(role_id)
        if role:
            await role.delete()
            embed = discord.Embed(title='🗑️ Cargo Deletado',
                                  description=f'**Cargo:** {role.name} foi deletado.',
                                  color=discord.Color.red())
            await ctx.send(embed=embed)
            await send_log(f'Cargo {role.name} foi deletado no servidor {guild.name}.')
        else:
            await ctx.send('Cargo não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def create_channel(ctx, server_id: int, channel_name: str, channel_type: str = "text"):
    """Cria um novo canal no servidor especificado."""
    guild = bot.get_guild(server_id)
    if guild:
        if channel_type.lower() == "text":
            channel = await guild.create_text_channel(channel_name)
        elif channel_type.lower() == "voice":
            channel = await guild.create_voice_channel(channel_name)
        else:
            await ctx.send('Tipo de canal inválido. Use "text" ou "voice".')
            return
        
        embed = discord.Embed(title='📢 Canal Criado',
                              description=f'**Canal:** {channel.name}\n**Tipo:** {channel_type.capitalize()}',
                              color=discord.Color.green())
        await ctx.send(embed=embed)
        await send_log(f'Canal {channel.name} foi criado no servidor {guild.name}.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def delete_channel(ctx, server_id: int, channel_id: int):
    """Deleta um canal do servidor especificado."""
    guild = bot.get_guild(server_id)
    if guild:
        channel = guild.get_channel(channel_id)
        if channel:
            await channel.delete()
            embed = discord.Embed(title='🗑️ Canal Deletado',
                                  description=f'**Canal:** {channel.name} foi deletado.',
                                  color=discord.Color.red())
            await ctx.send(embed=embed)
            await send_log(f'Canal {channel.name} foi deletado no servidor {guild.name}.')
        else:
            await ctx.send('Canal não encontrado no servidor.')
    else:
        await ctx.send('Servidor não encontrado.')

@bot.command()
@commands.check(is_owner)
async def logs(ctx):
    """Envia os logs de moderação."""
    owner = bot.get_user(OWNER_ID)
    if owner:
        embed = discord.Embed(title='📜 Logs de Moderação',
                              description=f'{json.dumps(moderation_data, indent=4)}',
                              color=discord.Color.purple())
        await owner.send(embed=embed)

@bot.command()
@commands.check(is_owner)
async def ajuda(ctx):
    """Envia a lista de comandos disponíveis."""
    owner = bot.get_user(OWNER_ID)
    if owner:
        embed = discord.Embed(title='📖 Lista de Comandos', color=discord.Color.blue())
        embed.add_field(name='🚨 k!ban [ID do servidor] @usuário [motivo]', value='Bane um usuário do servidor.', inline=False)
        embed.add_field(name='🔓 k!unban [ID do servidor] [ID do usuário]', value='Desbane um usuário do servidor.', inline=False)
        embed.add_field(name='👢 k!kick [ID do servidor] [ID do usuário] [motivo]', value='Expulsa um usuário do servidor.', inline=False)
        embed.add_field(name='🔇 k!mute [ID do servidor] [ID do usuário] ', value='Silencia um usuário por um tempo determinado.', inline=False)
        embed.add_field(name='🔊 k!unmute [ID do servidor] [ID do usuário]', value='Remove o silêncio de um usuário.', inline=False)
        embed.add_field(name='📜 k!logs', value='Envia os logs de moderação.', inline=False)
        embed.add_field(name='🔍 k!send_message [ID do canal] [mensagem]', value='Envia uma mensagem para um canal específico.', inline=False)
        embed.add_field(name='🔨 k!remote_ban [ID do servidor] [ID do usuário] [motivo]', value='Bane um usuário remotamente via DM.', inline=False)
        embed.add_field(name='📊 k!status', value='Mostra o status do bot.', inline=False)
        embed.add_field(name='🔍 k!check_ryan', value='Verifica canais que mencionam "Ryan".', inline=False)
        embed.add_field(name='👥 k!list_members', value='Lista todos os membros do servidor.', inline=False)
        embed.add_field(name='⏳ k!tempmute [ID do servidor] [ID do usuário] [minutos]', value='Silencia um usuário por um tempo determinado.', inline=False)
        embed.add_field(name='⏳ k!tempban [ID do servidor] [ID do usuário] [minutos] [motivo]', value='Bane um usuário por um tempo determinado.', inline=False)
        embed.add_field(name='🎉 k!create_role [ID do servidor] [nome do cargo] [cor]', value='Cria um novo cargo no servidor.', inline=False)
        embed.add_field(name='🗑️ k!delete_role [ID do servidor] [ID do cargo]', value='Deleta um cargo do servidor.', inline=False)
        embed.add_field(name='📢 k!create_channel [ID do servidor] [nome do canal] [tipo]', value='Cria um novo canal no servidor.', inline=False)
        embed.add_field(name='🗑️ k!delete_channel [ID do servidor] [ID do canal]', value='Deleta um canal do servidor.', inline=False)
        embed.add_field(name='📥 k!get_messages [ID do canal] [quantidade] [unidade de tempo] [ID do canal de destino]', value='Pega mensagens de um canal por um tempo e envia para um canal de destino ou DM.', inline=False)
        embed.add_field(name='🗑️ k!delete_messages [ID do canal] [quantidade]', value='Deleta mensagens de um canal.', inline=False)
        embed.add_field(name='🔒 k!lock [ID do canal]', value='Bloqueia um canal para que ninguém possa enviar mensagens.', inline=False)
        embed.add_field(name='🔓 k!unlock [ID do canal]', value='Desbloqueia um canal para que todos possam enviar mensagens.', inline=False)
        await owner.send(embed=embed)

@bot.command()
async def ticket(ctx):
    """Cria um ticket para suporte."""
    category = discord.utils.get(ctx.guild.categories, name='🎫 Tickets')
    if not category:
        category = await ctx.guild.create_category('🎫 Tickets')
    
    overwrites = {
        ctx.guild.default_role: discord.PermissionOverwrite(read_messages=False),
        ctx.author: discord.PermissionOverwrite(read_messages=True),
        ctx.guild.me: discord.PermissionOverwrite(read_messages=True)
    }
    
    ticket_channel = await ctx.guild.create_text_channel(
        name=f'ticket-{ctx.author.name}',
        category=category,
        overwrites=overwrites
    )
    
    embed = discord.Embed(
        title='✅ Ticket Criado',
        description=f'{ctx.author.mention}, os moderadores serão notificados. Use k!close para encerrar.',
        color=discord.Color.green()
    )
    await ticket_channel.send(embed=embed)
    await ctx.send(f"Seu ticket foi criado: {ticket_channel.mention}", delete_after=5)

@bot.command()
async def close(ctx):
    """Fecha o ticket atual."""
    if ctx.channel.category and ctx.channel.category.name == '🎫 Tickets':
        await ctx.channel.delete()
        await ctx.send("Ticket fechado.")

@bot.command()
@commands.check(is_owner)
async def send_message(ctx, channel_id: int, *, message: str):
    """Envia uma mensagem para um canal específico."""
    channel = bot.get_channel(channel_id)
    if channel:
        await channel.send(message)
        await ctx.send(f'Mensagem enviada para {channel.mention}.')
    else:
        await ctx.send('Canal não encontrado.')

@bot.command()
async def status(ctx):
    """Mostra o status do bot, incluindo servidores e membros."""
    embed = discord.Embed(title='📊 Status do Bot', color=discord.Color.blue())
    embed.add_field(name='🖥️ Servidores', value=f'{len(bot.guilds)} servidores', inline=False)
    total_members = sum(guild.member_count for guild in bot.guilds)
    embed.add_field(name='👥 Membros', value=f'{total_members} membros', inline=False)
    
    total_text_channels = sum(len(guild.text_channels) for guild in bot.guilds)
    total_voice_channels = sum(len(guild.voice_channels) for guild in bot.guilds)
    
    embed.add_field(name='📝 Canais de Texto', value=f'{total_text_channels} canais de texto', inline=False)
    embed.add_field(name='🔊 Canais de Voz', value=f'{total_voice_channels} canais de voz', inline=False)
    
    server_info = "\n".join([f"**{guild.name}** (ID: {guild.id}) - {guild.member_count} membros" for guild in bot.guilds])
    embed.add_field(name='🌐 Detalhes dos Servidores', value=server_info, inline=False)
    
    await ctx.send(embed=embed)

@bot.command()
async def check_ryan(ctx):
    """Verifica canais que mencionam o nome 'Ryan'."""
    channels_with_ryan = []
    for guild in bot.guilds:
        for channel in guild.text_channels:
            try:
                async for message in channel.history(limit=100):
                    if 'Ryan' in message.content:
                        channels_with_ryan.append(f"{channel.name} em {guild.name} (ID: {guild.id})")
                        break
            except discord.Forbidden:
                continue  # Ignora canais que o bot não tem acesso

    if channels_with_ryan:
        await ctx.send("Canais que mencionam 'Ryan': \n" + "\n".join(channels_with_ryan))
    else:
        await ctx.send("Nenhum canal encontrou mensagens com 'Ryan'.")

@bot.command()
@commands.check(is_owner)
async def get_messages(ctx, channel_id: int, time_amount: int, time_unit: str, target_channel_id: int = None):
    """Pega todas as mensagens enviadas em um chat pelo tempo que você selecionar e envia na DM ou em um canal que você pedir via ID."""
    channel = bot.get_channel(channel_id)
    if not channel or not isinstance(channel, discord.TextChannel):
        await ctx.send('Canal não encontrado ou não é um canal de texto.')
        return

    # Converte a unidade de tempo para o tempo de corte
    if time_unit.lower() in ['minuto', 'minutos']:
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(minutes=time_amount)
    elif time_unit.lower() in ['hora', 'horas']:
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(hours=time_amount)
    elif time_unit.lower() in ['dia', 'dias']:
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(days=time_amount)
    elif time_unit.lower() in ['mês', 'meses']:
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(days=time_amount * 30)  # Aproximado
    elif time_unit.lower() in ['ano', 'anos']:
        cutoff_time = datetime.datetime.utcnow() - datetime.timedelta(days=time_amount * 365)  # Aproximado
    else:
        await ctx.send('Unidade de tempo inválida. Use "minutos", "horas", "dias", "meses" ou "anos".')
        return

    messages = []

    async for message in channel.history(limit=None, after=cutoff_time):
        messages.append(f"{message.author.name}: {message.content}")

    if target_channel_id:
        target_channel = bot.get_channel(target_channel_id)
        if target_channel:
            await target_channel.send("\n".join(messages) if messages else "Nenhuma mensagem encontrada.")
            await ctx.send(f'Mensagens enviadas para {target_channel.mention}.')
        else:
            await ctx.send('Canal de destino não encontrado.')
    else:
        owner = bot.get_user(OWNER_ID)
        if owner:
            await owner.send("\n".join(messages) if messages else "Nenhuma mensagem encontrada.")
            await ctx.send('Mensagens enviadas para sua DM.')

@bot.command()
@commands.check(is_owner)
async def delete_messages(ctx, channel_id: int, amount: int):
    """Deleta um número específico de mensagens de um canal."""
    channel = bot.get_channel(channel_id)
    if not channel or not isinstance(channel, discord.TextChannel):
        await ctx.send('Canal não encontrado ou não é um canal de texto.')
        return

    deleted = await channel.purge(limit=amount)
    await ctx.send(f'Deletadas {len(deleted)} mensagens do canal {channel.mention}.')

@bot.command()
async def list_members(ctx):
    """Lista todos os membros do servidor."""
    members = ctx.guild.members
    member_list = "\n".join([f"{member.name}#{member.discriminator}" for member in members])
    embed = discord.Embed(title='👥 Lista de Membros', description=member_list, color=discord.Color.blue())
    await ctx.send(embed=embed)

@tasks.loop(hours=24)
async def daily_status():
    """Envia um status diário ao dono do bot."""
    owner = bot.get_user(OWNER_ID)
    if owner:
        embed = discord.Embed(title='📊 Status Diário', color=discord.Color.blue())
        embed.add_field(name='🖥️ Servidores', value=f'{len(bot.guilds)} servidores', inline=False)
        embed.add_field(name='👥 Usuários', value=f'{sum(g.member_count for g in bot.guilds)} membros', inline=False)
        await owner.send(embed=embed)

@bot.command()
@commands.check(is_owner)
async def send_daily_status(ctx):
    """Comando para enviar manualmente o status diário."""
    await daily_status()

@bot.event
async def on_message(message):
    """Processa mensagens e ignora bots."""
    if message.author.bot:
        return
    await bot.process_commands(message)

# Inicia o bot
load_data()

bot.run('TOKEN_DO_BOT')