# Claude para o Board — Portal de Treinamento PRIMETOUR

Portal web estático (HTML/CSS/JS vanilla, sem build) que hospeda o treinamento executivo de **Claude (Anthropic)** para o C-level da **PRIMETOUR Viagens & Experiências**. Sete sessões, cada uma servindo a dois propósitos: **apresentação ao vivo** (modo fullscreen projetável) e **consulta posterior** (biblioteca de prompts + glossário).

Identidade visual: paleta e tipografia oficiais Claude/Anthropic (Poppins + Lora via Google Fonts).

---

## Estrutura

```
treinamento-claude/
├── index.html              # Home: manifesto + mapa das 7 sessões + atalhos
├── sessao-01/index.html    # Sessão 1 completa (34 slides + caderno + glossário)
├── sessao-02/ … 07/        # As 7 sessões completas (cada uma com slides, caderno e glossário)
├── prompts/index.html      # Biblioteca consolidada — 73 prompts (10 por sessão + 3 complementos CFO/RH/TI)
├── glossario/index.html    # Glossário transversal
├── assets/
│   ├── claude.css          # Sistema de design compartilhado
│   └── claude.js           # Modo apresentação, copiar prompts, navegação
└── README.md
```

Sem dependências externas além das fontes do Google Fonts (cacheadas pelo browser → funciona offline depois do primeiro carregamento).

---

## Como abrir localmente (Mac)

Basta abrir o arquivo direto no Safari/Chrome — não há build step:

```bash
open index.html
```

> **Observação sobre copiar prompts:** `navigator.clipboard` exige contexto seguro. Ao abrir via `file://`, a maioria dos browsers ainda permite, mas o código tem fallback (`execCommand`) por garantia. Em produção (GitHub Pages = HTTPS) funciona sempre.

Para servir via HTTP local (recomendado para testar igual à produção):

```bash
python3 -m http.server 8000
# abra http://localhost:8000
```

---

## Modo apresentação

Em qualquer página de sessão:

- Clique em **▶ Apresentar** (ou tecle **P**) para entrar no modo fullscreen.
- **← →** (ou PageUp/PageDown, Espaço) navegam entre slides.
- **Home / End** vão ao primeiro / último slide.
- **ESC** sai. No mobile, **swipe** horizontal navega.
- As bordas laterais da tela também são clicáveis para avançar/voltar.

Cada `<section class="slide">` vira um slide. Conteúdo marcado como `.non-slide` (caderno completo, glossário, footer) só aparece no modo de consulta, nunca na apresentação.

---

## Deploy no GitHub Pages

1. Crie o repositório na organização `primetour` (ex.: `treinamento-claude`).
2. Faça push do conteúdo desta pasta para o branch `main`.

   ```bash
   git remote add origin https://github.com/primetour/treinamento-claude.git
   git branch -M main
   git push -u origin main
   ```

3. No GitHub: **Settings › Pages › Source = Deploy from a branch**, branch `main`, pasta `/ (root)`. Salve.
4. Em ~1 min o portal estará em `https://primetour.github.io/treinamento-claude/`.

Todos os caminhos internos são **relativos** (`../assets/...`), então funciona em subpasta sem ajustes.

---

## Como adicionar uma nova sessão (template)

1. Duplique `sessao-01/index.html` para `sessao-0N/index.html`.
2. Ajuste, no topo: `<title>`, o `crumb` da topbar, o `.nav-brand`/`.nav-sub` do sumário.
3. Substitua os slides. Cada slide segue este esqueleto:

   ```html
   <section class="slide">
     <span class="slide-num">NN / TOTAL</span>
     <div class="slide-inner">
       <div class="section-tag">TAG DA SEÇÃO</div>
       <h2>Título do slide</h2>
       <hr class="accent-bar">
       <p class="lead">Subtítulo opcional em itálico.</p>
       <!-- conteúdo: use .card, .grid-2/3/4, .card-dark, tabelas .tbl, etc. -->
     </div>
   </section>
   ```

   - Slides de capa/transição/fechamento usam `class="slide slide-dark"` (fundo escuro).
   - Atualize `.slide-num` e o número total.
   - Atualize a barra de progresso (`.present-progress` no topo e `.progress-7` no footer): mova a classe `on` para o quadradinho da sessão atual.
4. **Caderno de prompts:** copie um bloco `<article class="prompt-card">`, troque categoria (`cat-analise` / `cat-comunicacao` / `cat-preparacao` / `cat-decisao`), texto e o `id` do `<pre>` (precisa ser único na página, ex.: `p11`).
5. Adicione os novos prompts também em `prompts/index.html` (use `id`s `q11`, `q12`… para não colidir).
6. Acrescente termos novos ao `glossario/index.html` e à seção de glossário da sessão.
7. Na home (`index.html`), troque a classe do card da sessão de `soon` para um `<a class="session-card current" href="...">` e atualize o badge.

### Componentes do design system (em `assets/claude.css`)

| Classe | Uso |
|--------|-----|
| `.section-tag` | Tag caps com quadrado laranja (topo de cada slide) |
| `.accent-bar` | Linha laranja de assinatura sob títulos |
| `.card`, `.card-soft`, `.card-dark`, `.card-darker` | Variações de card |
| `.side-orange/blue/green/gray` | Barra lateral colorida (4–5px) |
| `.top-orange/blue/green` | Barra superior colorida |
| `.grid-2/3/4/7` | Grids responsivos |
| `.prompt-block` + `.copy-btn` | Bloco terminal com botão copiar |
| `.num-circle`, `.num-big` | Numeração de passos |
| `.tbl` | Tabelas com coluna escura / coluna Claude destacada |
| `.t-orange/blue/green/gray` | Cor de texto/acento |

Cores e fontes são **CSS custom properties** em `:root` — nunca hardcode hex no HTML; use `var(--claude-orange)` etc.

---

Renê Junio · Marketing PRIMETOUR Viagens & Experiências
