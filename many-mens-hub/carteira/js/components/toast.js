import { el, qs } from "../core/dom.js";

let stack;

function ensureStack() {
  if (stack) return stack;
  stack = qs("#toast-stack");
  if (!stack) {
    stack = el("div", { id: "toast-stack", class: "toast-stack", "aria-live": "polite" });
    document.body.append(stack);
  }
  return stack;
}

export function showToast(message, { type = "default", duration = 4000 } = {}) {
  const container = ensureStack();
  const node = el(
    "div",
    { class: `toast${type === "error" ? " toast--error" : ""}`, role: "status" },
    message,
  );
  container.append(node);
  setTimeout(() => {
    node.style.opacity = "0";
    node.style.transition = "opacity .2s ease";
    setTimeout(() => node.remove(), 200);
  }, duration);
}
