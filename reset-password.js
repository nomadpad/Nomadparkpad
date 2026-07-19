import { supabase } from "./supabase-client.js";

const form = document.querySelector("#reset-password-form");

const message = document.querySelector("#reset-message");

const saveButton = form?.querySelector('button[type="submit"]');

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

function timeoutAfter(milliseconds) {

  return new Promise((_, reject) => {

    setTimeout(() => {

      reject(new Error("The request timed out."));

    }, milliseconds);

  });

}

form?.addEventListener("submit", async event => {

  event.preventDefault();

  const password =

    document.querySelector("#new-password")?.value || "";

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

  showMessage("Checking your reset link...");

  try {

    const {

      data: { session },

      error: sessionError

    } = await Promise.race([

      supabase.auth.getSession(),

      timeoutAfter(10000)

    ]);

    if (sessionError || !session) {

      throw new Error(

        "This reset link is no longer valid. Please request a new one."

      );

    }

    showMessage("Saving your new password...");

    const { error } = await Promise.race([

      supabase.auth.updateUser({ password }),

      timeoutAfter(15000)

    ]);

    if (error) throw error;

    showMessage("Password updated successfully. Returning to login...");

    setTimeout(() => {

      window.location.href = "login.html";

    }, 1200);

  } catch (error) {

    console.error("Password reset failed:", error);

    showMessage(

      error?.message ||

        "Could not update your password. Please request a new reset link.",

      true

    );

    saveButton.disabled = false;

  }

});