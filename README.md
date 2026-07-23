# Many Mens — Hub

Site principal (portal) que reúne os microsites do projeto. Hoje tem um:
o Alocador de Carteira, dentro da pasta `carteira/`.

## Estrutura

```
many-mens-hub/
├── index.html          ← página principal (hub)
├── css/ (tokens.css, styles.css)
├── js/main.js
├── assets/icons/favicon.svg
│
└── carteira/            ← o microsite que já existia, sem nenhuma mudança
    ├── index.html
    ├── sobre.html
    ├── metodologia.html
    ├── ...
    └── .github/workflows/atualizar-cotacoes.yml
```

O hub e o microsite vivem **no mesmo repositório**, um dentro do outro. Não
precisa de dois repositórios nem de configuração especial — é só isso: uma
pasta dentro da outra.

## Por que ficou assim (e como isso funciona no ar)

Quando o GitHub Pages publica um repositório, ele publica a pasta inteira,
mantendo a mesma estrutura de pastas nos endereços (URLs). Então, se o hub
fica no endereço principal, o que está dentro de `carteira/` fica
automaticamente disponível como um "sub-endereço" dele:

- Hub: `https://SEU-USUARIO.github.io/`
- Carteira: `https://SEU-USUARIO.github.io/carteira/`

Quando você criar o **próximo** microsite, o processo é o mesmo: cria uma
pasta nova na raiz (ex: `outro-projeto/`) com o `index.html` dele lá dentro,
e adiciona um card novo em `index.html` do hub apontando pra
`outro-projeto/index.html`. Não precisa mexer em mais nada.

## Publicando no GitHub

Pra este hub virar o seu **domínio principal** do GitHub Pages (em vez de um
projeto qualquer), o nome do repositório precisa ser exatamente:

```
SEU-USUARIO.github.io
```

(troque `SEU-USUARIO` pelo seu usuário real do GitHub — esse é um nome
especial que o GitHub reconhece como "site pessoal").

Passo a passo:
1. Crie um repositório novo com esse nome exato.
2. Suba todo o conteúdo desta pasta (`many-mens-hub/`) para a raiz dele —
   incluindo a subpasta `carteira/` com tudo dentro (o `.github/workflows`
   dela também, já que é o que atualiza as cotações sozinho).
3. Em **Settings → Pages**, ative o Pages na branch `main`, pasta raiz.
4. Repita os mesmos passos de secret/permissões que você já fez para o
   Alocador de Carteira (`BRAPI_TOKEN`, permissões de Actions) — como está
   tudo no mesmo repositório agora, é a mesma configuração, só uma vez.

Se você já tinha um repositório separado só para o Alocador de Carteira, dá
pra mover ele pra dentro deste (copiando os arquivos pra pasta `carteira/`) e
depois apagar o repositório antigo, ou manter os dois se preferir — funciona
dos dois jeitos, mas ter tudo num repositório só é mais simples de manter.

## Sobre a identidade visual

Usei preto + dourado (a mesma linha do Alocador de Carteira) porque ainda não
consegui ver o print do seu Instagram (o Instagram bloqueia acesso
automatizado de fora). Quando você mandar o print, ajusto as cores em
`css/tokens.css` — é um arquivo só, então a mudança é rápida e se propaga
pro site inteiro.

## Sobre o anúncio

Deixei um espaço reservado e rotulado como "Publicidade" logo abaixo da
lista de projetos, em `index.html`. Quando você tiver conta aprovada no
Google AdSense:

1. No painel do AdSense, crie um "bloco de anúncios" e copie o código que
   ele te der (algo como `<ins class="adsbygoogle" ...></ins>` mais um
   `<script>`).
2. No `index.html` do hub, procure o comentário `ESPAÇO DE ANÚNCIO` e troque
   a `<div class="ad-slot">...</div>` por esse código.
3. Repita o processo em qualquer outro microsite onde quiser anúncio.

Antes de aplicar pro AdSense, vale ter uma página de **Política de
Privacidade** (o AdSense costuma exigir) — posso montar uma pra você quando
chegar nessa etapa.
