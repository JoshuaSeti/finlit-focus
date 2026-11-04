// Stress meter: a semicircle made of dots, the band phrase large, the number small.
// Also: the goal bar, notices when stress is high, and the "Finished" screen after bankruptcy.
// Reads stress_status() (db/12-stress.sql). If that function is not deployed yet, the card stays hidden.
const StressMeter = (function () {
  const BANDS = {
    calm:       { label: 'Vibes on vibes',  name: 'Calm',       color: '#1D9E75' },
    manageable: { label: 'Steady chilling', name: 'Manageable', color: '#639922' },
    strained:   { label: 'Not that bad',    name: 'Strained',   color: '#EF9F27' },
    overloaded: { label: 'Trippin',         name: 'Overloaded', color: '#D85A30' },
    crisis:     { label: 'Performing!',     name: 'Crisis',     color: '#E24B4A' },
    bankrupt:   { label: 'Finished 😭🤚🏾',    name: 'Bankrupt',   color: '#791F1F' }
  };
  const DOTS = 31;

  function bandFor(v) {
    v = Math.round(v);
    if (v >= 100) return 'bankrupt';
    if (v >= 80) return 'crisis';
    if (v >= 60) return 'overloaded';
    if (v >= 40) return 'strained';
    if (v >= 20) return 'manageable';
    return 'calm';
  }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function css() {
    if (document.getElementById('stress-css')) return;
    const st = document.createElement('style'); st.id = 'stress-css';
    st.textContent =
      '.stress-card{background:#fff;border:1px solid #E5E7EB;border-radius:18px;padding:16px 16px 14px;margin-bottom:20px}' +
      '.stress-k{font-size:11px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:#6B7280;text-align:center}' +
      '.stress-k b{color:#15803D;margin-left:6px}' +
      '.stress-card svg{display:block;width:100%;max-width:340px;margin:6px auto 0}' +
      '.stress-band{font:700 24px/1.1 "DM Sans",system-ui,sans-serif;fill:#111827}' +
      '.stress-num{font:500 13px "DM Sans",system-ui,sans-serif;fill:#6B7280}' +
      '.stress-why{list-style:none;margin:6px 0 0;padding:0}' +
      '.stress-why li{display:flex;align-items:center;gap:10px;font-size:14px;line-height:1.35;color:#374151;padding:6px 0}' +
      '.stress-why i{width:8px;height:8px;border-radius:50%;flex:none}' +
      '.stress-note{margin:8px 0 0;padding:10px 12px;border-radius:12px;font-size:13.5px;line-height:1.4}' +
      '.stress-note.warn{background:#FFFBEB;color:#92400E}.stress-note.bad{background:#FEF2F2;color:#7A1010}' +
      '.stress-goal{margin-top:12px;padding-top:12px;border-top:1px solid #F3F4F6}' +
      '.stress-goal-t{display:flex;justify-content:space-between;gap:8px;font-size:13.5px;font-weight:600;color:#111827}' +
      '.stress-goal-t span:last-child{font-weight:500;color:#6B7280;white-space:nowrap}' +
      '.stress-bar{position:relative;height:10px;border-radius:99px;background:#F3F4F6;margin:8px 0 0;overflow:visible}' +
      '.stress-bar i{display:block;height:100%;border-radius:99px;background:#22C55E;transition:width .5s ease}' +
      '.stress-bar b{position:absolute;top:-3px;width:2px;height:16px;background:#111827;opacity:.45;border-radius:2px}' +
      '.stress-link{display:block;text-align:center;margin-top:12px;font-size:13.5px;font-weight:600;color:#15803D;text-decoration:none}' +
      '.stress-dot{transition:fill .35s ease,opacity .35s ease}' +
      '#stress-fin{position:fixed;inset:0;z-index:4000;background:rgba(17,24,39,.72);display:flex;align-items:center;justify-content:center;padding:20px;font-family:"DM Sans",system-ui,sans-serif}' +
      '#stress-fin .box{background:#fff;border-radius:24px;max-width:400px;width:100%;max-height:92vh;overflow:auto;padding:26px 20px 18px;text-align:center}' +
      '#stress-fin h2{font-size:26px;font-weight:800;margin:0 0 8px;color:#791F1F}' +
      '#stress-fin p{font-size:15px;line-height:1.5;color:#374151;margin:0 0 14px}' +
      '#stress-fin ul{list-style:none;margin:0 0 14px;padding:0;text-align:left}' +
      '#stress-fin li{background:#FEF2F2;color:#7A1010;border-radius:12px;padding:10px 12px;margin-bottom:8px;font-size:14px;line-height:1.35}' +
      '#stress-fin textarea{width:100%;box-sizing:border-box;border:1.5px solid #E5E7EB;border-radius:12px;padding:10px 12px;font:15px "DM Sans",system-ui,sans-serif;min-height:70px;margin-bottom:12px}' +
      '#stress-fin button{width:100%;min-height:52px;border:0;border-radius:14px;background:#15803D;color:#fff;font:700 16px "DM Sans",system-ui,sans-serif;cursor:pointer}' +
      '#stress-fin button[disabled]{opacity:.6}' +
      '@media (prefers-reduced-motion:reduce){.stress-dot,.stress-bar i{transition:none}}';
    document.head.appendChild(st);
  }

  function dotsSvg() {
    const R = 140, CX = 170, CY = 165;
    let out = '';
    for (let i = 0; i < DOTS; i++) {
      const a = Math.PI * (1 - i / (DOTS - 1));
      out += '<circle class="stress-dot" data-i="' + i + '" cx="' + (CX + R * Math.cos(a)).toFixed(1) +
             '" cy="' + (CY - R * Math.sin(a)).toFixed(1) + '" r="6" fill="#D1D5DB" opacity=".6"/>';
    }
    return out;
  }

  function paint(root, d) {
    const v = Math.max(0, Math.min(100, Number(d.stress) || 0));
    const key = BANDS[d.band] ? d.band : bandFor(v);
    const b = BANDS[key];
    let last = -1;
    root.querySelectorAll('.stress-dot').forEach(c => {
      const i = Number(c.getAttribute('data-i'));
      const dv = Math.round(i * 100 / (DOTS - 1));
      const on = dv <= v;
      if (on) last = i;
      c.setAttribute('fill', on ? BANDS[bandFor(dv)].color : '#D1D5DB');
      c.setAttribute('opacity', on ? '1' : '.6');
      c.setAttribute('r', '6');
    });
    if (last >= 0) { const c = root.querySelector('.stress-dot[data-i="' + last + '"]'); if (c) c.setAttribute('r', '9'); }
    root.querySelector('.stress-band').textContent = b.label;
    root.querySelector('.stress-num').textContent = 'Stress ' + Math.round(v) + ' of 100 · ' + b.name;
    root.querySelector('svg').setAttribute('aria-label', 'Stress ' + Math.round(v) + ' of 100. ' + b.label);
    const name = d.name || 'Your yungsta';
    root.querySelector('.stress-k').innerHTML = 'How is ' + esc(name) + ' coping?' + (d.comeback ? ' <b>Comeback ✨</b>' : '');
    const drivers = Array.isArray(d.drivers) ? d.drivers : [];
    root.querySelector('.stress-why').innerHTML =
      (drivers.length ? drivers : [{ text: 'Nothing is putting pressure on ' + name + ' right now' }])
        .map(x => '<li><i style="background:' + b.color + '"></i><span>' + esc(x.text) + '</span></li>').join('');
    const note = root.querySelector('.stress-note');
    if (v >= 80) { note.className = 'stress-note bad'; note.textContent = name + ' is overwhelmed. Step in: deal with what is waiting and protect their cash.'; }
    else if (v >= 60) { note.className = 'stress-note warn'; note.textContent = 'Overloaded: careful options are locked and scams show up more often. Bring stress below 60 to get them back.'; }
    else { note.className = 'stress-note'; note.textContent = ''; }
    const g = d.goal;
    const gh = root.querySelector('.stress-goal');
    if (g) {
      const pct = Math.round(Math.max(0, Math.min(1, Number(g.progress) || 0)) * 100);
      const exp = Math.round(Math.max(0, Math.min(1, Number(g.expected) || 0)) * 100);
      gh.hidden = false;
      gh.querySelector('.stress-goal-t span').textContent = (g.emoji || '🎯') + ' ' + g.title;
      gh.querySelector('.stress-goal-t span:last-child').textContent = pct + '% · ' + g.months_left + ' mo left';
      gh.querySelector('.stress-bar i').style.width = pct + '%';
      gh.querySelector('.stress-bar b').style.left = 'calc(' + exp + '% - 1px)';
      gh.setAttribute('aria-label', g.title + ', ' + pct + ' percent done, ' + exp + ' percent expected by now');
    } else { gh.hidden = true; }
  }

  function showFinished(d) {
    if (document.getElementById('stress-fin')) return;
    const name = d.name || 'Your yungsta';
    const tp = (d.bankruptcy && d.bankruptcy.turning_points) || [];
    const wrap = document.createElement('div'); wrap.id = 'stress-fin';
    wrap.setAttribute('role', 'dialog'); wrap.setAttribute('aria-modal', 'true');
    wrap.innerHTML = '<div class="box"><h2>' + BANDS.bankrupt.label + '</h2>' +
      '<p>' + esc(name) + ' ran out of road. This is not the end. It is a chapter. Here is what led to it:</p>' +
      '<ul>' + (tp.length ? tp : ['Too many pressures at once']).map(t => '<li>' + esc(t) + '</li>').join('') + '</ul>' +
      '<p>What will you do differently next time? (optional)</p><textarea id="stress-fin-note" maxlength="300"></textarea>' +
      '<button id="stress-fin-go">Start again with a fresh K3,000</button></div>';
    document.body.appendChild(wrap); document.body.style.overflow = 'hidden';
    document.getElementById('stress-fin-go').addEventListener('click', async function () {
      this.disabled = true;
      const { data, error } = await supabase.rpc('stress_restart', { p_note: document.getElementById('stress-fin-note').value });
      if (error || !data || data.error) { this.disabled = false; alert('Could not restart. Please try again.'); return; }
      window.location.reload();
    });
  }

  async function mount(id) {
    const host = document.getElementById(id);
    if (!host || typeof supabase === 'undefined' || !supabase.rpc) return null;
    const { data, error } = await supabase.rpc('stress_status');
    if (error || !data || data.error) return null;            // not deployed yet, or not signed in: stay hidden
    css();
    window.__stressLevel = data.stress;
    host.innerHTML =
      '<div class="stress-card"><div class="stress-k"></div>' +
      '<svg viewBox="0 0 340 180" role="img" aria-label="Stress meter">' + dotsSvg() +
      '<text class="stress-band" x="170" y="128" text-anchor="middle"></text>' +
      '<text class="stress-num" x="170" y="154" text-anchor="middle"></text></svg>' +
      '<ul class="stress-why"></ul><div class="stress-note"></div>' +
      '<div class="stress-goal" hidden role="img"><div class="stress-goal-t"><span></span><span></span></div>' +
      '<div class="stress-bar"><i style="width:0"></i><b></b></div></div>' +
      '<a class="stress-link" href="leaderboard.html">See how you rank →</a></div>';
    const root = host.firstChild;
    paint(root, Object.assign({}, data, { stress: 0, band: 'calm' }));
    requestAnimationFrame(() => requestAnimationFrame(() => paint(root, data)));   // lets the dots fill in
    if (data.bankrupt) showFinished(data);
    return data;
  }

  return { mount, bandFor, BANDS };
})();
window.StressMeter = StressMeter;
