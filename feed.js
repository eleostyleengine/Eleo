import { h, icon, avatar, toast, errorMessage } from '../ui.js';
import { renderShell } from '../components/shell.js';
import { renderPostCard, postCardSkeleton } from '../components/post-card.js';
import { fetchFeed, fetchCategories } from '../api/posts.js';
import { routes, READY } from '../routes.js';

const PAGE_SIZE = 12;
const params = new URLSearchParams(location.search);
const state = {
  tab: params.get('tab') === 'following' ? 'following' : 'latest',
  category: params.get('category') || null,
  cursor: null, done: false, loading: false, count: 0, token: 0,
};

const listEl = document.getElementById('feed-list');
const statusEl = document.getElementById('feed-status');
const sentinel = document.getElementById('feed-sentinel');
const catsEl = document.getElementById('cat-filter');
const tabsEl = document.getElementById('feed-tabs');
const introEl = document.getElementById('feed-intro');

let ctx = { user: null, me: null };

function syncUrl() {
  const p = new URLSearchParams();
  if (state.tab === 'following') p.set('tab', 'following');
  if (state.category) p.set('category', state.category);
  history.replaceState(null, '', p.toString() ? `?${p}` : location.pathname);
}

function setStatus(node) { statusEl.replaceChildren(...(node ? [node] : [])); }

function emptyState() {
  if (state.tab === 'following') {
    return ctx.user
      ? h('div', { class: 'state' },
          h('h2', { class: 'state-title' }, 'Nobody to show yet'),
          h('p', {}, 'Posts from creators you follow will appear here.'),
          h('button', { type: 'button', class: 'btn btn-gold', onclick: () => selectTab('latest') }, 'Browse the latest posts'))
      : h('div', { class: 'state' },
          h('h2', { class: 'state-title' }, 'Sign in to see who you follow'),
          h('p', {}, 'Follow tailors, designers and stylists and their work shows up here.'),
          h('a', { class: 'btn btn-gold', href: `${routes.auth}?next=feed.html%3Ftab%3Dfollowing` }, 'Sign in'));
  }
  return h('div', { class: 'state' },
    h('h2', { class: 'state-title' }, state.category ? 'Nothing in this category yet' : 'No posts yet'),
    h('p', {}, state.category ? 'Be the first to share work in this category.' : 'Share the first piece of work on Eleo.'),
    h('a', { class: 'btn btn-gold', href: ctx.user ? routes.create : `${routes.auth}?mode=signup&next=${routes.create}` }, 'Create a post'));
}

async function loadMore() {
  if (state.loading || state.done) return;
  if (state.tab === 'following' && !ctx.user) { state.done = true; setStatus(emptyState()); return; }
  state.loading = true;
  const token = state.token;
  const first = state.count === 0;
  if (first) listEl.replaceChildren(postCardSkeleton(), postCardSkeleton());
  setStatus(null);
  try {
    const rows = await fetchFeed({
      limit: PAGE_SIZE, cursor: state.cursor, category: state.category,
      followingOnly: state.tab === 'following',
    });
    if (token !== state.token) return;          // user switched tab/filter meanwhile
    if (first) listEl.replaceChildren();
    rows.forEach((post, i) => {
      listEl.append(renderPostCard(post, { ...ctx, priority: first && i === 0 }));
    });
    state.count += rows.length;
    if (rows.length) state.cursor = { created_at: rows.at(-1).created_at, id: rows.at(-1).id };
    if (rows.length < PAGE_SIZE) {
      state.done = true;
      if (state.count === 0) setStatus(emptyState());
      else setStatus(h('p', { class: 'muted end-note' }, 'You have reached the end.'));
    }
  } catch (err) {
    if (token !== state.token) return;
    if (first) listEl.replaceChildren();
    setStatus(h('div', { class: 'state', role: 'alert' },
      h('h2', { class: 'state-title' }, 'The feed did not load'),
      h('p', {}, errorMessage(err, 'Check your connection and try again.')),
      h('button', { type: 'button', class: 'btn btn-gold', onclick: () => loadMore() }, 'Try again')));
  } finally {
    if (token === state.token) state.loading = false;
  }
}

function reset() {
  state.token += 1;
  Object.assign(state, { cursor: null, done: false, loading: false, count: 0 });
  listEl.replaceChildren();
  setStatus(null);
  syncUrl();
  loadMore();
}

function selectTab(tab) {
  state.tab = tab;
  tabsEl.querySelectorAll('.tab-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tab === tab)));
  reset();
}

function selectCategory(slug) {
  state.category = slug;
  catsEl.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String((b.dataset.slug || '') === (slug || ''))));
  reset();
}

async function buildFilters() {
  tabsEl.replaceChildren(
    ...[['latest', 'Latest'], ['following', 'Following']].map(([id, label]) =>
      h('button', {
        type: 'button', class: 'tab-btn', dataset: { tab: id },
        'aria-pressed': String(state.tab === id), onclick: () => selectTab(id),
      }, label)));
  try {
    const cats = await fetchCategories();
    catsEl.replaceChildren(
      ...[{ slug: '', name: 'All' }, ...cats].map((c) =>
        h('button', {
          type: 'button', class: 'chip chip-btn', dataset: { slug: c.slug },
          'aria-pressed': String((c.slug || '') === (state.category || '')),
          onclick: () => selectCategory(c.slug || null),
        }, c.name)));
  } catch { catsEl.hidden = true; }
}

function buildIntro() {
  if (ctx.user) {
    introEl.replaceChildren(h('a', { class: 'composer', href: routes.create },
      ctx.me ? avatar(ctx.me, 40) : icon('user'),
      h('span', {}, 'Share your latest work')));
  } else {
    introEl.replaceChildren(h('div', { class: 'join-note' },
      h('p', {}, 'Eleo connects people with fashion talent. Join to like, save and follow the makers you rate.'),
      h('a', { class: 'btn btn-gold btn-sm', href: `${routes.auth}?mode=signup&next=feed.html` }, 'Join Eleo')));
  }
}

(async function init() {
  ctx = await renderShell('feed');
  buildIntro();
  await buildFilters();
  const observer = new IntersectionObserver((entries) => {
    if (entries.some((e) => e.isIntersecting)) loadMore();
  }, { rootMargin: '700px 0px' });
  observer.observe(sentinel);
  loadMore();
})();
