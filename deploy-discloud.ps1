# Kernal Bot - Deploy Discloud Script
# PowerShell version

Write-Host "🚀 PREPARANDO KERNAL BOT PARA DEPLOY NA DISCLOUD" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan

Write-Host ""
Write-Host "📋 Verificando arquivos necessários..." -ForegroundColor Yellow

# Verificar se o projeto foi compilado
if (-not (Test-Path "build")) {
    Write-Host "❌ Pasta build não encontrada! Compilando projeto..." -ForegroundColor Red
    npm run build
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro na compilação! Verifique o código." -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "✅ Pasta build encontrada" -ForegroundColor Green
}

# Verificar se node_modules existe
if (-not (Test-Path "node_modules")) {
    Write-Host "❌ node_modules não encontrado! Instalando dependências..." -ForegroundColor Red
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Erro na instalação das dependências!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    }
} else {
    Write-Host "✅ node_modules encontrado" -ForegroundColor Green
}

# Verificar arquivos essenciais
$requiredFiles = @("package.json", "discloud.config")
foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        Write-Host "❌ $file não encontrado!" -ForegroundColor Red
        Read-Host "Pressione Enter para sair"
        exit 1
    } else {
        Write-Host "✅ $file encontrado" -ForegroundColor Green
    }
}

# Verificar .env
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  Arquivo .env não encontrado!" -ForegroundColor Yellow
    Write-Host "⚠️  Certifique-se de criar o arquivo .env com suas variáveis antes do deploy" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Exemplo de .env:" -ForegroundColor Cyan
    Write-Host "DISCORD_TOKEN=seu_token_aqui" -ForegroundColor Gray
    Write-Host "OPENAI_API_KEY=sua_chave_openai_aqui" -ForegroundColor Gray
    Write-Host "OWNER_ID=819954175173328906" -ForegroundColor Gray
    Write-Host ""
    $continue = Read-Host "Continuar mesmo assim? (s/n)"
    if ($continue -notlike "s*") { exit 1 }
} else {
    Write-Host "✅ Arquivo .env encontrado" -ForegroundColor Green
}

Write-Host ""
Write-Host "📦 Criando pasta de deploy..." -ForegroundColor Yellow

# Remover pasta temporária se existir
if (Test-Path "deploy-temp") {
    Remove-Item "deploy-temp" -Recurse -Force
}
New-Item -ItemType Directory -Path "deploy-temp" | Out-Null

Write-Host ""
Write-Host "📁 Copiando arquivos necessários..." -ForegroundColor Yellow

# Copiar arquivos essenciais
$filesToCopy = @(
    @{Source="build"; Destination="deploy-temp\build"; Type="Directory"},
    @{Source="node_modules"; Destination="deploy-temp\node_modules"; Type="Directory"},
    @{Source="package.json"; Destination="deploy-temp\package.json"; Type="File"},
    @{Source="discloud.config"; Destination="deploy-temp\discloud.config"; Type="File"}
)

# Copiar arquivos opcionais
$optionalFiles = @(
    @{Source="package-lock.json"; Destination="deploy-temp\package-lock.json"; Type="File"},
    @{Source=".env"; Destination="deploy-temp\.env"; Type="File"},
    @{Source="logs"; Destination="deploy-temp\logs"; Type="Directory"},
    @{Source="infractions"; Destination="deploy-temp\infractions"; Type="Directory"},
    @{Source="recordings"; Destination="deploy-temp\recordings"; Type="Directory"}
)

foreach ($item in $filesToCopy) {
    if (Test-Path $item.Source) {
        if ($item.Type -eq "Directory") {
            Copy-Item $item.Source $item.Destination -Recurse -Force
        } else {
            Copy-Item $item.Source $item.Destination -Force
        }
        Write-Host "✅ Copiado: $($item.Source)" -ForegroundColor Green
    } else {
        Write-Host "❌ Não encontrado: $($item.Source)" -ForegroundColor Red
    }
}

foreach ($item in $optionalFiles) {
    if (Test-Path $item.Source) {
        if ($item.Type -eq "Directory") {
            Copy-Item $item.Source $item.Destination -Recurse -Force
        } else {
            Copy-Item $item.Source $item.Destination -Force
        }
        Write-Host "✅ Copiado (opcional): $($item.Source)" -ForegroundColor Cyan
    }
}

Write-Host ""
Write-Host "📊 Verificando tamanho dos arquivos..." -ForegroundColor Yellow
$size = (Get-ChildItem "deploy-temp" -Recurse | Measure-Object -Property Length -Sum).Sum
$sizeMB = [math]::Round($size / 1MB, 2)
Write-Host "Tamanho total: $sizeMB MB" -ForegroundColor Cyan

Write-Host ""
Write-Host "✅ PREPARAÇÃO CONCLUÍDA!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Próximos passos:" -ForegroundColor Cyan
Write-Host "1. Vá para https://discloud.app" -ForegroundColor White
Write-Host "2. Faça login na sua conta" -ForegroundColor White
Write-Host "3. Vá para Dashboard → Upload App" -ForegroundColor White
Write-Host "4. Crie um ZIP da pasta 'deploy-temp' (todos os arquivos dentro dela)" -ForegroundColor White
Write-Host "5. Faça upload do ZIP na Discloud" -ForegroundColor White
Write-Host ""
Write-Host "📁 Arquivos preparados na pasta: deploy-temp\" -ForegroundColor Yellow
Write-Host ""
Write-Host "🎯 IMPORTANTE:" -ForegroundColor Red
Write-Host "- Certifique-se que seu token Discord está no arquivo .env" -ForegroundColor Yellow
Write-Host "- Verifique se a API Key da OpenAI está configurada" -ForegroundColor Yellow
Write-Host "- O bot será restrito ao ID: 819954175173328906" -ForegroundColor Yellow
Write-Host ""

# Opção para criar ZIP automaticamente se 7-Zip estiver instalado
if (Get-Command "7z" -ErrorAction SilentlyContinue) {
    $createZip = Read-Host "Deseja criar o arquivo ZIP automaticamente? (s/n)"
    if ($createZip -like "s*") {
        Write-Host "📦 Criando arquivo ZIP..." -ForegroundColor Yellow
        & 7z a -tzip "kernal-bot-deploy.zip" ".\deploy-temp\*"
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✅ Arquivo ZIP criado: kernal-bot-deploy.zip" -ForegroundColor Green
        } else {
            Write-Host "❌ Erro ao criar ZIP" -ForegroundColor Red
        }
    }
}

Read-Host "Pressione Enter para sair"
