# Tipo de material "Obrigado" (página de obrigado)

Data: 2026-08-11
Arquivo afetado: `vsl-production-panel-v2.jsx` (+ `painel-online/public/bundle.js` recompilado)

## Problema

O painel só conhece 4 tipos de material: Corpo VSL, Lead, Upsell e Downsell. A página de
obrigado não tem onde ser cadastrada — hoje o único jeito de representá-la no Funil Atual é
criar um card de Downsell e renomeá-lo para "Pág. Obrigado", o que deixa o item com nome
`DOWNSELL1_...`, misturado no bloco de Downsell da aba Produção e poluindo o picker de
downsell dos outros funis.

## Objetivo

Um tipo `obrigado` de primeira classe: cadastrado no modal "Novo item" com os mesmos campos
dos demais (copy, URL, quem fez, status, prazos), listado na aba Produção e engatável como
card na aba Funil Atual.

## Decisões tomadas

1. **A página de obrigado pertence à oferta, não ao funil.** Ela se cadastra com nome de
   produto e `Expert`/`Funil` opcionais — igual a Upsell e Downsell — e por isso pode ser
   reaproveitada em mais de um funil.
2. **Sem posição e sem associação.** Não existe "Obrigado 1" e "Obrigado 2" como entidades
   ligadas entre si, então o formulário não tem o seletor de posição nem o vínculo
   "o 2 segue o 1". Também não tem o campo Formato (vídeo/TSL), que é exclusivo do Downsell.
3. **Reusar a trilha de "oferta" que já existe no modal** em vez de escrever um formulário
   novo. Evita duplicar o formulário em dois lugares.
4. **O layout padrão dos funis continua com os 6 cards de hoje.** O card de Obrigado é
   adicionado sob demanda pelo botão "+ Obrigado". Incluí-lo em `defaultSlots` faria todo
   funil ainda não customizado ganhar um card vazio de uma vez.

## Modelo de dados

Item com `type: "obrigado"`, guardado na mesma lista `items` dos demais.

| Campo | Uso |
|---|---|
| `produto` | Nome da oferta a que a página pertence. Entra na nomenclatura. |
| `expertId`, `funilId` | Opcionais. Definem dentro de qual funil o item aparece na aba Produção e em qual expert ele fica disponível no Funil Atual. |
| `versao` | Igual aos demais. |
| `editor`, `copy` | Igual aos demais. |
| `contexto` | Texto livre opcional, igual ao de Upsell/Downsell. |
| `status`, `dataInicio`, `dataEntrega` | Igual aos demais. |
| `linkBruto`, `linkCopy`, `linkEditado`, `linkPagina` | Os 4 links, igual aos demais. |

Não usa `posicao`, `associar`, `associadoId` nem `tipo`. Nenhum item existente muda de forma —
o tipo novo é aditivo.

## Mudanças por tela

### Constantes

- `TYPE_LABEL.obrigado = "Obrigado"`.
- `TYPE_ICON.obrigado = Sparkles` — ícone já importado do lucide-react e não usado em nenhum
  outro ponto do arquivo, sem conflito visual com o `CheckCircle2` do status "Editado".

### Modal "Novo item" (`ItemModal`)

- Quinto botão **Obrigado** na linha de tipo.
- O bloco **ONDE** passa a ter três formas: `isVslLike` (Expert + Funil obrigatórios),
  oferta com posição (Upsell/Downsell) e oferta sem posição (Obrigado). Concretamente, a
  condição que hoje se chama `isReusable` se divide em duas:
  - `usaProduto` = `upsell | downsell | obrigado` → mostra Produto, Expert opcional,
    Funil opcional e Contexto.
  - `temPosicao` = `upsell | downsell` → mostra o seletor Posição 1/2 e o bloco de associação.
- O texto de ajuda embaixo dos selects passa a citar o Obrigado junto com upsell/downsell.
- **QUEM**, **STATUS & PRAZO**, **LINKS** e **NOMENCLATURA OFICIAL** não mudam.

