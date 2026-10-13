// Eleo Social: Supabase client + session helpers.
// The only place the client is created. Everything else imports from here.
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/+esm';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

export const isConfigured =
  !SUPABASE_URL.includes('YOUR-PROJECT') && !SUPABASE_ANON_KEY.includes('YOUR-ANON');

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export async function getUser() {
  const { data } = await supabase.auth.getSession();
  return data.session?.user ?? null;
}

let myProfileCache = null;
export async function getMyProfile(force = false) {
  const user = await getUser();
  if (!user) { myProfileCache = null; return null; }
  if (myProfileCache && myProfileCache.id === user.id && !force) return myProfileCache;
  const { data, error } = await supabase
    .from('profile_cards').select('*').eq('id', user.id).maybeSingle();
  if (error) throw error;
  myProfileCache = data;
  return data;
}

export async function signOut() {
  myProfileCache = null;
  await supabase.auth.signOut();
}

/** Send the visitor to the sign-in page, then bring them back here. */
export function goToAuth(mode = 'signin') {
  const next = location.pathname.split('/').pop() + location.search;
  location.assign(`auth.html?mode=${mode}&next=${encodeURIComponent(next)}`);
}
