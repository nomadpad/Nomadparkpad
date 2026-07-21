import { supabase } from "./supabase-client.js";
const statusTitle = document.querySelector("#payout-status-title");

const statusMessage = document.querySelector("#payout-status-message");

const actionButton = document.querySelector("#payout-action-button");

const methodMessage = document.querySelector("#payout-method-message");

const manageMethodButton = document.querySelector("#manage-payout-method");

function showStatus(title, message) {

  if (statusTitle) statusTitle.textContent = title;

  if (statusMessage) statusMessage.textContent = message;

}

async function loadStripeAccountStatus() {

  try {

    const {

      data: { session },

      error: sessionError,

    } = await supabase.auth.getSession();

    if (sessionError || !session) {

      showStatus(

        "Login required",

        "Please log in again to view your payout account."

      );

      return;

    }

    const { data, error } = await supabase.functions.invoke(

      "get-stripe-account-status"

    );

    if (error) {

      console.error("Payout status error:", error);

      showStatus(

        "Could not check payouts",

        "Please refresh the page and try again."

      );

      return;

    }

    if (!data?.connected) {

      showStatus(

        "Payout setup required",

        "Your Stripe payout account has not been connected yet."

      );

      if (methodMessage) {

        methodMessage.textContent =

          "Complete Stripe onboarding before adding a payout method.";

      }

      return;

    }

    if (data.payouts_enabled && data.details_submitted) {

      showStatus(

        "Payouts ready",

        "Your Stripe account is connected and ready to receive host earnings."

      );
actionButton?.setAttribute("hidden", "");

manageMethodButton?.removeAttribute("hidden");
      if (methodMessage) {

        methodMessage.textContent =

          "Your payout method is securely managed through Stripe.";

      }

      return;

    }

    if (data.disabled_reason) {

      showStatus(

        "Payouts restricted",

        "Stripe requires additional information before payouts can begin."

      );

    } else {

      showStatus(

        "Setup incomplete",

        "Finish Stripe onboarding to activate host payouts."

      );

    }

    if (methodMessage) {

      methodMessage.textContent =

        "Your payout method will appear after Stripe onboarding is complete.";

    }

  } catch (error) {

  console.error("Unexpected payout page error:", error);

  const errorMessage =

    error?.message ||

    String(error) ||

    "Unknown payout error";

  showStatus(

    "Could not check payouts",

    errorMessage

  );

}
}

actionButton?.setAttribute("hidden", "");

manageMethodButton?.setAttribute("hidden", "");
actionButton?.addEventListener("click", async (event) => {

  event.preventDefault();

  const originalText = actionButton.textContent;

  try {

    actionButton.textContent = "Opening Stripe...";

    actionButton.setAttribute("aria-disabled", "true");

    actionButton.style.pointerEvents = "none";

    const { data, error } = await supabase.functions.invoke(

      "create-stripe-onboarding-link"

    );

    if (error) {

      throw error;

    }

    if (!data?.url) {

      throw new Error("Stripe onboarding link was not returned.");

    }

    window.location.href = data.url;

  } catch (error) {

    console.error("Stripe onboarding error:", error);

    showStatus(

      "Could not start payout setup",

      error?.message || "Please try again."

    );

    actionButton.textContent = originalText || "Set Up Payouts";

    actionButton.removeAttribute("aria-disabled");

    actionButton.style.pointerEvents = "";

  }

});
loadStripeAccountStatus();