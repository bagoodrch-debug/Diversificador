import { el, qs, clear } from "../core/dom.js";
import { brl, parseCurrencyInput, formatCurrencyInput, formatUpdatedAt } from "../core/format.js";
import { KEYS as STORE_KEYS, load, save } from "../core/store.js";
import { ASSETS, DEFAULT_ALLOC, DEFAULT_TOTAL } from "../data/categorias.data.js";
import { normalizeTo100, redistribute, buildSuggestions } from "../services/alocacao-service.js";
import { getQuotes } from "../services/api.js";
import { initDonut } from "../components/grafico-canvas.js";
import { renderSuggestions } from "../components/tabela-ativos.js";
import { refreshSVG } from "../components/loading.js";
import { showToast } from "../components/toast.js";

const state = {
  total: DEFAULT_TOTAL,
  alloc: { ...DEFAULT_ALLOC },
  customAssets: {},
  excluded: {},
  quotes: null,
  quotesLoading: true,
  quotesError: null,
  quotesUpdatedAt: null,
};

function loadPersisted() {
  const persisted = load(STORE_KEYS.ALLOC);
  if (persisted) {
    if (typeof persisted.total === "number") state.total = persisted.total;
    if (persisted.alloc) state.alloc = normalizeTo100({ ...DEFAULT_ALLOC, ...persisted.alloc }, "rf");
  }
  state.customAssets = load(STORE_KEYS.CUSTOM, {}) || {};
  state.excluded = load(STORE_KEYS.EXCLUDED, {}) || {};
}

function persistAlloc() {
  save(STORE_KEYS.ALLOC, { total: state.total, alloc: state.alloc });
}
function persistCustom() {
  save(STORE_KEYS.CUSTOM, state.customAssets);
}
function persistExcluded() {
  save(STORE_KEYS.EXCLUDED, state.excluded);
}

let fullRenderTimer = null;
/** Agenda a reconstrução pesada (sugestões) para depois que o arraste parar. */
function scheduleFullRender(root, delay = 150) {
  clearTimeout(fullRenderTimer);
  fullRenderTimer = setTimeout(() => renderAssetCards(root), delay);
}
function cancelScheduledFullRender() {
  clearTimeout(fullRenderTimer);
  fullRenderTimer = null;
}

function sliderBackgroundSize(pct) {
  return `${Math.max(0, Math.min(100, pct))}% 100%`;
}

/**
 * Atualiza só os números e a barrinha de cada card (leve, roda a cada pixel
 * do arraste). As sugestões (parte pesada) ficam intactas até o próximo
 * render completo — isso é o que deixa o slider liso.
 */
function updateLightweight(root) {
  ASSETS.forEach((asset) => {
    const card = qs(`[data-asset="${asset.key}"]`, root);
    if (!card) return;
    const pct = state.alloc[asset.key];
    const value = (pct / 100) * state.total;

    card.dataset.active = String(pct > 0);

    const pctInput = qs(".asset-card__pct input", card);
    if (pctInput && document.activeElement !== pctInput) {
      pctInput.value = pct.toFixed(1).replace(".", ",");
    }

    const slider = qs(".slider", card);
    if (slider) {
      slider.value = String(pct);
      slider.style.backgroundSize = sliderBackgroundSize(pct);
    }

    const valueEl = qs(".asset-card__value", card);
    if (valueEl) valueEl.textContent = brl(value);
  });
  renderComposition(root);
}

export function initSimuladorPage() {
  const root = qs("#simulador-root");
  if (!root) return;
  loadPersisted();
  render(root);
  fetchQuotes(root);
}

async function fetchQuotes(root) {
  state.quotesLoading = true;
  updateStatus(root);
  try {
    const data = await getQuotes();
    state.quotes = data;
    state.quotesUpdatedAt = data.updatedAt;
    state.quotesError = null;
  } catch (e) {
    state.quotesError = e instanceof Error ? e.message : "Erro ao buscar cotações";
    showToast("Não foi possível carregar as cotações agora. Tente novamente em instantes.", { type: "error" });
  } finally {
    state.quotesLoading = false;
    updateStatus(root);
    renderAssetCards(root);
  }
}

