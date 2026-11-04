// Eleo Social: page chrome for the community pages.
// The top menu is the shared site menu (site-nav.js). This file only adds the
// "Supabase not configured" banner and the phone tab bar for community actions.
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
  const bannerHost = document.getElementById('app-header');
  const tabsHost = document.getElementById('app-tabs');

  let user = null;
  let me = null;
  try {
    user = await getUser();
    me = user ? await getMyProfile() : null;
  } catch (err) {
    console.error('Could not load session', err);
  }

  if (bannerHost) {
    bannerHost.replaceChildren(...(isConfigured ? [] : [
      h('div', { class: 'config-banner', role: 'alert' },
        'Supabase is not configured yet. Add your Project URL and anon key to social/config.js.'),
    ]));
  }

  const signInHref = `${routes.auth}?next=${encodeURIComponent(location.pathname.split('/').pop() + location.search)}`;
  const createHref = user ? routes.create : `${routes.auth}?mode=signup&next=${routes.create}`;

  if (tabsHost) {
    tabsHost.replaceChildren(
      h('nav', { class: 'tabbar', 'aria-label': 'Community' },
        NAV.slice(0, 2).map((item) => tab(item.href, item.icon, item.label, item.id === active)),
        tab(createHref, 'plus', 'Create', active === 'create', true),
        NAV.slice(2).map((item) => tab(item.href, item.icon, item.label, item.id === active)),
        user
          ? h('button', { type: 'button', class: 'tab', onclick: async () => { await signOut(); toast('Signed out'); location.assign(routes.feed); } },
              icon('user'), h('span', {}, 'Sign out'))
          : tab(signInHref, 'user', 'Sign in', false)));
  }

  return { user, me };
}

function tab(href, iconName, label, current, accent = false) {
  return h('a', { href, class: `tab${accent ? ' tab-accent' : ''}`, 'aria-current': current ? 'page' : null },
    icon(iconName), h('span', {}, label));
}
