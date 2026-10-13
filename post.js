import { h, errorMessage } from '../ui.js';
import { renderShell } from '../components/shell.js';
import { renderPostCard } from '../components/post-card.js';
import { fetchPostById } from '../api/posts.js';
import { routes } from '../routes.js';

const host = document.getElementById('post-host');
const id = new URLSearchParams(location.search).get('id');
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function notFound(message) {
  host.replaceChildren(h('div', { class: 'state' },
    h('h1', { class: 'state-title' }, 'This post is not available'),
    h('p', {}, message),
    h('a', { class: 'btn btn-gold', href: routes.feed }, 'Back to the feed')));
}

(async function init() {
  const ctx = await renderShell('feed');
  if (!id || !UUID.test(id)) return notFound('The link looks incomplete.');
  try {
    const post = await fetchPostById(id);
    if (!post) return notFound('It may have been deleted or removed.');
    document.title = `${post.display_name} on Eleo`;
    host.replaceChildren(renderPostCard(post, {
      ...ctx, openComments: true, priority: true,
      onDeleted: () => location.assign(routes.feed),
    }));
  } catch (err) {
    host.replaceChildren(h('div', { class: 'state', role: 'alert' },
      h('h1', { class: 'state-title' }, 'The post did not load'),
      h('p', {}, errorMessage(err, 'Check your connection and try again.')),
      h('button', { type: 'button', class: 'btn btn-gold', onclick: () => location.reload() }, 'Try again')));
  }
})();
