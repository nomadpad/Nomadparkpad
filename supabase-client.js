import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm";

const url = window.NPP_SUPABASE_URL;
const key = window.NPP_SUPABASE_ANON_KEY;

const configured =
  url &&
  key &&
  !url.includes("PASTE_YOUR_") &&
  !key.includes("PASTE_YOUR_");

export const supabase = configured ? createClient(url, key) : null;
export const supabaseConfigured = Boolean(configured);

window.NPP_SUPABASE_READY = supabaseConfigured;
