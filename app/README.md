# Aplicação Betânia Terapeuta

A landing page da raiz foi preservada. A aplicação Vue fica em `/app/` e usa a API Django
por `/api/accounts/` e `/api/scheduling/`, com proxy local para `http://127.0.0.1:8000` no Vite.

Telas: login, primeiro acesso, página inicial, convite de cliente exclusivo da administradora
e agenda (`/agenda`). O cliente vê as próprias sessões e reserva horários livres dos próximos
14 dias, agrupados por dia; a administradora consulta todos os agendamentos por período,
altera a situação, remarca e cria agendamentos. `/disponibilidade` (administradora) mantém
janelas semanais e bloqueios. Datas são exibidas e enviadas no fuso `America/Sao_Paulo`.
O token de acesso fica em memória; o refresh usa cookie HttpOnly. Recarregar restaura a
sessão pela API, e a troca de senha invalida tokens anteriores.

Validação local executada: `npm run test:unit`, `npm run lint` e `npm run build`.
A integração Playwright é iniciada pelo teste `tests/test_browser_flow.py` do backend,
que provisiona credenciais efêmeras e usa PostgreSQL descartável. Não apontar esse teste
para o banco de desenvolvimento nem para produção. Não versionar relatórios ou credenciais.

O build em `dist/` inclui a landing page e os arquivos estáticos existentes na raiz.
A hospedagem precisa encaminhar rotas de `/app/*` para `/app/index.html` e `/api/*` para
Django, na mesma origem. O Vite já implementa essas duas regras em desenvolvimento.
Nenhuma publicação foi realizada por esta tarefa.

Dependências transitivas `glob` e `minimatch` usam versões corrigidas por `overrides`,
validadas por lint, build e testes. O lockfile fixa a resolução reproduzível.
