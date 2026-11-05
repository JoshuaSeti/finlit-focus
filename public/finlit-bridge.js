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
    home: function () { post('home'); },
    open: function (slug) { post('open', { slug: slug }); },
    post: post,
  };

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
    if (!raw || raw === last) return;
    last = raw;
    var p = null; try { p = JSON.parse(raw); } catch (e) { return; }
    var c = window.FINLIT_MODULE || {};
    post('progress', { progress: p, sections: c.sections || [] });
  }
  setInterval(sync, 2000);
  window.addEventListener('hashchange', function () { setTimeout(sync, 300); });
  window.addEventListener('pagehide', sync);

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
    var d = e.data || {};
    if (d.source === 'finlit-sim' && (d.type === 'practice-complete' || d.type === 'practice-unavailable')) {
      post('practice', { status: d.type });
    }
  });
})();
