import { supabase } from "./supabase-client.js";

const form = document.querySelector("#change-password-form");

const message = document.querySelector("#change-password-message");

const button = form?.querySelector('button[type="submit"]');

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

form?.addEventListener("submit", async event => {

  event.preventDefault();

  const newPassword =

    document.querySelector("#settings-new-password")?.value || "";

  const confirmPassword =

    document.querySelector("#settings-confirm-password")?.value || "";

  if (newPassword.length < 8) {

    showMessage("Your password must be at least 8 characters.", true);

    return;

  }

  if (newPassword !== confirmPassword) {

    showMessage("The passwords do not match.", true);

    return;

  }

  button.disabled = true;

  showMessage("Changing your password...");

  const { error } = await supabase.auth.updateUser({

    password: newPassword

  });

  if (error) {

    console.error("Password change failed:", error);

    showMessage(error.message || "Could not change your password.", true);

    button.disabled = false;

    return;

  }

  form.reset();

  button.disabled = false;

  showMessage("Password changed successfully.");

});
const logoutButton = document.querySelector("#settings-logout");

const logoutMessage = document.querySelector("#logout-message");

logoutButton?.addEventListener("click", async () => {

  logoutButton.disabled = true;

  if (logoutMessage) {

    logoutMessage.textContent = "Logging out...";

    logoutMessage.classList.remove("error");

  }

  const { error } = await supabase.auth.signOut();

  if (error) {

    console.error("Logout failed:", error);

    if (logoutMessage) {

      logoutMessage.textContent = "Could not log out. Please try again.";

      logoutMessage.classList.add("error");

    }

    logoutButton.disabled = false;

    return;

  }

  window.location.href = "index.html";

});