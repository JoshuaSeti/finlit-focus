/* FinLit module bridge — injected into every lesson module at load time. */
(function () {
  var CFG = window.__FINLIT_BRIDGE__ || {};
  function post(type, data) {
    try { window.parent.postMessage(Object.assign({ source: 'finlit-module', type: type, slug: CFG.slug }, data || {}), '*'); } catch (e) {}
  }

  var B = window.FinLitBridge = {
    slug: CFG.slug,
    user: CFG.user || null,
    track: function (kind, payload) { post('event', { kind: kind, payload: payload || {} }); },
    home: function () { sync(); setTimeout(function () { post('home'); }, 60); },
    open: function (slug) { sync(); setTimeout(function () { post('open', { slug: slug }); }, 60); },
    post: post,
  };

  // ── 1. Apple-Style Editorial Intro Cover & Site Buttons ──
  (function initAppleStyles() {
    var meta = CFG.meta || {};
    var hasCoverImage = meta.cover_image_url && typeof meta.cover_image_url === 'string';

    var st = document.createElement('style');
    st.textContent = [
      // Hide legacy orbs and noise grain
      '.cover .orb, .cover .grain, .cover .vignette { display: none !important; }',

      // Full-bleed Apple canvas (no cramped 680px card)
      '.cover {',
      '  box-sizing: border-box !important;',
      '  width: 100% !important;',
      '  max-width: 100% !important;',
      '  min-height: calc(100vh - 14px) !important;',
      '  margin: 0 !important;',
      '  border-radius: 0 !important;',
      '  padding: clamp(48px, 10vh, 96px) 24px 48px !important;',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  justify-content: center !important;',
      '  align-items: center !important;',
      '  text-align: center !important;',
      '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", system-ui, sans-serif !important;',
      hasCoverImage
        ? '  background: linear-gradient(180deg, rgba(6,16,10,0.72) 0%, rgba(6,16,10,0.90) 55%, rgba(6,16,10,0.98) 100%), url("' +
          meta.cover_image_url +
          '") center/cover no-repeat !important;'
        : '  background: radial-gradient(ellipse 1100px 700px at 50% -10%, rgba(34,197,94,0.18) 0%, transparent 60%), linear-gradient(180deg, #09170e 0%, #061009 100%) !important;',
      '}',

      // Apple micro-caps kicker
      '.cover-tag {',
      '  font-size: 11px !important;',
      '  font-weight: 700 !important;',
      '  letter-spacing: 0.12em !important;',
      '  text-transform: uppercase !important;',
      '  color: #34D399 !important;',
      '  background: rgba(52, 211, 153, 0.12) !important;',
      '  border: 1px solid rgba(52, 211, 153, 0.28) !important;',
      '  border-radius: 9999px !important;',
      '  padding: 6px 16px !important;',
      '  margin-bottom: 24px !important;',
      '  display: inline-flex !important;',
      '}',

      // Title & typography hierarchy
      '.cover-content {',
      '  max-width: 680px !important;',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  align-items: center !important;',
      '  gap: 12px !important;',
      '}',
      '.cover-headline {',
      '  font-size: clamp(34px, 5.5vw, 56px) !important;',
      '  line-height: 1.08 !important;',
      '  font-weight: 700 !important;',
      '  letter-spacing: -0.035em !important;',
      '  color: #FFFFFF !important;',
      '  margin: 0 !important;',
      '}',
      '.cover-headline-accent {',
      '  color: #6EE7B7 !important;',
      '  font-weight: 700 !important;',
      '}',
      '.cover-subline {',
      '  font-size: 15px !important;',
      '  font-weight: 500 !important;',
      '  line-height: 1.5 !important;',
      '  color: rgba(255, 255, 255, 0.72) !important;',
      '  max-width: 520px !important;',
      '  margin: 4px 0 0 !important;',
      '}',

      // Bottom bar & metadata dock
      '.cover-bottom-bar {',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  align-items: center !important;',
      '  gap: 28px !important;',
      '  border-top: none !important;',
      '  width: 100% !important;',
      '  max-width: 560px !important;',
      '  padding: 0 !important;',
      '  margin-top: 40px !important;',
      '}',
      '.cover-pills {',
      '  display: flex !important;',
      '  align-items: center !important;',
      '  justify-content: center !important;',
      '  gap: 8px !important;',
      '  flex-wrap: wrap !important;',
      '}',

      // Frosted Apple metadata badges (no chunky border or shadow)
      '.cover-pills .pill {',
      '  background: rgba(255, 255, 255, 0.08) !important;',
      '  backdrop-filter: blur(20px) saturate(180%) !important;',
      '  -webkit-backdrop-filter: blur(20px) saturate(180%) !important;',
      '  border: 1px solid rgba(255, 255, 255, 0.14) !important;',
      '  color: rgba(255, 255, 255, 0.88) !important;',
      '  font-size: 12px !important;',
      '  font-weight: 600 !important;',
      '  letter-spacing: -0.01em !important;',
      '  border-radius: 9999px !important;',
      '  padding: 6px 14px !important;',
      '  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15) !important;',
      '}',

      // ── Site Button Styling Across the Module ──
      '.btn::after, .cta-btn::after, .fl-practice-go::after { display: none !important; }',
      'button, .btn, .cta-btn, .fl-practice-go, .fl-cert-claim-btn, .fl-myth-btn, .fl-myth-next-btn {',
      '  font-family: -apple-system, BlinkMacSystemFont, "SF Pro Text", system-ui, sans-serif !important;',
      '  font-weight: 600 !important;',
      '  letter-spacing: -0.015em !important;',
      '  border-radius: 9999px !important;',
      '  touch-action: manipulation !important;',
      '  user-select: none !important;',
      '  transition: all 150ms cubic-bezier(0.16, 1, 0.3, 1) !important;',
      '}',
      'button:active, .btn:active, .cta-btn:active, .fl-practice-go:active {',
      '  transform: scale(0.96) !important;',
      '}',
      '.btn-p, .cta-btn, .fl-practice-go:not(.alt), .fl-cert-claim-btn, .fl-myth-next-btn {',
      '  background: #22C55E !important;',
      '  color: #04240F !important;',
      '  border: 1px solid rgba(255, 255, 255, 0.35) !important;',
      '  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.45), 0 3px 12px -2px rgba(34, 197, 94, 0.35) !important;',
      '}',
      '.btn-p:hover, .cta-btn:hover, .fl-practice-go:not(.alt):hover {',
      '  filter: brightness(1.04) !important;',
      '  box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.55), 0 6px 18px -3px rgba(34, 197, 94, 0.45) !important;',
      '}',
      '.btn-s, .btn-alt, .fl-practice-go.alt, .apple-reset-btn, button.alt {',
      '  background: rgba(255, 255, 255, 0.85) !important;',
      '  backdrop-filter: blur(12px) !important;',
      '  -webkit-backdrop-filter: blur(12px) !important;',
      '  color: #1F2937 !important;',
      '  border: 1px solid rgba(229, 231, 235, 0.9) !important;',
      '  box-shadow: 0 1px 2px 0 rgba(0, 0, 0, 0.05) !important;',
      '}',
      '.btn-s:hover, .fl-practice-go.alt:hover, button.alt:hover {',
      '  background: #F3F4F6 !important;',
      '  color: #111827 !important;',
      '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);

    function sanitizePills() {
      var pills = document.querySelectorAll('.cover-pills .pill');
      for (var i = 0; i < pills.length; i++) {
        var el = pills[i];
        var clean = (el.textContent || '')
          .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu, '')
          .trim();
        if (clean) el.textContent = clean;
      }
    }
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', sanitizePills);
    } else {
      sanitizePills();
    }
  })();

  // ── 2. Hide Redundant Buttons & Handle Smooth Handoff ──
  (function () {
    var st = document.createElement('style');
    st.textContent = [
      '#fin-next,#fin-back,#fin-finish{display:none!important}',
      'body.fin-hide-bar #fin-bar{display:none!important}',
      'body.fin-hide-bar{padding-bottom:0!important}',
      '#fin-bar{display:none!important}'
    ].join('');
    (document.head || document.documentElement).appendChild(st);

    function getSections() {
      var c = window.FINLIT_MODULE || {};
      return Array.isArray(c.sections) && c.sections.length ? c.sections : ['s0', 's1', 's2', 's3', 's4'];
    }

    function currentSection() {
      var ids = getSections();
      var h = (location.hash || '').replace('#', '');
      return ids.indexOf(h) > -1 ? h : null;
    }

    var handoffTimer = null;
    function handleDoneOverlay() {
      var done = document.getElementById('fin-done');
      if (!done || !done.classList.contains('on')) return;
      sync();
      var ids = getSections();
      var cur = currentSection();
      var idx = cur ? ids.indexOf(cur) : -1;
      var isLast = idx === ids.length - 1;
      var simBtn = document.getElementById('fin-sim');
      var simVisible = !!(simBtn && simBtn.style.display !== 'none');

      if (simVisible || isLast) {
        done.classList.remove('on');
        if (!handoffTimer) {
          handoffTimer = setTimeout(function () {
            handoffTimer = null;
            post('enter-protege');
          }, 80);
        }
      } else if (idx > -1 && idx < ids.length - 1) {
        done.classList.remove('on');
        location.hash = '#' + ids[idx + 1];
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        done.classList.remove('on');
      }
    }

    function check() {
      handleDoneOverlay();
    }

    setInterval(check, 300);
    window.addEventListener('load', function () {
      check();
      var done = document.getElementById('fin-done');
      if (done && typeof MutationObserver !== 'undefined') {
        new MutationObserver(handleDoneOverlay).observe(done, { attributes: true, attributeFilter: ['class'] });
      }
    });

    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('#fin-finish') : null;
      if (!b) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      sync();
      post('enter-protege');
    }, true);
  })();

  // ── 3. Hash Links & Progress Syncing ──
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.charAt(0) === '#') {
      if (a.getAttribute('onclick') && e.defaultPrevented) return;
      e.preventDefault();
      if (href.length > 1) { location.hash = href; } else { window.scrollTo(0, 0); }
      return;
    }
    var m = href.match(/^(?:\.\/)?(index\.html|module-[\w-]+?)(?:-full)?\.html?(#.*)?$/) || href.match(/^(?:\.\/)?index\.html(#.*)?$/);
    if (m) {
      e.preventDefault();
      if (/^index/.test(href.replace('./', ''))) B.home(); else B.open(m[1]);
    }
  }, true);

  function key() { var c = window.FINLIT_MODULE || {}; return 'finlit-progress-' + (c.moduleId || CFG.slug); }
  function sync() {
    var raw = null; try { raw = localStorage.getItem(key()); } catch (e) {}
    if (!raw) return;
    var p = null; try { p = JSON.parse(raw); } catch (e) { return; }
    var c = window.FINLIT_MODULE || {};
    post('progress', { progress: p, sections: c.sections || [] });
  }
  setInterval(sync, 2000);
  window.addEventListener('hashchange', function () { setTimeout(sync, 100); });
  window.addEventListener('pagehide', sync);
  window.addEventListener('beforeunload', sync);
})();
