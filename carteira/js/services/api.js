// Camada de acesso a dados do site.
//
// Duas fontes de cotação:
// 1. dados/cotacoes.json — gerado periodicamente pelo GitHub Actions, usado
//    nas sugestões padrão de cada categoria (rápido, sem gastar cota extra).
// 2. Cloudflare Worker (WORKER_URL) — usado só na busca manual por ticker,
//    pra achar ativos que não estão na lista pré-carregada. O token da
//    Brapi fica só no Worker, nunca aparece aqui.

const DATA_URL = "dados/cotacoes.json";
const WORKER_URL = "https://brapi-proxu.manymens777.workers.dev"; // troque pelo seu endereço

let cache = null;
let inflight = null;

export async function getQuotes({ force = false } = {}) {
  if (cache && !force) return cache;
  if (inflight) return inflight;
  inflight = fetch(`${DATA_URL}?v=${Date.now()}`)
    .then((r) => {
      if (!r.ok) throw new Error(`Não foi possível carregar as cotações (${r.status})`);
      return r.json();
    })
    .then((data) => {
      cache = data;
      return data;
    })
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

/**
 * Busca um ticker. Primeiro tenta na base já carregada (rápido, sem gastar
 * cota); se não achar, tenta ao vivo via Cloudflare Worker.
 */
export async function lookupTicker(rawTicker) {
  const ticker = String(rawTicker || "").trim().toUpperCase();
  if (!/^[A-Z0-9]{2,10}$/.test(ticker)) {
    throw new Error("Ticker inválido");
  }

  const data = await getQuotes();
  const all = [
    ...(data.stocks || []),
    ...(data.bdrs || []),
    ...(data.fiis || []),
    ...(data.goldEtf || []),
  ];
  const found = all.find((q) => q.symbol === ticker);
  if (found) {
    return {
      symbol: found.symbol,
      shortName: found.name,
      regularMarketPrice: found.price,
      regularMarketChangePercent: found.changePct,
    };
  }

  // Não estava na base pré-carregada — tenta ao vivo.
  const r = await fetch(`${WORKER_URL}/quote/${encodeURIComponent(ticker)}`);
  if (!r.ok) {
    throw new Error("Ativo não encontrado");
  }
  return r.json();
}