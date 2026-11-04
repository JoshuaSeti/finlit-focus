// Embedded mode (?embed=1): the page is shown inside a lesson on the lessons site.
// Talks to the lesson with postMessage:  ready | height | practice-complete | practice-unavailable
(function () {
  const EMBED = new URLSearchParams(window.location.search).has('embed');
  window.__EMBED = EMBED;
  if (!EMBED) return;
  document.documentElement.classList.add('embed');
  function post(type, extra) {
    try { window.parent.postMessage(Object.assign({ source: 'finlit-sim', type: type }, extra || {}), '*'); } catch (e) {}
  }
  window.Embed = { post: post };
  let last = 0;
  function height() {
    const h = Math.max(document.documentElement.scrollHeight, 560);
    if (Math.abs(h - last) > 4) { last = h; post('height', { height: h }); }
  }
  window.addEventListener('load', function () {
    post('ready'); height();
    try { new ResizeObserver(height).observe(document.body); } catch (e) { setInterval(height, 800); }
  });
})();
