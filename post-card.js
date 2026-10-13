// Eleo Social: the post card. Used by the feed, explore, saved, profile grids
// (full view), and the single-post share page.
import {
  h, icon, avatar, verifiedSeal, timeAgo, compactNumber, toast, confirmDialog,
  placeholderArt, PRO_LABELS, errorMessage,
} from '../ui.js';
import { postImageUrl } from '../api/storage.js';
import {
  likePost, unlikePost, savePost, unsavePost, fetchComments, addComment, deleteComment,
} from '../api/interactions.js';
import { deletePost } from '../api/posts.js';
import { goToAuth } from '../supabase.js';
import { READY, routes } from '../routes.js';

const COMMENT_PAGE = 10;

function actionButton({ cls, iconName, label, onClick, pressable = false }) {
  const count = h('span', { class: 'action-count' });
  const btn = h('button', { type: 'button', class: `action action-${cls}`, onclick: onClick },
    icon(iconName), h('span', { class: 'sr-only' }, label), count);
  return {
    btn,
    set(n, pressed) {
      count.textContent = n == null ? '' : compactNumber(n);
      if (pressable) {
        btn.setAttribute('aria-pressed', String(!!pressed));
        btn.classList.toggle('is-on', !!pressed);
      }
    },
  };
}

function maybeLink(ready, href, className, ...children) {
  return ready ? h('a', { href, class: className }, ...children) : h('span', { class: className }, ...children);
}

/**
 * @param post  a row shaped like feed_posts() output
 * @param ctx   { user, me, onDeleted(post, element), openComments, priority }
 */