function render(root) {
  clear(root);

  // Card do valor total
  const totalCard = el("section", { class: "card total-card" }, [
    el("label", { for: "total-input" }, "Valor total a investir"),
    el("input", {
      id: "total-input",
      inputmode: "numeric",
      value: formatCurrencyInput(state.total),
      onFocus: (e) => e.target.select(),
      onInput: (e) => {
        const parsed = parseCurrencyInput(e.target.value);
        state.total = parsed;
        e.target.value = formatCurrencyInput(parsed);
        persistAlloc();
        renderAssetCards(root);
        renderComposition(root);
      },
    }),
  ]);
  root.append(totalCard);

  const grid = el("div", { class: "sim__grid" });
  root.append(grid);

  const assetsSection = el("section", { class: "sim__assets" });
  const toolbar = el("div", { class: "sim__assets-toolbar" }, [
    el("h2", {}, "Distribuição"),
    el("div", { class: "sim__assets-toolbar-actions", id: "sim-toolbar-actions" }),
  ]);
  assetsSection.append(toolbar);
  assetsSection.append(el("div", { id: "asset-cards" }));
  grid.append(assetsSection);

  const compositionSection = el("section", { class: "card composition-card" }, [
    el("h2", {}, "Composição"),
    el("div", { class: "donut-wrap" }, el("canvas", { id: "donut-canvas" })),
    el("div", { class: "composition-total" }, [
      el("div", { class: "label" }, "Total"),
      el("div", { class: "value tabular-nums", id: "composition-total-value" }, brl(state.total)),
    ]),
    el("ul", { class: "composition-legend", id: "composition-legend" }),
  ]);
  grid.append(compositionSection);

  root.append(
    el("footer", { class: "sim__disclaimer" }, [
      el(
        "p",
        {},
        "Este site tem fins educacionais e de simulação pessoal. As informações e sugestões apresentadas não constituem recomendação de investimento nem consultoria financeira.",
      ),
      el("p", {}, "Os valores são salvos automaticamente neste navegador."),
    ]),
  );

  renderToolbarActions(root);
  renderAssetCards(root);
  root._donut = initDonut(qs("#donut-canvas", root));
  renderComposition(root);
}

function renderToolbarActions(root) {
  const host = qs("#sim-toolbar-actions", root);
  clear(host);
  const statusBtn = el(
    "button",
    {
      type: "button",
      class: "pill",
      id: "quotes-status",
      title: "Atualizar cotações",
      onClick: () => fetchQuotes(root),
    },
    [el("span", { html: refreshSVG(12, state.quotesLoading) }), " ", el("span", { id: "quotes-status-label" }, statusLabel())],
  );
  const resetBtn = el(
    "button",
    {
      type: "button",
      class: "btn btn--outline btn--sm",
      onClick: () => {
        state.alloc = { ...DEFAULT_ALLOC };
        persistAlloc();
        renderAssetCards(root);
        renderComposition(root);
      },
    },
    ["↺ Distribuir igualmente"],
  );
  host.append(statusBtn, resetBtn);
}

function statusLabel() {
  if (state.quotesUpdatedAt) {
    const t = formatUpdatedAt(state.quotesUpdatedAt);
    return t ? `Atualizado às ${t}` : "Atualizado";
  }
  return state.quotesLoading ? "Carregando cotações…" : "Cotações indisponíveis";
}

function updateStatus(root) {
  const label = qs("#quotes-status-label", root);
  const btn = qs("#quotes-status", root);
  if (label) label.textContent = statusLabel();
  if (btn) {
    const icon = qs("svg", btn);
    if (icon) icon.outerHTML = refreshSVG(12, state.quotesLoading);
  }
}

function renderAssetCards(root) {
  const host = qs("#asset-cards", root);
  clear(host);
  ASSETS.forEach((asset) => {
    host.append(buildAssetCard(root, asset));
  });
}

