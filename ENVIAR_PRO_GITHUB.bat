@echo off
echo 🚀 Iniciando Sincronizacao com GitHub...
echo.

echo 📥 Puxando mudancas remotas (Rebase)...
git pull origin main --rebase

echo.
echo 💾 Adicionando arquivos...
git add .

echo.
echo 📝 Criando commit...
git commit -m "feat: melhoria na precisao de prospeccao GBP, historico Supabase e relatorios PDF"

echo.
echo 📤 Enviando para o GitHub...
git push origin main

echo.
echo ✅ TUDO PRONTO! Seu codigo esta no ar.
pause
