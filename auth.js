import { h, toast, errorMessage } from '../ui.js';
import { supabase, getUser, isConfigured } from '../supabase.js';

const params = new URLSearchParams(location.search);
let mode = params.get('mode') === 'signup' ? 'signup' : 'signin';

const root = document.getElementById('auth-root');

/** Only ever redirect back to our own origin (prevents open-redirect abuse). */
function nextUrl() {
  const raw = params.get('next');
  const fallback = new URL('feed.html', location.href).href;
  if (!raw) return fallback;
  try {
    const u = new URL(raw, location.href);
    return u.origin === location.origin ? u.href : fallback;
  } catch { return fallback; }
}

function field({ id, label, type = 'text', autocomplete, hint, minlength, maxlength, required = true }) {
  const err = h('p', { class: 'field-error', id: `${id}-err`, role: 'alert', hidden: true });
  const input = h('input', {
    id, name: id, type, class: 'input', autocomplete, minlength, maxlength, required,
    'aria-describedby': `${hint ? `${id}-hint ` : ''}${id}-err`,
  });
  return {
    input, err,
    el: h('div', { class: 'field' },
      h('label', { for: id, class: 'label' }, label),
      input,
      hint && h('p', { class: 'hint', id: `${id}-hint` }, hint),
      err),
  };
}
const showErr = (f, msg) => { f.err.textContent = msg; f.err.hidden = !msg; f.input.setAttribute('aria-invalid', msg ? 'true' : 'false'); };

function formError() { return h('p', { class: 'form-error', role: 'alert', hidden: true }); }
function setFormError(el, msg) { el.textContent = msg; el.hidden = !msg; }

function friendlyAuthError(err) {
  const m = (err?.message || '').toLowerCase();
  if (m.includes('invalid login')) return 'That email and password do not match.';
  if (m.includes('email not confirmed')) return 'Confirm your email first. Check your inbox for the link.';
  if (m.includes('already registered') || m.includes('already been registered')) return 'An account with that email already exists. Sign in instead.';
  if (m.includes('rate limit') || m.includes('too many')) return 'Too many attempts. Wait a few minutes and try again.';
  if (m.includes('password')) return err.message;
  return errorMessage(err, 'Something went wrong. Try again.');
}

function renderTabs() {
  return h('div', { class: 'tabs', role: 'group', 'aria-label': 'Account' },
    h('button', { type: 'button', class: 'tab-btn', 'aria-pressed': String(mode === 'signin'), onclick: () => { mode = 'signin'; render(); } }, 'Sign in'),
    h('button', { type: 'button', class: 'tab-btn', 'aria-pressed': String(mode === 'signup'), onclick: () => { mode = 'signup'; render(); } }, 'Create account'));
}

function signInForm() {
  const email = field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email' });
  const password = field({ id: 'password', label: 'Password', type: 'password', autocomplete: 'current-password' });
  const fe = formError();
  const submit = h('button', { type: 'submit', class: 'btn btn-gold btn-block' }, 'Sign in');
  const forgot = h('button', { type: 'button', class: 'link-btn', onclick: async () => {
    showErr(email, '');
    if (!email.input.value.trim()) { showErr(email, 'Enter your email above first.'); email.input.focus(); return; }
    const { error } = await supabase.auth.resetPasswordForEmail(email.input.value.trim(), { redirectTo: new URL('auth.html', location.href).href });
    if (error) setFormError(fe, friendlyAuthError(error));
    else toast('Password reset link sent. Check your email.');
  } }, 'Forgot password?');

  const form = h('form', { class: 'auth-form', novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    setFormError(fe, '');
    showErr(email, ''); showErr(password, '');
    let bad = false;
    if (!/^\S+@\S+\.\S+$/.test(email.input.value.trim())) { showErr(email, 'Enter a valid email address.'); bad = true; }
    if (!password.input.value) { showErr(password, 'Enter your password.'); bad = true; }
    if (bad) return;
    submit.disabled = true; submit.textContent = 'Signing in...';
    const { error } = await supabase.auth.signInWithPassword({ email: email.input.value.trim(), password: password.input.value });
    if (error) { setFormError(fe, friendlyAuthError(error)); submit.disabled = false; submit.textContent = 'Sign in'; return; }
    location.assign(nextUrl());
  } }, email.el, password.el, fe, submit, h('p', { class: 'center' }, forgot));
  return form;
}

