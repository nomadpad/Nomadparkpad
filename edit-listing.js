import {

  supabase,

  supabaseConfigured

} from "./supabase-client.js";

const params = new URLSearchParams(window.location.search);

const listingId = params.get("listing");
const cancelLink =
  document.querySelector(".btn-secondary");

if (cancelLink && listingId) {
  cancelLink.href =
    `pad-listing.html?listing=${encodeURIComponent(listingId)}`;
}
const loading = document.querySelector("#edit-loading");

const form = document.querySelector("#edit-listing-form");

const message = document.querySelector("#edit-message");

const saveButton = document.querySelector("#save-listing");

const titleInput = document.querySelector("#edit-title");

const descriptionInput = document.querySelector("#edit-description");

const cityInput = document.querySelector("#edit-city");

const countryInput =
  document.querySelector("#edit-country");

const provinceInput = document.querySelector("#edit-province");

const priceInput = document.querySelector("#edit-price");

const guestsInput = document.querySelector("#edit-guests");

const arrivalNoteInput =

  document.querySelector("#edit-arrival-note");

let currentUser = null;

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

async function loadListing() {

  if (!supabaseConfigured || !supabase) {

    loading.hidden = true;

    showMessage("Supabase is not configured.", true);

    return;

  }

  if (!listingId) {

    loading.hidden = true;

    showMessage("No listing was selected.", true);

    return;

  }

  const {

    data: { user },

    error: userError

  } = await supabase.auth.getUser();

  if (userError || !user) {

    window.location.href = "login.html";

    return;

  }

  currentUser = user;

  const { data: listing, error: listingError } =

    await supabase

      .from("listings")

      .select(`

        id,

        host_id,

        title,

        description,

        city,

        province,

        nightly_price,

        max_guests

      `)

      .eq("id", listingId)

      .eq("host_id", user.id)

      .single();

  if (listingError || !listing) {

    loading.hidden = true;

    showMessage(

      listingError?.message ||

        "This listing could not be found.",

      true

    );

    return;

  }

  const {

    data: privateDetails,

    error: privateError

  } = await supabase

    .from("listing_private_details")

    .select("arrival_note")

    .eq("listing_id", listingId)

    .maybeSingle();

  if (privateError) {

    console.warn(

      "Unable to load arrival note:",

      privateError

    );

  }

  titleInput.value = listing.title || "";

  descriptionInput.value = listing.description || "";

  cityInput.value = listing.city || "";

countryInput.value =
  listing.country || "Canada";

  provinceInput.value = listing.province || "";

  priceInput.value = listing.nightly_price ?? "";

  guestsInput.value = listing.max_guests ?? 1;

  arrivalNoteInput.value =

    privateDetails?.arrival_note || "";

  loading.hidden = true;

  form.hidden = false;

}

form?.addEventListener("submit", async event => {

  event.preventDefault();

  if (!currentUser || !listingId) return;

  saveButton.disabled = true;

  saveButton.textContent = "Saving...";

  showMessage("");

  const listingUpdates = {

    title: titleInput.value.trim(),

    description: descriptionInput.value.trim(),

    city: cityInput.value.trim(),

country: countryInput.value,

    province: provinceInput.value.trim(),

    nightly_price: Number(priceInput.value),

    max_guests: Number(guestsInput.value)

  };

  const { error: listingError } = await supabase

    .from("listings")

    .update(listingUpdates)

    .eq("id", listingId)

    .eq("host_id", currentUser.id);

  if (listingError) {

    console.error(

      "Unable to update listing:",

      listingError

    );

    showMessage(

      listingError.message ||

        "Unable to save this listing.",

      true

    );

    saveButton.disabled = false;

    saveButton.textContent = "Save Changes";

    return;

  }

  const { error: privateError } = await supabase

    .from("listing_private_details")

    .update({

      arrival_note:

        arrivalNoteInput.value.trim() || null

    })

    .eq("listing_id", listingId);

  if (privateError) {

    console.error(

      "Unable to update arrival note:",

      privateError

    );

    showMessage(

      privateError.message ||

        "The listing saved, but the arrival note did not.",

      true

    );

    saveButton.disabled = false;

    saveButton.textContent = "Save Changes";

    return;

  }

  showMessage("Your listing has been updated.");

  saveButton.textContent = "Saved";

  window.setTimeout(() => {

    window.location.href = "my-listings.html";

  }, 900);

});

loadListing();