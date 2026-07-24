// Roda em Node (GitHub Actions), NUNCA no navegador.
// Lê o token da Brapi de uma variável de ambiente (GitHub Secret) e grava
// dados/cotacoes.json — um arquivo público, mas sem nenhuma credencial nele.
//
// Observação: os tickers acompanhados aqui espelham
// js/data/ativos.data.js (mantidos separados de propósito para que este
// script funcione de forma independente, sem depender de resolução de
// módulos ESM/CJS entre ambientes diferentes). Se adicionar um ticker em um
// arquivo, adicione no outro também.

const TOKEN = process.env.BRAPI_TOKEN;
if (!TOKEN) {
  console.error("BRAPI_TOKEN não definido. Configure em Settings > Secrets and variables > Actions.");
  process.exit(1);
}

const BRAPI = "https://brapi.dev/api";
const TROY_OUNCE_G = 31.1034768;

const STOCK_TICKERS = ["PETR4", "ITUB4", "VALE3", "WEGE3", "BBAS3", "BBDC4", "ABEV3"];
const BDR_TICKERS = ["IVVB11", "AAPL34", "MSFT34", "GOGL34", "AMZO34"];
const FII_TICKERS = ["HGLG11", "KNRI11", "MXRF11", "XPML11", "VISC11"];
const GOLD_ETF_TICKER = "GOLD11";

async function fetchBrapiOne(ticker) {
  const url = `${BRAPI}/quote/${encodeURIComponent(ticker)}?token=${encodeURIComponent(TOKEN)}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`brapi ${ticker} ${r.status}`);
  const j = await r.json();
  const item = j.results?.[0];
  if (!item) return null;
  return {
    symbol: item.symbol,
    price: item.regularMarketPrice ?? 0,
    changePct: item.regularMarketChangePercent ?? null,
    name: item.longName ?? item.shortName ?? null,
  };
}

async function fetchBrapi(tickers) {
  const settled = await Promise.allSettled(tickers.map(fetchBrapiOne));
  const out = [];
  const errors = [];
  settled.forEach((s, i) => {
    if (s.status === "fulfilled" && s.value) out.push(s.value);
    else errors.push(`${tickers[i]}: ${s.reason?.message ?? s.reason}`);
  });
  return { out, errors };
}

async function fetchGold() {
  const r = await fetch("https://economia.awesomeapi.com.br/json/last/XAU-BRL", {
    headers: { "User-Agent": "DistribuiRico/1.0" },
  });
  if (!r.ok) throw new Error(`gold ${r.status}`);
  const j = await r.json();
  const ounce = parseFloat(j.XAUBRL.bid);
  return {
    pricePerOunceBRL: ounce,
    pricePerGramBRL: ounce / TROY_OUNCE_G,
    updatedAt: j.XAUBRL.create_date,
  };
}

// Renda Fixa: o site oficial do Tesouro Direto passou a bloquear chamadas
// automatizadas (proteção anti-robô da Cloudflare, aconteceu com todo mundo
// que faz esse tipo de integração, não só com a gente). Em vez de brigar com
// isso, usamos o "sandbox" público da API de Tesouro Direto da Brapi: 3
// títulos fixos (um de cada tipo — Selic, Prefixado, IPCA+) que funcionam
// sem token e sem exigir plano pago. Ver:
// https://brapi.dev/blog/api-tesouro-direto-brasil-como-consultar-2026
const TREASURY_SANDBOX_SYMBOLS = [
  "tesouro-selic-01032031",
  "tesouro-prefixado-com-juros-semestrais-01012037",
  "tesouro-ipca-com-juros-semestrais-15082060",
];

function treasuryTypeLabel(item) {
  switch (item.rateInfo?.rateType) {
    case "spreadOverSelic":
      return "Pós-fixado (Selic + spread)";
    case "nominalAnnualRate":
      return "Prefixado (taxa nominal)";
    case "realAnnualRateOverIpca":
      return "Híbrido (IPCA + taxa real)";
    default:
      return item.bondType ?? "Tesouro Direto";
  }
}

async function fetchTreasury() {
  const symbols = TREASURY_SANDBOX_SYMBOLS.join(",");
  const r = await fetch(`https://brapi.dev/api/v2/treasury/indicators?symbols=${encodeURIComponent(symbols)}`);
  if (!r.ok) throw new Error(`treasury ${r.status}`);
  const j = await r.json();
  return (j.results || []).map((item) => ({
    name: `${item.bondType ?? "Tesouro Direto"} ${item.maturityDate?.slice(0, 4) ?? ""}`.trim(),
    rate: item.buyRate,
    unitPrice: item.buyPrice,
    minAmount: item.buyPrice * 0.01,
    maturity: item.maturityDate ?? null,
    type: treasuryTypeLabel(item),
  }));
}

async function safe(label, promise, fallback, errors) {
  try {
    return await promise;
  } catch (e) {
    errors.push(`${label}: ${e instanceof Error ? e.message : String(e)}`);
    return fallback;
  }
}

async function main() {
  const errors = [];

  const stocksR = await safe("stocks", fetchBrapi(STOCK_TICKERS), { out: [], errors: [] }, errors);
  const bdrsR = await safe("bdrs", fetchBrapi(BDR_TICKERS), { out: [], errors: [] }, errors);
  const fiisR = await safe("fiis", fetchBrapi(FII_TICKERS), { out: [], errors: [] }, errors);
  const goldEtfR = await safe("goldEtf", fetchBrapi([GOLD_ETF_TICKER]), { out: [], errors: [] }, errors);
  const gold = await safe("gold", fetchGold(), null, errors);
  const treasury = await safe("treasury", fetchTreasury(), [], errors);

  [stocksR, bdrsR, fiisR, goldEtfR].forEach((r) => errors.push(...r.errors));

  const payload = {
    updatedAt: new Date().toISOString(),
    stocks: stocksR.out,
    bdrs: bdrsR.out,
    fiis: fiisR.out,
    goldEtf: goldEtfR.out,
    gold,
    treasury,
    errors,
  };

  const fs = await import("node:fs/promises");
  await fs.mkdir("dados", { recursive: true });
  await fs.writeFile("dados/cotacoes.json", JSON.stringify(payload, null, 2) + "\n", "utf8");

  console.log("dados/cotacoes.json atualizado.");
  if (errors.length) console.warn("Avisos:", errors);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
