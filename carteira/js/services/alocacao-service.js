// Lógica de alocação: redistribuição proporcional entre classes de ativos.
// Portado 1:1 da versão React original (PortfolioAllocator.tsx).

import { ASSETS } from "../data/categorias.data.js";
import { META } from "../data/ativos.data.js";
import { ratePct, formatMaturity } from "../core/format.js";

const KEYS = ASSETS.map((a) => a.key);

/** Garante que as porcentagens somem exatamente 100, ajustando a maior entrada não-alvo. */
export function normalizeTo100(alloc, pinned) {
  const rounded = { ...alloc };
  KEYS.forEach((k) => {
    rounded[k] = Math.max(0, Math.min(100, Math.round(rounded[k] * 100) / 100));
  });
  const sum = KEYS.reduce((a, k) => a + rounded[k], 0);
  const diff = Math.round((100 - sum) * 100) / 100;
  if (Math.abs(diff) < 0.005) return rounded;

  const others = KEYS.filter((k) => k !== pinned);
  const candidate =
    others
      .filter((k) => rounded[k] + diff >= 0 && rounded[k] + diff <= 100)
      .sort((a, b) => rounded[b] - rounded[a])[0] ?? others[0];
  rounded[candidate] = Math.round((rounded[candidate] + diff) * 100) / 100;
  return rounded;
}

/** Redistribui para que o alvo termine em newValue, ajustando os demais proporcionalmente. */
export function redistribute(current, target, newValue) {
  const clamped = Math.max(0, Math.min(100, newValue));
  const oldValue = current[target];
  const delta = clamped - oldValue;
  const next = { ...current, [target]: clamped };

  if (delta === 0) return normalizeTo100(next, target);

  const others = KEYS.filter((k) => k !== target);

  if (delta > 0) {
    let remaining = delta;
    for (let iter = 0; iter < 8 && remaining > 1e-6; iter++) {
      const active = others.filter((k) => next[k] > 0);
      if (active.length === 0) break;
      const total = active.reduce((s, k) => s + next[k], 0);
      if (total <= 0) break;
      let cutThisRound = 0;
      for (const k of active) {
        const share = (next[k] / total) * remaining;
        const applied = Math.min(next[k], share);
        next[k] -= applied;
        cutThisRound += applied;
      }
      remaining -= cutThisRound;
      if (cutThisRound < 1e-9) break;
    }
  } else {
    const freed = -delta;
    const active = others.filter((k) => next[k] > 0);
    if (active.length === 0) {
      const share = freed / others.length;
      for (const k of others) next[k] += share;
    } else {
      const total = active.reduce((s, k) => s + next[k], 0);
      for (const k of active) {
        next[k] += (next[k] / total) * freed;
      }
    }
  }

  return normalizeTo100(next, target);
}

function toStockSuggestion(q) {
  const m = META[q.symbol] || {};
  return {
    ticker: q.symbol,
    name: m.longName ?? q.name ?? q.symbol,
    sector: m.sector ?? "—",
    metric:
      q.changePct != null
        ? `Variação do dia: ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`
        : "Preço em tempo quase-real",
    price: q.price,
    unit: "cota",
    unitPlural: "cotas",
  };
}

/** Monta a lista de sugestões de ativos para uma classe, a partir do payload de cotações. */
export function buildSuggestions(key, data) {
  if (!data) return [];
  switch (key) {
    case "rf":
      return (data.treasury || []).map((b) => ({
        ticker: b.name,
        name: b.name,
        sector: b.type ?? "Tesouro Direto",
        metric: `Taxa: ${ratePct(b.rate)}${b.maturity ? " · Venc. " + formatMaturity(b.maturity) : ""}`,
        price: b.unitPrice,
        minFraction: 0.01,
        unit: "título",
        unitPlural: "títulos",
      }));
    case "acoes":
      return (data.stocks || []).map(toStockSuggestion);
    case "exterior":
      return (data.bdrs || []).map(toStockSuggestion);
    case "fii":
      return (data.fiis || []).map(toStockSuggestion);
    case "ouro": {
      const items = [];
      if (data.gold) {
        items.push({
          ticker: "Ouro spot (XAU)",
          name: "Ouro físico (referência internacional)",
          sector: "Cotação spot em BRL/grama",
          metric: `Onça troy: ${data.gold.pricePerOunceBRL.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}`,
          price: data.gold.pricePerGramBRL,
          minFraction: 0.01,
          unit: "grama",
          unitPlural: "gramas",
        });
      }
      for (const etf of data.goldEtf || []) items.push(toStockSuggestion(etf));
      return items;
    }
    default:
      return [];
  }
}

export function customToSuggestion(c) {
  return {
    ticker: c.ticker || c.name,
    name: c.name,
    sector: c.source === "manual" ? "Adicionado manualmente" : "Adicionado pelo usuário",
    metric: c.metric ?? "Ativo personalizado",
    price: c.price,
    unit: "cota",
    unitPlural: "cotas",
  };
}