function buildAssetCard(root, asset) {
  const pct = state.alloc[asset.key];
  const value = (pct / 100) * state.total;
  const active = pct > 0;

  const pctInput = el("input", {
    value: pct.toFixed(1).replace(".", ","),
    onFocus: (e) => e.target.select(),
    onKeydown: (e) => {
      if (e.key === "Enter") e.target.blur();
    },
    onBlur: (e) => {
      const n = parseFloat(e.target.value.replace(",", "."));
      if (Number.isFinite(n)) {
        state.alloc = redistribute(state.alloc, asset.key, n);
        persistAlloc();
        renderAssetCards(root);
        renderComposition(root);
      } else {
        e.target.value = pct.toFixed(1).replace(".", ",");
      }
    },
  });

  const slider = el("input", {
    type: "range",
    class: "slider",
    min: "0",
    max: "100",
    step: "0.5",
    value: String(pct),
    style: `--asset-color:${asset.color}; background-size:${sliderBackgroundSize(pct)}`,
    onInput: (e) => {
      state.alloc = redistribute(state.alloc, asset.key, parseFloat(e.target.value));
      persistAlloc();
      updateLightweight(root);
      scheduleFullRender(root);
    },
    onChange: () => {
      // Soltou o slider: garante que as sugestões fiquem com os números finais.
      cancelScheduledFullRender();
      renderAssetCards(root);
    },
  });

  const suggestionsHost = el("div", { class: "suggestions" });

  const card = el(
    "div",
    { class: "card asset-card", "data-active": String(active), "data-asset": asset.key },
    [
      el("div", { class: "asset-card__top" }, [
        el("div", { class: "asset-card__label" }, [
          el("span", { class: "asset-card__dot", style: `background:${asset.color}` }),
          el("span", { class: "asset-card__name" }, asset.name),
        ]),
        el("div", { class: "asset-card__controls" }, [
          el("div", { class: "asset-card__pct" }, [pctInput, el("span", {}, "%")]),
          el(
            "button",
            {
              type: "button",
              class: "icon-btn",
              "aria-label": `Zerar ${asset.name}`,
              onClick: () => {
                state.alloc = redistribute(state.alloc, asset.key, 0);
                persistAlloc();
                renderAssetCards(root);
                renderComposition(root);
              },
            },
            "✕",
          ),
        ]),
      ]),
      el("div", { class: "asset-card__slider" }, slider),
      el("div", { class: "asset-card__value tabular-nums" }, brl(value)),
      suggestionsHost,
    ],
  );

  const items = buildSuggestions(asset.key, state.quotes);
  renderSuggestions(
    suggestionsHost,
    asset.key,
    value,
    {
      items,
      customAssets: state.customAssets[asset.key] ?? [],
      excluded: state.excluded[asset.key] ?? [],
      loading: state.quotesLoading,
      error: state.quotesError,
    },
    {
      onAddCustom: (a) => {
        const list = state.customAssets[asset.key] ?? [];
        if (list.some((x) => x.ticker && x.ticker === a.ticker)) return;
        state.customAssets = { ...state.customAssets, [asset.key]: [...list, a] };
        persistCustom();
        renderAssetCards(root);
      },
      onRemoveCustom: (id) => {
        const list = state.customAssets[asset.key] ?? [];
        state.customAssets = { ...state.customAssets, [asset.key]: list.filter((x) => x.id !== id) };
        persistCustom();
        renderAssetCards(root);
      },
      onToggleExclude: (ticker) => {
        const list = state.excluded[asset.key] ?? [];
        const next = list.includes(ticker) ? list.filter((t) => t !== ticker) : [...list, ticker];
        state.excluded = { ...state.excluded, [asset.key]: next };
        persistExcluded();
        renderAssetCards(root);
      },
    },
  );

  return card;
}

function renderComposition(root) {
  const legend = qs("#composition-legend", root);
  clear(legend);
  const chartData = ASSETS.map((a) => ({
    name: a.name,
    value: state.alloc[a.key],
    color: a.color,
    key: a.key,
  }));
  root._donut?.setData(chartData);
  qs("#composition-total-value", root).textContent = brl(state.total);

  chartData.forEach((d) => {
    const value = (d.value / 100) * state.total;
    legend.append(
      el("li", { style: d.value > 0 ? "" : "opacity:.5" }, [
        el("span", { class: "name" }, [el("span", { class: "dot", style: `background:${d.color}` }), d.name]),
        el("span", { class: "amounts" }, [
          el("span", { class: "pct tabular-nums" }, `${d.value.toFixed(1)}%`),
          el("span", { class: "val tabular-nums" }, brl(value)),
        ]),
      ]),
    );
  });
}
