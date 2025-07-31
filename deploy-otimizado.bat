@echo off
echo 🚀 CRIANDO DEPLOY OTIMIZADO PARA DISCLOUD (Limite 100MB)
echo =========================================================

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
echo 📦 Criando pasta de deploy otimizada...

REM Criar pasta temporaria para deploy
if exist "deploy-temp\" rmdir /s /q "deploy-temp\"
mkdir "deploy-temp"

echo.
echo 📁 Copiando apenas arquivos essenciais...

REM Copiar arquivos obrigatorios
xcopy "build\" "deploy-temp\build\" /e /i /h /y > nul
copy "package.json" "deploy-temp\" > nul
copy "package-lock.json" "deploy-temp\" > nul 2>nul
copy "discloud.config" "deploy-temp\" > nul
copy ".env" "deploy-temp\" > nul 2>nul

REM Criar diretorios vazios para funcionalidades
mkdir "deploy-temp\logs" > nul 2>nul
mkdir "deploy-temp\infractions" > nul 2>nul
mkdir "deploy-temp\recordings" > nul 2>nul

echo.
echo 🔄 Instalando apenas dependencias de producao...
cd deploy-temp
call npm install --production --no-dev --no-optional > nul 2>nul
cd ..

echo.
echo 📊 Verificando tamanho final...
for /f %%A in ('dir "deploy-temp" /s /-c ^| find "bytes"') do set size=%%A
echo Tamanho total: %size% bytes

REM Calcular MB aproximado
set /a sizeMB=%size% / 1048576
echo Tamanho aproximado: %sizeMB% MB

if %sizeMB% GTR 95 (
    echo ⚠️  AVISO: Arquivo ainda pode estar grande para Discloud
    echo ⚠️  Limite recomendado: 95MB (100MB max)
)

echo.
echo 📦 Criando arquivo ZIP otimizado...
powershell -command "Compress-Archive -Path 'deploy-temp\*' -DestinationPath 'kernal-bot-deploy.zip' -Force"

if exist "kernal-bot-deploy.zip" (
    for %%A in ("kernal-bot-deploy.zip") do set zipsize=%%~zA
    set /a zipMB=!zipsize! / 1048576
    echo ✅ ZIP criado: kernal-bot-deploy.zip
    echo 📊 Tamanho do ZIP: !zipMB! MB
    
    if !zipMB! LEQ 100 (
        echo ✅ SUCESSO: Arquivo dentro do limite de 100MB!
    ) else (
        echo ❌ ERRO: Arquivo ainda muito grande! Tamanho: !zipMB! MB
    )
) else (
    echo ❌ Erro ao criar ZIP!
)

pause
