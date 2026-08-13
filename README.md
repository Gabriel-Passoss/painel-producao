# Painel de Produção — VSL / Lead / Upsell / Downsell

Painel de controle da produção de VSLs. Centraliza o que já foi
produzido, o que está em produção, o que falta produzir e o que está rodando agora em cada funil.
Os dados ficam num servidor e são **compartilhados** — todo mundo que abre o link vê a mesma base,
que se atualiza sozinha a cada 15 segundos.

## Telas

- **Dashboard** — visão geral com KPIs e atividade recente.
- **Produção** — cadastro de todo material (Corpo VSL, Lead, Upsell, Downsell), por Expert e Funil.
- **Funil Atual** — o que está no ar em cada funil, nos 6 slots (Lead → Corpo → Upsell 1 → Downsell 1 → Upsell 2 → Downsell 2), com histórico de trocas.
- **Testes** — registro dos testes de lead, gerando o nome-padrão usado no VTurb e na API.

## Estrutura do repositório

```
painel-online/            App pronto para hospedar
  server.js               Servidor Node (sem dependências): serve o site + API de dados
  package.json            Define "npm start" e a versão do Node
  Procfile                Para plataformas estilo Heroku
  public/                 Painel já compilado (index.html + bundle.js)
  LEIA-ME.md              Instruções de hospedagem
vsl-production-panel-v2.jsx   Código-fonte (React) do painel
```

## Rodar localmente

Precisa apenas de **Node.js 18+** (o servidor não tem dependências para instalar):

```bash
cd painel-online
npm start
```

Abre em http://localhost:3000

## Hospedar

Qualquer hospedagem que rode **Node.js** serve (VPS, Render, Railway, Fly.io). O comando é `npm start`
e a plataforma define a porta via `PORT`. Em hospedagem com disco efêmero (Render/Railway), anexe um
disco persistente e aponte a variável `DATA_DIR` para ele — assim os dados não se perdem em cada deploy.
Detalhes em [`painel-online/LEIA-ME.md`](painel-online/LEIA-ME.md).

## Alterar o painel

O código-fonte é o [`vsl-production-panel-v2.jsx`](vsl-production-panel-v2.jsx). Depois de editar, é
preciso recompilar o `painel-online/public/bundle.js` (com esbuild) antes de subir de novo.

### Recompilar o bundle

Precisa de um `entry.jsx` que importe o painel e monte com `createRoot`:

```jsx
import React from "react";
import { createRoot } from "react-dom/client";
import VSLProductionPanel from "./vsl-production-panel-v2.jsx";

createRoot(document.getElementById("root")).render(<VSLProductionPanel />);
```

E das dependências instaladas ao lado dele:

```bash
npm i react@19.2.8 react-dom@19.2.8 lucide-react@1.27.0
```

Depois, gera o bundle:

```bash
npx esbuild@0.24.0 entry.jsx --bundle --minify --loader:.jsx=jsx \
  --define:process.env.NODE_ENV='"production"' \
  --outfile=painel-online/public/bundle.js
```
