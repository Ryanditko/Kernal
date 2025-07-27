@echo off
echo 🚀 PREPARANDO KERNAL BOT PARA DEPLOY NA DISCLOUD
echo ================================================

echo.
echo 📋 Verificando arquivos necessarios...

REM Verificar se o projeto foi compilado
if not exist "build\" (
    echo ❌ Pasta build nao encontrada! Compilando projeto...
    call npm run build
    if errorlevel 1 (
        echo ❌ Erro na compilacao! Verifique o codigo.
        pause
        exit /b 1
    )
) else (
    echo ✅ Pasta build encontrada
)

REM Verificar se node_modules existe
if not exist "node_modules\" (
    echo ❌ node_modules nao encontrado! Instalando dependencias...
    call npm install
    if errorlevel 1 (
        echo ❌ Erro na instalacao das dependencias!
        pause
        exit /b 1
    )
) else (
    echo ✅ node_modules encontrado
)

REM Verificar arquivos essenciais
if not exist "package.json" (
    echo ❌ package.json nao encontrado!
    pause
    exit /b 1
) else (
    echo ✅ package.json encontrado
)

if not exist "discloud.config" (
    echo ❌ discloud.config nao encontrado!
    pause
    exit /b 1
) else (
    echo ✅ discloud.config encontrado
)

if not exist ".env" (
    echo ⚠️  Arquivo .env nao encontrado!
    echo ⚠️  Certifique-se de criar o arquivo .env com suas variaveis antes do deploy
    echo.
    echo Exemplo de .env:
    echo DISCORD_TOKEN=seu_token_aqui
    echo OPENAI_API_KEY=sua_chave_openai_aqui  
    echo OWNER_ID=819954175173328906
    echo.
    set /p continue="Continuar mesmo assim? (s/n): "
    if /i not "%continue%"=="s" exit /b 1
) else (
    echo ✅ Arquivo .env encontrado
)

echo.
echo 📦 Criando pasta de deploy...

REM Criar pasta temporaria para deploy
if exist "deploy-temp\" rmdir /s /q "deploy-temp\"
mkdir "deploy-temp"

echo.
echo 📁 Copiando arquivos necessarios...

REM Copiar arquivos essenciais
xcopy "build\" "deploy-temp\build\" /e /i /h /y > nul
xcopy "node_modules\" "deploy-temp\node_modules\" /e /i /h /y > nul
copy "package.json" "deploy-temp\" > nul
copy "package-lock.json" "deploy-temp\" > nul 2>nul
copy "discloud.config" "deploy-temp\" > nul
copy ".env" "deploy-temp\" > nul 2>nul

REM Copiar pastas opcionais se existirem
if exist "logs\" xcopy "logs\" "deploy-temp\logs\" /e /i /h /y > nul
if exist "infractions\" xcopy "infractions\" "deploy-temp\infractions\" /e /i /h /y > nul
if exist "recordings\" xcopy "recordings\" "deploy-temp\recordings\" /e /i /h /y > nul

echo ✅ Arquivos copiados com sucesso!

echo.
echo 📊 Verificando tamanho dos arquivos...
for /f %%A in ('dir "deploy-temp" /s /-c ^| find "bytes"') do set size=%%A
echo Tamanho total: %size% bytes

echo.
echo ✅ PREPARACAO CONCLUIDA!
echo.
echo 📋 Proximos passos:
echo 1. Vá para https://discloud.app
echo 2. Faca login na sua conta
echo 3. Va para Dashboard → Upload App
echo 4. Crie um ZIP da pasta 'deploy-temp' (todos os arquivos dentro dela)
echo 5. Faca upload do ZIP na Discloud
echo.
echo 📁 Arquivos preparados na pasta: deploy-temp\
echo.
echo 🎯 IMPORTANTE:
echo - Certifique-se que seu token Discord esta no arquivo .env
echo - Verifique se a API Key da OpenAI esta configurada
echo - O bot sera restrito ao ID: 819954175173328906
echo.

pause
