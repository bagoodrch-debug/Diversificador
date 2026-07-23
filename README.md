# Distribui Rico — Simulador de Alocação de Carteira

Site estático (HTML + CSS + JS puro, sem build) que reproduz o simulador de
alocação de carteira, pronto para publicar no GitHub Pages.

## Estrutura de pastas

```
carteira/
├── index.html                 # Página do simulador (home)
├── sobre.html
├── metodologia.html
├── sitemap.xml
├── robots.txt
├── README.md
│
├── .github/workflows/
│   └── atualizar-cotacoes.yml # Busca cotações periodicamente (com o token seguro)
├── scripts/
│   └── atualizar-cotacoes.mjs # Script Node executado pelo workflow acima
├── dados/
│   └── cotacoes.json          # Gerado automaticamente — sem nenhuma credencial
│
├── css/
│   ├── tokens.css
│   ├── base.css
│   ├── layout.css
│   ├── components.css
│   └── pages/
│       ├── home.css
│       └── content.css
│
├── js/
│   ├── core/        (dom.js, format.js, store.js)
│   ├── data/        (categorias.data.js, ativos.data.js)
│   ├── services/    (alocacao-service.js, api.js)
│   ├── components/  (toast.js, loading.js, skeleton.js, grafico-canvas.js, tabela-ativos.js)
│   └── pages/
│       └── simulador.page.js
│
└── assets/
    ├── icons/favicon.svg
    └── og/distribui-rico-og.png
```

## ⚠️ Sobre a chave da Brapi — leia antes de publicar

Você me enviou sua chave da Brapi. **Ela não está em nenhum arquivo deste
projeto** — de propósito. Um site publicado no GitHub Pages é 100% estático:
tudo que existe no repositório é público e baixável por qualquer visitante,
mesmo repositórios "privados no código, públicos no Pages". Se a chave
estivesse em qualquer `.js` ou `.json` versionado, ela ficaria exposta.

Em vez disso, o site usa esta arquitetura:

1. A chave fica guardada **apenas** em *GitHub Actions Secrets* — um cofre do
   próprio GitHub, ligado ao repositório, que nunca aparece no código nem no
   histórico do Git.
2. Um workflow agendado (`.github/workflows/atualizar-cotacoes.yml`) roda a
   cada 30 minutos nos servidores do GitHub, usa a chave para consultar a
   Brapi e grava o resultado em `dados/cotacoes.json`.
3. O site, no navegador de cada visitante, só lê esse `cotacoes.json` — que é
   público, mas não tem nenhuma credencial dentro.

Isso é o equivalente ao que qualquer site estático precisa fazer para usar uma
API com chave secreta sem servidor próprio.

## Passo a passo para publicar

### 1. Criar o repositório
1. Crie um repositório novo no GitHub (ex: `carteira`), público ou privado
   (GitHub Pages funciona nos dois, mas privado exige plano pago para Pages).
2. Envie todos os arquivos desta pasta para a raiz do repositório.

### 2. Cadastrar a chave da Brapi como Secret
1. No repositório, vá em **Settings → Secrets and variables → Actions**.
2. Clique em **New repository secret**.
3. Nome: `BRAPI_TOKEN`
4. Valor: sua chave da Brapi (a que você me passou — cole ela aqui, e só
   aqui).
5. Salve.

### 3. Dar permissão de escrita para o workflow
1. Em **Settings → Actions → General → Workflow permissions**.
2. Selecione **Read and write permissions**.
3. Salve.
   (Isso permite que o workflow grave `dados/cotacoes.json` de volta no
   repositório.)

### 4. Ativar o GitHub Pages
1. Em **Settings → Pages**.
2. Em "Build and deployment", escolha **Deploy from a branch**.
3. Branch: `main` (ou `master`), pasta `/ (root)`.
4. Salve. O GitHub mostrará a URL pública (algo como
   `https://SEU-USUARIO.github.io/carteira/`).

### 5. Rodar o workflow pela primeira vez
1. Vá na aba **Actions** do repositório.
2. Clique no workflow **Atualizar cotações**.
3. Clique em **Run workflow** para rodar manualmente uma vez (não precisa
   esperar os 30 minutos).
4. Confira se ele terminou com sucesso (✔️) e se `dados/cotacoes.json` foi
   atualizado no repositório.

### 6. Ajustar URLs
Troque `SEU-USUARIO` pelo seu usuário/organização do GitHub nos arquivos:
- `index.html`, `sobre.html`, `metodologia.html` (tags `<link rel="canonical">` e `og:url`)
- `sitemap.xml`
- `robots.txt`

Pronto — o site estará no ar, atualizando cotações sozinho a cada 30 minutos,
sem nunca expor sua chave.

## Rodando localmente

Como o site usa ES Modules (`<script type="module">`) e `fetch` para ler o
JSON, ele precisa ser servido por um servidor HTTP (não funciona abrindo o
`index.html` direto com `file://`). Qualquer servidor estático simples
resolve, por exemplo:

```bash
cd carteira
python3 -m http.server 8080
# depois abra http://localhost:8080
```

## Limitações conhecidas

- As cotações têm até ~30 minutos de atraso (frequência do workflow), não são
  tempo real.
- A busca por ticker no formulário "Adicionar ativo" procura dentro da base
  já acompanhada pelo site (lista em `js/data/ativos.data.js` e
  `scripts/atualizar-cotacoes.mjs`). Para acompanhar mais tickers, adicione-os
  nas duas listas.
- Todo o estado do simulador (valor total, percentuais, ativos personalizados)
  fica só no `localStorage` do navegador de cada visitante — não há conta de
  usuário nem sincronização entre dispositivos.
