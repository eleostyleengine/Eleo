// Eleo Social: posts API. UI code never calls Supabase for posts directly.
import { supabase } from '../supabase.js';
import { prepareImage, uploadPostImage, removeFile, POST_BUCKET } from './storage.js';

let categoriesCache = null;
export async function fetchCategories() {
  if (categoriesCache) return categoriesCache;
  const { data, error } = await supabase
    .from('fashion_categories').select('id, slug, name').order('sort_order');
  if (error) throw error;
  categoriesCache = data;
  return data;
}

/**
 * One entry point for feed, explore, saved and (later) AI-ranked feeds.
 * sort: 'new' (keyset pagination) | 'popular' | 'trending' (offset pagination)
 */
export async function fetchFeed({
  limit = 12, cursor = null, offset = 0, sort = 'new', category = null, author = null,
  query = null, location = null, followingOnly = false, savedOnly = false,
} = {}) {
  const { data, error } = await supabase.rpc('feed_posts', {
    p_limit: limit,
    p_before_created: cursor?.created_at ?? null,
    p_before_id: cursor?.id ?? null,
    p_offset: offset,
    p_sort: sort,
    p_category: category,
    p_author: author,
    p_query: query || null,
    p_location: location || null,
    p_following_only: followingOnly,
    p_saved_only: savedOnly,
  });
  if (error) throw error;
  return data ?? [];
}

/** Single post in the same shape as a feed row (used by the share link page). */
export async function fetchPostById(id) {
  const { data: post, error } = await supabase
    .from('posts')
    .select('id, author_id, image_path, caption, location, tags, likes_count, comments_count, saves_count, created_at, status, fashion_categories(slug, name)')
    .eq('id', id).eq('status', 'published').maybeSingle();
  if (error) throw error;
  if (!post) return null;

  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  const [author, liked, saved] = await Promise.all([
    supabase.from('profile_cards').select('*').eq('id', post.author_id).maybeSingle(),
    uid ? supabase.from('likes').select('post_id').eq('post_id', id).eq('user_id', uid).maybeSingle() : { data: null },
    uid ? supabase.from('saves').select('post_id').eq('post_id', id).eq('user_id', uid).maybeSingle() : { data: null },
  ]);
  if (!author.data) return null;
  const a = author.data;
  return {
    id: post.id, author_id: post.author_id,
    username: a.username, display_name: a.display_name, avatar_url: a.avatar_url,
    account_type: a.account_type, professional_type: a.professional_type, is_verified: a.is_verified,
    image_path: post.image_path, caption: post.caption,
    category_slug: post.fashion_categories?.slug, category_name: post.fashion_categories?.name,
    location: post.location, tags: post.tags,
    likes_count: post.likes_count, comments_count: post.comments_count, saves_count: post.saves_count,
    created_at: post.created_at,
    liked_by_me: !!liked.data, saved_by_me: !!saved.data,
  };
}

export function normalizeTag(raw) {
  return String(raw).trim().replace(/^#+/, '').toLowerCase().replace(/\s+/g, '');
}
export const TAG_PATTERN = /^[a-z0-9_]{2,30}$/;

export async function createPost({ userId, file, caption, categoryId, location, tags }) {
  const blob = await prepareImage(file);
  const imagePath = await uploadPostImage(userId, blob);
  const { data, error } = await supabase.from('posts').insert({
    author_id: userId,
    image_path: imagePath,
    caption: caption.trim(),
    category_id: categoryId,
    location: location?.trim() || null,
    tags,
  }).select('id').single();
  if (error) {
    // Don't leave an orphaned upload behind if the database rejected the post.
    await removeFile(POST_BUCKET, imagePath).catch(() => {});
    throw error;
  }
  return data;
}

export async function deletePost(post) {
  const { error } = await supabase.from('posts').delete().eq('id', post.id);
  if (error) throw error;
  await removeFile(POST_BUCKET, post.image_path).catch(() => {});
}
