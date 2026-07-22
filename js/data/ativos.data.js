// Universo de tickers acompanhados pelo site + metadados (setor / nome longo).
// Este arquivo é a fonte única usada tanto pelo site (browser) quanto pelo
// script Node (scripts/atualizar-cotacoes.mjs) que roda no GitHub Actions.
// Para acompanhar um novo ticker, basta adicioná-lo na lista correspondente.

export const STOCK_TICKERS = ["PETR4", "ITUB4", "VALE3", "WEGE3", "BBAS3", "BBDC4", "ABEV3"];
export const BDR_TICKERS = ["IVVB11", "AAPL34", "MSFT34", "GOGL34", "AMZO34"];
export const FII_TICKERS = ["HGLG11", "KNRI11", "MXRF11", "XPML11", "VISC11"];
export const GOLD_ETF_TICKER = "GOLD11";

export const META = {
  PETR4: { sector: "Petróleo & Gás", longName: "Petrobras PN" },
  ITUB4: { sector: "Bancos", longName: "Itaú Unibanco PN" },
  VALE3: { sector: "Mineração", longName: "Vale ON" },
  WEGE3: { sector: "Bens Industriais", longName: "WEG ON" },
  BBAS3: { sector: "Bancos", longName: "Banco do Brasil ON" },
  BBDC4: { sector: "Bancos", longName: "Bradesco PN" },
  ABEV3: { sector: "Bebidas", longName: "Ambev ON" },
  IVVB11: { sector: "ETF S&P 500 (BRL)", longName: "iShares S&P 500" },
  AAPL34: { sector: "BDR - Tecnologia (EUA)", longName: "Apple Inc." },
  MSFT34: { sector: "BDR - Tecnologia (EUA)", longName: "Microsoft" },
  GOGL34: { sector: "BDR - Tecnologia (EUA)", longName: "Alphabet (Google)" },
  AMZO34: { sector: "BDR - Consumo (EUA)", longName: "Amazon" },
  HGLG11: { sector: "FII Logística (tijolo)", longName: "CSHG Logística" },
  KNRI11: { sector: "FII Híbrido (tijolo)", longName: "Kinea Renda Imobiliária" },
  MXRF11: { sector: "FII Papel (CRI)", longName: "Maxi Renda" },
  XPML11: { sector: "FII Shoppings (tijolo)", longName: "XP Malls" },
  VISC11: { sector: "FII Shoppings (tijolo)", longName: "Vinci Shopping Centers" },
  GOLD11: { sector: "ETF Ouro (B3)", longName: "Trend ETF Ouro" },
};
