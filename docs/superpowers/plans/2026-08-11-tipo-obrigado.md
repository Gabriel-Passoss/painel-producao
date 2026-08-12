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

### Task 6: Verificação visual no painel rodando

**Files:**
- Nenhum arquivo é modificado se tudo passar. Qualquer defeito encontrado vira correção na task correspondente (1 a 5), com rebuild e commit próprio.

**Interfaces:**
- Consumes: tudo das Tasks 1 a 5.
- Produces: confirmação de que o tipo funciona ponta a ponta.

- [ ] **Step 1: Subir o painel local**

```bash
cd painel-online && PORT=3777 node server.js
```

Abrir `http://localhost:3777`. **Atenção:** este painel usa o Supabase compartilhado da equipe — o que for salvo vale para todo mundo. Combine com o dono do projeto antes de criar itens de teste, ou apague-os no fim.

- [ ] **Step 2: Conferir o formulário**

Clicar em "+ Novo material" → botão **Obrigado**. Confirmar, na ordem:

1. Aparecem: Produto, Expert (opcional), Funil (opcional), Versão, Contexto (opcional).
2. **Não** aparecem: Posição 1/2, o bloco "Associar a um ... 1?", nem o campo Formato (vídeo/TSL).
3. Editor, Copy, Status, datas e os 4 links estão presentes, iguais aos dos outros tipos.
4. Preenchendo Produto `Carteira Black`, Versão `1`, Editor `THI`, Copy `LUC`, a seção "Nomenclatura oficial" mostra `OBRIGADO_CARTEIRABLACK_V1_THI-LUC`.

- [ ] **Step 3: Conferir a aba Produção**

Salvar o item com Expert e Funil preenchidos e status **Editado**. Confirmar:

1. Ele aparece no bloco **Obrigado** dentro daquele funil, com a tag `V1` e sem tag de posição.
2. O contador de itens do funil subiu em 1.
3. O select de tipo tem a opção **Obrigado** e, escolhendo-a, só os itens desse tipo continuam na tela.
4. Na visão Geral, ele aparece na "Biblioteca de Upsell, Downsell & Obrigado".

- [ ] **Step 4: Conferir a aba Funil Atual**

1. Na linha "ADICIONAR CARD" do funil daquele expert existe o botão **+ Obrigado**; clicar cria um card chamado "Obrigado 1".
2. Clicar em "trocar" lista o item recém-criado — e **não** lista páginas de obrigado de outro expert.
3. Depois de vincular, criar um segundo card "+ Obrigado" e confirmar que o item já usado **não** aparece na lista dele.
4. O card entra no contador "x/y no ar" e a troca fica registrada em "Registro de alterações".
5. O lápis do card renomeia para "Pág. Obrigado" e o nome persiste.

- [ ] **Step 5: Conferir que nada quebrou nos tipos antigos**

1. Novo item → **Upsell**: Posição 1/2 e o bloco de associação continuam lá; Contexto também.
2. Novo item → **Downsell**: o campo Formato (vídeo/TSL) continua lá; escolhendo TSL, o campo Editor some, como antes.
3. Novo item → **Corpo VSL** e **Lead**: continuam pedindo Expert e Funil obrigatórios, sem campo de Produto.
4. As abas Dashboard e Testes abrem sem erro no console do navegador.

- [ ] **Step 6: Limpar e encerrar**

Apagar os itens de teste criados, parar o servidor local e reportar o resultado. Se algum passo falhou, corrigir na task de origem, recompilar e commitar antes de dar a implementação por concluída.
