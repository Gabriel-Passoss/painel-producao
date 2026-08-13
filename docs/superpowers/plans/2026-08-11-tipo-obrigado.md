# Tipo de material "Obrigado" — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Adicionar um quinto tipo de material, `obrigado` (página de obrigado), cadastrável no modal "Novo item", listado na aba Produção e engatável como card na aba Funil Atual.

**Architecture:** O painel inteiro é um único componente React em `vsl-production-panel-v2.jsx`, sem framework de build no repositório — o `painel-online/public/bundle.js` é gerado por esbuild e commitado junto com o fonte. O tipo `obrigado` é aditivo: reusa a trilha de "oferta" que Upsell e Downsell já usam (produto + expert/funil opcionais) e só esconde o que não se aplica (posição, associação, formato vídeo/TSL). Nenhum item existente muda de forma.

**Tech Stack:** React 19.2.8, lucide-react 1.27.0, Tailwind via CDN, esbuild 0.24.0 (transform JSX clássico), Node 18+.

## Global Constraints

- **Não existe suíte de testes automatizados neste repositório.** O ciclo de cada task é: editar o fonte → recompilar o bundle (o build falha em erro de sintaxe ou identificador não definido) → asserção por string no bundle gerado → commit. A verificação visual acontece na Task 6.
- Todo commit leva **fonte e bundle juntos** — `vsl-production-panel-v2.jsx` e `painel-online/public/bundle.js` — porque o bundle commitado é o que o GitHub Pages serve.
- Trabalhar na branch `adjusts` (já criada).
- Mensagens de commit **sem acentos**, seguindo o padrão do histórico do repositório.
- Rótulos da interface em português, seguindo o tom dos existentes (minúsculas em textos de apoio, MAIÚSCULAS em rótulos de seção).
- Nenhum item já salvo pode mudar de comportamento: os 4 tipos antigos continuam idênticos, incluindo Posição e associação em Upsell/Downsell.
- Não alterar `defaultSlots` — o layout padrão dos funis continua com os 6 cards de hoje.

### Setup do build (uma vez, antes da Task 1)

O esbuild não está instalado no repositório. Monte um diretório de build fora dele:

```bash
BUILD=/private/tmp/claude-501/-Users-gabrieldospassos-Documents-www-painel-producao/37c4c2b9-d61d-497a-b06b-5adf0c53ac96/scratchpad/build
mkdir -p "$BUILD" && cd "$BUILD"
npm init -y
npm i --no-audit --no-fund react@19.2.8 react-dom@19.2.8 lucide-react@1.27.0
cat > entry.jsx <<'EOF'
import React from "react";
import { createRoot } from "react-dom/client";
import VSLProductionPanel from "./panel.jsx";

createRoot(document.getElementById("root")).render(<VSLProductionPanel />);
EOF
```

O binário do esbuild 0.24.0 já existe no cache do npx:
`/Users/gabrieldospassos/.npm/_npx/bcbb4f677bdf3481/node_modules/.bin/esbuild`
(se não existir, `npm i --no-audit --no-fund esbuild@0.24.0` dentro de `$BUILD` e usar `$BUILD/node_modules/.bin/esbuild`).

### Comando de build (usado em toda task)

```bash
REPO=/Users/gabrieldospassos/Documents/www/painel-producao
BUILD=/private/tmp/claude-501/-Users-gabrieldospassos-Documents-www-painel-producao/37c4c2b9-d61d-497a-b06b-5adf0c53ac96/scratchpad/build
ESB=/Users/gabrieldospassos/.npm/_npx/bcbb4f677bdf3481/node_modules/.bin/esbuild

cp "$REPO/vsl-production-panel-v2.jsx" "$BUILD/panel.jsx" && \
"$ESB" "$BUILD/entry.jsx" --bundle --minify --loader:.jsx=jsx \
  --define:process.env.NODE_ENV='"production"' \
  --outfile="$REPO/painel-online/public/bundle.js" --log-level=warning
```

