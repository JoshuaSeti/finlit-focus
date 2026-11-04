// Bottom tab bar, shared by the main pages. Locked features keep working: the story engine marks
// tabs with data-feature as locked and shows its hint.
(function () {
  const here = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const T = [
    { href: 'index.html', label: 'Today', match: ['', 'index.html', 'leaderboard.html', 'history.html'],
      svg: '<path d="M3 11.5 12 4l9 7.5"/><path d="M5.5 10v9.5a1 1 0 0 0 1 1H10v-5.5h4v5.5h3.5a1 1 0 0 0 1-1V10"/>' },
    { href: 'ventures.html', label: 'Business', match: ['ventures.html'],
      svg: '<path d="M4 9.5 5.5 4h13L20 9.5"/><path d="M4 9.5a2.7 2.7 0 0 0 5.3 0 2.7 2.7 0 0 0 5.4 0 2.7 2.7 0 0 0 5.3 0"/><path d="M5.5 12.5V20h13v-7.5"/>' },
    { href: 'trade.html', label: 'Invest', match: ['trade.html'], feature: 'trade',
      svg: '<path d="M4 19.5V5"/><path d="M4 19.5h16"/><path d="m7.5 15 3.5-4 3 2.5 4.5-6"/>' },
    { href: 'debts.html', label: 'Debts', match: ['debts.html'], feature: 'debts',
      svg: '<rect x="3" y="6" width="18" height="12" rx="2.5"/><path d="M3 10.5h18"/><path d="M7 15h3"/>' },
    { href: 'profile.html', label: 'Me', match: ['profile.html'],
      svg: '<circle cx="12" cy="8.5" r="3.7"/><path d="M4.8 20c.6-3.7 3.5-5.7 7.2-5.7s6.6 2 7.2 5.7"/>' }
  ];
  function build() {
    if (document.querySelector('.tabbar')) return;
    const nav = document.createElement('nav'); nav.className = 'tabbar'; nav.setAttribute('aria-label', 'Main');
    nav.innerHTML = T.map(t => '<a href="' + t.href + '"' + (t.feature ? ' data-feature="' + t.feature + '"' : '') +
      (t.match.indexOf(here) >= 0 ? ' class="on" aria-current="page"' : '') +
      '><svg viewBox="0 0 24 24" aria-hidden="true">' + t.svg + '</svg><span>' + t.label + '</span></a>').join('');
    document.body.appendChild(nav);
  }
  if (document.body) build(); else document.addEventListener('DOMContentLoaded', build);
})();
