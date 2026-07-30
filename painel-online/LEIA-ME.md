# Painel de Produção — versão online (dados compartilhados)

Todo mundo que abrir o link vê e edita **a mesma base de dados**.
O painel também se atualiza sozinho a cada 15 segundos para puxar o que os outros mudaram.

Não tem dependências para instalar — é só Node.js puro.

---

## 🟢 Onde os dados ficam salvos (Supabase — já configurado)

O painel guarda os dados no **Supabase** (banco externo), definido em `public/config.js`:

```js
window.SUPABASE_URL = "https://....supabase.co";
window.SUPABASE_KEY = "sb_publishable_...";
```

Vantagem: os dados ficam no banco, **independente do deploy** — pode atualizar/redeployar o site à
vontade que **nada é perdido**. E como é o front-end que fala com o Supabase, funciona até em
hospedagem estática (inclusive o site de teste do GitHub Pages).

- Para **trocar de projeto Supabase**, é só editar `public/config.js`.
- Para **voltar ao modo servidor** (usar o `data.json` em vez do Supabase), deixe as duas variáveis
  vazias (`""`) em `config.js`.
- Tabela usada no Supabase: `kv (key text primary key, value text, updated_at timestamptz)` com uma
  policy de acesso liberado (RLS). Backup = exportar essa tabela no painel do Supabase.

> Observação de segurança: a chave em `config.js` é a **publishable** (feita para ficar no cliente).
> Como o repositório é público, ela fica visível — para uso interno sem login é aceitável, mas quem
> tiver a chave consegue ler/gravar. Se precisar travar, dá para deixar o repositório privado, apertar
> a policy de RLS ou adicionar uma autenticação depois.

O resto abaixo (servidor Node + `data.json`) continua valendo como **alternativa/fallback**, caso um dia
não queira usar o Supabase.

---

## O essencial (qualquer hospedagem Node)

A hospedagem precisa **rodar Node.js** (versão 18 ou mais nova) e usar o comando:

```
npm start
```

Ela vai definir a porta automaticamente (variável `PORT`) — o servidor já respeita isso.
Hospedagem de site **estático** (só HTML/CSS) **não serve**, porque é o servidor que guarda os dados de todos.

Arquivos do projeto:
- `server.js` — o servidor (serve o site + guarda os dados)
- `public/` — o painel já compilado
- `package.json` — define o `npm start` e a versão do Node
- `Procfile` — para plataformas estilo Heroku
- `data.json` — criado sozinho na primeira gravação; é onde ficam **todos os dados**

---

## ⚠️ O ponto mais importante: onde os dados ficam salvos

Os dados vão para um arquivo (`data.json`). Dependendo da hospedagem, esse arquivo pode
ser **apagado a cada reinício/atualização** (o chamado "disco efêmero"). Isso muda a receita:

### Opção A — VPS / servidor com disco próprio (recomendado, mais simples)
Ex.: contratar um VPS, ou aquele servidor do Jorge. O disco é permanente, então **funciona direto**:

```
npm start
```

Para deixar rodando sempre (mesmo após reboot), use o pm2:
```
npm install -g pm2
pm2 start server.js --name painel
pm2 startup   # segue a instrução que ele imprimir
pm2 save
```

### Opção B — Render / Railway / Fly.io e afins (disco efêmero)
Nessas plataformas o `npm start` já funciona, MAS o `data.json` some quando o app reinicia.
Para não perder nada, faça **duas coisas**:

1. Crie/anexe um **disco persistente** (todas essas plataformas oferecem — ex.: no Render,
   "Disks"; monte em `/data`).
2. Defina a variável de ambiente **`DATA_DIR`** apontando para esse disco:

```
DATA_DIR = /data
```

Pronto — os dados passam a ser gravados em `/data/data.json`, que sobrevive a reinícios e deploys.
(Testado: com o `DATA_DIR` configurado, os dados voltam intactos depois de reiniciar o servidor.)

---

## Variáveis de ambiente (todas opcionais)

| Variável   | Para quê                                             | Padrão            |
|------------|------------------------------------------------------|-------------------|
| `PORT`     | Porta (a hospedagem geralmente define sozinha)       | 3000              |
| `DATA_DIR` | Pasta onde salvar os dados (aponte p/ disco persistente) | pasta do projeto |
| `HOST`     | Interface de rede                                    | 0.0.0.0           |

---

## Backup

Backup de tudo = copiar o arquivo `data.json` (ou o `DATA_DIR` inteiro). Simples assim.

---

## Rodar no seu computador (para testar)

```
npm start
```
Abre em http://localhost:3000

Se quiser testar em outra porta:
```
PORT=8080 npm start           (Linux/Mac)
$env:PORT=8080; npm start     (Windows PowerShell)
```

---

## Atualizar o painel no futuro

O código-fonte é o `vsl-production-panel-v2.jsx` (na pasta acima desta).
Depois de mexer nele, é preciso **recompilar** o `public/bundle.js` (com esbuild) e subir de novo.
Sem login por enquanto, conforme combinado — se um dia precisar, dá para adicionar uma senha
simples no `server.js`.