### Nomenclatura (`officialName`)

```
OBRIGADO_[PRODUTO]_V[versão]_[EDITOR]-[COPY]
```

Exemplo: `OBRIGADO_CARTEIRABLACK_V1_THI-LUC`.

Sem número de posição — o `UPSELL1_`/`DOWNSELL2_` existe porque essas ofertas têm posição 1 e 2.

### Linha do item (`ItemCard`)

O bloco de tags que hoje é exclusivo de upsell/downsell (`V{versao}` + `Upsell 1`) passa a
mostrar, para o Obrigado, apenas a tag de versão. O `contexto` em itálico, hoje exibido só
para upsell/downsell, passa a valer também para o Obrigado.

### Aba Produção (`ProducaoTab`)

- `reusableAll` passa a incluir `obrigado`, e a visão Geral ganha um terceiro `TypeBlock`
  **Obrigado** depois dos de Upsell e Downsell, alimentado por esse filtro.
- Dentro de cada funil, um `TypeBlock` **Obrigado** depois do de Downsell, alimentado pelos
  itens com `expertId` e `funilId` daquele funil, e exibido só quando houver ao menos um —
  mesma regra dos outros dois. O contador de itens do funil passa a somá-los.
- O select "Todos os tipos" ganha a opção **Obrigado**.
- A busca já cobre o tipo novo, porque monta o texto a partir de `TYPE_LABEL`.

### Aba Funil Atual (`FunilAtualTab`)

- `SLOT_KIND` ganha `obrigado: { base: "Obrigado", type: "obrigado" }` e `SLOT_KIND_ORDER`
  passa a `["lead", "corpo", "upsell", "downsell", "obrigado"]`, o que cria o botão
  **+ Obrigado** na linha "ADICIONAR CARD".
- O rótulo automático segue a numeração por tipo já existente (`Obrigado 1`, `Obrigado 2`…) e
  continua renomeável pelo lápis.
- `eligibleFor` ganha o ramo do Obrigado com as mesmas três regras dos demais: só status
  `editado`, só do expert daquele funil (ou sem expert definido, os itens de biblioteca), e
  fora o que já está em outro card do mesmo funil.
- O chip do card e a lista do "trocar" não precisam de mudança: o Obrigado tem `produto`, e
  esses trechos já caem no formato `Produto V1`.
- Mover, remover, contador "x/y no ar" e Registro de alterações funcionam sem alteração.

### Dashboard e Testes

Sem mudança. O Dashboard conta por status sobre a lista inteira e a aba Testes só lida com
lead e corpo.

## Como verificar

Não há suíte de testes no repositório. A verificação é manual, no painel rodando localmente
(`cd painel-online && PORT=3777 npm start`):

1. Novo item → Obrigado: os campos são Produto, Expert/Funil opcionais, Versão e Contexto;
   não aparece Posição, associação nem Formato.
2. A nomenclatura mostrada no modal sai como `OBRIGADO_PRODUTO_V1_EDI-COP`.
3. Salvando com expert e funil preenchidos, o item aparece no bloco Obrigado daquele funil na
   aba Produção; o filtro "Obrigado" isola só esses itens.
4. Funil Atual → "+ Obrigado" cria o card; o "trocar" lista só os itens Editado daquele expert
   e não repete o que já está em outro card do funil.
5. Os 4 tipos antigos continuam idênticos, incluindo Posição/associação em Upsell e Downsell.

Depois de aprovado, recompilar `painel-online/public/bundle.js` com esbuild (React 19.2.8,
lucide-react 1.27.0, transform JSX clássico) e commitar fonte e bundle juntos.

## Fora de escopo

- Alterar o layout padrão dos funis.
- Migrar automaticamente os cards que foram renomeados à mão para "Pág. Obrigado" — quem já
  fez esse contorno refaz o card quando quiser.
