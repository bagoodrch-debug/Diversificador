import { el } from "../core/dom.js";

export function skeletonLines(count = 3, height = 14) {
  const wrap = el("div", { style: "display:flex;flex-direction:column;gap:8px" });
  for (let i = 0; i < count; i++) {
    wrap.append(
      el("div", {
        class: "skeleton",
        style: `height:${height}px;width:${100 - i * 12}%`,
      }),
    );
  }
  return wrap;
}