Build silencioso = sucesso. Qualquer saída é erro e a task não avança.

## File Structure

Um arquivo de produto e um artefato gerado:

- **Modificar:** `vsl-production-panel-v2.jsx` — o painel inteiro. É um arquivo grande (≈2000 linhas) e essa é a estrutura estabelecida do projeto; este plano não o divide. As mudanças ficam concentradas em 5 regiões já bem delimitadas por comentários de seção: constantes de tipo, `officialName`, `ItemModal`, `ItemCard`/`ProducaoTab` e `FunilAtualTab`.
- **Regenerar:** `painel-online/public/bundle.js` — artefato de build, nunca editado à mão.

---

### Task 1: Constantes do tipo e nomenclatura oficial

**Files:**
- Modify: `vsl-production-panel-v2.jsx:36-37` (TYPE_LABEL / TYPE_ICON)
- Modify: `vsl-production-panel-v2.jsx:53-58` (officialName)
- Regenerate: `painel-online/public/bundle.js`

**Interfaces:**
- Consumes: nada.
- Produces: `TYPE_LABEL.obrigado === "Obrigado"`, `TYPE_ICON.obrigado === Sparkles`, e `officialName(item, items, experts)` devolvendo `OBRIGADO_<PRODUTO>_V<versao>_<EDITOR>-<COPY>` para `item.type === "obrigado"`. Todas as tasks seguintes dependem dessas três coisas.

- [ ] **Step 1: Registrar o tipo nas duas constantes**

Substituir as linhas 36-37:

```js
const TYPE_LABEL = { vsl: "Corpo VSL", lead: "Lead", upsell: "Upsell", downsell: "Downsell", obrigado: "Obrigado" };
const TYPE_ICON = { vsl: Film, lead: Zap, upsell: ArrowUpCircle, downsell: ArrowDownCircle, obrigado: Sparkles };
```

`Sparkles` já está na lista de imports do lucide-react no topo do arquivo e não é usado em nenhum outro ponto — não precisa mexer no import.

- [ ] **Step 2: Adicionar o ramo do Obrigado na nomenclatura**

Em `officialName`, logo depois da linha `const pair = (ed, cp) => ...` e **antes** do `if (item.type === "upsell" || item.type === "downsell")`, inserir:

```js
  if (item.type === "obrigado") {
    // pagina de obrigado nao tem posicao 1/2, entao o nome vai direto para o produto
    return `OBRIGADO_${slug(item.produto) || "PRODUTO"}_V${item.versao || "?"}_${pair(item.editor, item.copy)}`;
  }
```

- [ ] **Step 3: Recompilar o bundle**

Rodar o comando de build da seção "Global Constraints".
Esperado: nenhuma saída.

- [ ] **Step 4: Conferir que o tipo e o nome entraram no bundle**

```bash
node -e '
const s = require("fs").readFileSync("painel-online/public/bundle.js", "utf8");
const checks = [
  ["rotulo do tipo", /obrigado:"Obrigado"/],
  ["nomenclatura",   /OBRIGADO_\$\{/],
];
let ok = true;
for (const [nome, re] of checks) {
  const hit = re.test(s);
  if (!hit) ok = false;
  console.log((hit ? "OK   " : "FALHA") + "  " + nome);
}
process.exit(ok ? 0 : 1);'
```

Esperado: duas linhas `OK` e saída 0.

- [ ] **Step 5: Commit**

```bash
git add vsl-production-panel-v2.jsx painel-online/public/bundle.js
git commit -m "Obrigado: registra o tipo e a nomenclatura oficial"
```

---

### Task 2: Botão e formulário do Obrigado no modal "Novo item"

**Files:**
- Modify: `vsl-production-panel-v2.jsx:456-457` (flags do formulário)
- Modify: `vsl-production-panel-v2.jsx:483` (lista de botões de tipo)
- Modify: `vsl-production-panel-v2.jsx:535-537` (texto de ajuda)
- Modify: `vsl-production-panel-v2.jsx:566` e `:608-613` (bloco de Posição vs campo Contexto)
- Regenerate: `painel-online/public/bundle.js`

