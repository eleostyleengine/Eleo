/* =============================================================================
   ELEO SITE NAV  |  site-nav.js
   Builds the one shared menu into <div id="site-nav" data-active="..."></div>.
   To change the menu for the whole site, edit LINKS below. Nothing else.
   data-active values: creators | community | about | faq | join | (empty)
   ============================================================================= */
(function () {
  'use strict';
  var mount = document.getElementById('site-nav');
  if (!mount) return;
  var active = mount.getAttribute('data-active') || '';

  var LINKS = [
    { id: 'creators',  href: 'directories.html', label: 'Find Creators', panel: 'Find Creators', desc: 'Search tailors, designers and stylists' },
    { id: 'community', href: 'feed.html',        label: 'Community',     panel: 'Community',     desc: 'See new work and follow the makers you rate' },
    { id: 'about',     href: 'abouteleo.html',   label: 'About',         panel: 'About Eleo',    desc: 'Who we are and why we built this' },
    { id: 'faq',       href: 'faq.html',         label: 'FAQ',           panel: 'FAQ',           desc: 'Answers before you ask' }
  ];

  // Light check only (decides which buttons to show). Real security lives in Supabase.
  function signedIn() {
    try {
      for (var i = 0; i < localStorage.length; i++) {
        var key = localStorage.key(i);
        if (/^sb-.+-auth-token$/.test(key)) {
          var session = JSON.parse(localStorage.getItem(key));
          if (session && session.refresh_token) return true;
        }
      }
    } catch (e) { /* storage blocked: treat as signed out */ }
    return false;
  }

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (attrs[k] === null || attrs[k] === undefined || attrs[k] === false) return;
      if (k === 'text') node.textContent = attrs[k]; else node.setAttribute(k, attrs[k]);
    });
    (children || []).forEach(function (c) { node.appendChild(c); });
    return node;
  }

  var here = (location.pathname.split('/').pop() || 'index.html') + location.search;
  var onAuth = /auth(\.html)?$/.test(location.pathname);
  var loggedIn = signedIn();
  var signInHref = 'auth.html' + (onAuth ? '' : '?next=' + encodeURIComponent(here));

  function actions(cls) {
    if (loggedIn) {
      return [
        el('a', { 'class': cls.cta, href: 'create-post.html', text: 'Create post' }),
        el('a', { 'class': cls.sub, href: 'auth.html?signout=1', text: 'Sign out' })
      ];
    }
    return [
      el('a', { 'class': cls.sub, href: signInHref, text: 'Sign in' }),
      el('a', { 'class': cls.cta, href: 'join.html', text: 'Join as a creator', 'aria-current': active === 'join' ? 'page' : null })
    ];
  }

  // --- bar ---
  var links = el('nav', { 'class': 'sn-links', 'aria-label': 'Main' }, LINKS.map(function (l) {
    return el('a', { href: l.href, text: l.label, 'aria-current': l.id === active ? 'page' : null });
  }));

  var desktopActions = el('div', { 'class': 'sn-actions' }, actions({ cta: 'sn-cta', sub: 'sn-signin' }));

  var toggle = el('button', { 'class': 'sn-toggle', type: 'button', 'aria-expanded': 'false', 'aria-controls': 'sn-panel', 'aria-label': 'Open menu' });
  toggle.innerHTML =
    '<svg class="sn-bars" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h16"/></svg>' +
    '<svg class="sn-x" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';

  var bar = el('div', { 'class': 'sn-bar' }, [
    el('a', { 'class': 'sn-logo', href: 'index.html', 'aria-label': 'Eleo home', text: 'ELEO' }),
    links, desktopActions, toggle
  ]);

  // --- phone panel ---
  var items = [el('a', { 'class': 'sn-item', href: 'index.html' }, [el('strong', { text: 'Home' }), el('span', { text: 'Back to the start' })])]
    .concat(LINKS.map(function (l) {
      return el('a', { 'class': 'sn-item', href: l.href, 'aria-current': l.id === active ? 'page' : null },
        [el('strong', { text: l.panel }), el('span', { text: l.desc })]);
    }));
  var panelActions = actions({ cta: 'sn-cta', sub: 'sn-ghost' });
  // On the phone panel the main button goes first
  panelActions.sort(function (a, b) { return (b.className === 'sn-cta') - (a.className === 'sn-cta'); });
  var panel = el('div', { 'class': 'sn-panel', id: 'sn-panel', hidden: '' },
    items.concat([el('div', { 'class': 'sn-row' }, panelActions)]));

  var root = el('div', { 'class': 'sn' }, [bar, panel]);
  mount.textContent = '';
  mount.appendChild(root);

  // --- behaviour ---
  function setOpen(open) {
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    if (open) panel.removeAttribute('hidden'); else panel.setAttribute('hidden', '');
    document.documentElement.style.overflow = open ? 'hidden' : '';
  }
  toggle.addEventListener('click', function () { setOpen(panel.hasAttribute('hidden')); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && !panel.hasAttribute('hidden')) { setOpen(false); toggle.focus(); }
  });
  panel.addEventListener('click', function (e) { if (e.target.closest && e.target.closest('a')) setOpen(false); });
  if (window.matchMedia) {
    var mq = window.matchMedia('(min-width: 900px)');
    var onChange = function (e) { if (e.matches) setOpen(false); };
    if (mq.addEventListener) mq.addEventListener('change', onChange); else if (mq.addListener) mq.addListener(onChange);
  }
})();
