// Eleo Social: likes, saves and comments.
// Composite primary keys in the database make duplicate likes/saves impossible;
// a unique-violation (23505) just means "already done", so we treat it as success.
import { supabase } from '../supabase.js';

const isDuplicate = (error) => error && error.code === '23505';

async function me() {
  const { data } = await supabase.auth.getSession();
  const user = data.session?.user;
  if (!user) throw new Error('Sign in to continue.');
  return user;
}

export async function likePost(postId) {
  const user = await me();
  const { error } = await supabase.from('likes').insert({ user_id: user.id, post_id: postId });
  if (error && !isDuplicate(error)) throw error;
}
export async function unlikePost(postId) {
  const user = await me();
  const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('post_id', postId);
  if (error) throw error;
}

export async function savePost(postId) {
  const user = await me();
  const { error } = await supabase.from('saves').insert({ user_id: user.id, post_id: postId });
  if (error && !isDuplicate(error)) throw error;
}
export async function unsavePost(postId) {
  const user = await me();
  const { error } = await supabase.from('saves').delete().eq('user_id', user.id).eq('post_id', postId);
  if (error) throw error;
}

// Comments. parent_id exists in the database for future replies; v1 is flat.
export async function fetchComments(postId, { limit = 10, before = null } = {}) {
  let query = supabase.from('comment_details').select('*')
    .eq('post_id', postId).order('created_at', { ascending: false }).limit(limit);
  if (before) query = query.lt('created_at', before);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).reverse();   // oldest first within the page
}

export async function addComment(postId, body) {
  const user = await me();
  const { data, error } = await supabase.from('comments')
    .insert({ post_id: postId, author_id: user.id, body: body.trim() })
    .select('id, created_at').single();
  if (error) throw error;
  return data;
}

export async function deleteComment(commentId) {
  const { error } = await supabase.from('comments').delete().eq('id', commentId);
  if (error) throw error;
}
