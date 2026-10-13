// Eleo Social: shared page chrome (top bar on desktop, tab bar on phones).
import { h, icon, toast } from '../ui.js';
import { getUser, getMyProfile, signOut, isConfigured } from '../supabase.js';
import { READY, routes } from '../routes.js';

const NAV = [
  { id: 'feed', label: 'Feed', href: routes.feed, icon: 'home', ready: READY.feed },
  { id: 'explore', label: 'Explore', href: routes.explore(), icon: 'search', ready: READY.explore },
  { id: 'saved', label: 'Saved', href: routes.saved, icon: 'bookmark', ready: READY.saved },
  { id: 'alerts', label: 'Alerts', href: routes.notifications, icon: 'bell', ready: READY.notifications },
].filter((item) => item.ready);

export async function renderShell(active) {
  const headerHost = document.getElementById('app-header');
  const tabsHost = document.getElementById('app-tabs');

  let user = null;
  let me = null;
  try {
    user = await getUser();
    me = user ? await getMyProfile() : null;
  } catch (err) {
    console.error('Could not load session', err);
  }

  const signInHref = `${routes.auth}?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`;

  const account = user
    ? h('button', {
        type: 'button', class: 'btn btn-ghost btn-sm',
        onclick: async () => { await signOut(); location.assign(routes.feed); },
      }, 'Sign out')
    : h('a', { class: 'btn btn-ghost btn-sm', href: signInHref }, 'Sign in');

  headerHost.replaceChildren(
    !isConfigured && h('div', { class: 'config-banner', role: 'alert' },
      'Supabase is not configured yet. Add your Project URL and anon key to social/config.js.'),
    h('div', { class: 'topbar-inner' },
      h('a', { class: 'brand', href: 'index.html', 'aria-label': 'Eleo home' }, 'ELEO'),
      h('nav', { class: 'topnav', 'aria-label': 'Main' },
        NAV.map((item) => h('a', { href: item.href, class: 'topnav-link', 'aria-current': item.id === active ? 'page' : null }, item.label))),
      h('div', { class: 'topbar-actions' },
        h('a', { class: 'btn btn-gold btn-sm', href: user ? routes.create : `${routes.auth}?mode=signup&next=${routes.create}` },
          icon('plus', 18), h('span', {}, 'Create post')),
        account)));

  tabsHost.replaceChildren(
    h('nav', { class: 'tabbar', 'aria-label': 'Main' },
      NAV.slice(0, 2).map((item) => tab(item.href, item.icon, item.label, item.id === active)),
      tab(user ? routes.create : `${routes.auth}?mode=signup&next=${routes.create}`, 'plus', 'Create', active === 'create', true),
      NAV.slice(2).map((item) => tab(item.href, item.icon, item.label, item.id === active)),
      user
        ? h('button', { type: 'button', class: 'tab', onclick: async () => { await signOut(); toast('Signed out'); location.assign(routes.feed); } },
            icon('user'), h('span', {}, 'Sign out'))
        : tab(signInHref, 'user', 'Sign in', false)));

  return { user, me };
}

function tab(href, iconName, label, current, accent = false) {
  return h('a', { href, class: `tab${accent ? ' tab-accent' : ''}`, 'aria-current': current ? 'page' : null },
    icon(iconName), h('span', {}, label));
}
