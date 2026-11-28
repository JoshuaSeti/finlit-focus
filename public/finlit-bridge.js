/* FinLit module bridge — injected into every lesson module at load time.
   Lets standalone HTML modules talk to the main site without changing their code.

   Module → site messages (window.parent.postMessage, source "finlit-module"):
     progress     { progress, sections }      lesson progress object (auto-synced from localStorage)
     certificate  { name, score }             learner generated a certificate
     practice     { status }                  yungsta practice finished inside the module
     event        { kind, payload }           any custom event a module wants recorded
     home                                      go back to the lessons list
     open         { slug }                     open another module

   Modules may also call these directly:
     FinLitBridge.track(kind, payload)  FinLitBridge.home()  FinLitBridge.open(slug)  FinLitBridge.user (when signed in)
*/
(function () {
  var CFG = window.__FINLIT_BRIDGE__ || {};
  function post(type, data) {
    try { window.parent.postMessage(Object.assign({ source: 'finlit-module', type: type, slug: CFG.slug }, data || {}), '*'); } catch (e) {}
  }
var B = window.FinLitBridge = {
    slug: CFG.slug, user: CFG.user || null,
    track: function (kind, payload) { post('event', { kind: kind, payload: payload || {} }); },
    home: function () { sync(); setTimeout(function () { post('home'); }, 60); },
    open: function (slug) { sync(); setTimeout(function () { post('open', { slug: slug }); }, 60); },
    post: post,
  };

  // ── Apple-Style Editorial Intro Cover ──
  (function initAppleCover() {
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
        ? '  background: linear-gradient(180deg, rgba(6,16,10,0.68) 0%, rgba(6,16,10,0.88) 55%, rgba(6,16,10,0.98) 100%), url("' +
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

      // Apple primary CTA button
      '.cta-btn {',
      '  background: #22C55E !important;',
      '  color: #04240F !important;',
      '  font-weight: 600 !important;',
      '  font-size: 15px !important;',
      '  letter-spacing: -0.01em !important;',
      '  border-radius: 9999px !important;',
      '  padding: 13px 34px !important;',
      '  border: 1px solid rgba(255, 255, 255, 0.35) !important;',
      '  box-shadow: 0 4px 20px rgba(34, 197, 94, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.45) !important;',
      '  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s ease !important;',
      '}',
      '.cta-btn:hover {',
      '  transform: scale(1.02) !important;',
      '  box-shadow: 0 6px 24px rgba(34, 197, 94, 0.48), inset 0 1px 0 rgba(255, 255, 255, 0.55) !important;',
      '}',
      '.cta-btn:active {',
      '  transform: scale(0.98) !important;',
      '}',
    ].join('\n');
    (document.head || document.documentElement).appendChild(st);

    // Clean up emojis from metadata pills to match Apple minimalism
    function sanitizePills() {
      var pills = document.querySelectorAll('.cover-pills .pill');
      for (var i = 0; i < pills.length; i++) {
        var el = pills[i];
        // Strip emojis and leading/trailing whitespace
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

  // Hide "Next lesson" and "Back to path" buttons inside modules so learners flow
  // smoothly from the lesson directly into the Protégé & Hot-Seat experience.
  (function () {
    var st = document.createElement('style');

    st.textContent = [
      '#fin-next,#fin-back,#fin-finish{display:none!important}',
      'body.fin-hide-bar #fin-bar{display:none!important}',
      'body.fin-hide-bar{padding-bottom:0!important}',
      '#fin-bar{display:none!important}' // Module footer bar completely hidden in favor of player transitions
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

    function renameYungstaLabels() {
      var simBtn = document.getElementById('fin-sim');
      if (simBtn && /yungsta/i.test(simBtn.textContent || '')) {
        simBtn.textContent = 'Continue to Protégé →';
      }
      var pt = document.querySelector('#fl-practice .fl-practice-t');
      if (pt && /yungsta/i.test(pt.textContent || '')) {
        pt.textContent = pt.textContent.replace(/yungsta/gi, 'Protégé');
      }
      var ps = document.querySelector('#fl-practice .fl-practice-s');
      if (ps && /yungsta/i.test(ps.textContent || '')) {
        ps.textContent = ps.textContent.replace(/yungsta/gi, 'Protégé');
      }
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
        // Intermediate section finished: dismiss overlay smoothly and move to next section
        done.classList.remove('on');
        location.hash = '#' + ids[idx + 1];
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        done.classList.remove('on');
      }
    }

    function check() {
      var b = document.getElementById('fin-finish');
      if (b && document.body) {
        var txt = b.textContent || '';
        if (/back to path/i.test(txt)) {
          b.textContent = 'Continue to Protégé →';
          b.dataset.finProtege = '1';
          document.body.classList.remove('fin-hide-bar');
        } else if (/continue to prot/i.test(txt)) {
          b.dataset.finProtege = '1';
          document.body.classList.remove('fin-hide-bar');
        } else {
          delete b.dataset.finProtege;
          document.body.classList.toggle('fin-hide-bar', /next lesson/i.test(txt));
        }
      }
      renameYungstaLabels();
      handleDoneOverlay();
    }

    setInterval(check, 300);
    document.addEventListener('click', function () { setTimeout(check, 40); setTimeout(check, 220); });
    window.addEventListener('load', function () {
      check();
      var done = document.getElementById('fin-done');
      if (done && typeof MutationObserver !== 'undefined') {
        new MutationObserver(handleDoneOverlay).observe(done, { attributes: true, attributeFilter: ['class'] });
      }
    });

    // Intercept the end-of-module "Back to path" / "Continue to Protégé" bar button
    document.addEventListener('click', function (e) {
      var b = e.target && e.target.closest ? e.target.closest('#fin-finish') : null;
      if (!b) return;
      if (b.dataset.finProtege === '1' || /back to path|continue to prot/i.test(b.textContent || '')) {
        e.preventDefault();
        e.stopImmediatePropagation();
        sync();
        post('enter-protege');
      }
    }, true);
  })();

  // Completion card "Practice with your yungsta / Protégé": smoothly transition to Protégé stage.
  document.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('#fin-sim') : null;
    if (!b) return;
    e.preventDefault();
    e.stopImmediatePropagation();
    var done = document.getElementById('fin-done');
    if (done) done.classList.remove('on');
    sync();
    post('enter-protege');
  }, true);

  // Hash links: the page uses <base>, so keep "#section" links inside this page.
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

  // Progress: watch the module's own localStorage record and forward changes.
 var last = '';
  function key() { var c = window.FINLIT_MODULE || {}; return 'finlit-progress-' + (c.moduleId || CFG.slug); }
  function sync() {
    var raw = null; try { raw = localStorage.getItem(key()); } catch (e) {}
    if (!raw) return;
    last = raw;
    var p = null; try { p = JSON.parse(raw); } catch (e) { return; }
    var c = window.FINLIT_MODULE || {};
    post('progress', { progress: p, sections: c.sections || [] });
  }
  setInterval(sync, 2000);
  window.addEventListener('hashchange', function () { setTimeout(sync, 100); });
  window.addEventListener('pagehide', sync);
  window.addEventListener('beforeunload', sync);

// Hook into finish button if present in DOM
  document.addEventListener('click', function (e) {
    var finishBtn = e.target && e.target.closest ? e.target.closest('#fin-finish, .fin-finish-btn') : null;
    if (finishBtn) {
      setTimeout(sync, 50);
    }
  }, true);
   
  // Certificates keep working as-is; we just record the claim.
  window.addEventListener('load', function () {
    sync();
    if (typeof window.openCertModal === 'function') {
      var orig = window.openCertModal;
      window.openCertModal = function () {
        var name = ((document.getElementById('fl-cert-name-input') || {}).value || '').trim();
        var score = null;
        try { var p = JSON.parse(localStorage.getItem(key()) || '{}'); if (p.quizScore) score = Math.round(p.quizScore.correct / p.quizScore.total * 100); } catch (e) {}
        post('certificate', { name: name, score: score });
        return orig.apply(this, arguments);
      };
    }
  });

  // Character simulator inside the module talks to its parent (this page) — pass it up.
  window.addEventListener('message', function (e) {
    if (e.origin !== window.location.origin) return;
    var d = e.data || {};
    if (d.source === 'finlit-sim' && (d.type === 'practice-complete' || d.type === 'practice-unavailable')) {
      post('practice', { status: d.type });
    }
  });
})();
