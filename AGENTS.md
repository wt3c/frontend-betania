# Betania Frontend — Instruções do Projeto

> Fonte canônica das instruções deste repositório para os agentes. O Codex lê este
> arquivo nativamente; o `CLAUDE.md` o importa por `@AGENTS.md`. Orientações
> compartilhadas ficam aqui; particularidades de cada ferramenta ficam separadas.

## Fonte dos requisitos e atualização das regras

`../betania-backend/docs/prompt.md` orienta o que deve se tornar realidade nos dois
projetos. Atualizar código e regras locais quando um pedido substituir uma regra antiga;
não usar instruções locais desatualizadas como impedimento. Seguir a
[regra compartilhada de aplicação do prompt](../betania-backend/AGENTS.md#fonte-dos-requisitos-e-atualização-das-regras).
A autonomia do item 2.3 dispensa aprovação do plano e confirmações locais redundantes.
Permissões efetivas das ferramentas continuam valendo.

## Leitura prévia

1. Ler as instruções globais do agente e este arquivo.
2. Consultar `../betania-backend/docs/prompt.md`, fonte dos requisitos atuais e dos
   checkboxes das tarefas nos dois projetos; conferir o pedido antes de usar planos antigos.
3. Consultar `../betania-backend/tasks/todo.md` e somente o plano ou as lições
   pertinentes à tarefa. Os planos detalhados ficam em `../betania-backend/docs/superpowers/`.
4. Conferir o estado Git e os HTMLs envolvidos antes de editar. O `README.md`
   contém descrições antigas; confirmar a estrutura real nos arquivos atuais.

## Contexto e estado atual

Frontend da plataforma Betania Terapeuta, da terapeuta Maria Betânia. Este
repositório se chama `frontend-betania`; referências antigas usam `landpage-betania`.
É um projeto pessoal, sem as convenções corporativas do MPRJ.

O frontend existente é uma landing page estática em HTML, CSS e JavaScript vanilla,
com páginas de anamnese e política de privacidade. Usa Google Fonts externo.
A aplicação Vue em `/app/` implementa login por senha, primeiro acesso, convite de clientes e agenda (item 4).
Há manifesto, lockfile, Vite, Vitest/Vue Test Utils e Playwright integrado ao backend. A stack obrigatória para a evolução é
Vue.js, conforme a tarefa 2.4 e a seção abaixo; as ferramentas já estão instaladas para a aplicação em `/app/`.

O backend irmão `../betania-backend/` usa Django + DRF e implementa login por
e-mail/senha com JWT próprio; a rota Google está desativada. Agendamentos, histórico
e novos CRUDs de sessões são objetivos ainda a implementar, descritos em
`../betania-backend/docs/prompt.md`.

## Stack obrigatória e TDD

- Usar **Vue.js 3**, TypeScript e Vite, com Composition API e componentes
  Single-File Components (`.vue`). Preservar e reaproveitar o conteúdo existente
  conforme o escopo da tarefa de migração.
- Usar Vue Router para navegação e Pinia quando houver estado compartilhado.
  Adicionar outros complementos conforme a necessidade da funcionalidade.
- Usar Vitest e Vue Test Utils para testes unitários e de componentes; Playwright
  para testes de ponta a ponta dos fluxos integrados à API.
- **Testes de telas no navegador são obrigatórios, além dos testes de código**, conforme
  a tarefa 2.5 do prompt. Exercitar os fluxos afetados e conferir desktop e celular;
  componentes, lint e build não substituem a validação no browser.
- **TDD é obrigatório no frontend e no backend:** escrever e executar o teste
  antes da implementação, observar a falha pelo motivo esperado, implementar
  o mínimo e refatorar com os testes passando. Correções exigem teste de regressão.
- Testar comportamento observável dos componentes e validar os fluxos integrados
  com a API, sem depender apenas de mocks. No backend, seguir pytest, PostgreSQL
  de teste isolado e as regras de segurança do repositório irmão.
- Seguir a [regra compartilhada de stack e TDD](../betania-backend/AGENTS.md#stack-do-frontend-e-tdd-nos-dois-projetos).
  As ferramentas estão configuradas no manifesto da raiz e os testes em `app/tests/` e `e2e/`.

## Estrutura a conferir antes de editar

- `app/src/`: aplicação Vue com login, primeiro acesso, convite administrativo e página inicial.
- `app/tests/`: testes de componentes; `e2e/`: testes Playwright integrados à API real.
- `package.json`, `vite.config.ts` e `playwright.config.ts`: ferramentas e execução dos testes.
- `index.html`: landing page preservada, com CSS e JavaScript inline.
- `anamnese-trg.html`: formulário de anamnese, também com CSS e JavaScript inline.
- `politica-de-privacidade.html`: página da política de privacidade.
- `styles.css` e `script.js`: arquivos separados existentes. Conferir as referências
  nos HTMLs antes de modificá-los; sua presença não comprova que sejam carregados.

## Trabalho entre os projetos

- O trabalho pode ser coordenado a partir deste repositório ou do backend.
- Antes de editar o backend, ler `../betania-backend/AGENTS.md` e conferir seu estado Git.
  Aplicar as regras de teste, banco, autenticação e infraestrutura daquele projeto.
- Manter os planos compartilhados no backend e referenciá-los por caminho relativo.
  Atualizar as instruções locais de cada repositório quando seu estado implementado mudar.
- Reaproveitar os elementos existentes conforme o plano aprovado; distinguir sempre
  requisitos futuros de funcionalidades já disponíveis.

### Planejamento e autonomia

Apresentar o plano e seguir para a execução sem pedir confirmação após o
planejamento, conforme a tarefa 2.3 de `../betania-backend/docs/prompt.md`.
Resolver as escolhas técnicas autonomamente e perguntar somente sobre decisões
necessárias que o agente não possa ou não consiga resolver sozinho. Seguir a
[regra compartilhada de planejamento e autonomia](../betania-backend/AGENTS.md#planejamento-e-autonomia),
preservando as autorizações específicas de segurança e permissões das ferramentas.

### Conduta de arquiteto e comunicação

Aplicar o item 2.6 do prompt conforme a
[regra compartilhada de conduta](../betania-backend/AGENTS.md#conduta-de-arquiteto-e-comunicação).
Ela vale para Claude Code e Codex: postura crítica, objetiva e didática, proporcional
à tarefa e com as mesmas regras de autonomia e segurança.

### Pedidos de criação de telas

Todo pedido para criar uma tela inclui implementá-la neste frontend e criar ou
adaptar os endpoints necessários em `../betania-backend/`, reaproveitando os
existentes e validando a integração. Seguir a
[regra compartilhada de criação de telas](../betania-backend/AGENTS.md#pedidos-de-criação-de-telas),
inclusive quando o pedido partir deste repositório.

### Divisão de tarefas entre Claude Code e Codex

Seguir a [regra compartilhada de divisão de tarefas](../betania-backend/AGENTS.md#divisão-de-tarefas-entre-claude-code-e-codex).
O agente que recebe o pedido coordena a divisão, registra responsáveis,
arquivos e validações no plano mantido no backend e confere as entregas.
Escritas no mesmo repositório são sequenciais; preservar as alterações
existentes e respeitar as autorizações de invocação e execução vigentes.

## Requisitos da evolução

- Cada usuário poderá administrar somente os próprios agendamentos; a administradora,
  todos os agendamentos.
- Cada usuário poderá somente consultar o próprio histórico; a administradora poderá
  consultar e administrar todos os históricos.
- Os detalhes dos novos cadastros e CRUDs de sessões ainda serão definidos.
- Restrições de acesso devem ser garantidas pelo backend, além da apresentação na interface.

### Login e primeiro acesso — tarefa 3

- Página inicial sem funcionalidades nesta etapa; preservar a landing page existente.
- A administradora solicitada é `mariabetania4020@gmail.com`; prever também uma conta
  permanente de testes, distinta das fixtures descartáveis da suíte.
- Só a administradora acessa o cadastro de clientes; a API também deve impor essa regra.
  O cadastro inicial pede apenas o e-mail, usado como username de login.
- O convite por e-mail contém usuário, senha temporária, orientação de troca obrigatória
  e link de primeiro acesso. Documentos anexos ainda dependem de definição posterior.
- O primeiro acesso exige nome completo, telefone e troca de senha, seguido do
  redirecionamento à página inicial. Não permitir contornar essa etapa pela navegação.
- Credenciais e senhas de configuração ficam no `.env` local do backend nesta fase;
  senhas dos clientes ficam como hash no banco. Nunca incluir secrets no bundle Vue.
- Telas e API estão implementadas e validadas; banco local migrado e contas permanentes
  criadas e autenticadas (administradora solicitada e `teste@betania.local`). SMTP externo
  e remetente continuam pendentes de configuração e validação. Atualizar checkboxes com evidência.

## Validação

- Mudanças visuais ou de comportamento devem ser verificadas no navegador, incluindo
  fluxos afetados, permissões, erros, navegação e tamanhos de tela relevantes. Registrar
  os cenários executados e os bloqueios; não declarar conclusão sem essa evidência.
- Validar o JavaScript realmente carregado, inclusive os blocos inline. Uma checagem
  isolada de `script.js` não cobre os scripts embutidos nos HTMLs.
- Ao introduzir lógica ou corrigir um bug, definir e executar o teste correspondente
  antes da implementação, conforme as regras globais. Usar a suíte existente em
  `app/tests/` e `e2e/`. O runner integrado do backend é opt-in e usa banco isolado;
  um teste ignorado na suíte comum não comprova validação no navegador.
- Mudanças apenas de instruções: conferir referências, importação do `AGENTS.md`,
  consistência com os arquivos atuais e o diff.

## Configuração e convenções

- Documentação, commits e comunicação em português do Brasil; identificadores em inglês.
- Seguir o estilo dos arquivos atuais e manter mudanças pequenas e reversíveis.
- Nenhum secret no HTML, CSS, JavaScript ou arquivos versionados. Nunca ler ou exibir `.env`.
- Não aplicar Infisical, Keycloak ou infraestrutura corporativa a este projeto pessoal.
- Configuração local ignorada do agente pertence à máquina. Preservar seu conteúdo
  e suas permissões; este arquivo não concede autorização de execução ou publicação.
- Publicação e alterações de infraestrutura exigem o escopo e a autorização da tarefa.
  Propostas de infraestrutura da plataforma devem respeitar o teto de custo de US$ 0
  registrado nas instruções do backend.
