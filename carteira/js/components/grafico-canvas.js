// Gráfico de rosca (donut) da composição da carteira, desenhado em <canvas>.

function resolveColor(cssVarOrColor) {
  if (!cssVarOrColor.startsWith("var(")) return cssVarOrColor;
  const name = cssVarOrColor.slice(4, -1).trim();
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || "#999";
}

export class DonutChart {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.data = [];
    this._resize();
    window.addEventListener("resize", () => this._resize());
  }

  _resize() {
    const rect = this.canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    const size = Math.max(rect.width, 180);
    this.canvas.width = size * dpr;
    this.canvas.height = size * dpr;
    this.canvas.style.height = `${size}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this._size = size;
    this.render();
  }

  setData(data) {
    this.data = data.filter((d) => d.value > 0);
    this.render();
  }

  render() {
    const { ctx } = this;
    const size = this._size || 240;
    const cx = size / 2;
    const cy = size / 2;
    const outer = size * 0.46;
    const inner = size * 0.3;
    ctx.clearRect(0, 0, size, size);

    const total = this.data.reduce((s, d) => s + d.value, 0);
    if (total <= 0) {
      ctx.beginPath();
      ctx.arc(cx, cy, outer, 0, Math.PI * 2);
      ctx.strokeStyle = resolveColor("var(--color-border)");
      ctx.lineWidth = outer - inner;
      ctx.stroke();
      return;
    }

    const gap = 0.015; // pequeno espaço entre fatias, em radianos por unidade
    let start = -Math.PI / 2;
    for (const d of this.data) {
      const frac = d.value / total;
      const sweep = frac * Math.PI * 2;
      const end = start + Math.max(sweep - gap, 0.001);
      ctx.beginPath();
      ctx.arc(cx, cy, (outer + inner) / 2, start, end);
      ctx.lineWidth = outer - inner;
      ctx.strokeStyle = resolveColor(d.color);
      ctx.lineCap = "round";
      ctx.stroke();
      start += sweep;
    }
  }
}

export function initDonut(canvasEl) {
  return new DonutChart(canvasEl);
}
