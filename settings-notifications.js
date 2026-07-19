import { supabase } from "./supabase-client.js";

const bookingsCheckbox = document.querySelector("#notify-bookings");

const messagesCheckbox = document.querySelector("#notify-messages");

const paymentsCheckbox = document.querySelector("#notify-payments");

const reviewsCheckbox = document.querySelector("#notify-reviews");

const saveButton = document.querySelector("#save-notifications");

const message = document.querySelector("#notifications-message");

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

async function loadNotificationSettings() {

  const {

    data: { user },

    error

  } = await supabase.auth.getUser();

  if (error || !user) {

    showMessage("Could not load notification settings.", true);

    return;

  }

  const preferences = user.user_metadata?.notification_preferences || {};

  bookingsCheckbox.checked = preferences.bookings ?? true;

  messagesCheckbox.checked = preferences.messages ?? true;

  paymentsCheckbox.checked = preferences.payments ?? true;

  reviewsCheckbox.checked = preferences.reviews ?? true;

}

saveButton?.addEventListener("click", async () => {

  saveButton.disabled = true;

  showMessage("Saving notification settings...");

  const notificationPreferences = {

    bookings: bookingsCheckbox.checked,

    messages: messagesCheckbox.checked,

    payments: paymentsCheckbox.checked,

    reviews: reviewsCheckbox.checked

  };

  const { error } = await supabase.auth.updateUser({

    data: {

      notification_preferences: notificationPreferences

    }

  });

  if (error) {

    console.error("Notification settings failed:", error);

    showMessage("Could not save notification settings.", true);

    saveButton.disabled = false;

    return;

  }

  showMessage("Notification settings saved.");

  saveButton.disabled = false;

});

loadNotificationSettings();