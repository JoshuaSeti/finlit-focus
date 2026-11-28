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

   // ── 1. Minimalist Editorial Cover with Smooth Fade-Out (No Scroll) ──
  (function initCoverStyles() {
    var meta = CFG.meta || {};
    var hasCoverImage = meta.cover_image_url && typeof meta.cover_image_url === 'string';

    var st = document.createElement('style');
    st.textContent = [
      // Hide legacy decorative noise, orbs, and generic pills entirely
      '.cover .orb, .cover .grain, .cover .vignette, .cover-tag, .cover-pills, .pills { display: none !important; }',

      // Clean editorial hero cover
      '.cover {',
      '  box-sizing: border-box !important;',
      '  width: 100% !important;',
      '  max-width: 100% !important;',
      '  min-height: 100vh !important;',
      '  margin: 0 !important;',
      '  border-radius: 0 !important;',
      '  padding: clamp(48px, 12vh, 96px) 24px 48px !important;',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  justify-content: center !important;',
      '  align-items: center !important;',
      '  text-align: center !important;',
      '  opacity: 1;',
      '  transition: opacity 0.35s cubic-bezier(0.16, 1, 0.3, 1), transform 0.35s cubic-bezier(0.16, 1, 0.3, 1) !important;',
      hasCoverImage
        ? '  background: linear-gradient(180deg, rgba(6,16,10,0.78) 0%, rgba(6,16,10,0.92) 60%, rgba(6,16,10,0.98) 100%), url("' +
          meta.cover_image_url +
          '") center/cover no-repeat !important;'
        : '  background: radial-gradient(ellipse 1100px 700px at 50% -10%, rgba(34,197,94,0.12) 0%, transparent 60%), linear-gradient(180deg, #09170e 0%, #061009 100%) !important;',
      '}',

      '.cover.faded-out {',
      '  opacity: 0 !important;',
      '  transform: scale(0.98) !important;',
      '  pointer-events: none !important;',
      '}',

      '.cover-content {',
      '  max-width: 680px !important;',
      '  display: flex !important;',
      '  flex-direction: column !important;',
      '  align-items: center !important;',
      '  gap: 16px !important;',
      '}',
      '.cover-headline {',
      '  font-size: clamp(32px, 5vw, 52px) !important;',
      '  line-height: 1.12 !important;',
      '  font-weight: 700 !important;',
      '  letter-spacing: -0.03em !important;',
      '  color: #FFFFFF !important;',
      '  margin: 0 !important;',
      '}',
      '.cover-subline {',
      '  font-size: 16px !important;',
      '  font-weight: 400 !important;',
      '  line-height: 1.55 !important;',
      '  color: rgba(255, 255, 255, 0.72) !important;',
      '  max-width: 520px !important;',
      '  margin: 0 !important;',
      '}',

      '.cover-bottom-bar {',
      '  margin-top: 36px !important;',
      '  display: flex !important;',
      '  justify-content: center !important;',
      '}',

      // FinLit Site Button Styling
      '.btn::after, .cta-btn::after { display: none !important; }',
      '.cta-btn, .btn-p {',
      '  background: #22C55E !important;',
      '  color: #04240F !important;',
      '  font-weight: 600 !important;',
      '  font-size: 15px !important;',
      '  border-radius: 9999px !important;',
      '  padding: 12px 32px !important;',
      '  border: none !important;',
      '  cursor: pointer !important;',
      '  box-shadow: 0 4px 14px rgba(34, 197, 94, 0.3) !important;',
      '  transition: transform 0.15s ease, filter 0.15s ease !important;',
      '}',
      '.cta-btn:hover, .btn-p:hover {',
      '  filter: brightness(1.05) !important;',
      '  transform: scale(1.02) !important;',
      '}',
      '.cta-btn:active, .btn-p:active {',
      '  transform: scale(0.98) !important;',
      '}'
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);

    // Fade cover out cleanly and reset scroll to top (no scrolling down to section)
    function attachFadeHandler() {
      var cover = document.querySelector('.cover');
      var cta = document.querySelector('.cta-btn');
      if (!cover || !cta) return;

      cta.addEventListener('click', function (e) {
        e.preventDefault();
        cover.classList.add('faded-out');
        setTimeout(function () {
          cover.style.display = 'none';
          location.hash = '#s0';
          window.scrollTo(0, 0);
        }, 350);
      });
    }

    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', attachFadeHandler);
    } else {
      attachFadeHandler();
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