**Interfaces:**
- Consumes: `TYPE_LABEL.obrigado` e `TYPE_ICON.obrigado` da Task 1.
- Produces: um item salvo com `type: "obrigado"`, `produto`, `expertId`/`funilId` possivelmente vazios, `versao`, `editor`, `copy`, `contexto`, `status`, `dataInicio`, `dataEntrega` e os 4 campos de link. Sem `posicao`, `associadoId` nem `tipo` preenchidos pelo usuário. As Tasks 3, 4 e 5 consomem esse formato.

- [ ] **Step 1: Trocar a flag única por duas flags**

Substituir a linha 457:

```js
  const isReusable = form.type === "upsell" || form.type === "downsell";
```

por:

```js
  // usaProduto: cadastra por produto, com expert/funil opcionais (upsell, downsell, obrigado)
  const usaProduto = form.type === "upsell" || form.type === "downsell" || form.type === "obrigado";
  // temPosicao: so upsell/downsell existem em posicao 1 e 2, com o 2 podendo seguir o 1
  const temPosicao = form.type === "upsell" || form.type === "downsell";
```

`isReusable` aparece só duas vezes no arquivo: esta declaração e um uso na linha 566 (Step 2). O Step 5 confirma que não sobrou nenhuma.

- [ ] **Step 2: Trocar o único uso da flag antiga**

O bloco "Onde" (o ternário `{isVslLike ? (...) : (...)}`) **não muda**: o `else` dele já é acionado por qualquer tipo que não seja `vsl`/`lead`, então o Obrigado cai nele e ganha Produto + Expert/Funil opcionais de graça.

O único uso de `isReusable` é na linha 566. Trocar:

```jsx
            {isReusable && (
```

por:

```jsx
            {temPosicao && (
```

- [ ] **Step 3: Tirar o campo Contexto de dentro do bloco de Posição**

O campo "Contexto da oferta" está hoje dentro do `<div className="mt-3">` do bloco de Posição, então ele sumiria para o Obrigado. Substituir o fecho desse bloco (linhas 608-613):

```jsx
                <Field label="Contexto da oferta (opcional)">
                  <input style={inputStyle} value={form.contexto || ""} onChange={set("contexto")} placeholder='ex: "agradece a compra da Aiva Pro"' />
                </Field>
              </div>
            )}
```

por:

```jsx
              </div>
            )}

            {usaProduto && (
              <div className="mt-3">
                <Field label="Contexto da oferta (opcional)">
                  <input style={inputStyle} value={form.contexto || ""} onChange={set("contexto")} placeholder='ex: "agradece a compra da Aiva Pro"' />
                </Field>
              </div>
            )}
```

- [ ] **Step 4: Adicionar o botão do tipo e ajustar o texto de ajuda**

Na linha 483, trocar:

```jsx
              {["vsl", "lead", "upsell", "downsell"].map((t) => {
```

por:

```jsx
              {["vsl", "lead", "upsell", "downsell", "obrigado"].map((t) => {
```

E o parágrafo de ajuda das linhas 535-537, trocar:

```jsx
                <p className="text-[10px] mt-1" style={{ color: "#5C5C5C" }}>
                  Vincule a um funil para o upsell/downsell aparecer dentro dele. Fica na biblioteca de qualquer forma e pode ser usado em outros funis.
                </p>
```

por:

```jsx
                <p className="text-[10px] mt-1" style={{ color: "#5C5C5C" }}>
                  Vincule a um funil para este item aparecer dentro dele. Fica na biblioteca de qualquer forma e pode ser usado em outros funis.
                </p>
```

- [ ] **Step 5: Confirmar que a flag antiga sumiu por completo**

```bash
grep -n "isReusable" vsl-production-panel-v2.jsx
```

