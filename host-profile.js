import { supabase } from "./supabase-client.js";

function setText(id, value) {

  const element = document.getElementById(id);

  if (element) {

    element.textContent = value;

  }

}

async function loadHostProfile() {

  const {

    data: { user },

    error: userError

  } = await supabase.auth.getUser();

  if (userError || !user) {

    window.location.href = "login.html";

    return;

  }

  const { data: profile, error: profileError } = await supabase

    .from("profiles")

    .select("first_name")

    .eq("id", user.id)

    .maybeSingle();

  if (profileError) {

    console.error("Could not load host profile:", profileError);

  }

  const name =

    profile?.first_name ||

    user.user_metadata?.first_name ||

    user.user_metadata?.full_name ||

    "Host";

  setText("hostProfileName", name);

  setText("hostProfileAboutName", name);

  setText("hostProfileReviewName", name);

}

loadHostProfile();