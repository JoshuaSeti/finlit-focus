// "Take your own advice": the second half of practising with your yungsta.
// Teaching your yungsta cements the idea, but we all give better advice than we follow, so the learner is then asked
// whether they would do the same with their own money, and can promise to try it. The yungsta checks in later.
//   Mirror.mountPractice(hostElement, lessonId)   shown under "Practice complete"
//   Mirror.mountDue(cardElement)                  shown on the dashboard when a promise is due
(function () {
  function el(tag, cls, text) { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function rows(host, items, onPick) {
    const list = el('div', 'mi-list');
    items.forEach(function (it) {
      const b = el('button', 'mi-opt', it.t); b.type = 'button';
      b.onclick = function () { onPick(it.v); };
      list.appendChild(b);
    });
    host.appendChild(list);
  }

  async function mountPractice(host, lesson) {
    if (!host || !lesson || typeof supabase === 'undefined') return;
    let info;
    try { const r = await supabase.rpc('practice_mirror_get', { p_lesson: lesson }); info = r.data; } catch (e) { return; }
    if (!info || info.error || !info.available || info.saved) return;

    host.hidden = false;
    const name = info.name || 'Your yungsta';
    const state = { stance: null, barrier: null };

    function head(title, sub) {
      host.innerHTML = '';
      host.appendChild(el('div', 'mi-k', 'Your turn'));
      host.appendChild(el('h2', 'mi-h', title));
      if (sub) host.appendChild(el('p', 'mi-p', sub));
    }
    function step1() {
      head('Now take your own advice', 'You told ' + name + ':');
      host.appendChild(el('div', 'mi-quote', info.advice));
      host.appendChild(el('p', 'mi-p', 'It is easier to give good advice than to follow it. Be honest: would you do this with your own money?'));
      rows(host, [
        { v: 'same', t: 'Yes, I would do exactly that' },
        { v: 'different', t: 'I would probably do something different' },
        { v: 'unsure', t: 'I am not sure I would really do it' },
        { v: 'na', t: 'This does not apply to me right now' }
      ], function (v) { state.stance = v; (v === 'different' || v === 'unsure') ? step2() : save(); });
      const skip = el('button', 'mi-skip', 'Skip for now'); skip.type = 'button';
      skip.onclick = function () { host.hidden = true; };
      host.appendChild(skip);
    }
    function step2() {
      head('What would get in the way?', 'No wrong answer. Knowing the real reason is half the fix.');
      rows(host, [
        { v: 'cost', t: 'The cost' },
        { v: 'people', t: 'What other people would say or do' },
        { v: 'habit', t: 'I would forget or put it off' },
        { v: 'trust', t: 'I would not trust it' }
      ], function (v) { state.barrier = v; step3(); });
    }
    function step3() {
      head('When will you try it?', 'Pick a day. ' + name + ' will ask you how it went.');
      rows(host, [
        { v: 'today', t: 'Today' }, { v: 'week', t: 'This week' }, { v: 'month', t: 'This month' }
      ], function (v) { save(v); });
    }
    async function save(when) {
      host.querySelectorAll('button').forEach(function (b) { b.disabled = true; });
      let res;
      try { const r = await supabase.rpc('practice_mirror_save', { p_lesson: lesson, p_stance: state.stance, p_barrier: state.barrier, p_when: when || null }); res = r.data; } catch (e) { res = null; }
      host.innerHTML = '';
      if (!res || res.error) {
        host.appendChild(el('div', 'mi-k', 'Your turn'));
        host.appendChild(el('p', 'mi-p', res && res.error === 'already_saved' ? 'You already answered this one.' : 'We could not save that. Your practice still counts. You can carry on.'));
        return;
      }
      host.appendChild(el('div', 'mi-k', 'Your turn'));
      host.appendChild(el('div', 'mi-react', res.reaction || ''));
    }
    step1();
  }

  async function mountDue(card) {
    if (!card || typeof supabase === 'undefined') return;
    let due;
    try { const r = await supabase.rpc('mirror_due'); due = r.data; } catch (e) { return; }
    if (!due || !due.id) return;
    card.hidden = false; card.innerHTML = '';
    const body = el('div', 'mi-card');
    body.appendChild(el('div', 'mi-k', 'Your promise'));
    body.appendChild(el('h2', 'mi-h', 'Did you take your own advice?'));
    body.appendChild(el('p', 'mi-p', 'You told ' + (due.name || 'your yungsta') + ':'));
    body.appendChild(el('div', 'mi-quote', due.advice));
    const out = el('div', 'mi-react'); out.hidden = true;
    const yes = el('button', 'btn', 'Yes, I did'), no = el('button', 'btn btn-secondary', 'Not yet');
    yes.type = no.type = 'button';
    async function answer(done) {
      yes.disabled = no.disabled = true;
      let res; try { const r = await supabase.rpc('mirror_check', { p_id: due.id, p_done: done }); res = r.data; } catch (e) { res = null; }
      if (!res || res.error) { yes.disabled = no.disabled = false; return; }
      yes.remove(); no.remove(); out.hidden = false; out.textContent = res.reaction || '';
      setTimeout(function () { card.hidden = true; }, 6000);
    }
    yes.onclick = function () { answer(true); }; no.onclick = function () { answer(false); };
    body.appendChild(yes); body.appendChild(no); body.appendChild(out);
    card.appendChild(body);
  }

  window.Mirror = { mountPractice: mountPractice, mountDue: mountDue };
})();
