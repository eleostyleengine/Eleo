// Eleo Social: route table + "is this page built yet?" flags.
// Components link to a page only when its flag is true, so nothing 404s while
// the platform is built in stages. Flip a flag when its page ships.
export const READY = {
  feed: true,
  create: true,
  post: true,
  explore: false,
  saved: false,
  notifications: false,
  profile: false,
};

export const routes = {
  feed: 'feed.html',
  create: 'create-post.html',
  auth: 'auth.html',
  explore: (params = {}) => 'explore.html' + qs(params),
  saved: 'saved.html',
  notifications: 'notifications.html',
  profile: (username) => `u.html?username=${encodeURIComponent(username)}`,
  post: (id) => `post.html?id=${encodeURIComponent(id)}`,
};

function qs(params) {
  const s = new URLSearchParams(Object.entries(params).filter(([, v]) => v)).toString();
  return s ? `?${s}` : '';
}