Esperado: nenhuma linha (saída vazia, exit 1 do grep). Se aparecer alguma ocorrência, ela precisa virar `usaProduto` ou `temPosicao` antes de seguir.

- [ ] **Step 6: Recompilar o bundle**

Rodar o comando de build.
Esperado: nenhuma saída.

- [ ] **Step 7: Conferir o botão no bundle**

```bash
node -e '
const s = require("fs").readFileSync("painel-online/public/bundle.js", "utf8");
const hit = /"vsl","lead","upsell","downsell","obrigado"/.test(s);
console.log((hit ? "OK   " : "FALHA") + "  botao Obrigado na lista de tipos");
process.exit(hit ? 0 : 1);'
```

Esperado: `OK` e saída 0.

- [ ] **Step 8: Commit**

```bash
git add vsl-production-panel-v2.jsx painel-online/public/bundle.js
git commit -m "Obrigado: botao e formulario no modal de novo item"
```

---

### Task 3: Tags e contexto na linha do item

**Files:**
- Modify: `vsl-production-panel-v2.jsx:690` (declarações no topo de `ItemCard`)
- Modify: `vsl-production-panel-v2.jsx:721-726` (bloco de tags)
- Modify: `vsl-production-panel-v2.jsx:737` (contexto em itálico)
- Regenerate: `painel-online/public/bundle.js`

**Interfaces:**
- Consumes: o item `type: "obrigado"` da Task 2 e `TYPE_LABEL` da Task 1.
- Produces: nada que outra task consuma.

- [ ] **Step 1: Declarar a flag de oferta no topo do componente**

Em `ItemCard`, logo depois da linha:

```js
  const isTsl = item.type === "downsell" && item.tipo === "tsl";
```

inserir:

```js
  const isOferta = item.type === "upsell" || item.type === "downsell" || item.type === "obrigado";
```

- [ ] **Step 2: Mostrar a tag de versão para o Obrigado**

Logo **depois** do bloco de tags de upsell/downsell (que termina em `)}` na linha 726), inserir:

```jsx
          {item.type === "obrigado" && <Tag>V{item.versao || "?"}</Tag>}
```

O Obrigado não ganha a tag de posição, porque não tem posição.

- [ ] **Step 3: Estender o contexto em itálico ao Obrigado**

Na linha 737, trocar:

```jsx
          {(item.type === "upsell" || item.type === "downsell") && item.contexto && (
```

por:

```jsx
          {isOferta && item.contexto && (
```

- [ ] **Step 4: Recompilar o bundle**

Rodar o comando de build.
Esperado: nenhuma saída.

- [ ] **Step 5: Commit**

```bash
git add vsl-production-panel-v2.jsx painel-online/public/bundle.js
git commit -m "Obrigado: tag de versao e contexto na linha do item"
```

---

### Task 4: Aba Produção — bloco por funil, biblioteca e filtro

**Files:**
- Modify: `vsl-production-panel-v2.jsx:904` (`reusableAll`)
- Modify: `vsl-production-panel-v2.jsx:927-930` (itens por funil e contador)
- Modify: `vsl-production-panel-v2.jsx:943-946` (blocos dentro do funil)
- Modify: `vsl-production-panel-v2.jsx:995-1001` (biblioteca da visão Geral)
- Modify: `vsl-production-panel-v2.jsx:973-978` (select de tipo)
- Regenerate: `painel-online/public/bundle.js`

**Interfaces:**
- Consumes: itens `type: "obrigado"` da Task 2.
- Produces: nada que outra task consuma.

- [ ] **Step 1: Incluir o Obrigado na lista de ofertas**

Na linha 904, trocar:

```js
  const reusableAll = items.filter((i) => (i.type === "upsell" || i.type === "downsell") && matchesFilters(i));
```

por:

```js
  const reusableAll = items.filter((i) => (i.type === "upsell" || i.type === "downsell" || i.type === "obrigado") && matchesFilters(i));
```

