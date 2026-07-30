import { supabase, supabaseConfigured } from "./supabase-client.js";

const form = document.querySelector("#travelerProfileForm");

const message = document.querySelector("#travelerProfileMessage");
const profilePhotoInput = document.querySelector("#travelerProfilePhoto");
const profilePhotoPreview = document.querySelector(

  "#travelerProfilePhotoPreview"
const vehiclePhotoInput = document.querySelector("#travelerVehiclePhoto");
const vehiclePhotoPreview = document.querySelector(

  "#travelerVehiclePhotoPreview"

);
let currentProfile = null;
const aboutInput = document.querySelector("#travelerAbout");

const vehicleTypeInput = document.querySelector("#travelerVehicleType");

const vehicleModelInput = document.querySelector("#travelerVehicleModel");

const vehicleLengthInput = document.querySelector("#travelerVehicleLength");

const plateRegionInput = document.querySelector("#travelerPlateRegion");
const cityInput = document.querySelector("#travelerCity");
const provinceInput = document.querySelector("#travelerProvince");
const cityProvinceMap = {

  edmonton: "Alberta",

  calgary: "Alberta",

  reddeer: "Alberta",

  lethbridge: "Alberta",

  medicinehat: "Alberta",

  sherwoodpark: "Alberta",

  stalbert: "Alberta"

};
cityInput?.addEventListener("input", () => {

  const cityKey = cityInput.value

    .toLowerCase()

    .replace(/[^a-z]/g, "");

  const matchedProvince = cityProvinceMap[cityKey];

  if (matchedProvince) {

    provinceInput.value = matchedProvince;

  }

});
if (window.google?.maps?.places && cityInput) {

  const autocomplete = new google.maps.places.Autocomplete(cityInput, {

    types: ["(cities)"],

    fields: ["address_components", "name"]

  });

  autocomplete.addListener("place_changed", () => {

    const place = autocomplete.getPlace();

    const provinceComponent = place.address_components?.find((component) =>

      component.types.includes("administrative_area_level_1")

    );

    if (place.name) {

      cityInput.value = place.name;

    }

    if (provinceComponent) {

      provinceInput.value = provinceComponent.long_name;

    }

  });

}
const vehicleLeaksInput = document.querySelector("#travelerVehicleLeaks");
async function uploadTravellerPhoto(file, userId, photoType) {

  if (!file) return null;

  const fileExtension = file.name.split(".").pop().toLowerCase();

  const filePath = `${userId}/${photoType}.${fileExtension}`;

  const { error: uploadError } = await supabase.storage

    .from("traveller-photos")

    .upload(filePath, file, {

      upsert: true,

      contentType: file.type

    });

  if (uploadError) {

    throw uploadError;

  }

  const { data } = supabase.storage

    .from("traveller-photos")

    .getPublicUrl(filePath);

  return data.publicUrl;

}
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
const { data: profile, error: profileError } = await supabase

  .from("traveler_profiles")

  .select(

  "about, vehicle_type, vehicle_model, vehicle_length, plate_region, city, province, vehicle_leaks, profile_photo_url, vehicle_photo_url"

  )

  .eq("user_id", user.id)

  .maybeSingle();

if (profileError) {

  showMessage(profileError.message, true);

  return;

}

if (profile) {
  currentProfile = profile;
if (profile.profile_photo_url && profilePhotoPreview) {

  profilePhotoPreview.src = profile.profile_photo_url;

  profilePhotoPreview.hidden = false;

}
if (profile.vehicle_photo_url && vehiclePhotoPreview) {

  vehiclePhotoPreview.src = profile.vehicle_photo_url;

  vehiclePhotoPreview.hidden = false;

}
  aboutInput.value = profile.about || "";

  vehicleTypeInput.value = profile.vehicle_type || "";

  vehicleModelInput.value = profile.vehicle_model || "";

  vehicleLengthInput.value = profile.vehicle_length || "";

  plateRegionInput.value = profile.plate_region || "";
cityInput.value = profile.city || "";
  provinceInput.value = profile.province || "";vehicleLeaksInput.value = profile.vehicle_leaks || "";

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
let profilePhotoUrl = currentProfile?.profile_photo_url || null;

let vehiclePhotoUrl = currentProfile?.vehicle_photo_url || null;

try {

  if (profilePhotoInput?.files?.[0]) {

  profilePhotoUrl = await uploadTravellerPhoto(

    profilePhotoInput.files[0],

    user.id,

    "profile"

  );

}

if (vehiclePhotoInput?.files?.[0]) {

  vehiclePhotoUrl = await uploadTravellerPhoto(

    vehiclePhotoInput.files[0],

    user.id,

    "vehicle"

  );

}

} catch (photoError) {

  showMessage(photoError.message, true);

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
        city: cityInput.value.trim(),
province: provinceInput.value.trim(),
        vehicle_leaks: vehicleLeaksInput.value,
        profile_photo_url: profilePhotoUrl,
vehicle_photo_url: vehiclePhotoUrl

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