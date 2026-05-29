# Agency Personalization Settings

## Goal
Adicionar novos campos (instagram, site, telefone, endereço) na personalização da agência e renderizá-los no cabeçalho do PDF impresso na aba de prospecção.

## Tasks
- [x] Task 1: Adicionar os novos campos no formulário de `TabSettings.tsx` (state, inputs, ícones e envio para `updateUser`). → Verify: O formulário exibe os campos e atualiza o estado corretamente.
- [x] Task 2: Modificar a lógica de salvar (`handleSave`) em `TabSettings.tsx` para incluir os novos metadados: `agency_instagram`, `agency_website`, `agency_phone`, `agency_address`. → Verify: Salvar o formulário e recarregar exibe os dados salvos persistidos.
- [x] Task 3: Obter e renderizar os novos metadados da sessão em `TabProspecting.tsx` no cabeçalho da impressão em PDF (`print:flex`). → Verify: Clicar em "PDF Completo" ou "PDF Pré-Venda (Blur)" exibe o cabeçalho impresso com o logotipo, nome, Instagram com ícone, site, telefone e endereço organizados de forma premium.
- [x] Task 4: Validar e corrigir eventuais erros de TypeScript e lints. → Verify: Rodar `npm run lint` ou `npx tsc --noEmit` sem erros.

## Done When
- [x] O usuário consegue preencher e salvar Instagram, site, telefone e endereço na aba de personalização da agência.
- [x] O cabeçalho do PDF gerado no radar de prospecção é impresso no topo com logotipo à esquerda e dados de contato à direita com design de alta qualidade (e sem campos vazios).
