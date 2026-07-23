import { el, clear, qs } from "../core/dom.js";
import { brl } from "../core/format.js";
import { customToSuggestion } from "../services/alocacao-service.js";
import { lookupTicker } from "../services/api.js";
import { spinnerSVG } from "./loading.js";

const SEARCHABLE = new Set(["acoes", "fii", "exterior"]);

/**
 * Renderiza o bloco de sugestões de uma classe de ativo dentro de `container`.
 * `state` = { items, customAssets, excluded, loading, error }
 * `handlers` = { onAddCustom, onRemoveCustom, onToggleExclude }
 */
export function renderSuggestions(container, assetKey, allocatedValue, state, handlers) {
  clear(container);
  const supportsCustom = SEARCHABLE.has(assetKey);

  const combined = [
    ...state.items.map((item) => ({ item, excluded: state.excluded.includes(item.ticker) })),
    ...state.customAssets.map((c) => ({
      item: customToSuggestion(c),
      custom: c,
      excluded: state.excluded.includes(c.ticker || c.name),
    })),
  ];
  const activeCount = combined.filter((c) => !c.excluded).length;
  const perItemAllocated = activeCount > 0 ? allocatedValue / activeCount : 0;

  const head = el("div", { class: "suggestions__head" }, [
    el("h3", {}, "Sugestões"),
    el(
      "span",
      { class: "tag" },
      state.loading && state.items.length === 0
        ? "Carregando…"
        : state.error
        ? "Erro"
        : "Dados de mercado",
    ),
  ]);
  container.append(head);

  if (state.error && state.items.length === 0) {
    container.append(el("p", { class: "disclaimer", style: "color:var(--color-destructive);margin-bottom:8px" }, state.error));
  }
  if (!state.error && combined.length === 0 && !state.loading) {
    container.append(el("p", { class: "disclaimer", style: "margin-bottom:8px" }, "Sem cotações disponíveis no momento."));
  }

  const list = el("ul");
  combined.forEach(({ item: s, custom, excluded }) => {
    const minFraction = s.minFraction ?? 1;
    const unit = s.unit ?? "cota";
    const unitPlural = s.unitPlural ?? `${unit}s`;
    const itemAllocated = excluded ? 0 : perItemAllocated;
    const rawQty = s.price > 0 ? itemAllocated / s.price : 0;
    const qty = Math.floor(rawQty / minFraction) * minFraction;
    const decimals = minFraction < 1 ? 2 : 0;
    const qtyLabel = qty.toLocaleString("pt-BR", {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    const unitLabel = qty === 1 ? unit : unitPlural;

    const li = el("li", { class: "suggestion-item", "data-excluded": String(excluded) }, [
      el("div", { style: "min-width:0" }, [
        el("div", { style: "display:flex;align-items:baseline;gap:8px" }, [
          el("span", { class: "suggestion-item__ticker" }, s.ticker),
          el("span", { class: "suggestion-item__name" }, s.name),
        ]),
        el("div", { class: "suggestion-item__meta" }, s.sector),
        el("div", { class: "suggestion-item__metric" }, s.metric),
        !excluded && activeCount > 1
          ? el("div", { class: "suggestion-item__alloc" }, `Alocado: ${brl(itemAllocated)}`)
          : null,
      ]),
      el("div", { class: "suggestion-item__right" }, [
        el("div", {}, [
          el("div", { class: "suggestion-item__price" }, brl(s.price)),
          el("div", { class: "suggestion-item__qty" }, `~${qtyLabel} ${unitLabel}`),
        ]),
        custom
          ? el("button", {
              type: "button",
              class: "icon-btn icon-btn--danger",
              "aria-label": `Remover ${s.ticker}`,
              onClick: () => handlers.onRemoveCustom(custom.id),
              html: trashSVG(),
            })
          : el("button", {
              type: "button",
              class: "icon-btn icon-btn--danger",
              "aria-label": excluded ? `Reincluir ${s.ticker}` : `Excluir ${s.ticker}`,
              title: excluded ? "Reincluir" : "Excluir da simulação",
              onClick: () => handlers.onToggleExclude(s.ticker),
              html: closeSVG(),
            }),
      ]),
    ]);
    list.append(li);
  });
  container.append(list);

  if (supportsCustom) {
    const formHost = el("div", { style: "margin-top:12px" });
    container.append(formHost);
    renderAddButtonOrForm(formHost, assetKey, handlers);
  }

  container.append(
    el(
      "p",
      { class: "disclaimer", style: "margin-top:8px" },
      "Estas sugestões têm caráter meramente informativo e educacional. Não constituem recomendação de investimento. Rentabilidade passada não garante rentabilidade futura. Consulte um profissional certificado antes de investir.",
    ),
  );
  if (supportsCustom && state.customAssets.length > 0) {
    container.append(
      el(
        "p",
        { class: "disclaimer", style: "margin-top:4px" },
        "Ativos adicionados por você são escolha sua, não recomendação da plataforma.",
      ),
    );
  }
}

function renderAddButtonOrForm(host, assetKey, handlers) {
  clear(host);
  host.append(
    el(
      "button",
      {
        type: "button",
        class: "pill",
        style: "border-style:dashed",
        onClick: () => renderForm(host, assetKey, handlers),
      },
      ["+ Adicionar ativo"],
    ),
  );
}

function renderForm(host, assetKey, handlers) {
  clear(host);
  const searchEnabled = SEARCHABLE.has(assetKey);
  let mode = searchEnabled ? "search" : "manual";

  const form = el("div", { class: "add-asset-form" });
  host.append(form);

  function draw() {
    clear(form);
    if (mode === "search" && searchEnabled) {
      form.append(buildSearchMode());
    } else {
      form.append(buildManualMode());
    }
  }

  function buildSearchMode() {
    const wrap = el("div");
    const tickerInput = el("input", {
      class: "field",
      placeholder: "Ex: PETR4, MXRF11, AAPL34",
      style: "text-transform:uppercase",
    });
    const searchBtn = el("button", { type: "button", class: "btn btn--primary btn--sm" }, "Buscar");
    const errorBox = el("div");
    const previewBox = el("div");

    tickerInput.addEventListener("input", () => {
      tickerInput.value = tickerInput.value.toUpperCase();
    });
    tickerInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        doSearch();
      }
    });
    searchBtn.addEventListener("click", doSearch);

    async function doSearch() {
      const t = tickerInput.value.trim();
      if (!t) return;
      clear(errorBox);
      clear(previewBox);
      searchBtn.disabled = true;
      searchBtn.innerHTML = spinnerSVG(13);
      try {
        const res = await lookupTicker(t);
        previewBox.append(buildPreview(res));
      } catch {
        errorBox.append(
          el(
            "p",
            { class: "error" },
            "Ativo não encontrado. Tente novamente ou adicione manualmente.",
          ),
        );
      } finally {
        searchBtn.disabled = false;
        searchBtn.textContent = "Buscar";
      }
    }

    function buildPreview(res) {
      return el("div", { class: "preview" }, [
        el("div", { style: "min-width:0" }, [
          el("div", { style: "font-weight:600;font-size:14px" }, res.symbol),
          el("div", { class: "suggestion-item__name" }, res.shortName ?? "—"),
          res.regularMarketChangePercent != null
            ? el(
                "div",
                { style: "font-size:12px;margin-top:2px" },
                `Variação: ${res.regularMarketChangePercent >= 0 ? "+" : ""}${res.regularMarketChangePercent.toFixed(2)}%`,
              )
            : null,
        ]),
        el("div", { style: "text-align:right" }, [
          el("div", { class: "suggestion-item__price" }, brl(res.regularMarketPrice)),
          el(
            "button",
            {
              type: "button",
              class: "btn btn--primary btn--sm",
              style: "margin-top:4px",
              onClick: () => {
                handlers.onAddCustom({
                  id: crypto.randomUUID(),
                  ticker: res.symbol,
                  name: res.shortName ?? res.symbol,
                  price: res.regularMarketPrice,
                  metric:
                    res.regularMarketChangePercent != null
                      ? `Variação do dia: ${res.regularMarketChangePercent >= 0 ? "+" : ""}${res.regularMarketChangePercent.toFixed(2)}%`
                      : undefined,
                  source: "brapi",
                });
              },
            },
            "Adicionar",
          ),
        ]),
      ]);
    }

    wrap.append(
      el("label", {}, "Buscar por ticker"),
      el("div", { class: "row" }, [tickerInput, searchBtn]),
      errorBox,
      previewBox,
      el("div", { class: "form-actions" }, [
        el(
          "button",
          { type: "button", class: "btn btn--ghost btn--sm", onClick: () => { mode = "manual"; draw(); } },
          "Prefiro adicionar manualmente",
        ),
        el(
          "button",
          { type: "button", class: "btn btn--ghost btn--sm", onClick: () => renderAddButtonOrForm(host, assetKey, handlers) },
          "Cancelar",
        ),
      ]),
    );
    return wrap;
  }

  function buildManualMode() {
    const wrap = el("div");
    const nameInput = el("input", { class: "field", placeholder: "Nome do ativo" });
    const tickerInput = el("input", { class: "field", placeholder: "Ticker (opcional)" });
    const priceInput = el("input", { class: "field", placeholder: "R$ 0,00", inputmode: "numeric" });

    const addBtn = el(
      "button",
      {
        type: "button",
        class: "btn btn--primary btn--sm",
        onClick: () => {
          const price = parseCurrencyLike(priceInput.value);
          if (!nameInput.value.trim() || price <= 0) return;
          handlers.onAddCustom({
            id: crypto.randomUUID(),
            ticker: tickerInput.value.trim().toUpperCase() || nameInput.value.trim().slice(0, 8).toUpperCase(),
            name: nameInput.value.trim(),
            price,
            source: "manual",
          });
        },
      },
      "Adicionar",
    );

    priceInput.addEventListener("input", () => {
      priceInput.value = brl(parseCurrencyLike(priceInput.value));
    });

    wrap.append(
      el("label", {}, "Adicionar manualmente"),
      el("div", { style: "display:flex;flex-direction:column;gap:8px;margin-top:6px" }, [nameInput, tickerInput, priceInput]),
      el("div", { class: "form-actions" }, [
        searchEnabled
          ? el(
              "button",
              { type: "button", class: "btn btn--ghost btn--sm", onClick: () => { mode = "search"; draw(); } },
              "← Voltar para busca",
            )
          : el("span"),
        el("div", { style: "display:flex;gap:8px" }, [
          el(
            "button",
            { type: "button", class: "btn btn--ghost btn--sm", onClick: () => renderAddButtonOrForm(host, assetKey, handlers) },
            "Cancelar",
          ),
          addBtn,
        ]),
      ]),
    );
    return wrap;
  }

  draw();
}

function parseCurrencyLike(raw) {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (!digits) return 0;
  return parseInt(digits, 10) / 100;
}

function closeSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg>`;
}
function trashSVG() {
  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0-1 14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 6"/></svg>`;
}