- [ ] **Step 2: Separar os itens de Obrigado do funil e somá-los no contador**

Nas linhas 928-930, depois de `downsellItems` e antes de `total`, inserir a lista nova e trocar o `total`:

```js
          const obrigadoItems = reusableAll.filter((i) => i.type === "obrigado" && i.expertId === ex.id && i.funilId === f.id).sort((a, b) => (a.produto || "").localeCompare(b.produto || ""));
          const total = funilItems.length + upsellItems.length + downsellItems.length + obrigadoItems.length;
```

(A ordenação de Upsell/Downsell é por `posicao`, que o Obrigado não tem — por isso ordena por produto.)

- [ ] **Step 3: Renderizar o bloco dentro do funil**

Logo depois do bloco condicional do Downsell (`{downsellItems.length > 0 && (...)}`), inserir:

```jsx
              {obrigadoItems.length > 0 && (
                <TypeBlock title="Obrigado" Icon={Sparkles} items={obrigadoItems} allItems={items} experts={experts} onEdit={onEdit} onDelete={onDelete} />
              )}
```

- [ ] **Step 4: Renderizar o bloco na biblioteca da visão Geral**

Trocar o título da biblioteca (linha 997):

```jsx
            <h4 className="text-[13.5px] font-bold" style={{ color: C.primary }}>Biblioteca de Upsell & Downsell</h4>
```

por:

```jsx
            <h4 className="text-[13.5px] font-bold" style={{ color: C.primary }}>Biblioteca de Upsell, Downsell & Obrigado</h4>
```

E, logo depois do `TypeBlock` de Downsell da biblioteca (linha 1001), inserir:

```jsx
          <TypeBlock title="Obrigado" Icon={Sparkles} items={reusableAll.filter((i) => i.type === "obrigado")} allItems={items} experts={experts} onEdit={onEdit} onDelete={onDelete} emptyText="nenhuma pagina de obrigado cadastrada ainda" />
```

- [ ] **Step 5: Adicionar a opção no select de tipo**

Depois da linha `<option value="downsell">Downsell</option>`, inserir:

```jsx
          <option value="obrigado">Obrigado</option>
```

- [ ] **Step 6: Recompilar o bundle**

Rodar o comando de build.
Esperado: nenhuma saída.

- [ ] **Step 7: Conferir os pontos da aba Produção no bundle**

```bash
node -e '
const s = require("fs").readFileSync("painel-online/public/bundle.js", "utf8");
const checks = [
  ["titulo do TypeBlock",       /title:"Obrigado"/],
  ["opcao do filtro",           /value:"obrigado"/],
  ["biblioteca renomeada",      /Biblioteca de Upsell, Downsell & Obrigado/],
];
let ok = true;
for (const [nome, re] of checks) {
  const hit = re.test(s);
  if (!hit) ok = false;
  console.log((hit ? "OK   " : "FALHA") + "  " + nome);
}
process.exit(ok ? 0 : 1);'
```

Esperado: três linhas `OK` e saída 0.

- [ ] **Step 8: Commit**

```bash
git add vsl-production-panel-v2.jsx painel-online/public/bundle.js
git commit -m "Obrigado: bloco na aba Producao e opcao no filtro de tipo"
```

---

### Task 5: Card de Obrigado na aba Funil Atual

**Files:**
- Modify: `vsl-production-panel-v2.jsx:1186-1192` (`SLOT_KIND` e `SLOT_KIND_ORDER`)
- Modify: `vsl-production-panel-v2.jsx:1399-1409` (`eligibleFor`)
- Regenerate: `painel-online/public/bundle.js`

**Interfaces:**
- Consumes: itens `type: "obrigado"` da Task 2.
- Produces: cards com `kind: "obrigado"` gravados em `funilState[funilId].slots`. Formato idêntico ao dos outros cards (`{ id, kind, value }`), então histórico, mover, remover e contador funcionam sem alteração.

