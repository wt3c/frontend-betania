# Betania Frontend — Contexto do Claude Code

Ler as instruções globais do Claude Code e as instruções compartilhadas abaixo antes
de trabalhar neste projeto. Consultar também `../betania-backend/docs/prompt.md`,
fonte dos requisitos e das tarefas atuais nos dois repositórios.

@AGENTS.md

## Aplicação do prompt

Aplicar os pedidos de `../betania-backend/docs/prompt.md` e atualizar as regras locais
que os contrariem, conforme o `AGENTS.md`. O item 2.3 dispensa confirmação do plano e
confirmações locais redundantes; seguir com a execução dentro do escopo solicitado.

## Específico do Claude Code

- Seguir a seção "Divisão de tarefas entre Claude Code e Codex" do `AGENTS.md`
  importado acima e a regra compartilhada do backend que ela referencia.
- Atualizar as orientações compartilhadas no `AGENTS.md`, evitando duplicá-las aqui.
- As configurações locais ignoradas em `.claude/` pertencem à máquina e devem ser
  preservadas. As permissões Django, uv e Docker do backend não são um modelo de
  execução para este frontend Vue com landing page estática preservada.
- Para telas, executar testes no navegador além dos testes de código, conforme a
  tarefa 2.5 do prompt e o `AGENTS.md`; registrar os cenários e resultados reais.
- Conferir o estado implementado e as pendências de ativação antes de atualizar os
  checkboxes do prompt; os requisitos compartilhados de login ficam no `AGENTS.md`.
- Para uma tarefa no backend, ler o `AGENTS.md` daquele repositório e suas regras
  próprias de segurança e testes antes de editar.
