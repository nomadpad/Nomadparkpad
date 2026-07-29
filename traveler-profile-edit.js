import { supabase, supabaseConfigured } from "./supabase-client.js";

const form = document.querySelector("#travelerProfileForm");

const message = document.querySelector("#travelerProfileMessage");

const aboutInput = document.querySelector("#travelerAbout");

const vehicleTypeInput = document.querySelector("#travelerVehicleType");

const vehicleModelInput = document.querySelector("#travelerVehicleModel");

const vehicleLengthInput = document.querySelector("#travelerVehicleLength");

const plateRegionInput = document.querySelector("#travelerPlateRegion");

const vehicleLeaksInput = document.querySelector("#travelerVehicleLeaks");

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

async function loadTravelerProfile() {

  if (!supabaseConfigured) {

    showMessage("Supabase is not configured.", true);

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

  showMessage("Traveller account loaded.");

}

loadTravelerProfile();
form?.addEventListener("submit", async (event) => {

  event.preventDefault();

  showMessage("Saving your traveller profile...");

  const {

    data: { user },

    error: userError

  } = await supabase.auth.getUser();

  if (userError || !user) {

    showMessage("Please log in again.", true);

    return;

  }

  const { error } = await supabase

    .from("traveler_profiles")

    .upsert(

      {

        user_id: user.id,

        about: aboutInput.value.trim(),

        vehicle_type: vehicleTypeInput.value,

        vehicle_model: vehicleModelInput.value.trim(),

        vehicle_length: vehicleLengthInput.value.trim(),

        plate_region: plateRegionInput.value.trim(),

        vehicle_leaks: vehicleLeaksInput.value

      },

      {

        onConflict: "user_id"

      }

    );

  if (error) {

    showMessage(error.message, true);

    return;

  }

  showMessage("Traveller profile saved successfully.");

});