// Camada de acesso a dados do site.
//
// IMPORTANTE SOBRE SEGURANÇA DA CHAVE DA BRAPI:
// Este é um site 100% estático (GitHub Pages). Qualquer chamada feita direto
// do navegador para a Brapi exigiria colocar o token no JS público — e nesse
// caso ele ficaria visível para qualquer visitante (F12 > Network resolve
// isso em segundos). Por isso este site NUNCA chama a Brapi a partir do
// navegador.
//
// Em vez disso, um workflow do GitHub Actions (.github/workflows/atualizar-
// cotacoes.yml) roda periodicamente NO SERVIDOR do GitHub, usando o token
// guardado em Settings > Secrets (nunca aparece no código), busca as cotações
// e grava o resultado em dados/cotacoes.json — um arquivo público, mas sem
// nenhuma credencial dentro dele. O site só lê esse arquivo.
//
// Veja scripts/atualizar-cotacoes.mjs para a lógica que gera esse arquivo.

const DATA_URL = "dados/cotacoes.json";
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
 * Busca um ticker dentro da base já carregada (ações, BDRs, FIIs, ETF de
 * ouro). Como o site não pode chamar a Brapi ao vivo sem expor o token, a
 * busca funciona sobre os ativos que o workflow já acompanha. Qualquer coisa
 * fora dessa lista pode ser adicionada manualmente pelo usuário.
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
  if (!found) {
    throw new Error("Ativo não encontrado na base acompanhada pelo site");
  }
  return {
    symbol: found.symbol,
    shortName: found.name,
    regularMarketPrice: found.price,
    regularMarketChangePercent: found.changePct,
  };
}
