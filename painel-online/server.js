/* Servidor do Painel de Produção — sem dependências externas (só Node.js).
 *
 * Uso local:   node server.js
 * Porta:       a hospedagem define via process.env.PORT; local cai em 3000.
 * Dados:       arquivo JSON único, compartilhado entre todos os usuários.
 *              Caminho padrão: ./data.json (ao lado deste arquivo).
 *              Em hospedagem com disco persistente, defina DATA_DIR apontando
 *              para o disco montado, ex: DATA_DIR=/data  ->  /data/painel.json
 */
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "0.0.0.0"; // hospedagens exigem 0.0.0.0
const PUBLIC_DIR = path.join(__dirname, "public");

// Onde os dados ficam salvos. DATA_DIR permite apontar para um disco persistente.
const DATA_DIR = process.env.DATA_DIR || __dirname;
const DATA_FILE = process.env.DATA_FILE || path.join(DATA_DIR, "data.json");

// Garante que a pasta de dados existe (importante em discos montados).
try {
  fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
} catch (e) {
  console.error("Não consegui criar a pasta de dados:", e.message);
}

let store = {};
try {
  store = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  console.log(`Dados carregados de ${DATA_FILE}`);
} catch (e) {
  store = {};
  console.log(`Sem dados anteriores — começando vazio (${DATA_FILE})`);
}

let saveTimer = null;
let saving = false;
let dirty = false;

function writeNow() {
  if (saving) { dirty = true; return; }
  saving = true;
  const tmp = DATA_FILE + ".tmp";
  const payload = JSON.stringify(store, null, 2);
  fs.writeFile(tmp, payload, (err) => {
    if (err) { saving = false; return console.error("erro ao salvar (write):", err.message); }
    fs.rename(tmp, DATA_FILE, (err2) => {
      saving = false;
      if (err2) return console.error("erro ao salvar (rename):", err2.message);
      if (dirty) { dirty = false; writeNow(); } // houve alteração enquanto salvava
    });
  });
}

function scheduleSave() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => { saveTimer = null; writeNow(); }, 250);
}

// Salva de forma síncrona (usado ao desligar/redeploy, para não perder dados).
function saveSync() {
  try {
    const tmp = DATA_FILE + ".tmp";
    fs.writeFileSync(tmp, JSON.stringify(store, null, 2));
    fs.renameSync(tmp, DATA_FILE);
  } catch (e) {
    console.error("erro ao salvar no desligamento:", e.message);
  }
}

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
};

function sendJson(res, code, obj) {
  res.writeHead(code, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}

function serveFile(res, filePath) {
  fs.readFile(filePath, (err, data) => {
    if (err) return serveIndex(res);
    res.writeHead(200, {
      "Content-Type": MIME[path.extname(filePath)] || "application/octet-stream",
      "Cache-Control": "no-store, must-revalidate",
    });
    res.end(data);
  });
}

function serveIndex(res) {
  fs.readFile(path.join(PUBLIC_DIR, "index.html"), (err, data) => {
    if (err) { res.writeHead(500); return res.end("index.html não encontrado"); }
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store, must-revalidate" });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  let url;
  try {
    url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  } catch (e) {
    return sendJson(res, 400, { error: "requisição inválida" });
  }

  // Health check — várias hospedagens pingam este endpoint.
  if (url.pathname === "/api/health") return sendJson(res, 200, { ok: true });

  // API de dados compartilhados (key-value).
  if (url.pathname.startsWith("/api/kv/")) {
    const key = decodeURIComponent(url.pathname.slice("/api/kv/".length));
    if (!key) return sendJson(res, 400, { error: "chave vazia" });

    if (req.method === "GET") {
      if (!(key in store)) return sendJson(res, 404, { error: "não encontrado" });
      return sendJson(res, 200, { value: store[key] });
    }
    if (req.method === "PUT" || req.method === "POST") {
      let body = "";
      let tooBig = false;
      req.on("data", (c) => {
        body += c;
        if (body.length > 10_000_000) { tooBig = true; req.destroy(); }
      });
      req.on("end", () => {
        if (tooBig) return;
        try {
          const parsed = JSON.parse(body);
          if (typeof parsed.value !== "string") return sendJson(res, 400, { error: "value deve ser string" });
          store[key] = parsed.value;
          scheduleSave();
          sendJson(res, 200, { ok: true });
        } catch (e) {
          sendJson(res, 400, { error: "JSON inválido" });
        }
      });
      req.on("error", () => {});
      return;
    }
    return sendJson(res, 405, { error: "método não suportado" });
  }

  // Só GET/HEAD para arquivos estáticos.
  if (req.method !== "GET" && req.method !== "HEAD") {
    return sendJson(res, 405, { error: "método não suportado" });
  }

  // Arquivos estáticos, com proteção contra path traversal.
  const rel = url.pathname === "/" ? "index.html" : url.pathname.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(PUBLIC_DIR, rel));
  if (!filePath.startsWith(PUBLIC_DIR)) {
    res.writeHead(403);
    return res.end("forbidden");
  }
  // Se não for um arquivo existente, cai no index.html (deep links não quebram).
  fs.stat(filePath, (err, stat) => {
    if (err || !stat.isFile()) return serveIndex(res);
    serveFile(res, filePath);
  });
});

// Nunca deixa uma requisição ruim derrubar o servidor.
process.on("uncaughtException", (e) => console.error("uncaughtException:", e.message));
process.on("unhandledRejection", (e) => console.error("unhandledRejection:", e));

// Ao receber sinal de desligamento (redeploy/reboot), grava os dados antes de sair.
["SIGINT", "SIGTERM"].forEach((sig) =>
  process.on(sig, () => {
    console.log(`\nRecebido ${sig} — salvando dados antes de sair...`);
    saveSync();
    process.exit(0);
  })
);

server.on("error", (e) => {
  if (e.code === "EADDRINUSE") console.error(`Porta ${PORT} já está em uso.`);
  else console.error("Erro no servidor:", e.message);
  process.exit(1);
});

server.listen(PORT, HOST, () => {
  console.log(`Painel de Produção rodando na porta ${PORT}`);
  console.log(`Dados compartilhados em ${DATA_FILE}`);
});
