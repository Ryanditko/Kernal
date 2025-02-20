
import unittest
from unittest.mock import AsyncMock, patch
import discord
from discord.ext import commands

class TestKaliBot(unittest.TestCase):
    def setUp(self):
        self.bot = commands.Bot(command_prefix='!', intents=discord.Intents.default())
        self.ctx = AsyncMock()

    @patch('app.record.gravar')
    async def test_gravar(self, mock_gravar):
        await self.bot.get_command('gravar')(self.ctx)
        mock_gravar.assert_called_once_with(self.ctx)

    @patch('app.record.parar_gravacao')
    async def test_parar_gravacao(self, mock_parar):
        await self.bot.get_command('parar_gravacao')(self.ctx)
        mock_parar.assert_called_once_with(self.ctx)

    @patch('app.record.status')
    async def test_status(self, mock_status):
        await self.bot.get_command('status')(self.ctx)
        mock_status.assert_called_once_with(self.ctx)

    @patch('app.record.pegar_gravacao')
    async def test_pegar_gravacao(self, mock_pegar):
        await self.bot.get_command('pegar_gravacao')(self.ctx)
        mock_pegar.assert_called_once_with(self.ctx)

    @patch('app.record.desconectar')
    async def test_desconectar(self, mock_desconectar):
        await self.bot.get_command('desconectar')(self.ctx)
        mock_desconectar.assert_called_once_with(self.ctx)

    @patch('app.kali.check_ryan')
    async def test_check_ryan(self, mock_check_ryan):
        await self.bot.get_command('check_ryan')(self.ctx)
        mock_check_ryan.assert_called_once_with(self.ctx)

    @patch('app.kali.chatgpt')
    async def test_chatgpt(self, mock_chatgpt):
        prompt = "Test prompt"
        await self.bot.get_command('chatgpt')(self.ctx, prompt=prompt)
        mock_chatgpt.assert_called_once_with(self.ctx, prompt=prompt)

    @patch('app.kali.send_log')
    async def test_send_log(self, mock_send_log):
        await self.bot.get_command('ban')(self.ctx, 123456789, discord.Object(id=987654321), reason='Test reason')
        mock_send_log.assert_called_once_with('Usuário <@987654321> foi banido no servidor 123456789. Motivo: Test reason')

if __name__ == '__main__':
    unittest.main()

#+
    if __name__ == '__main__':#+
        unittest.main()#+

# Comando para rodar os testes: python -m unittest discover -s app -p "test_*.py"
