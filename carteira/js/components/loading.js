// Ícone de carregamento (spinner) usado em botões/estados de loading.

export function spinnerSVG(size = 14) {
  return `<svg class="spin" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-9-9" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>
  </svg>`;
}

export function refreshSVG(size = 12, spinning = false) {
  return `<svg class="${spinning ? "spin" : ""}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M21 12a9 9 0 1 1-2.64-6.36" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
    <path d="M21 3v6h-6" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`;
}
