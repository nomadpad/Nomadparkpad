import { supabase } from "./supabase-client.js";

const form = document.querySelector("#reset-password-form");

const message = document.querySelector("#reset-message");

const saveButton = form?.querySelector('button[type="submit"]');

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

form?.addEventListener("submit", async event => {

  event.preventDefault();

  const password = document.querySelector("#new-password")?.value || "";

  const confirmation =

    document.querySelector("#confirm-password")?.value || "";

  if (password.length < 8) {

    showMessage("Your password must be at least 8 characters.", true);

    return;

  }

  if (password !== confirmation) {

    showMessage("The passwords do not match.", true);

    return;

  }

  saveButton.disabled = true;

  showMessage("Saving your new password...");

  const { error } = await supabase.auth.updateUser({

    password

  });

  if (error) {

    console.error("Password update failed:", error);

    showMessage("Could not update your password. Please request a new reset link.", true);

    saveButton.disabled = false;

    return;

  }

  showMessage("Password updated successfully. Returning to login...");

  await supabase.auth.signOut();

  setTimeout(() => {

    window.location.href = "login.html";

  }, 1200);

});