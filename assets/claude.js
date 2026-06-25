/* =========================================================================
   PORTAL DE TREINAMENTO CLAUDE — PRIMETOUR
   Modo apresentação · copiar prompts · navegação do sumário
   Vanilla JS, sem dependências.
   ========================================================================= */
(function () {
  'use strict';

  /* ----------------------------------------------------------------------
     MODO APRESENTAÇÃO
     Cada <section class="slide"> vira uma tela cheia. Só .active aparece.
     ---------------------------------------------------------------------- */
  var slides = [];
  var current = 0;
  var presenting = false;

  function collectSlides() {
    slides = Array.prototype.slice.call(document.querySelectorAll('.slide'));
  }

  function showSlide(i) {
    if (!slides.length) return;
    current = Math.max(0, Math.min(i, slides.length - 1));
    slides.forEach(function (s, idx) {
      s.classList.toggle('active', idx === current);
    });
    var active = slides[current];
    // contexto escuro? troca cor dos controles/progresso
    document.body.classList.toggle('dark-context', active.classList.contains('slide-dark'));
    // rola para o topo do slide ativo
    active.scrollTop = 0;
  }

  function enterPresent() {
    collectSlides();
    if (!slides.length) return;
    presenting = true;
    document.body.classList.add('presenting');
    // entra no fullscreen real do browser, se permitido
    var el = document.documentElement;
    if (el.requestFullscreen) { el.requestFullscreen().catch(function () {}); }
    // começa do slide mais próximo do scroll atual
    var idx = nearestSlideToViewport();
    showSlide(idx >= 0 ? idx : 0);
  }

  function exitPresent() {
    presenting = false;
    document.body.classList.remove('presenting', 'dark-context');
    if (document.fullscreenElement && document.exitFullscreen) {
      document.exitFullscreen().catch(function () {});
    }
    // mantém a posição: rola até o slide que estava ativo
    if (slides[current]) {
      slides[current].scrollIntoView({ behavior: 'instant', block: 'start' });
    }
  }

  function togglePresent() { presenting ? exitPresent() : enterPresent(); }
  function next() { if (presenting) showSlide(current + 1); }
  function prev() { if (presenting) showSlide(current - 1); }

  // qual slide está mais visível no viewport (para iniciar a apresentação ali)
  function nearestSlideToViewport() {
    collectSlides();
    var best = -1, bestDist = Infinity;
    slides.forEach(function (s, idx) {
      var r = s.getBoundingClientRect();
      var dist = Math.abs(r.top);
      if (dist < bestDist) { bestDist = dist; best = idx; }
    });
    return best;
  }

  /* ----------------------------------------------------------------------
     TECLADO
     ---------------------------------------------------------------------- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && presenting) { e.preventDefault(); exitPresent(); return; }
    if (!presenting) {
      // atalho "P" para iniciar apresentação fora de campos de texto
      if ((e.key === 'p' || e.key === 'P') && !/input|textarea/i.test(e.target.tagName)) {
        enterPresent();
      }
      return;
    }
    switch (e.key) {
      case 'ArrowRight': case 'PageDown': case ' ': e.preventDefault(); next(); break;
      case 'ArrowLeft': case 'PageUp': e.preventDefault(); prev(); break;
      case 'Home': e.preventDefault(); showSlide(0); break;
      case 'End': e.preventDefault(); showSlide(slides.length - 1); break;
    }
  });

  // se o usuário sair do fullscreen pelo F11/Esc do browser, sincroniza
  document.addEventListener('fullscreenchange', function () {
    if (!document.fullscreenElement && presenting) { exitPresent(); }
  });

  /* ----------------------------------------------------------------------
     SWIPE no mobile
     ---------------------------------------------------------------------- */
  var touchX = null;
  document.addEventListener('touchstart', function (e) {
    if (presenting) touchX = e.changedTouches[0].clientX;
  }, { passive: true });
  document.addEventListener('touchend', function (e) {
    if (!presenting || touchX === null) return;
    var dx = e.changedTouches[0].clientX - touchX;
    if (Math.abs(dx) > 60) { dx < 0 ? next() : prev(); }
    touchX = null;
  }, { passive: true });

  /* ----------------------------------------------------------------------
     COPIAR PROMPT
     copyPrompt(id) copia o texto do <pre> e mostra "Copiado!" por 2s
     ---------------------------------------------------------------------- */
  window.copyPrompt = function (id, btn) {
    var pre = document.getElementById(id);
    if (!pre) return;
    var text = pre.innerText || pre.textContent;
    var done = function () {
      if (!btn) return;
      var original = btn.dataset.label || btn.textContent;
      btn.dataset.label = original;
      btn.textContent = 'Copiado!';
      btn.classList.add('copied');
      setTimeout(function () {
        btn.textContent = btn.dataset.label;
        btn.classList.remove('copied');
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(fallbackCopy);
    } else {
      fallbackCopy();
    }
    function fallbackCopy() {
      var ta = document.createElement('textarea');
      ta.value = text; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (err) {}
      document.body.removeChild(ta);
    }
  };

  /* ----------------------------------------------------------------------
     COPIAR LINK desta página/sessão (botão com feedback)
     ---------------------------------------------------------------------- */
  window.copyLink = function (btn) {
    var url = window.location.href.split('#')[0];
    var label = btn.querySelector('.tool-label');
    var original = label ? label.textContent : btn.textContent;
    var done = function () {
      btn.classList.add('copied');
      if (label) label.textContent = 'Link copiado!'; else btn.textContent = 'Link copiado!';
      setTimeout(function () {
        btn.classList.remove('copied');
        if (label) label.textContent = original; else btn.textContent = original;
      }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url).then(done).catch(fallback);
    } else { fallback(); }
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = url; ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  };

  /* ----------------------------------------------------------------------
     BAIXAR PDF — usa a impressão do navegador (Salvar como PDF)
     ---------------------------------------------------------------------- */
  window.downloadPDF = function () {
    if (presenting) exitPresent();
    window.print();
  };

  /* ----------------------------------------------------------------------
     SUMÁRIO LATERAL — destaque do item ativo conforme o scroll
     ---------------------------------------------------------------------- */
  function setupScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('.session-nav a[href^="#"]'));
    if (!links.length || !('IntersectionObserver' in window)) return;
    var map = {};
    links.forEach(function (a) {
      var id = a.getAttribute('href').slice(1);
      var el = document.getElementById(id);
      if (el) map[id] = a;
    });
    var obs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          links.forEach(function (l) { l.classList.remove('active'); });
          var a = map[en.target.id];
          if (a) a.classList.add('active');
        }
      });
    }, { rootMargin: '-30% 0px -60% 0px', threshold: 0 });
    Object.keys(map).forEach(function (id) {
      var el = document.getElementById(id);
      if (el) obs.observe(el);
    });
  }

  /* ----------------------------------------------------------------------
     CRONÔMETRO do desafio (slide 26) — opcional, ativado por botão
     ---------------------------------------------------------------------- */
  window.toggleTimer = function (btn) {
    var disp = document.getElementById('challenge-timer');
    if (!disp) return;
    if (disp._interval) {
      clearInterval(disp._interval); disp._interval = null;
      btn.textContent = 'Retomar';
      return;
    }
    // duração configurável via data-minutes no display (default 60 min)
    var total = (parseInt(disp.dataset.minutes, 10) || 60) * 60;
    var remaining = disp._remaining != null ? disp._remaining : total;
    btn.textContent = 'Pausar';
    function tick() {
      var m = Math.floor(remaining / 60), s = remaining % 60;
      disp.textContent = (m < 10 ? '0' : '') + m + ':' + (s < 10 ? '0' : '') + s;
      if (remaining <= 0) { clearInterval(disp._interval); disp._interval = null; btn.textContent = 'Reiniciar'; return; }
      remaining--; disp._remaining = remaining;
    }
    tick();
    disp._interval = setInterval(tick, 1000);
  };
  window.resetTimer = function (btn) {
    var disp = document.getElementById('challenge-timer');
    if (!disp) return;
    if (disp._interval) { clearInterval(disp._interval); disp._interval = null; }
    var mins = parseInt(disp.dataset.minutes, 10) || 60;
    disp._remaining = mins * 60;
    disp.textContent = (mins < 10 ? '0' : '') + mins + ':00';
    var start = document.getElementById('timer-start');
    if (start) start.textContent = 'Iniciar contador';
  };

  /* ----------------------------------------------------------------------
     LIGA OS BOTÕES
     ---------------------------------------------------------------------- */
  function wire() {
    collectSlides();

    // botões "Apresentar" / fechar / navegar
    document.querySelectorAll('[data-action="present"]').forEach(function (b) {
      b.addEventListener('click', enterPresent);
    });
    document.querySelectorAll('[data-action="present-exit"]').forEach(function (b) {
      b.addEventListener('click', exitPresent);
    });
    document.querySelectorAll('[data-action="present-next"]').forEach(function (b) {
      b.addEventListener('click', next);
    });
    document.querySelectorAll('[data-action="present-prev"]').forEach(function (b) {
      b.addEventListener('click', prev);
    });

    setupScrollSpy();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  // expõe controles globais (úteis para debug ou botões inline)
  window.ClaudePresent = { enter: enterPresent, exit: exitPresent, next: next, prev: prev, toggle: togglePresent };
})();