- [ ] **Step 1: Declarar o novo tipo de card**

No objeto `SLOT_KIND`, depois da linha do `downsell`, inserir:

```js
  obrigado: { base: "Obrigado", type: "obrigado" },
```

E trocar a linha seguinte:

```js
const SLOT_KIND_ORDER = ["lead", "corpo", "upsell", "downsell"];
```

por:

```js
const SLOT_KIND_ORDER = ["lead", "corpo", "upsell", "downsell", "obrigado"];
```

Isso já cria o botão "+ Obrigado" na linha "ADICIONAR CARD", porque ela é renderizada a partir de `SLOT_KIND_ORDER`. A numeração automática do rótulo ("Obrigado 1", "Obrigado 2"…) também sai de graça: `slotLabels` conta por `kind`.

- [ ] **Step 2: Adicionar o ramo do Obrigado no picker**

Em `eligibleFor`, trocar as duas últimas linhas:

```js
                if (slot.kind === "upsell") return editado.filter((i) => i.type === "upsell" && doExpert(i) && livre(i));
                return editado.filter((i) => i.type === "downsell" && doExpert(i) && livre(i));
```

por:

```js
                if (slot.kind === "upsell") return editado.filter((i) => i.type === "upsell" && doExpert(i) && livre(i));
                if (slot.kind === "downsell") return editado.filter((i) => i.type === "downsell" && doExpert(i) && livre(i));
                return editado.filter((i) => i.type === "obrigado" && doExpert(i) && livre(i));
```

As três regras já existentes (`editado`, `doExpert`, `livre`) passam a valer para o Obrigado sem nenhum código novo.

O chip do card e a lista do "trocar" não precisam de mudança: o item de Obrigado tem `produto`, então os dois trechos já caem no formato `Produto V1`.

- [ ] **Step 3: Recompilar o bundle**

Rodar o comando de build.
Esperado: nenhuma saída.

- [ ] **Step 4: Conferir o card no bundle**

```bash
node -e '
const s = require("fs").readFileSync("painel-online/public/bundle.js", "utf8");
const checks = [
  ["SLOT_KIND do obrigado",  /obrigado:\{base:"Obrigado",type:"obrigado"\}/],
  ["botao ADICIONAR CARD",   /"lead","corpo","upsell","downsell","obrigado"/],
];
let ok = true;
for (const [nome, re] of checks) {
  const hit = re.test(s);
  if (!hit) ok = false;
  console.log((hit ? "OK   " : "FALHA") + "  " + nome);
}
process.exit(ok ? 0 : 1);'
```

Esperado: duas linhas `OK` e saída 0.

- [ ] **Step 5: Commit**

```bash
git add vsl-production-panel-v2.jsx painel-online/public/bundle.js
git commit -m "Obrigado: card proprio na aba Funil Atual"
```

---

### Task 6: Verificação funcional headless (jsdom)

**Files:**
- Create: `$BUILD/smoke.mjs` (fora do repositório — arquivo de verificação descartável, não é commitado)
- Nenhum arquivo do repositório é modificado se tudo passar. Defeito encontrado vira correção na task de origem (1 a 5), com rebuild e commit próprio.

**Interfaces:**
- Consumes: tudo das Tasks 1 a 5.
- Produces: confirmação de que o tipo funciona ponta a ponta.

**Por que headless e não no painel rodando:** o painel local fala com o Supabase compartilhado da equipe, e criar itens de teste lá deixaria lixo visível para todo mundo. A camada de storage (`vsl-production-panel-v2.jsx:120-150`) cai em `localStorage` quando não há `window.SUPABASE_URL` e o `/api/health` falha — que é exatamente o que acontece em jsdom. Assim dá para renderizar o painel de verdade, com dados semeados, sem encostar na base compartilhada.

- [ ] **Step 1: Instalar o jsdom no diretório de build**

