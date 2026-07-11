import { supabase, supabaseConfigured } from "./supabase-client.js";

const message = document.querySelector(".form-message");

function show(text, error = false) {
  if (!message) return;
  message.textContent = text;
  message.classList.toggle("error", error);
}

if (!supabaseConfigured) {
  show("Supabase is not configured. Update supabase-config.js.", true);
} else {
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    window.location.href = "login.html";
  } else {
    document.querySelector("#profile-email").textContent = user.email || "";

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("first_name,last_name,city,role")
      .eq("id", user.id)
      .single();

    if (error) {
      show(error.message, true);
    } else {
      document.querySelector("#profile-first-name").value = profile.first_name || "";
      document.querySelector("#profile-last-name").value = profile.last_name || "";
      document.querySelector("#profile-city").value = profile.city || "";
      document.querySelector("#profile-role").value = profile.role || "traveler";

      const fullName = `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Nomad Member";
      document.querySelector("#profile-name").textContent = fullName;
      document.querySelector("#profile-initial").textContent = fullName.charAt(0).toUpperCase();
    }
  }
}

document.querySelector("#profile-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const payload = {
    id: user.id,
    first_name: document.querySelector("#profile-first-name").value.trim(),
    last_name: document.querySelector("#profile-last-name").value.trim(),
    city: document.querySelector("#profile-city").value.trim(),
    role: document.querySelector("#profile-role").value,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from("profiles").upsert(payload);
  show(error ? error.message : "Profile saved.", Boolean(error));

  if (!error) {
    const fullName = `${payload.first_name} ${payload.last_name}`.trim();
    document.querySelector("#profile-name").textContent = fullName || "Nomad Member";
    document.querySelector("#profile-initial").textContent = (fullName || "N").charAt(0).toUpperCase();
  }
});

document.querySelector("#logout-button")?.addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});
