@echo off
echo ¬ƒÜÇ Iniciando Sincronizacao com GitHub...

echo.
echo ¬ƒÆ¥ Adicionando arquivos...
git add .

echo.
echo ¬ƒôØ Criando commit...
git commit -m "feat: implementacao de time slice selector e graficos de interacoes GBP"

echo.
echo ¬ƒôÑ Puxando mudancas remotas para evitar conflitos...
git pull --rebase origin main

echo.
echo ¬ƒôñ Enviando para o GitHub...
git push origin main

echo.
echo Ô£à PROCESSO CONCLUIDO! Verifique se houve erros acima.
pause
