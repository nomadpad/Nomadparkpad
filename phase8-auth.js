import { supabase, supabaseConfigured } from "./supabase-client.js";

const warning = document.querySelector("[data-setup-warning]");
if (warning) warning.hidden = supabaseConfigured;

function setMessage(form, text, error = false) {
  const el = form?.querySelector(".form-message");
  if (!el) return;
  el.textContent = text;
  el.classList.toggle("error", error);
}

document.querySelector("#real-signup-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  if (!supabaseConfigured) {
    setMessage(form, "Supabase must be configured before account creation can work.", true);
    return;
  }

  const firstName = document.querySelector("#signup-first-name").value.trim();
  const lastName = document.querySelector("#signup-last-name").value.trim();
  const email = document.querySelector("#signup-email").value.trim();
  const password = document.querySelector("#signup-password").value;
  const city = document.querySelector("#signup-city").value.trim();
  const role = document.querySelector('input[name="role"]:checked')?.value || "traveler";

  setMessage(form, "Creating your account...");

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth-callback.html`,
      data: {
        first_name: firstName,
        last_name: lastName,
        city,
        role
      }
    }
  });

  if (error) {
    setMessage(form, error.message, true);
    return;
  }

  if (data.session) {
    window.location.href = "account.html";
  } else {
    setMessage(form, "Account created. Check your email to confirm your address, then log in.");
  }
});

document.querySelector("#login-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  if (!supabaseConfigured) {
    setMessage(form, "Supabase must be configured before login can work.", true);
    return;
  }

  setMessage(form, "Logging in...");

  const { error } = await supabase.auth.signInWithPassword({
    email: document.querySelector("#login-email").value.trim(),
    password: document.querySelector("#login-password").value
  });

  if (error) {
    setMessage(form, error.message, true);
    return;
  }

  window.location.href = "account.html";
});

document.querySelector("#forgot-form")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  const form = event.currentTarget;

  if (!supabaseConfigured) {
    setMessage(form, "Supabase must be configured before password reset can work.", true);
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(
    document.querySelector("#forgot-email").value.trim(),
    { redirectTo: `${window.location.origin}/auth-callback.html` }
  );

  setMessage(form, error ? error.message : "Password reset email sent.", Boolean(error));
});

if (window.location.pathname.endsWith("auth-callback.html") && supabaseConfigured) {
  const message = document.querySelector(".form-message");
  const { data } = await supabase.auth.getSession();

  if (data.session) {
    if (message) message.textContent = "Account confirmed. Redirecting...";
    setTimeout(() => window.location.href = "account.html", 800);
  } else {
    if (message) message.textContent = "Confirmation received. You may now log in.";
    setTimeout(() => window.location.href = "login.html", 1200);
  }
}
