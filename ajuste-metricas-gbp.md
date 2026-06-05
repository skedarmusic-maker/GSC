# Ajuste de Métricas e Visualizações do Google Business Profile (GBP)

## 📋 Descrição
O objetivo desta tarefa é corrigir a exibição de visualizações do perfil do Google Business Profile (que estavam vindo como zero devido a erro de parsing no JSON aninhado retornado pelo Google API) e sincronizar o total de interações com o valor real exibido no painel do Google (adicionando as interações de Mensagens e Agendamentos).

## 🛠️ Arquivos Modificados
- [src/lib/business.ts](file:///c:/Users/Skedar/Desktop/IA%20-%20SITES/GSC/src/lib/business.ts):
  - Inclusão das métricas `BUSINESS_CONVERSATIONS` (Mensagens) e `BUSINESS_BOOKINGS` (Agendamentos) no array de busca `baseMetrics`.
  - Correção do parser da resposta de `fetchMultiDailyMetricsTimeSeries` na linha 235 para ler corretamente o array aninhado `dailyMetricTimeSeries` sob `multiDailyMetricTimeSeries`.
  - Ajuste de índices na desestruturação das promessas paralelas resolvidas por `Promise.all`.
- [src/components/tabs/TabGBPDashboard.tsx](file:///c:/Users/Skedar/Desktop/IA%20-%20SITES/GSC/src/components/tabs/TabGBPDashboard.tsx):
  - Inclusão de Mensagens e Agendamentos no cálculo do `totalInteractions` e no texto informativo.
  - Adicionados cards para Mensagens e Agendamentos.
  - Remoção da cor roxa (`#a855f7`) do site, substituindo-a por ciano (`#06b6d4`) em conformidade com o **Purple Ban**.
  - Inclusão das novas métricas nas legendas do gráfico, nas definições de gradientes (`Defs`) e nas áreas de renderização.
- [src/components/tabs/TabGBPReport.tsx](file:///c:/Users/Skedar/Desktop/IA%20-%20SITES/GSC/src/components/tabs/TabGBPReport.tsx):
  - Adição de Mensagens e Agendamentos no cálculo total e na tabela de visualização/exportação do PDF.

## 🎯 Lista de Tarefas
- [x] Identificar e corrigir o bug do JSON aninhado na API de impressões do Google (`fetchMultiDailyMetricsTimeSeries`).
- [x] Incluir novas métricas `BUSINESS_CONVERSATIONS` e `BUSINESS_BOOKINGS` na busca do backend.
- [x] Atualizar a soma de interações no painel inicial e cards de métricas.
- [x] Remover elementos na cor roxa do dashboard e aplicar ciano para o websiteClicks (Purple Ban).
- [x] Atualizar a tabela de relatórios e exportação PDF.
- [x] Validar a compilação com linter e TypeScript compiler (`npm run lint` e `npx tsc --noEmit`).

## ✅ Critérios de Aceitação
- Visualizações não devem vir zeradas quando retornadas pela API do Google.
- O total de interações deve somar Chamadas + Rotas + Cliques no Site + Mensagens + Reservas/Agendamentos.
- O PDF exportado e a visualização A4 na tela devem mostrar a tabela de desempenho completa com os novos dados.
- Nenhuma cor roxa/violeta inserida na interface de interações.
