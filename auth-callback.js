import { supabase } from "./supabase-client.js";

const title =

  document.getElementById(

    "confirmationTitle"

  );

const message =

  document.getElementById(

    "confirmationMessage"

  );

const spinner =

  document.getElementById(

    "confirmationSpinner"

  );

const loginLink =

  document.getElementById(

    "confirmationLoginLink"

  );

function showError(text) {

  if (spinner) {

    spinner.hidden = true;

  }

  if (title) {

    title.textContent =

      "Confirmation could not be completed";

  }

  if (message) {

    message.textContent = text;

  }

  if (loginLink) {

    loginLink.hidden = false;

  }

}

async function confirmAccount() {

  try {

    const params =

      new URLSearchParams(

        window.location.search

      );

    const code =

      params.get("code");

    const errorDescription =

      params.get(

        "error_description"

      );

    if (errorDescription) {

      showError(

        decodeURIComponent(

          errorDescription

        )

      );

      return;

    }

    if (code) {

      const {

        data,

        error

      } =

        await supabase.auth

          .exchangeCodeForSession(

            code

          );

      if (error) {

        throw error;

      }

      if (!data?.user) {

        throw new Error(

          "The confirmation session could not be created."

        );

      }

    } else {

      const {

        data,

        error

      } =

        await supabase.auth

          .getSession();

      if (error) {

        throw error;

      }

      if (!data?.session?.user) {

        throw new Error(

          "The confirmation link is missing or has expired."

        );

      }

    }

    if (spinner) {

      spinner.hidden = true;

    }

    if (title) {

      title.textContent =

        "Email confirmed!";

    }

    if (message) {

      message.textContent =

        "Your Nomad Park Pad account is ready. Taking you to login…";

    }

    window.setTimeout(

      async () => {

        await supabase.auth.signOut();

        window.location.replace(

          "login.html?confirmed=true"

        );

      },

      1200

    );

  } catch (error) {

    console.error(

      "Account confirmation failed:",

      error

    );

    showError(

      error.message ||

      "This confirmation link may have expired. Please request a new confirmation email."

    );

  }

}

confirmAccount();