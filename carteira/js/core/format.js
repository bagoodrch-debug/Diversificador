// Formatação de moeda, números e datas em pt-BR.

export function brl(value) {
  return (value || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/** Converte string de input (dígitos) em número decimal — igual ao campo "Valor total". */
export function parseCurrencyInput(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

export function formatCurrencyInput(value) {
  return brl(value);
}

export function pct(value, decimals = 1) {
  return `${value.toFixed(decimals).replace(".", ",")}%`;
}

/** Normaliza taxas que podem vir como fração (0.0682) ou percentual (6.82). */
export function ratePct(rate) {
  const p = rate > 1 ? rate : rate * 100;
  return `${p.toFixed(2).replace(".", ",")}% a.a.`;
}

export function formatMaturity(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString("pt-BR");
}

export function formatUpdatedAt(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}