```bash
BUILD=/private/tmp/claude-501/-Users-gabrieldospassos-Documents-www-painel-producao/37c4c2b9-d61d-497a-b06b-5adf0c53ac96/scratchpad/build
cd "$BUILD" && npm i --no-audit --no-fund jsdom@25
```

- [ ] **Step 2: Escrever o smoke test**

Criar `$BUILD/smoke.mjs`. Ele semeia o `localStorage` com um expert, um funil, um corpo, uma lead e **duas** páginas de obrigado (uma do expert certo e uma de outro expert, para provar o filtro), renderiza o painel e faz asserções sobre o DOM.

```js
import { JSDOM } from "jsdom";
import fs from "node:fs";

const bundle = fs.readFileSync(process.argv[2], "utf8");

// chaves reais do painel (vsl-production-panel-v2.jsx:1970-1975)
const dados = {
  "vslpanel:experts": [
    { id: "ex1", name: "Ronald", funis: [{ id: "f1", name: "HFTC" }] },
    { id: "ex2", name: "Jhon", funis: [{ id: "f2", name: "Atmoz" }] },
  ],
  "vslpanel:items": [
    { id: "i1", type: "vsl", expertId: "ex1", funilId: "f1", versao: "1", editor: "THI", copy: "WEND", status: "editado" },
    { id: "i2", type: "lead", expertId: "ex1", funilId: "f1", versao: "1", leadNum: "01", editor: "THI", copy: "WEND", status: "editado" },
    { id: "i3", type: "obrigado", expertId: "ex1", funilId: "f1", produto: "Carteira Black", versao: "1", editor: "THI", copy: "LUC", status: "editado", contexto: "agradece a compra" },
    { id: "i4", type: "obrigado", expertId: "ex2", funilId: "f2", produto: "Atmoz PRO", versao: "1", editor: "SEL", copy: "LUC", status: "editado" },
  ],
  "vslpanel:funilstate": {},
  "vslpanel:slotlog": [],
  "vslpanel:tests": [],
  "vslpanel:notifications": [],
};

const dom = new JSDOM(`<!doctype html><html><body><div id="root"></div></body></html>`, {
  url: "http://localhost/",
  runScripts: "outside-only",
  pretendToBeVisual: true,
});

// storage: sem Supabase e sem /api -> o painel cai no localStorage
dom.window.SUPABASE_URL = "";
dom.window.SUPABASE_KEY = "";
dom.window.fetch = () => Promise.reject(new Error("sem rede no smoke test"));
for (const [k, v] of Object.entries(dados)) {
  dom.window.localStorage.setItem(k, JSON.stringify(v));
}

dom.window.eval(bundle);

const falhas = [];
const ok = (nome, cond) => {
  console.log((cond ? "OK   " : "FALHA") + "  " + nome);
  if (!cond) falhas.push(nome);
};
const txt = () => dom.window.document.body.textContent;
const botao = (rotulo) =>
  [...dom.window.document.querySelectorAll("button")].find((b) => b.textContent.trim() === rotulo);
const clicar = (el) => el.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
const esperar = () => new Promise((r) => setTimeout(r, 60));

await esperar();

// --- 1. o painel renderiza e leu os dados semeados
ok("painel renderiza sem erro", txt().includes("Ronald"));

// --- 2. modal: botao Obrigado e formulario enxuto
clicar(botao("Novo material"));
await esperar();
ok("modal tem o botao Obrigado", !!botao("Obrigado"));
clicar(botao("Obrigado"));
await esperar();
const modal = txt();
ok("mostra o campo Produto", modal.includes("Produto"));
ok("mostra Expert/Funil opcionais", modal.includes("Expert do funil (opcional)"));
ok("mostra Contexto da oferta", modal.includes("Contexto da oferta (opcional)"));
ok("NAO mostra Posicao", !modal.includes("Posição"));
ok("NAO mostra Formato (video/TSL)", !modal.includes("Formato"));
ok("nomenclatura comeca com OBRIGADO_", modal.includes("OBRIGADO_"));
clicar([...dom.window.document.querySelectorAll("button")].at(-1)); // fecha o modal pelo X mais proximo
await esperar();

// --- 3. aba Producao: bloco Obrigado dentro do funil
clicar(botao("Produção"));
await esperar();
ok("aba Producao abre", txt().includes("Funil HFTC") || txt().includes("HFTC"));
ok("lista a pagina de obrigado do funil", txt().includes("Carteira Black"));

// --- 4. aba Funil Atual: botao + Obrigado e filtro por expert
clicar(botao("Funil Atual"));
await esperar();
ok("existe o botao + Obrigado", !!botao("Obrigado"));
clicar(botao("Obrigado"));
await esperar();
ok("card Obrigado 1 criado", txt().includes("Obrigado 1"));

const trocares = [...dom.window.document.querySelectorAll("button")].filter((b) => b.textContent.includes("trocar"));
clicar(trocares.at(-1));
await esperar();
const lista = txt();
ok("picker oferece a pagina do expert certo", lista.includes("Carteira Black"));
ok("picker NAO oferece a de outro expert", !lista.includes("Atmoz PRO"));

console.log(falhas.length ? "\n" + falhas.length + " FALHA(S): " + falhas.join(" | ") : "\ntudo passou");
process.exit(falhas.length ? 1 : 0);
```

