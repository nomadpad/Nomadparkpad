import { supabase } from "./supabase-client.js";

const params = new URLSearchParams(window.location.search);

const listingId = params.get("listing");

const form = document.querySelector("#arrival-note-form");

const noteField = document.querySelector("#arrival-note");

const status = document.querySelector("#arrival-note-status");

const saveButton = form?.querySelector('button[type="submit"]');

function showStatus(message) {

  if (status) status.textContent = message;

}

async function loadArrivalNote() {

  if (!listingId) {

    showStatus("Listing not found.");

    if (saveButton) saveButton.disabled = true;

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

  const { data: listing, error: listingError } = await supabase

    .from("listings")

    .select("id,title,host_id")

    .eq("id", listingId)

    .eq("host_id", user.id)

    .maybeSingle();

  if (listingError || !listing) {

    showStatus("You cannot edit this listing.");

    if (saveButton) saveButton.disabled = true;

    return;

  }

  const { data: privateDetails, error: privateError } = await supabase

    .from("listing_private_details")

    .select("arrival_note")

    .eq("listing_id", listingId)

    .maybeSingle();

  if (privateError) {

    showStatus("Could not load the arrival note.");

    return;

  }

  noteField.value = privateDetails?.arrival_note || "";

  showStatus("");

}

form?.addEventListener("submit", async event => {

  event.preventDefault();

  if (!listingId) return;

  saveButton.disabled = true;

  showStatus("Saving...");

  const note = noteField.value.trim();

  const { error } = await supabase

    .from("listing_private_details")

    .update({

      arrival_note: note || null

    })

    .eq("listing_id", listingId);

  if (error) {

    console.error("Arrival note update failed:", error);

    showStatus("Could not save the note. Please try again.");

    saveButton.disabled = false;

    return;

  }

  showStatus("Arrival note saved.");

  setTimeout(() => {

    window.location.href = "host-dashboard.html";

  }, 900);

});

loadArrivalNote();