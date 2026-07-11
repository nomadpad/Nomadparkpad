import { supabase, supabaseConfigured } from "./supabase-client.js";

if (!supabaseConfigured) {
  console.warn("Supabase is not configured. Protected page guard is inactive.");
} else {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    window.location.href = `login.html?next=${next}`;
  }
}
