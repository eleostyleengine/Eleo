import { h, icon, toast, errorMessage, confirmDialog } from '../ui.js';
import { renderShell } from '../components/shell.js';
import { fetchCategories, createPost, normalizeTag, TAG_PATTERN } from '../api/posts.js';
import { validateImage } from '../api/storage.js';
import { routes } from '../routes.js';

const MAX_CAPTION = 2200;
const MAX_TAGS = 10;

const form = document.getElementById('post-form');
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('image');
const previewWrap = document.getElementById('preview');
const captionEl = document.getElementById('caption');
const captionCount = document.getElementById('caption-count');
const categoryEl = document.getElementById('category');
const locationEl = document.getElementById('location');
const tagInput = document.getElementById('tag-input');
const tagList = document.getElementById('tag-list');
const publishBtn = document.getElementById('publish');
const cancelBtn = document.getElementById('cancel');
const formError = document.getElementById('form-error');

const state = { file: null, previewUrl: null, tags: [], user: null, categories: [] };

const err = (id) => document.getElementById(`${id}-err`);
function setErr(id, msg, input) {
  const el = err(id);
  el.textContent = msg || '';
  el.hidden = !msg;
  (input || document.getElementById(id))?.setAttribute('aria-invalid', msg ? 'true' : 'false');
}

// ---- image ------------------------------------------------------------------
function setFile(file) {
  const problem = validateImage(file);
  if (problem) { setErr('image', problem, dropzone); return; }
  setErr('image', '', dropzone);
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  state.file = file;
  state.previewUrl = URL.createObjectURL(file);
  previewWrap.replaceChildren(
    h('img', { src: state.previewUrl, alt: 'Preview of the photo you are about to post' }),
    h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: clearFile }, 'Remove photo'));
  previewWrap.hidden = false;
  dropzone.hidden = true;
}
function clearFile() {
  if (state.previewUrl) URL.revokeObjectURL(state.previewUrl);
  Object.assign(state, { file: null, previewUrl: null });
  fileInput.value = '';
  previewWrap.hidden = true;
  previewWrap.replaceChildren();
  dropzone.hidden = false;
  dropzone.focus();
}
fileInput.addEventListener('change', () => { if (fileInput.files[0]) setFile(fileInput.files[0]); });
['dragenter', 'dragover'].forEach((t) => dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.add('is-over'); }));
['dragleave', 'drop'].forEach((t) => dropzone.addEventListener(t, (e) => { e.preventDefault(); dropzone.classList.remove('is-over'); }));
dropzone.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); fileInput.click(); } });
dropzone.addEventListener('drop', (e) => { const f = e.dataTransfer?.files?.[0]; if (f) setFile(f); });

// ---- caption ----------------------------------------------------------------
captionEl.addEventListener('input', () => {
  captionCount.textContent = `${captionEl.value.length} / ${MAX_CAPTION}`;
});

// ---- tags -------------------------------------------------------------------
function renderTags() {
  tagList.replaceChildren(...state.tags.map((t) =>
    h('li', { class: 'chip' }, `#${t}`,
      h('button', { type: 'button', class: 'chip-x', 'aria-label': `Remove tag ${t}`, onclick: () => { state.tags = state.tags.filter((x) => x !== t); renderTags(); } }, icon('x', 14)))));
}
function commitTag() {
  const raw = tagInput.value;
  if (!raw.trim()) return true;
  const parts = raw.split(/[,\s]+/).map(normalizeTag).filter(Boolean);
  for (const tag of parts) {
    if (!TAG_PATTERN.test(tag)) { setErr('tag-input', 'Tags use 2 to 30 letters, numbers or underscores.'); return false; }
    if (state.tags.length >= MAX_TAGS) { setErr('tag-input', `You can add up to ${MAX_TAGS} tags.`); return false; }
    if (!state.tags.includes(tag)) state.tags.push(tag);
  }
  tagInput.value = '';
  setErr('tag-input', '');
  renderTags();
  return true;
}
tagInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); commitTag(); }
  else if (e.key === 'Backspace' && !tagInput.value && state.tags.length) { state.tags.pop(); renderTags(); }
});
tagInput.addEventListener('blur', commitTag);

// ---- submit -----------------------------------------------------------------
const isDirty = () => !!(state.file || captionEl.value.trim() || locationEl.value.trim() || state.tags.length);

function validate() {
  let ok = true;
  const first = [];
  if (!state.file) { setErr('image', 'Add a photo of your work.', dropzone); ok = false; first.push(dropzone); }
  if (!captionEl.value.trim()) { setErr('caption', 'Write a caption.'); ok = false; first.push(captionEl); }
  else if (captionEl.value.length > MAX_CAPTION) { setErr('caption', `Keep the caption under ${MAX_CAPTION} characters.`); ok = false; first.push(captionEl); }
  else setErr('caption', '');
  if (!categoryEl.value) { setErr('category', 'Choose a category.'); ok = false; first.push(categoryEl); } else setErr('category', '');
  if (locationEl.value.length > 80) { setErr('location', 'Keep the location under 80 characters.'); ok = false; first.push(locationEl); } else setErr('location', '');
  if (!commitTag()) { ok = false; first.push(tagInput); }
  first[0]?.focus();
  return ok;
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  formError.hidden = true;
  if (!validate()) return;
  publishBtn.disabled = true;
  publishBtn.textContent = 'Publishing...';
  form.setAttribute('aria-busy', 'true');
  try {
    await createPost({
      userId: state.user.id,
      file: state.file,
      caption: captionEl.value,
      categoryId: Number(categoryEl.value),
      location: locationEl.value,
      tags: state.tags,
    });
    toast('Published');
    location.assign(routes.feed);
  } catch (error) {
    console.error(error);
    formError.textContent = errorMessage(error, 'Your post was not published. Check your connection and try again.');
    formError.hidden = false;
    formError.focus();
    publishBtn.disabled = false;
    publishBtn.textContent = 'Publish';
    form.removeAttribute('aria-busy');
  }
});

cancelBtn.addEventListener('click', async () => {
  if (isDirty()) {
    const leave = await confirmDialog({ title: 'Discard this post?', message: 'Your photo and caption will not be saved.', confirmLabel: 'Discard', danger: true });
    if (!leave) return;
  }
  location.assign(routes.feed);
});

(async function init() {
  const { user } = await renderShell('create');
  if (!user) { location.replace(`${routes.auth}?mode=signin&next=${encodeURIComponent(routes.create)}`); return; }
  state.user = user;
  try {
    state.categories = await fetchCategories();
    categoryEl.append(...state.categories.map((c) => h('option', { value: c.id }, c.name)));
  } catch {
    formError.textContent = 'Categories could not be loaded. Reload the page.';
    formError.hidden = false;
  }
  form.hidden = false;
  document.getElementById('form-loading').hidden = true;
})();
