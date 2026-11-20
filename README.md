# Frontend - Maria Betânia Terapeuta

Site público (landing, anamnese TRG e política de privacidade) e aplicação autenticada em `/app/`,
em Vue 3, TypeScript e Vite.

## 📁 Estrutura do Projeto

```
/
├── index.html, anamnese-trg.html, politica-de-privacidade.html  # entradas Vite: <head> + ponto de montagem
├── site/            # componentes Vue das páginas públicas e seus testes
├── app/             # aplicação autenticada (login, clientes, agenda)
└── e2e/             # testes Playwright
```

Comandos: `npm run dev`, `npm run build` (gera `dist/`), `npm run lint`, `npm run type-check`,
`npx vitest run` e `npx playwright test e2e/site.spec.ts`. Uma página por entrada Vite (ADR-013
no backend).

## 🛠️ Como Personalizar

- **Conteúdo e imagens:** editar o componente da página em `site/`; imagens são importadas por
  caminho relativo (`../arquivo.jpg`) e recebem hash no build.
- **Metadados, SEO e dados estruturados:** ficam no `<head>` do HTML de entrada correspondente.
- **Links de contato:** o WhatsApp usado é `https://wa.me/5521988070905`, em `site/LandingPage.vue`
  e em `site/anamneseLogic.ts`.

## 📦 Como Fazer Deploy

Publicar o conteúdo de `dist/` gerado por `npm run build`; os HTMLs da raiz não funcionam
servidos sem build. A hospedagem é a decisão D10 em `../betania-backend/docs/prompt.md`.

## 📄 Licença

Desenvolvido para uso exclusivo de Maria Betania.


## Aplicação Vue

A aplicação de login e clientes está em `/app/`. Consulte [a documentação](app/README.md) para fluxos, testes e hospedagem.
