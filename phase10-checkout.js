import { supabase } from "./supabase-client.js";

const checkoutForm = document.querySelector("#checkout-form");

function getBookingId() {

  const params = new URLSearchParams(window.location.search);

  return (

    params.get("booking") ||

    params.get("booking_id") ||

    params.get("id")

  );

}

function getMessageElement() {

  let message = document.querySelector("#checkout-message");

  if (!message && checkoutForm) {

    message = document.createElement("p");

    message.id = "checkout-message";

    message.setAttribute("role", "status");

    checkoutForm.appendChild(message);

  }

  return message;

}

function showMessage(text, isError = false) {

  const message = getMessageElement();

  if (!message) return;

  message.textContent = text;

  message.style.fontWeight = "700";

  message.style.marginTop = "16px";

  message.style.color = isError ? "#9b3d32" : "#1f573f";

}

checkoutForm?.addEventListener("submit", async (event) => {

  event.preventDefault();

  const button = checkoutForm.querySelector(

    'button[type="submit"], input[type="submit"]'

  );

  const bookingId = getBookingId();

  if (!bookingId) {

    showMessage(

      "This checkout page is missing the booking ID. Return to My Trips and open the accepted booking again.",

      true

    );

    return;

  }

  if (button) {

    button.disabled = true;

    if (button.tagName === "BUTTON") {

      button.dataset.originalText = button.textContent;

      button.textContent = "Opening secure checkout…";

    } else {

      button.dataset.originalText = button.value;

      button.value = "Opening secure checkout…";

    }

  }

  showMessage("Connecting securely to Stripe…");

  try {

    const {

      data: { session },

      error: sessionError,

    } = await supabase.auth.getSession();

    if (sessionError || !session) {

      throw new Error("Please sign in again before paying.");

    }

    const { data, error } = await supabase.functions.invoke(

      "create-checkout-session",

      {

        body: {

          bookingId,

        },

      }

    );

    if (error) {

      throw error;

    }

    if (!data?.url) {

      throw new Error("Stripe did not return a checkout page.");

    }

    window.location.href = data.url;

  } catch (error) {

    console.error("Checkout error:", error);

    showMessage(

      error?.message ||

        "Unable to start payment. Please try again.",

      true

    );

    if (button) {

      button.disabled = false;

      if (button.tagName === "BUTTON") {

        button.textContent =

          button.dataset.originalText || "Continue to payment";

      } else {

        button.value =

          button.dataset.originalText || "Continue to payment";

      }

    }

  }

});