function signUpForm() {
  const name = field({ id: 'display_name', label: 'Your name', autocomplete: 'name', maxlength: 60, hint: 'Shown on your posts. A brand or business name is fine.' });
  const username = field({ id: 'username', label: 'Username', autocomplete: 'username', maxlength: 30, hint: '3 to 30 characters: lowercase letters, numbers and underscores.' });
  const email = field({ id: 'email', label: 'Email', type: 'email', autocomplete: 'email' });
  const password = field({ id: 'password', label: 'Password', type: 'password', autocomplete: 'new-password', minlength: 8, hint: 'At least 8 characters.' });
  const fe = formError();
  const submit = h('button', { type: 'submit', class: 'btn btn-gold btn-block' }, 'Create account');

  username.input.addEventListener('input', () => { username.input.value = username.input.value.toLowerCase().replace(/[^a-z0-9_]/g, ''); });

  return h('form', { class: 'auth-form', novalidate: true, onsubmit: async (e) => {
    e.preventDefault();
    setFormError(fe, '');
    [name, username, email, password].forEach((f) => showErr(f, ''));
    let bad = false;
    if (!name.input.value.trim()) { showErr(name, 'Enter your name.'); bad = true; }
    if (!/^[a-z0-9_]{3,30}$/.test(username.input.value)) { showErr(username, 'Use 3 to 30 lowercase letters, numbers or underscores.'); bad = true; }
    if (!/^\S+@\S+\.\S+$/.test(email.input.value.trim())) { showErr(email, 'Enter a valid email address.'); bad = true; }
    if (password.input.value.length < 8) { showErr(password, 'Use at least 8 characters.'); bad = true; }
    if (bad) { root.querySelector('[aria-invalid="true"]')?.focus(); return; }

    submit.disabled = true; submit.textContent = 'Creating account...';
    const { count } = await supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('username', username.input.value);
    if (count && count > 0) {
      showErr(username, 'That username is taken. Try another.'); username.input.focus();
      submit.disabled = false; submit.textContent = 'Create account'; return;
    }
    const { data, error } = await supabase.auth.signUp({
      email: email.input.value.trim(), password: password.input.value,
      options: {
        data: { username: username.input.value, display_name: name.input.value.trim() },
        emailRedirectTo: nextUrl(),
      },
    });
    if (error) { setFormError(fe, friendlyAuthError(error)); submit.disabled = false; submit.textContent = 'Create account'; return; }
    if (data.session) { location.assign(nextUrl()); return; }
    root.replaceChildren(h('div', { class: 'state' },
      h('h1', { class: 'state-title' }, 'Check your email'),
      h('p', {}, `We sent a confirmation link to ${email.input.value.trim()}. Open it to finish creating your account.`)));
  } }, name.el, username.el, email.el, password.el, fe, submit,
  h('p', { class: 'hint center' }, 'By creating an account you agree to the ', h('a', { href: 'legal.html' }, 'Terms of Service and Privacy Policy'), '.'));
}

function recoveryForm() {
  const password = field({ id: 'new_password', label: 'New password', type: 'password', autocomplete: 'new-password', minlength: 8, hint: 'At least 8 characters.' });
  const fe = formError();
  const submit = h('button', { type: 'submit', class: 'btn btn-gold btn-block' }, 'Save new password');
  root.replaceChildren(
    h('h1', { class: 'auth-title' }, 'Choose a new password'),
    h('form', { class: 'auth-form', novalidate: true, onsubmit: async (e) => {
      e.preventDefault();
      showErr(password, '');
      if (password.input.value.length < 8) { showErr(password, 'Use at least 8 characters.'); return; }
      submit.disabled = true;
      const { error } = await supabase.auth.updateUser({ password: password.input.value });
      if (error) { setFormError(fe, friendlyAuthError(error)); submit.disabled = false; return; }
      toast('Password updated');
      location.assign(nextUrl());
    } }, password.el, fe, submit));
}

function render() {
  root.replaceChildren(
    h('h1', { class: 'auth-title' }, mode === 'signin' ? 'Welcome back' : 'Join Eleo'),
    h('p', { class: 'auth-sub' }, mode === 'signin'
      ? 'Sign in to like, save and follow the makers you rate.'
      : 'Share your work or find the tailor, designer or stylist you need.'),
    renderTabs(),
    mode === 'signin' ? signInForm() : signUpForm());
  history.replaceState(null, '', `?${new URLSearchParams({ mode, ...(params.get('next') ? { next: params.get('next') } : {}) })}`);
}

(async function init() {
  if (!isConfigured) {
    root.replaceChildren(h('div', { class: 'state', role: 'alert' },
      h('h1', { class: 'state-title' }, 'Supabase is not configured'),
      h('p', {}, 'Add your Project URL and anon key to social/config.js, then reload.')));
    return;
  }
  supabase.auth.onAuthStateChange((event) => { if (event === 'PASSWORD_RECOVERY') recoveryForm(); });
  if (location.hash.includes('type=recovery')) return;   // recovery handler will render
  if (await getUser()) { location.replace(nextUrl()); return; }
  render();
})();
