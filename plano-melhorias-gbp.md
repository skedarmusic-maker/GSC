# Plano de Melhorias - FocusLocal (Integração GBP Check)

Este plano documenta a análise de viabilidade, a necessidade real de cada funcionalidade mapeada no concorrente GBP Check e o roadmap de implementação estruturado para o FocusLocal (GSC).

---

## 📋 Análise Crítica de Viabilidade e Necessidade

Para evitar inflar o sistema com recursos desnecessários que aumentam a complexidade e o custo de manutenção, classificamos os recursos analisados do concorrente sob a ótica de **Impacto Comercial vs. Custo Técnico**.

### 1. Funcionalidades de Alta Prioridade (Implementar)

*   **Evolução da Análise (Histórico de Auditorias)**:
    *   *Real Necessidade*: **Altíssima**. Mostra graficamente o progresso do trabalho de SEO Local feito pela agência, retendo o cliente corporativo.
    *   *Viabilidade*: **Altíssima**. (Estrutura e banco de dados pré-montados na última sessão, em fase de validação).
*   **Cards de Avaliação & QR Code Customizáveis**:
    *   *Real Necessidade*: **Alta**. É um recurso físico (tangível) que a agência entrega para o lojista imprimir e colocar no balcão. Excelente para gerar engajamento imediato.
    *   *Viabilidade*: **Altíssima (Client-Side)**. Implementado 100% no navegador usando `html-to-image` e `qrcode.react`. Custo de processamento de servidor: **Zero**.
*   **Prospecção com Ordenação, Filtros Rápidos & Visualização em Mapa**:
    *   *Real Necessidade*: **Alta**. O FocusLocal já busca os leads, mas a lista estática dificulta a priorização. Filtros em memória (ex: ordenar por menor nota, menor volume de avaliações, se tem ou não telefone) e plotagem rápida dos leads no mapa tornam a ferramenta de vendas imbatível.
    *   *Viabilidade*: **Alta**. Modificações apenas na interface client-side do componente de prospecção.
*   **Simulador de Notas e Avaliações (Calculadora)**:
    *   *Real Necessidade*: **Alta**. Demonstra de forma simples a necessidade do serviço (ex: "quantos reviews de 5 estrelas eu preciso para compensar uma nota ruim?").
    *   *Viabilidade*: **Altíssima**. Lógica matemática simples desenvolvida puramente no frontend.

### 2. Funcionalidades de Média Prioridade (Opcional/Futuro)

*   **Pré-Análise Pública (Health Check para Prospectos)**:
    *   *Real Necessidade*: **Média**. Útil para enviar links de diagnóstico gratuitos para potenciais clientes.
    *   *Viabilidade*: **Média**. Requer expor uma versão simplificada e segura da API de auditoria sem exigência de autenticação do cliente.
*   **Nuvem de Palavras & Análise de Sentimento (Reviews)**:
    *   *Real Necessidade*: **Média**. Visualmente impressionante para relatórios de apresentação, mas consome tokens de IA adicionais e processamento de dados textuais.
    *   *Viabilidade*: **Média**.

### 3. Funcionalidades Descartadas (Baixa Prioridade / Não Recomendado Agora)

*   **Extensão do Chrome para Scrape**:
    *   *Justificativa*: **Altíssimo custo de manutenção**. O Google altera o layout do Maps constantemente, o que quebra scrapers baseados em extensão. Além disso, exige aprovação na Chrome Web Store e instalação manual pelo usuário. É melhor depender de extração centralizada via APIs de backend ou Outscraper.
*   **Proteção e Monitoramento Anti-Sequestro de Perfil**:
    *   *Justificativa*: **Complexidade excessiva**. Exige tarefas agendadas em segundo plano (cron jobs) monitorando alterações de perfil constantemente no Google GBP, o que pode esgotar limites de cota de API rapidamente para benefício restrito a poucos clientes.

---

## 🛠️ Detalhes do Projeto
*   **Tipo de Projeto**: WEB (Next.js App Router / TypeScript)
*   **Banco de Dados**: Supabase (PostgreSQL)

---

## 🚀 Roteiro de Tarefas (Roadmap)

### Fase 1: Validação do Histórico de Saúde (Evolução)
*   **Task 1**: Validar a tabela `gbp_audit_history` no Supabase e a persistência na rota `/api/audit`.
    *   *Agente*: `backend-specialist`
    *   *INPUT*: Rota `/api/audit` modificada e script SQL de criação de tabela.
    *   *OUTPUT*: Script SQL executado no console e verificação de gravação de dados ao auditar.
    *   *VERIFY*: Executar uma auditoria de teste e conferir no banco se o registro foi salvo.
*   **Task 2**: Testar e ajustar o componente `TabGBPEvolution.tsx` integrado no painel.
    *   *Agente*: `frontend-specialist`
    *   *INPUT*: Componente [TabGBPEvolution.tsx](file:///c:/Users/Skedar/Desktop/IA%20-%20SITES/GSC/src/components/tabs/TabGBPEvolution.tsx).
    *   *OUTPUT*: Componente exibindo os gráficos de linha/barra do histórico sem falhas de tipo ou re-renderizações infinitas.
    *   *VERIFY*: Selecionar um cliente com histórico de auditorias e validar a renderização correta do gráfico na aba.

### Fase 2: Implementação dos Cards de Avaliação & Simulador
*   **Task 3**: Criar a interface reativa dos Cards de Avaliação (QR Code).
    *   *Agente*: `frontend-specialist`
    *   *INPUT*: Criação da aba `TabGBPCards.tsx`.
    *   *OUTPUT*: Tela com opções de customização de marca (logo, cores de fundo, nome da empresa) e renderização instantânea do QR Code apontando para o link de review.
    *   *VERIFY*: Scanear o QR Code gerado na tela com o celular e validar se abre a página correta do Google.
*   **Task 4**: Criar a interface do Simulador de Notas (Calculadora).
    *   *Agente*: `frontend-specialist`
    *   *INPUT*: Adição de modal ou seção matemática no painel de reviews.
    *   *OUTPUT*: Inputs para "Nota Atual", "Volume Atual" e "Nota Desejada", calculando instantaneamente o número de reviews 5 estrelas necessários.
    *   *VERIFY*: Testar uma simulação real (ex: nota 4.0 com 10 avaliações, querendo chegar a 4.5. Resposta: precisa de 10 avaliações de 5.0).

### Fase 3: Polimento da Prospecção (Filtros & Mapa)
*   **Task 5**: Adicionar ordenação rápida e filtros client-side em `TabProspecting.tsx`.
    *   *Agente*: `frontend-specialist`
    *   *INPUT*: Componente [TabProspecting.tsx](file:///c:/Users/Skedar/Desktop/IA%20-%20SITES/GSC/src/components/tabs/TabProspecting.tsx).
    *   *OUTPUT*: Controles de filtros rápidos (ex: "Sem site", "Nota abaixo de 4.0") sem necessidade de refazer a busca na API externa.
    *   *VERIFY*: Filtrar uma listagem de leads de teste e conferir a reatividade da tabela/cards.

---

## 🏁 Phase X: Verificação Final
*   [ ] Executar `npm run build` para garantir conformidade de tipos e ausência de quebras no build.
*   [ ] Validar que nenhum componente implementado utiliza paletas puras roxas/violetas (cumprindo a regra do FocusLocal).
