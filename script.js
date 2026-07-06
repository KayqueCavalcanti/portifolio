    // -----------------------------------------------------------
    // 0. INTERNACIONALIZAÇÃO (PT/EN) — dicionário em translations.js,
    //    aplicado via atributos data-i18n / data-i18n-html /
    //    data-i18n-attr-* e data-i18n-title (este último para o
    //    componente <project-card>). Idioma persistido em
    //    localStorage e reaplicado a cada carregamento da página
    // -----------------------------------------------------------
    const LANG_STORAGE_KEY = 'portfolio-lang';
    let currentLang = localStorage.getItem(LANG_STORAGE_KEY) === 'en' ? 'en' : 'pt';

    function getDictValue(dict, path) {
      return path.split('.').reduce((acc, key) => (acc && acc[key] !== undefined ? acc[key] : undefined), dict);
    }

    function t(path) {
      const value = getDictValue(TRANSLATIONS[currentLang], path);
      if (value !== undefined) return value;
      return getDictValue(TRANSLATIONS.pt, path);
    }

    function translateProjectCard(card) {
      if (!card.shadowRoot) return;

      const titleKey = card.dataset.i18nTitle;
      if (titleKey) {
        const h3 = card.shadowRoot.querySelector('h3');
        if (h3) h3.textContent = t(titleKey);
      }

      const link = card.shadowRoot.querySelector('.project-link');
      if (link) {
        const textNode = Array.from(link.childNodes).find((node) => node.nodeType === Node.TEXT_NODE);
        if (textNode) textNode.textContent = t('projects.viewCaseStudy');
      }
    }

    function translateMarquee(track) {
      if (!track || !track.dataset.originalHtml) return;

      const temp = document.createElement('div');
      temp.innerHTML = track.dataset.originalHtml;
      temp.querySelectorAll('[data-i18n]').forEach((el) => {
        const value = getDictValue(TRANSLATIONS[currentLang], el.dataset.i18n);
        if (value !== undefined) el.textContent = value;
      });
      track.dataset.originalHtml = temp.innerHTML;
      fillMarquee(track);
    }

    function applyTranslations(lang) {
      currentLang = lang;
      document.documentElement.lang = lang === 'en' ? 'en' : 'pt-BR';

      document.querySelectorAll('[data-i18n]').forEach((el) => {
        const value = getDictValue(TRANSLATIONS[lang], el.dataset.i18n);
        if (value !== undefined) el.textContent = value;
      });

      document.querySelectorAll('[data-i18n-html]').forEach((el) => {
        const value = getDictValue(TRANSLATIONS[lang], el.dataset.i18nHtml);
        if (value !== undefined) el.innerHTML = value;
      });

      document.querySelectorAll('[data-i18n-attr-placeholder]').forEach((el) => {
        const value = getDictValue(TRANSLATIONS[lang], el.dataset.i18nAttrPlaceholder);
        if (value !== undefined) el.setAttribute('placeholder', value);
      });

      document.querySelectorAll('[data-i18n-attr-aria-label]').forEach((el) => {
        const value = getDictValue(TRANSLATIONS[lang], el.dataset.i18nAttrAriaLabel);
        if (value !== undefined) el.setAttribute('aria-label', value);
      });

      document.querySelectorAll('project-card[data-i18n-title]').forEach(translateProjectCard);

      translateMarquee(document.getElementById('marqueeTrack'));
      translateMarquee(document.getElementById('footerMarqueeTrack'));

      const hint = document.getElementById('projectsHint');
      const pin = document.getElementById('projectsPin');
      if (hint && pin) {
        hint.textContent = pin.classList.contains('pin-active') ? t('projects.hintScroll') : t('projects.hintDrag');
      }

      if (langToggle) {
        langToggle.textContent = lang === 'pt' ? 'EN' : 'PT';
        langToggle.setAttribute('aria-label', lang === 'pt' ? t('nav.langToggleToEn') : t('nav.langToggleToPt'));
      }

      document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
    }

    function setLanguage(lang) {
      localStorage.setItem(LANG_STORAGE_KEY, lang);
      applyTranslations(lang);
    }

    const langToggle = document.getElementById('langToggle');
    langToggle.addEventListener('click', () => {
      setLanguage(currentLang === 'pt' ? 'en' : 'pt');
    });

    // -----------------------------------------------------------
    // 1. MENU MOBILE (toggle do hambúrguer)
    // -----------------------------------------------------------
    const navToggle = document.getElementById('navToggle');
    const navLinks = document.getElementById('navLinks');

    navToggle.addEventListener('click', () => {
      navToggle.classList.toggle('active');
      navLinks.classList.toggle('active');
    });

    // -----------------------------------------------------------
    // 2. SMOOTH SCROLL + fechar menu mobile ao clicar em um link
    // -----------------------------------------------------------
    document.querySelectorAll('.nav-link').forEach((link) => {
      link.addEventListener('click', (e) => {
        const targetId = link.getAttribute('href');
        const target = document.querySelector(targetId);

        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }

        // Fecha o menu mobile (se estiver aberto)
        navToggle.classList.remove('active');
        navLinks.classList.remove('active');
      });
    });

    // -----------------------------------------------------------
    // 3. NAVBAR: leve mudança de fundo ao rolar a página
    // -----------------------------------------------------------
    const navbar = document.getElementById('navbar');
    // Estado visual definido via classe (CSS cuida das cores/sombra);
    // listener passivo evita bloquear o scroll
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 40);
    }, { passive: true });

    // -----------------------------------------------------------
    // 4. MARQUEE INFINITO: duplica o conteúdo para um loop perfeito
    // -----------------------------------------------------------
    function fillMarquee(track) {
      if (!track.dataset.originalHtml) {
        track.dataset.originalHtml = track.innerHTML;
        // Duração-base da animação definida no CSS (para 2 cópias do conteúdo).
        track.dataset.baseDuration = parseFloat(getComputedStyle(track).animationDuration) || 32;
      }
      const original = track.dataset.originalHtml;
      const containerWidth = track.parentElement.offsetWidth;

      // Reconstrói a partir do conteúdo original (evita acumular cópias
      // de execuções anteriores, ex.: após o carregamento das fontes).
      let html = original;
      let repeats = 1;
      track.innerHTML = html;

      // Duplica até a faixa ter pelo menos 2x a largura do container,
      // garantindo que translateX(-50%) nunca exponha vazio.
      let safety = 0;
      while (track.scrollWidth < containerWidth * 2 && safety < 12) {
        html += original;
        repeats++;
        track.innerHTML = html;
        safety++;
      }

      // Número par de repetições: a 1ª metade == 2ª metade, então
      // translateX(-50%) corresponde exatamente à largura de uma metade.
      if (repeats % 2 !== 0) {
        html += original;
        track.innerHTML = html;
      }

      // Mantém a velocidade (px/s) constante: quanto mais cópias forem
      // necessárias para preencher a tela, mais longa fica a animação.
      const baseDuration = parseFloat(track.dataset.baseDuration);
      track.style.animationDuration = `${baseDuration * (repeats / 2)}s`;
    }

    function setupMarquee(track) {
      fillMarquee(track);

      // As fontes (Press Start 2P / VT323) carregam com "display: swap" e
      // mudam a largura do texto depois do primeiro cálculo — recalcula
      // quando estiverem prontas para evitar o vazio "atrasado".
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => fillMarquee(track));
      }

      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => fillMarquee(track), 200);
      });
    }

    setupMarquee(document.getElementById('marqueeTrack'));
    setupMarquee(document.getElementById('footerMarqueeTrack'));

    // -----------------------------------------------------------
    // 4.1 BOTÕES DE WHATSAPP: monta o link com a mensagem pronta
    // -----------------------------------------------------------
    const WHATSAPP_NUMBER = '5511988778894';
    document.querySelectorAll('.wa-btn').forEach((btn) => {
      const message = btn.dataset.message || 'Olá! Vi seu portfólio e gostaria de conversar sobre um projeto.';
      btn.href = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    });

    // -----------------------------------------------------------
    // 4.2 PROJETOS: garante que o carrossel comece sempre no 1º card
    // (navegadores podem restaurar/ajustar o scrollLeft de elementos
    // com id em reloads, deixando "Processador OCR" como ponto inicial)
    // -----------------------------------------------------------
    const projectsGrid = document.getElementById('projectsGrid');
    const resetProjectsScroll = () => { projectsGrid.scrollLeft = 0; };
    resetProjectsScroll();
    window.addEventListener('load', () => requestAnimationFrame(resetProjectsScroll));

    // -----------------------------------------------------------
    // 4.3 PROJETOS: scroll vertical "pinado" controla o carrossel
    // horizontal — ao chegar na seção, o scroll para baixo arrasta
    // os cards para o lado; depois do último card o scroll é liberado.
    // -----------------------------------------------------------
    (function setupProjectsPin() {
      const pin = document.getElementById('projectsPin');
      const sticky = pin.querySelector('.projects-sticky');
      const hint = document.getElementById('projectsHint');
      const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

      if (reduceMotion) return;

      let maxTravel = 0;
      let extraHeight = 0;

      function measure() {
        const container = projectsGrid.parentElement;
        const stageWidth = container.offsetWidth;
        maxTravel = Math.max(0, projectsGrid.scrollWidth - stageWidth);

        if (maxTravel > 0) {
          extraHeight = maxTravel;
          pin.classList.add('pin-active');
          pin.style.height = `${sticky.offsetHeight + extraHeight}px`;
          if (hint) hint.textContent = t('projects.hintScroll');
        } else {
          pin.classList.remove('pin-active');
          pin.style.height = '';
          projectsGrid.style.transform = '';
          if (hint) hint.textContent = t('projects.hintDrag');
        }
      }

      function update() {
        if (maxTravel <= 0) return;
        const rect = pin.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, -rect.top / extraHeight));
        projectsGrid.style.transform = `translateX(${-progress * maxTravel}px)`;
      }

      // Adia a 1ª medição: <project-card> só assume seu tamanho final
      // depois que customElements.define() roda (mais abaixo neste script).
      requestAnimationFrame(() => {
        measure();
        update();
      });

      // As fontes (Press Start 2P) carregam depois e alteram a largura dos
      // cards — remede quando estiverem prontas para evitar valores errados.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          measure();
          update();
        });
      }

      window.addEventListener('scroll', () => requestAnimationFrame(update), { passive: true });

      let resizeTimeout;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
          measure();
          update();
        }, 200);
      });
    })();

    // -----------------------------------------------------------
    // 5. SCROLL REVEAL com IntersectionObserver
    // -----------------------------------------------------------
    const revealElements = document.querySelectorAll('.reveal');

    const revealObserver = new IntersectionObserver(
      (entries, observer) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            observer.unobserve(entry.target); // anima apenas uma vez
          }
        });
      },
      {
        threshold: 0.15,
        rootMargin: '0px 0px -60px 0px',
      }
    );

    revealElements.forEach((el) => revealObserver.observe(el));

    // -----------------------------------------------------------
    // 6. "MAIS PROJETOS": busca repositórios públicos via API do GitHub
    // -----------------------------------------------------------
    const GITHUB_USER = 'KayqueCavalcanti';
    const githubGrid = document.getElementById('githubGrid');

    // Evita injeção de HTML caso nome/descrição do repositório contenham caracteres especiais
    const escapeHtml = (str) =>
      String(str).replace(/[&<>"']/g, (ch) => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      }[ch]));

    let githubReposState = { status: 'loading' };

    // Cache simples em localStorage para evitar repetir a chamada à API
    // do GitHub a cada carregamento (limite de 60 req/hora sem autenticação)
    const GITHUB_CACHE_KEY = 'github-repos-cache';
    const GITHUB_CACHE_TTL = 60 * 60 * 1000; // 1 hora

    function renderGithub() {
      if (githubReposState.status === 'empty') {
        githubGrid.innerHTML = `<p class="github-status">${escapeHtml(t('github.empty'))}</p>`;
        return;
      }

      if (githubReposState.status === 'error') {
        githubGrid.innerHTML = `
          <p class="github-status">
            ${escapeHtml(t('github.errorPrefix'))}
            <a href="https://github.com/${GITHUB_USER}?tab=repositories" target="_blank" rel="noopener noreferrer">${escapeHtml(t('github.errorLink'))}</a>.
          </p>
        `;
        return;
      }

      if (githubReposState.status !== 'list') return;

      githubGrid.innerHTML = '';

      githubReposState.data.forEach((repo, index) => {
        const card = document.createElement('a');
        card.href = repo.html_url;
        card.target = '_blank';
        card.rel = 'noopener noreferrer';
        card.className = `github-card reveal reveal-delay-${(index % 3) + 1}`;
        card.innerHTML = `
          <div class="github-card-header">
            <h3>${escapeHtml(repo.name)}</h3>
            <span class="tag">${escapeHtml(repo.language || 'Code')}</span>
          </div>
          <p>${escapeHtml(repo.description || t('github.noDescription'))}</p>
          <div class="github-card-meta">
            <span>
              <svg viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/></svg>
              ${repo.stargazers_count}
            </span>
            <span>
              <svg viewBox="0 0 24 24"><circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="M6 9v6M18 6a9 9 0 0 1-9 9"/></svg>
              ${repo.forks_count}
            </span>
          </div>
        `;
        githubGrid.appendChild(card);
        revealObserver.observe(card);
      });
    }

    document.addEventListener('languagechange', renderGithub);

    function fetchGithubRepos() {
      fetch(`https://api.github.com/users/${GITHUB_USER}/repos?sort=updated&per_page=100`)
        .then((res) => {
          if (!res.ok) throw new Error('Falha ao buscar repositórios');
          return res.json();
        })
        .then((repos) => {
          const top = repos
            .filter((repo) => !repo.fork)
            .sort((a, b) => new Date(b.pushed_at) - new Date(a.pushed_at))
            .slice(0, 6);

          githubReposState = top.length === 0 ? { status: 'empty' } : { status: 'list', data: top };
          renderGithub();

          try {
            localStorage.setItem(GITHUB_CACHE_KEY, JSON.stringify({ data: top, timestamp: Date.now() }));
          } catch {
            // Armazenamento indisponível (modo privado, cota excedida etc.) — sem problema, segue sem cache
          }
        })
        .catch(() => {
          githubReposState = { status: 'error' };
          renderGithub();
        });
    }

    let usedGithubCache = false;
    try {
      const cached = JSON.parse(localStorage.getItem(GITHUB_CACHE_KEY));
      if (cached && Array.isArray(cached.data) && Date.now() - cached.timestamp < GITHUB_CACHE_TTL) {
        githubReposState = cached.data.length === 0 ? { status: 'empty' } : { status: 'list', data: cached.data };
        renderGithub();
        usedGithubCache = true;
      }
    } catch {
      // Cache corrompido ou indisponível — ignora e busca normalmente
    }

    if (!usedGithubCache) {
      fetchGithubRepos();
    }

    // -----------------------------------------------------------
    // 7. EASTER EGG: mini Pong autônomo (4 raquetes) que "destrói"
    //    e regenera os pixels do título do hero
    // -----------------------------------------------------------
    const pongCanvas = document.getElementById('pongCanvas');
    const pongCtx = pongCanvas.getContext('2d');
    const heroEl = document.querySelector('.hero');
    const heroTitleEl = document.getElementById('heroTitle');
    const heroTitleText = heroTitleEl.querySelector('.hero-title-text').textContent.trim();
    const heroSubtitleEl = document.getElementById('heroSubtitle');
    const heroSubtitleText = heroSubtitleEl.querySelector('.hero-subtitle-text').textContent.trim();

    const pong = {
      width: 0,
      height: 0,
      paddleWidth: 14,       // espessura das raquetes
      paddleHeight: 200,      // comprimento das raquetes verticais (esquerda/direita)
      hPaddleLength: 220,      // comprimento das raquetes horizontais (topo/fundo)
      paddleMargin: 18,
      leftPaddleY: 0,
      rightPaddleY: 0,
      topPaddleX: 0,
      bottomPaddleX: 0,
      ball: { x: 0, y: 0, vx: 0, vy: 0, r: 6 },
    };

    // Opacidade do "jogo" (raquetes, bola e partículas) — mantém as letras em
    // branco sólido enquanto o Pong fica discreto ao fundo
    const PONG_ALPHA = 0.3;

    // Grade de "pixels" do título e do subtítulo (preenchidas por buildTitleGrid/buildSubtitleGrid)
    let titleGrid = [];
    let titleCell = 6;
    const titleRect = { x: 0, y: 0, w: 0, h: 0 };
    let subtitleGrid = [];
    let subtitleCell = 6;
    const subtitleRect = { x: 0, y: 0, w: 0, h: 0 };

    // Fonte bitmap 5x7 (estilo dot-matrix/LED) usada para desenhar o título em
    // blocos uniformes — evita depender da renderização/métricas de fontes do
    // navegador, que variam e geravam letras incompletas ou sobrepostas
    const CHAR_COLS = 5;
    const CHAR_ROWS = 7;
    const CHAR_GAP = 1;
    const SPACE_COLS = 3;
    const FONT_5X7 = {
      A: ['01110', '10001', '10001', '11111', '10001', '10001', '10001'],
      B: ['11110', '10001', '10001', '11110', '10001', '10001', '11110'],
      C: ['01111', '10000', '10000', '10000', '10000', '10000', '01111'],
      D: ['11110', '10001', '10001', '10001', '10001', '10001', '11110'],
      E: ['11111', '10000', '10000', '11110', '10000', '10000', '11111'],
      F: ['11111', '10000', '10000', '11110', '10000', '10000', '10000'],
      G: ['01111', '10000', '10000', '10111', '10001', '10001', '01111'],
      H: ['10001', '10001', '10001', '11111', '10001', '10001', '10001'],
      I: ['11111', '00100', '00100', '00100', '00100', '00100', '11111'],
      J: ['00111', '00010', '00010', '00010', '00010', '10010', '01100'],
      K: ['10001', '10010', '10100', '11000', '10100', '10010', '10001'],
      L: ['10000', '10000', '10000', '10000', '10000', '10000', '11111'],
      M: ['10001', '11011', '10101', '10101', '10001', '10001', '10001'],
      N: ['10001', '11001', '10101', '10101', '10011', '10001', '10001'],
      O: ['01110', '10001', '10001', '10001', '10001', '10001', '01110'],
      P: ['11110', '10001', '10001', '11110', '10000', '10000', '10000'],
      Q: ['01110', '10001', '10001', '10001', '10101', '10010', '01101'],
      R: ['11110', '10001', '10001', '11110', '10100', '10010', '10001'],
      S: ['01111', '10000', '10000', '01110', '00001', '00001', '11110'],
      T: ['11111', '00100', '00100', '00100', '00100', '00100', '00100'],
      U: ['10001', '10001', '10001', '10001', '10001', '10001', '01110'],
      V: ['10001', '10001', '10001', '10001', '10001', '01010', '00100'],
      W: ['10001', '10001', '10001', '10101', '10101', '11011', '10001'],
      X: ['10001', '10001', '01010', '00100', '01010', '10001', '10001'],
      Y: ['10001', '10001', '01010', '00100', '00100', '00100', '00100'],
      Z: ['11111', '00001', '00010', '00100', '01000', '10000', '11111'],
    };

    function resetPongBall(direction) {
      pong.ball.x = pong.width / 2;
      pong.ball.y = pong.height / 2;
      const angle = Math.random() * 0.6 - 0.3;
      const speed = 5.5;
      pong.ball.vx = Math.cos(angle) * speed * direction;
      pong.ball.vy = Math.sin(angle) * speed;
    }

    // Renderiza um texto em uma grade de blocos (estilo dot-matrix, fonte
    // bitmap 5x7) e devolve os blocos, o tamanho de célula e a posição
    // resultante (usado tanto para o título quanto para o subtítulo)
    function buildBitmapGrid(containerEl, text, maxLines, maxCell) {
      const heroBox = heroEl.getBoundingClientRect();
      const box = containerEl.getBoundingClientRect();
      const width = box.width;
      if (width < 1) {
        return { grid: [], cell: 6, rect: { x: 0, y: 0, w: 0, h: 0 } };
      }

      const upper = text.toUpperCase();
      const words = upper.split(' ');

      // Largura (em "colunas" da fonte bitmap) de uma linha de texto
      const lineCols = (line) => {
        let cols = 0;
        for (const ch of line) cols += (ch === ' ' ? SPACE_COLS : CHAR_COLS) + CHAR_GAP;
        return cols - CHAR_GAP;
      };

      // Quebra o texto em linhas cuja largura (em colunas) não passe de maxCols
      const wrapByCols = (maxCols) => {
        const result = [];
        let current = '';
        words.forEach((word) => {
          const test = current ? `${current} ${word}` : word;
          if (current && lineCols(test) > maxCols) {
            result.push(current);
            current = word;
          } else {
            current = test;
          }
        });
        if (current) result.push(current);
        return result;
      };

      // Distribui o texto em até `maxLines` linhas, começando pelo alvo mais
      // compacto possível (textos grandes, blocos grandes)
      const totalCols = lineCols(upper);
      let maxCols = Math.ceil(totalCols / maxLines);
      let lines = wrapByCols(maxCols);
      while (lines.length > maxLines) {
        maxCols += 2;
        lines = wrapByCols(maxCols);
      }

      const gridCols = Math.max(...lines.map(lineCols));
      const lineRows = CHAR_ROWS + 1; // 1 linha de respiro entre as fileiras
      const gridRows = lines.length * lineRows - 1;

      const cell = Math.max(6, Math.min(maxCell, Math.floor(width / gridCols)));
      const gridWidth = gridCols * cell;
      const height = gridRows * cell;

      // Ajusta a altura real do elemento para abrir espaço para o canvas
      containerEl.style.height = `${height}px`;

      const blockOffsetX = (width - gridWidth) / 2;
      const grid = [];

      lines.forEach((line, li) => {
        const cols = lineCols(line);
        const lineOffsetX = blockOffsetX + (gridWidth - cols * cell) / 2;
        let colCursor = 0;
        for (const ch of line) {
          if (ch === ' ') {
            colCursor += SPACE_COLS + CHAR_GAP;
            continue;
          }
          const bitmap = FONT_5X7[ch];
          if (bitmap) {
            for (let r = 0; r < CHAR_ROWS; r++) {
              const rowStr = bitmap[r];
              for (let c = 0; c < CHAR_COLS; c++) {
                if (rowStr[c] === '1') {
                  grid.push({
                    x: lineOffsetX + (colCursor + c) * cell,
                    y: (li * lineRows + r) * cell,
                    destroyed: false,
                  });
                }
              }
            }
          }
          colCursor += CHAR_COLS + CHAR_GAP;
        }
      });

      const updatedBox = containerEl.getBoundingClientRect();
      return {
        grid,
        cell,
        rect: {
          x: updatedBox.left - heroBox.left,
          y: updatedBox.top - heroBox.top,
          w: width,
          h: height,
        },
      };
    }

    // Título e subtítulo, cada um em uma única linha de blocos
    function buildTitleGrid() {
      const result = buildBitmapGrid(heroTitleEl, heroTitleText, 1, 100);
      titleGrid = result.grid;
      titleCell = result.cell;
      Object.assign(titleRect, result.rect);
    }

    function buildSubtitleGrid() {
      const result = buildBitmapGrid(heroSubtitleEl, heroSubtitleText, 1, 100);
      subtitleGrid = result.grid;
      subtitleCell = result.cell;
      Object.assign(subtitleRect, result.rect);
    }

    function resizePong() {
      pong.width = pongCanvas.width = heroEl.offsetWidth;
      pong.height = pongCanvas.height = heroEl.offsetHeight;
      pong.leftPaddleY = pong.height / 2 - pong.paddleHeight / 2;
      pong.rightPaddleY = pong.height / 2 - pong.paddleHeight / 2;
      pong.topPaddleX = pong.width / 2 - pong.hPaddleLength / 2;
      pong.bottomPaddleX = pong.width / 2 - pong.hPaddleLength / 2;
      buildTitleGrid();
      buildSubtitleGrid();
    }

    resizePong();
    resetPongBall(1);
    window.addEventListener('resize', resizePong);

    function updatePong() {
      const { ball } = pong;

      ball.x += ball.vx;
      ball.y += ball.vy;

      // IA perfeita: cada raquete se sincroniza instantaneamente com a
      // posição da bola, garantindo que ela nunca escape pelas bordas
      pong.leftPaddleY = ball.y - pong.paddleHeight / 2;
      pong.rightPaddleY = ball.y - pong.paddleHeight / 2;
      pong.topPaddleX = ball.x - pong.hPaddleLength / 2;
      pong.bottomPaddleX = ball.x - pong.hPaddleLength / 2;

      pong.leftPaddleY = Math.max(0, Math.min(pong.height - pong.paddleHeight, pong.leftPaddleY));
      pong.rightPaddleY = Math.max(0, Math.min(pong.height - pong.paddleHeight, pong.rightPaddleY));
      pong.topPaddleX = Math.max(0, Math.min(pong.width - pong.hPaddleLength, pong.topPaddleX));
      pong.bottomPaddleX = Math.max(0, Math.min(pong.width - pong.hPaddleLength, pong.bottomPaddleX));

      // Colisão com a raquete esquerda
      if (
        ball.vx < 0 &&
        ball.x - ball.r < pong.paddleMargin + pong.paddleWidth &&
        ball.y > pong.leftPaddleY &&
        ball.y < pong.leftPaddleY + pong.paddleHeight
      ) {
        ball.vx *= -1.04;
        ball.vy += (Math.random() - 0.5) * 1.5;
        ball.x = pong.paddleMargin + pong.paddleWidth + ball.r;
        aimBallAtBlock();
      }

      // Colisão com a raquete direita
      if (
        ball.vx > 0 &&
        ball.x + ball.r > pong.width - pong.paddleMargin - pong.paddleWidth &&
        ball.y > pong.rightPaddleY &&
        ball.y < pong.rightPaddleY + pong.paddleHeight
      ) {
        ball.vx *= -1.04;
        ball.vy += (Math.random() - 0.5) * 1.5;
        ball.x = pong.width - pong.paddleMargin - pong.paddleWidth - ball.r;
        aimBallAtBlock();
      }

      // Colisão com a raquete superior
      if (
        ball.vy < 0 &&
        ball.y - ball.r < pong.paddleMargin + pong.paddleWidth &&
        ball.x > pong.topPaddleX &&
        ball.x < pong.topPaddleX + pong.hPaddleLength
      ) {
        ball.vy *= -1.04;
        ball.vx += (Math.random() - 0.5) * 1.5;
        ball.y = pong.paddleMargin + pong.paddleWidth + ball.r;
        aimBallAtBlock();
      }

      // Colisão com a raquete inferior
      if (
        ball.vy > 0 &&
        ball.y + ball.r > pong.height - pong.paddleMargin - pong.paddleWidth &&
        ball.x > pong.bottomPaddleX &&
        ball.x < pong.bottomPaddleX + pong.hPaddleLength
      ) {
        ball.vy *= -1.04;
        ball.vx += (Math.random() - 0.5) * 1.5;
        ball.y = pong.height - pong.paddleMargin - pong.paddleWidth - ball.r;
        aimBallAtBlock();
      }

      // Paredes (caso a bola escape de alguma raquete)
      if (ball.y - ball.r < 0 || ball.y + ball.r > pong.height) {
        ball.vy *= -1;
        ball.y = Math.max(ball.r, Math.min(pong.height - ball.r, ball.y));
      }

      // Limite de velocidade
      const maxSpeed = 9;
      ball.vx = Math.max(-maxSpeed, Math.min(maxSpeed, ball.vx));
      ball.vy = Math.max(-maxSpeed, Math.min(maxSpeed, ball.vy));

      // Se escapar pelas laterais, recomeça no centro
      if (ball.x < -40 || ball.x > pong.width + 40) {
        resetPongBall(ball.x < 0 ? 1 : -1);
      }
    }

    // Toda vez que a bola acerta uma raquete, ela é redirecionada em direção
    // a um bloco aleatório (ainda intacto) do título ou subtítulo, mantendo a
    // velocidade atual — assim ela viaja até lá e o quebra na colisão normal
    function aimBallAtBlock() {
      const candidates = [];
      for (const block of titleGrid) {
        if (!block.destroyed) candidates.push({ block, cell: titleCell, rect: titleRect });
      }
      for (const block of subtitleGrid) {
        if (!block.destroyed) candidates.push({ block, cell: subtitleCell, rect: subtitleRect });
      }
      if (candidates.length === 0) return;

      const { block, cell, rect } = candidates[Math.floor(Math.random() * candidates.length)];
      const targetX = rect.x + block.x + cell / 2;
      const targetY = rect.y + block.y + cell / 2;

      const { ball } = pong;
      const dx = targetX - ball.x;
      const dy = targetY - ball.y;
      const dist = Math.hypot(dx, dy) || 1;
      const speed = Math.hypot(ball.vx, ball.vy);

      ball.vx = (dx / dist) * speed;
      ball.vy = (dy / dist) * speed;
    }

    // Fragmentos liberados quando um bloco de letra é destruído pela bola
    const particles = [];

    function spawnBlockParticles(x, y, color) {
      const count = 12 + Math.floor(Math.random() * 8);
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = 1 + Math.random() * 5;
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 2 + Math.random() * 4,
          life: 1,
          decay: 0.008 + Math.random() * 0.012,
          color,
        });
      }
    }

    function updateParticles() {
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.97;
        p.vy *= 0.97;
        p.life -= p.decay;
        if (p.life <= 0) particles.splice(i, 1);
      }
    }

    function drawParticles() {
      for (const p of particles) {
        pongCtx.globalAlpha = Math.max(0, p.life) * PONG_ALPHA;
        pongCtx.fillStyle = p.color;
        pongCtx.shadowColor = p.color;
        pongCtx.shadowBlur = 10;
        pongCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
      }
      pongCtx.globalAlpha = 1;
      pongCtx.shadowBlur = 0;
    }

    // Faz a bola "rebater" nos blocos de uma grade (título ou subtítulo): ao
    // colidir, o bloco fica marcado como "danificado" permanentemente (vira
    // um bloco apagado/escuro, mas continua visível), libera fragmentos no
    // ponto do impacto e a bola muda de direção, podendo atingir e danificar
    // outros blocos em sequência
    function collideBlocks(grid, cell, rect, color) {
      if (grid.length === 0) return false;
      const { ball } = pong;

      const bx = ball.x - rect.x;
      const by = ball.y - rect.y;
      if (bx < -30 || by < -30 || bx > rect.w + 30 || by > rect.h + 30) return false;

      for (const block of grid) {
        if (block.destroyed) continue;

        const closestX = Math.max(block.x, Math.min(bx, block.x + cell));
        const closestY = Math.max(block.y, Math.min(by, block.y + cell));
        const dx = bx - closestX;
        const dy = by - closestY;

        if (dx * dx + dy * dy < ball.r * ball.r) {
          block.destroyed = true;
          spawnBlockParticles(rect.x + block.x + cell / 2, rect.y + block.y + cell / 2, color);

          if (Math.abs(dx) > Math.abs(dy)) {
            ball.vx *= -1;
          } else {
            ball.vy *= -1;
          }
          ball.vx += (Math.random() - 0.5) * 0.6;
          ball.vy += (Math.random() - 0.5) * 0.6;
          return true;
        }
      }
      return false;
    }

    function collideTitle() {
      if (collideBlocks(titleGrid, titleCell, titleRect, '#ffffff')) return;
      collideBlocks(subtitleGrid, subtitleCell, subtitleRect, '#ffffff');
    }

    // Desenha os blocos de uma grade: os "vivos" em opacidade plena e os
    // destruídos pela bola como um contorno bem fraco, mantendo o texto
    // original legível mesmo depois de quebrado
    function drawBlocks(grid, cell, rect, color) {
      if (grid.length === 0) return;
      pongCtx.save();
      pongCtx.translate(rect.x, rect.y);
      pongCtx.fillStyle = color;

      pongCtx.globalAlpha = 0.12;
      for (const block of grid) {
        if (block.destroyed) {
          pongCtx.fillRect(block.x, block.y, cell - 1, cell - 1);
        }
      }

      pongCtx.globalAlpha = 1;
      for (const block of grid) {
        if (!block.destroyed) {
          pongCtx.fillRect(block.x, block.y, cell - 1, cell - 1);
        }
      }

      pongCtx.restore();
    }

    function drawPong() {
      pongCtx.clearRect(0, 0, pong.width, pong.height);

      drawBlocks(titleGrid, titleCell, titleRect, '#ffffff');
      drawBlocks(subtitleGrid, subtitleCell, subtitleRect, '#ffffff');

      drawParticles();

      // O jogo (raquetes e bola) fica discreto; as letras permanecem em
      // branco sólido, sem perder opacidade
      pongCtx.globalAlpha = PONG_ALPHA;

      // Raquetes
      pongCtx.fillStyle = '#ffb800';
      pongCtx.shadowColor = '#ffb800';
      pongCtx.shadowBlur = 12;
      pongCtx.fillRect(pong.paddleMargin, pong.leftPaddleY, pong.paddleWidth, pong.paddleHeight);
      pongCtx.fillRect(pong.width - pong.paddleMargin - pong.paddleWidth, pong.rightPaddleY, pong.paddleWidth, pong.paddleHeight);
      pongCtx.fillRect(pong.topPaddleX, pong.paddleMargin, pong.hPaddleLength, pong.paddleWidth);
      pongCtx.fillRect(pong.bottomPaddleX, pong.height - pong.paddleMargin - pong.paddleWidth, pong.hPaddleLength, pong.paddleWidth);

      // Bola
      pongCtx.fillStyle = '#ffb800';
      pongCtx.shadowColor = '#ffb800';
      pongCtx.shadowBlur = 14;
      pongCtx.beginPath();
      pongCtx.arc(pong.ball.x, pong.ball.y, pong.ball.r, 0, Math.PI * 2);
      pongCtx.fill();

      pongCtx.shadowBlur = 0;
      pongCtx.globalAlpha = 1;
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!prefersReducedMotion) {
      let pongRafId = null;

      function pongLoop() {
        updatePong();
        collideTitle();
        updateParticles();
        drawPong();
        pongRafId = requestAnimationFrame(pongLoop);
      }

      // Pausa o loop do Pong quando o hero sai da viewport, evitando
      // desenhar no canvas sem necessidade durante a rolagem da página
      const pongVisibilityObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            if (pongRafId === null) pongRafId = requestAnimationFrame(pongLoop);
          } else if (pongRafId !== null) {
            cancelAnimationFrame(pongRafId);
            pongRafId = null;
          }
        });
      }, { threshold: 0 });
      pongVisibilityObserver.observe(heroEl);
    } else {
      drawPong();
    }

    // -----------------------------------------------------------
    // 9. WEB COMPONENT NATIVO: <project-card>
    //    Encapsula o card de projeto em Shadow DOM, reaproveitando
    //    o styles.css global via <link> e projetando descrição/tags
    //    via <slot>. Ao clicar em "Ver estudo de caso", dispara um
    //    evento customizado (bubbles + composed) consumido pelo
    //    Drawer de Arquitetura (seção 11)
    // -----------------------------------------------------------
    class ProjectCard extends HTMLElement {
      connectedCallback() {
        if (this.shadowRoot) return;

        const number = this.getAttribute('number') || '';
        const title = this.getAttribute('title') || '';
        const github = this.getAttribute('github') || '#';
        const caseStudy = this.getAttribute('case-study') || '';
        const featured = this.hasAttribute('featured');

        const shadow = this.attachShadow({ mode: 'open' });
        shadow.innerHTML = `
          <link rel="stylesheet" href="styles.css">
          <style>
            :host {
              display: flex;
              flex: 0 0 clamp(280px, 85vw, 380px);
              scroll-snap-align: start;
              perspective: 800px;
            }
            article.project-card {
              width: 100%;
              transform-style: preserve-3d;
              will-change: transform;
            }
          </style>
          <article class="project-card${featured ? ' featured' : ''}">
            <div class="card-inner">
              <div class="project-header">
                <span class="project-number">${escapeHtml(number)}</span>
                <h3>${escapeHtml(title)}</h3>
              </div>
              <slot name="description"></slot>
              <div class="tags"><slot name="tags"></slot></div>
              <button class="project-link" type="button">
                Ver estudo de caso
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>
              </button>
            </div>
          </article>
        `;

        shadow.querySelector('.project-link').addEventListener('click', () => {
          this.dispatchEvent(new CustomEvent('open-case-study', {
            bubbles: true,
            composed: true,
            detail: { id: caseStudy, title, github },
          }));
        });

        // Tilt 3D sutil, acompanhando a posição do mouse sobre o card
        const article = shadow.querySelector('article.project-card');
        const TILT_MAX_DEG = 6;
        const tiltDisabled = window.matchMedia('(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)');

        this.addEventListener('mousemove', (e) => {
          if (tiltDisabled.matches) return;
          const rect = this.getBoundingClientRect();
          const ratioX = (e.clientX - rect.left) / rect.width;
          const ratioY = (e.clientY - rect.top) / rect.height;
          const rotateY = (ratioX - 0.5) * TILT_MAX_DEG * 2;
          const rotateX = (0.5 - ratioY) * TILT_MAX_DEG * 2;
          article.style.transition = 'transform 0.1s ease-out';
          article.style.transform = `translateY(-6px) rotateX(${rotateX.toFixed(2)}deg) rotateY(${rotateY.toFixed(2)}deg)`;
        });

        this.addEventListener('mouseleave', () => {
          article.style.transition = 'transform 0.4s ease';
          article.style.transform = '';
        });
      }
    }

    customElements.define('project-card', ProjectCard);

    // -----------------------------------------------------------
    // 10. VIEW TRANSITIONS API — transição nativa entre estados da
    //     página (Drawer de Arquitetura, Modo Terminal). Em
    //     navegadores sem suporte, a função roda direto, sem
    //     transição (fallback seguro)
    // -----------------------------------------------------------
    function withViewTransition(updateFn) {
      if (document.startViewTransition) {
        document.startViewTransition(updateFn);
      } else {
        updateFn();
      }
    }

    // -----------------------------------------------------------
    // 10.1 FOCUS TRAP — utilitário compartilhado pelos overlays
    //      modais (Drawer, Terminal, Paleta de Comandos): prende
    //      o foco com Tab/Shift+Tab enquanto abertos e devolve o
    //      foco ao elemento que os abriu ao fechar
    // -----------------------------------------------------------
    function createFocusTrap(container) {
      let lastFocused = null;

      function getFocusable() {
        return Array.from(
          container.querySelectorAll('a[href], button, input, textarea, select, [tabindex]:not([tabindex="-1"])')
        ).filter((el) => !el.disabled && el.offsetParent !== null);
      }

      function handleKeydown(e) {
        if (e.key !== 'Tab') return;
        const focusable = getFocusable();
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }

      return {
        activate(focusTarget) {
          lastFocused = document.activeElement;
          container.addEventListener('keydown', handleKeydown);
          const target = focusTarget || getFocusable()[0];
          if (target) target.focus();
        },
        deactivate() {
          container.removeEventListener('keydown', handleKeydown);
          if (lastFocused && typeof lastFocused.focus === 'function') {
            lastFocused.focus();
          }
          lastFocused = null;
        },
      };
    }

    // -----------------------------------------------------------
    // 11. DRAWER DE ARQUITETURA (ESTUDO DE CASO)
    //     Gaveta lateral com diagrama ASCII e trecho de código
    //     (fonte VT323) para cada projeto, aberta pelo evento
    //     "open-case-study" disparado pelo <project-card>
    // -----------------------------------------------------------
    const CASE_STUDIES = {
      'torre-de-comando': {
        summary: 'Dashboard central que consulta a saúde de GitLab, Nexus, UrbanCode e Apptio em intervalos configuráveis, grava o histórico em SQLite e dispara alertas no Slack quando algum serviço cai.',
        diagram: `+-----------+        +------------------+        +-----------------+
|  BROWSER  | <----- |   FLASK APP.PY   | -----> |     SQLITE      |
|   (UI)    |  HTML  |    /dashboard    |  ORM   |  historico.db   |
+-----------+        +------------------+        +-----------------+
                             |   ^
                       ping  |   | status
                             v   |
                  +----------------------------+
                  |         SERVIDORES          |
                  |  GitLab / Nexus / UrbanCode  |
                  |          / Apptio            |
                  +----------------------------+
                             |
                       falha |
                             v
                  +----------------------------+
                  |        ALERTA SLACK          |
                  +----------------------------+`,
        code: `# Strategy + Factory: cada serviço tem sua propria forma de "ping"
class HealthCheck(ABC):
    @abstractmethod
    def check(self, target: str) -> Result: ...

class HttpHealthCheck(HealthCheck):
    def check(self, target):
        start = time.perf_counter()
        try:
            resp = requests.get(target, timeout=3)
            latency = (time.perf_counter() - start) * 1000
            return Result(target, resp.ok, latency)
        except requests.RequestException:
            return Result(target, False, None)

class CheckerFactory:
    _strategies = {"gitlab": HttpHealthCheck(), "nexus": HttpHealthCheck()}

    @classmethod
    def get(cls, service: str) -> HealthCheck:
        return cls._strategies[service]

# Singleton: um único histórico compartilhado por toda a app
class HistoryRepository:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance`,
      },
      'painel-monitoramento': {
        summary: 'Telemetria de CPU, RAM, disco, rede e processos transmitida via WebSocket em tempo real, com histórico persistido em SQLite e alertas de limite configuráveis.',
        diagram: `+-----------+   WebSocket   +-----------------+   psutil   +------------------+
|  BROWSER  | <===========> |  FLASK-SOCKETIO | ---------> | CPU / RAM / DISCO |
| (gráficos)|               |    server.py    |            | REDE / PROCESSOS  |
+-----------+               +-----------------+            +------------------+
                                     |
                                     v
                             +-----------------+
                             |     SQLITE      |
                             |  historico.db   |
                             +-----------------+`,
        code: `# Observer: cada cliente conectado "assina" o stream de métricas
class MetricsBroadcaster:
    def __init__(self):
        self._subscribers = []

    def subscribe(self, callback):
        self._subscribers.append(callback)

    def emit(self, snapshot: dict):
        for callback in self._subscribers:
            callback(snapshot)

@socketio.on("connect")
def on_connect():
    broadcaster.subscribe(
        lambda snap: socketio.emit("metrics", snap)
    )

def sample_loop():
    while True:
        broadcaster.emit({
            "cpu": psutil.cpu_percent(),
            "ram": psutil.virtual_memory().percent,
        })
        time.sleep(1)`,
      },
      'processador-ocr': {
        summary: 'API assíncrona que recebe PDFs, enfileira o processamento no RabbitMQ (com DLQ e retry) e extrai texto via parsing nativo, com fallback de OCR (Tesseract) para documentos digitalizados.',
        diagram: `+----------+  upload   +-----------+  publish   +-----------+
| CLIENTE  | --------> |  FASTAPI  | ---------> |  RABBITMQ |
+----------+   PDF     |  /upload  |   job      +-----------+
                        +-----------+                  |
                                                         v
                                              +-----------------+
                                              |      WORKER      |
                                              | parse | tesseract |
                                              +-----------------+
                                                  |          |
                                          sucesso |          | falha
                                                  v          v
                                          +-----------+  +-----+
                                          |  SQLITE   |  | DLQ |
                                          +-----------+  +-----+`,
        code: `# Retry com backoff exponencial antes de cair na Dead Letter Queue
@retry(max_attempts=5, backoff=exponential_backoff)
def process_pdf(job: Job) -> ExtractedText:
    text = parse_native_text(job.file_path)

    if not text.strip():
        # Fallback: documento escaneado -> OCR via Tesseract
        text = ocr_fallback(job.file_path)

    return ExtractedText(job_id=job.id, content=text)

def on_message(channel, method, properties, body):
    job = Job.from_json(body)
    try:
        result = process_pdf(job)
        repository.save(result)
        channel.basic_ack(method.delivery_tag)
    except MaxRetriesExceeded:
        channel.basic_publish(exchange="dlq", body=body)`,
      },
      'sistema-cotacao': {
        summary: 'Fluxo completo de orçamento: o cliente envia uma solicitação, a API FastAPI registra no SQLite e gera a proposta consumida pelo front-end em HTML/CSS/JS.',
        diagram: `+----------+   form    +-----------------+   ORM   +-----------+
| CLIENTE  | --------> |     FASTAPI     | ------> |  SQLITE   |
| (HTML/JS)|           |  POST /quotes   |         |  app.db   |
+----------+           +-----------------+         +-----------+
     ^                          |
     |        GET /quotes/:id   |
     +--------------------------+
                  |
                  v
        +-------------------+
        |  PROPOSTA (HTML)  |
        +-------------------+`,
        code: `class QuoteStatus(str, Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"

@app.post("/quotes", response_model=QuoteOut)
def create_quote(payload: QuoteIn, db: Session = Depends(get_db)):
    quote = Quote(**payload.dict(), status=QuoteStatus.PENDING)
    db.add(quote)
    db.commit()
    db.refresh(quote)
    return quote

@app.get("/quotes/{quote_id}", response_model=QuoteOut)
def get_quote(quote_id: int, db: Session = Depends(get_db)):
    quote = db.get(Quote, quote_id)
    if not quote:
        raise HTTPException(status_code=404)
    return quote`,
      },
    };

    const drawerEl = document.getElementById('drawer');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const drawerBody = document.getElementById('drawerBody');
    const drawerGithubBtn = document.getElementById('drawerGithubBtn');
    const drawerCloseX = document.getElementById('drawerCloseX');
    const drawerCloseBtn = document.getElementById('drawerCloseBtn');
    const drawerFocusTrap = createFocusTrap(drawerEl);

    const CASE_STUDY_TITLE_KEYS = {
      'torre-de-comando': 'torreDeComando',
      'painel-monitoramento': 'painelMonitoramento',
      'processador-ocr': 'processadorOcr',
      'sistema-cotacao': 'sistemaCotacao',
    };

    let currentDrawerDetail = null;

    function renderDrawerContent({ id, title, github }) {
      const study = CASE_STUDIES[id];
      if (!study) return false;

      const titleKey = CASE_STUDY_TITLE_KEYS[id];
      const displayTitle = titleKey ? t(`projects.cards.${titleKey}.title`) : title;

      drawerBody.innerHTML = `
        <h3>${escapeHtml(displayTitle)}</h3>
        <p>${escapeHtml(study.summary)}</p>
        <span class="drawer-subtitle">${escapeHtml(t('drawer.architecture'))}</span>
        <pre class="drawer-diagram"><code>${escapeHtml(study.diagram)}</code></pre>
        <span class="drawer-subtitle">${escapeHtml(t('drawer.codeSnippet'))}</span>
        <pre class="drawer-code"><code>${escapeHtml(study.code)}</code></pre>
      `;
      drawerGithubBtn.href = github || '#';
      return true;
    }

    function openDrawer(detail) {
      if (!renderDrawerContent(detail)) return;
      currentDrawerDetail = detail;

      withViewTransition(() => {
        document.body.classList.add('drawer-open');
        drawerOverlay.classList.add('visible');
        drawerEl.classList.add('open');
        drawerEl.setAttribute('aria-hidden', 'false');
        drawerOverlay.setAttribute('aria-hidden', 'false');
      });

      drawerFocusTrap.activate(drawerCloseX);
    }

    function closeDrawer() {
      currentDrawerDetail = null;

      withViewTransition(() => {
        document.body.classList.remove('drawer-open');
        drawerOverlay.classList.remove('visible');
        drawerEl.classList.remove('open');
        drawerEl.setAttribute('aria-hidden', 'true');
        drawerOverlay.setAttribute('aria-hidden', 'true');
      });

      drawerFocusTrap.deactivate();
    }

    document.addEventListener('languagechange', () => {
      if (currentDrawerDetail) renderDrawerContent(currentDrawerDetail);
    });

    document.addEventListener('open-case-study', (e) => openDrawer(e.detail));
    drawerCloseX.addEventListener('click', closeDrawer);
    drawerCloseBtn.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);
    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && drawerEl.classList.contains('open')) closeDrawer();
    });

    // -----------------------------------------------------------
    // 12. MODO TERMINAL — interface de CLI em tela cheia, com um
    //     interpretador básico de comandos em Vanilla JS
    // -----------------------------------------------------------
    const cliToggle = document.getElementById('cliToggle');
    const terminalOverlay = document.getElementById('terminalOverlay');
    const terminalOutput = document.getElementById('terminalOutput');
    const terminalInput = document.getElementById('terminalInput');
    const terminalFocusTrap = createFocusTrap(terminalOverlay);

    const PROJECTS_LS = ['monitoramento/', 'wp_craft/', 'wp_infra/', 'wp_soft/', 'processador-pdfs/'];

    const PING_HOSTS = {
      'torre-de-comando': '192.168.1.10',
      'monitoramento': '192.168.1.10',
      'wp_infra': '10.0.0.4',
      'wp_craft': '10.0.0.8',
      'wp_soft': '10.0.0.12',
      'processador-pdfs': '10.0.0.21',
      localhost: '127.0.0.1',
    };

    function printLine(text, className = '') {
      const line = document.createElement('span');
      line.className = className ? `term-line ${className}` : 'term-line';
      line.textContent = text;
      terminalOutput.appendChild(line);
      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function printCommand(cmd) {
      const line = document.createElement('span');
      line.className = 'term-line term-cmd';
      line.textContent = cmd;
      terminalOutput.appendChild(line);
    }

    function wait(ms) {
      return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async function pingTarget(target) {
      if (!target) {
        printLine(t('terminal.pingUsage'), 'term-muted');
        return;
      }

      const ip = PING_HOSTS[target] || `10.0.0.${Math.floor(Math.random() * 200) + 2}`;
      printLine(`Pinging ${target} [${ip}] with 32 bytes of data:`);

      const samples = 4;
      let total = 0;
      let min = Infinity;
      let max = 0;

      for (let i = 0; i < samples; i++) {
        await wait(260 + Math.random() * 220);
        const latency = Math.floor(8 + Math.random() * 30);
        total += latency;
        min = Math.min(min, latency);
        max = Math.max(max, latency);
        printLine(`Reply from ${ip}: bytes=32 time=${latency}ms TTL=64`);
      }

      printLine('');
      printLine(`Ping statistics for ${ip}:`);
      printLine(`    Packets: Sent = ${samples}, Received = ${samples}, Lost = 0 (0% loss)`, 'term-muted');
      printLine('Approximate round trip times in milli-seconds:', 'term-muted');
      printLine(`    Minimum = ${min}ms, Maximum = ${max}ms, Average = ${Math.round(total / samples)}ms`, 'term-muted');
    }

    // Object.create(null): sem protótipo herdado, então um comando digitado
    // como "constructor" ou "__proto__" não resolve para métodos de
    // Object.prototype (evita TypeError/chamadas silenciosas indevidas)
    const TERMINAL_COMMANDS = Object.assign(Object.create(null), {
      help() {
        printLine(t('terminal.helpTitle'));
        printLine('');
        const rows = [
          ['help', t('terminal.help.help')],
          ['whoami', t('terminal.help.whoami')],
          ['ls', t('terminal.help.ls')],
          ['cat sobre.txt', t('terminal.help.cat')],
          ['ping [alvo]', t('terminal.help.ping')],
          ['clear', t('terminal.help.clear')],
          ['exit', t('terminal.help.exit')],
        ];
        const width = Math.max(...rows.map(([cmd]) => cmd.length)) + 4;
        rows.forEach(([cmd, desc]) => {
          printLine(`  ${cmd.padEnd(width)}${desc}`, 'term-muted');
        });
      },
      whoami() {
        printLine(t('terminal.whoami'));
      },
      ls() {
        printLine(PROJECTS_LS.join('   '));
      },
      cat(args) {
        if (!args[0]) {
          printLine(t('terminal.catUsage'), 'term-muted');
        } else if (args[0] === 'sobre.txt') {
          t('terminal.sobre').forEach((line) => printLine(line));
        } else {
          printLine(t('terminal.catNotFound').replace('{0}', args[0]), 'term-muted');
        }
      },
      ping(args) {
        return pingTarget(args[0]);
      },
      clear() {
        terminalOutput.innerHTML = '';
      },
      exit() {
        closeTerminal();
      },
    });

    function runCommand(raw) {
      const trimmed = raw.trim();
      printCommand(trimmed);

      if (trimmed) {
        const [cmd, ...args] = trimmed.split(/\s+/);
        const handler = TERMINAL_COMMANDS[cmd.toLowerCase()];

        if (handler) {
          handler(args);
        } else {
          printLine(t('terminal.commandNotFound').replace('{0}', cmd), 'term-muted');
        }
      }

      terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    function openTerminal() {
      withViewTransition(() => {
        document.body.classList.add('terminal-mode');
        terminalOverlay.classList.add('active');
        terminalOverlay.setAttribute('aria-hidden', 'false');
      });

      if (!terminalOutput.dataset.welcomed) {
        printLine(t('terminal.welcome1'));
        printLine(t('terminal.welcome2'), 'term-muted');
        printLine('');
        terminalOutput.dataset.welcomed = 'true';
      }

      terminalFocusTrap.activate(terminalInput);
    }

    function closeTerminal() {
      withViewTransition(() => {
        document.body.classList.remove('terminal-mode');
        terminalOverlay.classList.remove('active');
        terminalOverlay.setAttribute('aria-hidden', 'true');
      });

      terminalFocusTrap.deactivate();
    }

    cliToggle.addEventListener('click', openTerminal);

    terminalInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && terminalInput.value.trim() !== '') {
        const value = terminalInput.value;
        terminalInput.value = '';
        runCommand(value);
      } else if (e.key === 'Enter') {
        terminalInput.value = '';
      }
    });

    terminalOverlay.addEventListener('click', () => terminalInput.focus());

    window.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && terminalOverlay.classList.contains('active')) {
        closeTerminal();
      }
    });

    // -----------------------------------------------------------
    // 13. WIDGET DE TELEMETRIA (dogfooding) — painel fixo no canto
    //     inferior direito simulando um sistema sob monitoramento
    // -----------------------------------------------------------
    const telemetryUptime = document.getElementById('telemetryUptime');
    const telemetryMem = document.getElementById('telemetryMem');

    setInterval(() => {
      const mem = (42 + (Math.random() * 6 - 3)).toFixed(1);
      telemetryMem.textContent = `${mem}MB`;

      const uptime = (99.9 - Math.random() * 0.08).toFixed(2);
      telemetryUptime.textContent = `${uptime}%`;
    }, 2200);

    // -----------------------------------------------------------
    // 14. BOOT SEQUENCE — log de inicialização exibido ao carregar
    //     a página, reforçando a estética de terminal/infra.
    //     Clicar ou pressionar qualquer tecla pula a animação
    // -----------------------------------------------------------
    const bootScreen = document.getElementById('bootScreen');
    const bootLog = document.getElementById('bootLog');

    const BOOT_LINES = [
      ['kayque-portfolio boot v1.0', ''],
      ['Inicializando núcleo................ [ OK ]', 'boot-muted'],
      ['Montando seções (about, projects)... [ OK ]', 'boot-muted'],
      ['Carregando estilos e fontes......... [ OK ]', 'boot-muted'],
      ['Conectando à API do GitHub.......... [ OK ]', 'boot-muted'],
      ['Calibrando easter eggs............... [ OK ]', 'boot-muted'],
      ['Sistema pronto.', ''],
    ];

    function skipBootSequence() {
      bootScreen.classList.add('hidden');
      document.body.classList.remove('boot-active');
    }

    if (prefersReducedMotion) {
      bootScreen.remove();
    } else {
      document.body.classList.add('boot-active');

      BOOT_LINES.forEach(([text, className], i) => {
        setTimeout(() => {
          const line = document.createElement('span');
          line.className = className ? `boot-line ${className}` : 'boot-line';
          line.textContent = text;
          bootLog.appendChild(line);

          if (i === BOOT_LINES.length - 1) {
            const cursor = document.createElement('span');
            cursor.className = 'boot-cursor';
            line.appendChild(cursor);
          }
        }, i * 130);
      });

      setTimeout(skipBootSequence, BOOT_LINES.length * 130 + 450);

      bootScreen.addEventListener('click', skipBootSequence);
      window.addEventListener('keydown', skipBootSequence, { once: true });
    }

    // -----------------------------------------------------------
    // 15. CURSOR CUSTOMIZADO — retícula que segue o mouse com
    //     suavização (lerp), reagindo a links, botões e tags
    // -----------------------------------------------------------
    const customCursor = document.getElementById('customCursor');
    const customCursorDot = document.getElementById('customCursorDot');
    const supportsFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

    if (!prefersReducedMotion && supportsFinePointer && customCursor && customCursorDot) {
      document.body.classList.add('custom-cursor-active');

      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let ringX = mouseX;
      let ringY = mouseY;

      window.addEventListener('mousemove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        customCursorDot.style.left = `${mouseX}px`;
        customCursorDot.style.top = `${mouseY}px`;
      });

      let cursorRafId = null;

      function animateCursor() {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        customCursor.style.left = `${ringX}px`;
        customCursor.style.top = `${ringY}px`;
        cursorRafId = requestAnimationFrame(animateCursor);
      }

      cursorRafId = requestAnimationFrame(animateCursor);

      // Pausa o loop do cursor quando a aba fica em segundo plano
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          if (cursorRafId !== null) {
            cancelAnimationFrame(cursorRafId);
            cursorRafId = null;
          }
        } else if (cursorRafId === null) {
          cursorRafId = requestAnimationFrame(animateCursor);
        }
      });

      const CURSOR_HOVER_SELECTOR = 'a, button, input, .tag, [role="button"]';

      document.addEventListener('mouseover', (e) => {
        if (e.target.closest(CURSOR_HOVER_SELECTOR)) {
          customCursor.classList.add('hover');
        }
      });
      document.addEventListener('mouseout', (e) => {
        if (e.target.closest(CURSOR_HOVER_SELECTOR)) {
          customCursor.classList.remove('hover');
        }
      });
      document.addEventListener('mousedown', () => customCursor.classList.add('click'));
      document.addEventListener('mouseup', () => customCursor.classList.remove('click'));
    }

    // -----------------------------------------------------------
    // 16. PALETA DE COMANDOS (CTRL+K) — busca rápida estilo
    //     VS Code/Spotlight, com navegação por seções e ações
    // -----------------------------------------------------------
    const cmdkHint = document.getElementById('cmdkHint');
    const cmdkOverlay = document.getElementById('cmdkOverlay');
    const cmdkInput = document.getElementById('cmdkInput');
    const cmdkList = document.getElementById('cmdkList');
    const cmdkFocusTrap = createFocusTrap(cmdkOverlay);

    function scrollToSection(selector) {
      const target = document.querySelector(selector);
      if (target) target.scrollIntoView({ behavior: 'smooth' });
    }

    const COMMAND_LIST = [
      { labelKey: 'cmdk.items.home', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#home') },
      { labelKey: 'cmdk.items.about', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#about') },
      { labelKey: 'cmdk.items.projects', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#projects') },
      { labelKey: 'cmdk.items.githubRepos', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#github-projects') },
      { labelKey: 'cmdk.items.devMachine', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#dev-machine') },
      { labelKey: 'cmdk.items.services', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#services') },
      { labelKey: 'cmdk.items.changelog', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#changelog') },
      { labelKey: 'cmdk.items.contact', tagKey: 'cmdk.tags.section', action: () => scrollToSection('#contact') },
      { labelKey: 'cmdk.items.openTerminal', tagKey: 'cmdk.tags.action', action: () => openTerminal() },
      { labelKey: 'cmdk.items.github', tagKey: 'cmdk.tags.link', action: () => window.open('https://github.com/KayqueCavalcanti?tab=repositories', '_blank', 'noopener') },
      { labelKey: 'cmdk.items.linkedin', tagKey: 'cmdk.tags.link', action: () => window.open('https://www.linkedin.com/in/kayque-cavalcanti-090438350/', '_blank', 'noopener') },
      { labelKey: 'cmdk.items.resume', tagKey: 'cmdk.tags.link', action: () => window.open('curriculo-kayque-cavalcanti.pdf', '_blank', 'noopener') },
    ];

    let cmdkFiltered = COMMAND_LIST;
    let cmdkActiveIndex = 0;

    function renderCommandList() {
      const query = cmdkInput.value.trim().toLowerCase();
      cmdkFiltered = COMMAND_LIST.filter((cmd) => t(cmd.labelKey).toLowerCase().includes(query));
      cmdkActiveIndex = 0;

      if (cmdkFiltered.length === 0) {
        cmdkList.innerHTML = `<p class="cmdk-empty">${escapeHtml(t('cmdk.empty'))}</p>`;
        return;
      }

      cmdkList.innerHTML = cmdkFiltered
        .map((cmd, i) => `
          <div class="cmdk-item${i === 0 ? ' active' : ''}" data-index="${i}">
            <span>${escapeHtml(t(cmd.labelKey))}</span>
            <span class="cmdk-item-tag">${escapeHtml(t(cmd.tagKey))}</span>
          </div>
        `)
        .join('');
    }

    function updateActiveItem() {
      cmdkList.querySelectorAll('.cmdk-item').forEach((item, i) => {
        item.classList.toggle('active', i === cmdkActiveIndex);
      });
      const active = cmdkList.querySelector('.cmdk-item.active');
      if (active) active.scrollIntoView({ block: 'nearest' });
    }

    function runActiveCommand() {
      const cmd = cmdkFiltered[cmdkActiveIndex];
      if (!cmd) return;
      closeCommandPalette();
      cmd.action();
    }

    function openCommandPalette() {
      cmdkInput.value = '';
      renderCommandList();

      withViewTransition(() => {
        document.body.classList.add('cmdk-open');
        cmdkOverlay.classList.add('visible');
        cmdkOverlay.setAttribute('aria-hidden', 'false');
      });

      cmdkFocusTrap.activate(cmdkInput);
    }

    function closeCommandPalette() {
      withViewTransition(() => {
        document.body.classList.remove('cmdk-open');
        cmdkOverlay.classList.remove('visible');
        cmdkOverlay.setAttribute('aria-hidden', 'true');
      });

      cmdkFocusTrap.deactivate();
    }

    document.addEventListener('languagechange', () => {
      if (cmdkOverlay.classList.contains('visible')) renderCommandList();
    });

    cmdkHint.addEventListener('click', openCommandPalette);

    cmdkInput.addEventListener('input', renderCommandList);

    cmdkInput.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        cmdkActiveIndex = Math.min(cmdkActiveIndex + 1, cmdkFiltered.length - 1);
        updateActiveItem();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        cmdkActiveIndex = Math.max(cmdkActiveIndex - 1, 0);
        updateActiveItem();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        runActiveCommand();
      } else if (e.key === 'Escape') {
        closeCommandPalette();
      }
    });

    cmdkList.addEventListener('click', (e) => {
      const item = e.target.closest('.cmdk-item');
      if (!item) return;
      cmdkActiveIndex = Number(item.dataset.index);
      runActiveCommand();
    });

    cmdkOverlay.addEventListener('click', (e) => {
      if (e.target === cmdkOverlay) closeCommandPalette();
    });

    window.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (cmdkOverlay.classList.contains('visible')) {
          closeCommandPalette();
        } else {
          openCommandPalette();
        }
      }
    });

    // -----------------------------------------------------------
    // 17. PWA — registra o service worker para cache de assets e
    //     uso offline (ver sw.js e manifest.json)
    // -----------------------------------------------------------
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(() => {});
      });
    }

    // -----------------------------------------------------------
    // 18. Aplica o idioma salvo (ou o padrão pt-BR) a toda a página,
    //     agora que todo o conteúdo estático e os Web Components
    //     já foram montados
    // -----------------------------------------------------------
    applyTranslations(currentLang);