export function renderPostCard(post, ctx = {}) {
  const { user = null, me = null, onDeleted, openComments = false, priority = false } = ctx;
  const state = {
    liked: !!post.liked_by_me, saved: !!post.saved_by_me,
    likes: post.likes_count, saves: post.saves_count, comments: post.comments_count,
  };
  const isOwner = !!user && user.id === post.author_id;
  const busy = { like: false, save: false };

  // ---- header (maker credit) ----------------------------------------------
  const trade = post.professional_type ? PRO_LABELS[post.professional_type] : null;
  const credit = maybeLink(READY.profile, routes.profile(post.username), 'post-author',
    avatar(post, 44),
    h('span', { class: 'post-author-text' },
      h('span', { class: 'post-author-name' }, post.display_name, post.is_verified && verifiedSeal()),
      h('span', { class: 'post-author-sub' },
        trade && h('span', {}, trade),
        post.location && h('span', { class: 'with-icon' }, icon('pin', 13), post.location))));

  let menu = null;
  if (isOwner) {
    const menuBtn = h('button', { type: 'button', class: 'icon-btn', 'aria-haspopup': 'true', 'aria-expanded': 'false', 'aria-label': 'Post options' }, icon('more'));
    const menuList = h('div', { class: 'menu', role: 'menu', hidden: true },
      h('button', { type: 'button', role: 'menuitem', class: 'menu-item menu-danger', onclick: handleDelete }, icon('trash', 18), 'Delete post'));
    const close = () => { menuList.hidden = true; menuBtn.setAttribute('aria-expanded', 'false'); };
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const open = menuList.hidden;
      menuList.hidden = !open;
      menuBtn.setAttribute('aria-expanded', String(open));
      if (open) menuList.querySelector('button').focus();
    });
    document.addEventListener('click', close);
    menuList.addEventListener('keydown', (e) => { if (e.key === 'Escape') { close(); menuBtn.focus(); } });
    menu = h('div', { class: 'menu-wrap' }, menuBtn, menuList);
  }

  // ---- media ---------------------------------------------------------------
  const url = postImageUrl(post.image_path);
  const media = h('figure', { class: 'post-media' },
    url
      ? h('img', {
          src: url, alt: `Photo by ${post.display_name}: ${post.caption.slice(0, 110)}`,
          loading: priority ? 'eager' : 'lazy', decoding: 'async', fetchpriority: priority ? 'high' : null,
        })
      : placeholderArt(post.category_name || 'Fashion', post.id));

  // ---- actions -------------------------------------------------------------
  const likeBtn = actionButton({ cls: 'like', iconName: 'heart', label: 'Like', pressable: true, onClick: () => toggle('like') });
  const commentBtn = actionButton({ cls: 'comment', iconName: 'comment', label: 'Comments', onClick: () => toggleComments() });
  const saveBtn = actionButton({ cls: 'save', iconName: 'bookmark', label: 'Save', pressable: true, onClick: () => toggle('save') });
  const shareBtn = actionButton({ cls: 'share', iconName: 'share', label: 'Share', onClick: sharePost });
  commentBtn.btn.setAttribute('aria-expanded', 'false');
  const paint = () => {
    likeBtn.set(state.likes, state.liked);
    commentBtn.set(state.comments);
    saveBtn.set(state.saves, state.saved);
    shareBtn.set(null);
  };
  paint();

  // ---- caption -------------------------------------------------------------
  const long = post.caption.length > 150 || post.caption.split('\n').length > 3;
  const captionText = h('span', { class: long ? 'is-clamped' : '' }, post.caption);
  const moreBtn = long && h('button', {
    type: 'button', class: 'link-btn', 'aria-expanded': 'false',
    onclick: () => {
      const open = captionText.classList.toggle('is-clamped') === false;
      moreBtn.textContent = open ? 'Show less' : 'Read more';
      moreBtn.setAttribute('aria-expanded', String(open));
    },
  }, 'Read more');

  const tags = (post.tags || []).length
    ? h('ul', { class: 'post-tags', 'aria-label': 'Tags' },
        post.tags.map((t) => h('li', {}, maybeLink(READY.explore, routes.explore({ q: t }), 'tag', `#${t}`))))
    : null;

  const meta = h('div', { class: 'post-meta' },
    post.category_name && maybeLink(READY.explore, routes.explore({ category: post.category_slug }), 'chip', post.category_name),
    h('time', { datetime: post.created_at, title: new Date(post.created_at).toLocaleString('en-NG') }, timeAgo(post.created_at)));

  // ---- comments ------------------------------------------------------------
  const list = h('ul', { class: 'comment-list' });
  const empty = h('p', { class: 'muted comment-empty', hidden: true }, 'No comments yet. Start the conversation.');
  const errorLine = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const earlier = h('button', { type: 'button', class: 'link-btn', hidden: true, onclick: () => loadComments(oldest) }, 'Show earlier comments');
  let oldest = null;
  let commentsLoaded = false;

  const input = h('input', { type: 'text', class: 'input', id: `c-${post.id}`, maxlength: '1000', autocomplete: 'off', placeholder: 'Add a comment', required: true });
  const submit = h('button', { type: 'submit', class: 'btn btn-gold btn-sm' }, 'Post');
  const form = user
    ? h('form', { class: 'comment-form', onsubmit: handleComment },
        h('label', { for: `c-${post.id}`, class: 'sr-only' }, 'Add a comment'), input, submit)
    : h('p', { class: 'muted' }, h('a', { href: `${routes.auth}?next=${encodeURIComponent(routes.post(post.id))}` }, 'Sign in'), ' to comment.');

  const commentsEl = h('section', { class: 'post-comments', hidden: true, 'aria-label': 'Comments' }, earlier, list, empty, errorLine, form);

  function renderComment(c) {
    const own = !!user && c.author_id === user.id;
    const li = h('li', { class: 'comment', dataset: { id: c.id } },
      avatar(c, 32),
      h('div', { class: 'comment-main' },
        h('p', { class: 'comment-head' },
          maybeLink(READY.profile, routes.profile(c.username), 'comment-name', c.display_name),
          c.is_verified && verifiedSeal(),
          h('time', { datetime: c.created_at, class: 'muted' }, timeAgo(c.created_at))),
        h('p', { class: 'comment-body' }, c.body)),
      own && h('button', {
        type: 'button', class: 'icon-btn icon-btn-sm', 'aria-label': 'Delete your comment',
        onclick: async () => {
          const ok = await confirmDialog({ title: 'Delete comment?', message: 'This cannot be undone.', confirmLabel: 'Delete', danger: true });
          if (!ok) return;
          try {
            await deleteComment(c.id);
            li.remove();
            state.comments = Math.max(0, state.comments - 1);
            paint();
            empty.hidden = list.children.length > 0;
          } catch (err) { toast(errorMessage(err, 'Could not delete the comment.'), 'error'); }
        },
      }, icon('trash', 16)));
    return li;
  }

  async function loadComments(before = null) {
    errorLine.hidden = true;
    try {
      const rows = await fetchComments(post.id, { limit: COMMENT_PAGE, before });
      list.prepend(...rows.map(renderComment));
      if (rows.length) oldest = rows[0].created_at;
      earlier.hidden = rows.length < COMMENT_PAGE;
      empty.hidden = list.children.length > 0;
      commentsLoaded = true;
    } catch (err) {
      errorLine.textContent = 'Comments could not be loaded. Close and reopen to try again.';
      errorLine.hidden = false;
    }
  }

  async function toggleComments(forceOpen = false) {
    const open = forceOpen || commentsEl.hidden;
    commentsEl.hidden = !open;
    commentBtn.btn.setAttribute('aria-expanded', String(open));
    if (open && !commentsLoaded) await loadComments();
    if (open && user) input.focus({ preventScroll: true });
  }

  async function handleComment(event) {
    event.preventDefault();
    const body = input.value.trim();
    if (!body) { errorLine.textContent = 'Write something before posting.'; errorLine.hidden = false; return; }
    errorLine.hidden = true;
    submit.disabled = true;
    try {
      const saved = await addComment(post.id, body);
      const mine = me || { display_name: 'You', username: '', avatar_url: null };
      list.append(renderComment({
        id: saved.id, author_id: user.id, body, created_at: saved.created_at,
        username: mine.username, display_name: mine.display_name, avatar_url: mine.avatar_url, is_verified: !!mine.is_verified,
      }));
      empty.hidden = true;
      state.comments += 1;
      paint();
      input.value = '';
    } catch (err) {
      errorLine.textContent = errorMessage(err, 'Your comment was not posted. Try again.');
      errorLine.hidden = false;
    } finally { submit.disabled = false; }
  }

  // ---- like / save (optimistic, with rollback) -----------------------------
  async function toggle(kind) {
    if (!user) return goToAuth();
    if (busy[kind]) return;
    busy[kind] = true;
    const flag = kind === 'like' ? 'liked' : 'saved';
    const counter = kind === 'like' ? 'likes' : 'saves';
    const was = state[flag];
    state[flag] = !was;
    state[counter] += was ? -1 : 1;
    paint();
    try {
      if (kind === 'like') await (was ? unlikePost(post.id) : likePost(post.id));
      else await (was ? unsavePost(post.id) : savePost(post.id));
      if (kind === 'save') toast(was ? 'Removed from saved' : 'Saved to your collection');
    } catch (err) {
      state[flag] = was;
      state[counter] += was ? 1 : -1;
      paint();
      toast(errorMessage(err, `Could not update your ${kind}. Try again.`), 'error');
    } finally { busy[kind] = false; }
  }

  // ---- share ---------------------------------------------------------------
  async function sharePost() {
    const link = new URL(routes.post(post.id), location.href).href;
    const data = { title: `${post.display_name} on Eleo`, text: post.caption.slice(0, 100), url: link };
    if (navigator.share) {
      try { await navigator.share(data); return; }
      catch (err) { if (err && err.name === 'AbortError') return; }
    }
    try {
      await navigator.clipboard.writeText(link);
      toast('Link copied');
    } catch {
      window.prompt('Copy this link', link);
    }
  }

  async function handleDelete() {
    const ok = await confirmDialog({
      title: 'Delete this post?', message: 'The photo, comments and likes will be removed permanently.',
      confirmLabel: 'Delete post', danger: true,
    });
    if (!ok) return;
    try {
      await deletePost(post);
      toast('Post deleted');
      if (onDeleted) onDeleted(post, article); else article.remove();
    } catch (err) { toast(errorMessage(err, 'Could not delete the post.'), 'error'); }
  }

  const article = h('article', { class: 'post-card', dataset: { postId: post.id } },
    h('header', { class: 'post-head' }, credit, menu),
    media,
    h('div', { class: 'post-body' },
      h('div', { class: 'post-actions' },
        h('div', { class: 'post-actions-main' }, likeBtn.btn, commentBtn.btn, shareBtn.btn),
        saveBtn.btn),
      h('p', { class: 'post-caption' }, h('strong', { class: 'post-caption-name' }, post.display_name), ' ', captionText, moreBtn),
      tags, meta),
    commentsEl);

  if (openComments) toggleComments(true);
  return article;
}

export function postCardSkeleton() {
  return h('div', { class: 'post-card skeleton', 'aria-hidden': 'true' },
    h('div', { class: 'sk-head' }, h('span', { class: 'sk-circle' }), h('span', { class: 'sk-line' })),
    h('div', { class: 'sk-media' }),
    h('div', { class: 'sk-body' }, h('span', { class: 'sk-line' }), h('span', { class: 'sk-line short' })));
}