As chaves acima são as reais, conferidas em `vsl-production-panel-v2.jsx:1970-1975`. O `useStorage` lê `localStorage.getItem(key)`, embrulha em `{ value }` e faz `JSON.parse` — por isso cada chave recebe o JSON já serializado.

- [ ] **Step 3: Rodar o smoke test**

```bash
BUILD=/private/tmp/claude-501/-Users-gabrieldospassos-Documents-www-painel-producao/37c4c2b9-d61d-497a-b06b-5adf0c53ac96/scratchpad/build
node "$BUILD/smoke.mjs" /Users/gabrieldospassos/Documents/www/painel-producao/painel-online/public/bundle.js
```

Esperado: todas as linhas `OK`, a mensagem `tudo passou` e saída 0.

Se alguma asserção falhar, **investigar antes de mexer no teste**: pode ser um defeito real do código (corrigir na task de origem, recompilar, commitar) ou uma asserção mal escrita (o `textContent` do painel é denso e pode dar falso negativo). Nunca afrouxar uma asserção sem antes confirmar, lendo o código, que o comportamento está certo.

- [ ] **Step 4: Conferir que os tipos antigos não quebraram**

Reabrir o modal no mesmo smoke test, agora nos tipos antigos. Acrescentar ao fim de `smoke.mjs`, antes do relatório final:

```js
// --- 5. regressao: os 4 tipos antigos continuam iguais
clicar(botao("Novo material"));
await esperar();
clicar(botao("Upsell"));
await esperar();
ok("Upsell mantem Posicao", txt().includes("Posição"));
ok("Upsell mantem Contexto", txt().includes("Contexto da oferta (opcional)"));
clicar(botao("Downsell"));
await esperar();
ok("Downsell mantem Formato", txt().includes("Formato"));
clicar(botao("Corpo VSL"));
await esperar();
ok("Corpo VSL nao pede Produto", !txt().includes("Contexto da oferta (opcional)"));
```

Rodar de novo e esperar todas as linhas `OK`.

- [ ] **Step 5: Reportar**

O smoke test vive fora do repositório e não é commitado — não há suíte de testes aqui e criar uma sozinha, sem combinar, sairia do escopo. Reportar ao dono do projeto:

1. O resultado de cada asserção.
2. Que a verificação foi headless, em `localStorage`, **sem tocar no Supabase compartilhado**.
3. A lista de conferência visual que sobra para ele fazer no painel quando quiser: aparência do botão novo na linha de tipos (são 5 botões agora e a linha quebra em duas), o ícone `Sparkles` no lugar certo, e o card de Obrigado no meio dos outros no Funil Atual.
