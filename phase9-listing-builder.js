import { supabase, supabaseConfigured } from "./supabase-client.js";

const storageKey = "nomadParkPadListingDraft";
const steps = [...document.querySelectorAll(".builder-step")];
const navItems = [...document.querySelectorAll(".builder-nav-item")];
const nextButton = document.querySelector("#next-step");
const previousButton = document.querySelector("#previous-step");
const controls = document.querySelector("#builder-controls");
const photoInput = document.querySelector("#listing-photos");
const photoGrid = document.querySelector("#photo-preview-grid");
const publishMessage = document.querySelector("#publish-message");
let currentStep = 1;
let selectedPhotos = [];

function checkedValues(selector) {
  return [...document.querySelectorAll(selector)].filter(el => el.checked).map(el => el.value);
}

function collectDraft() {
  return {
    title: document.querySelector("#listing-title")?.value.trim() || "",
    city: document.querySelector("#listing-city")?.value.trim() || "",
    province: document.querySelector("#listing-province")?.value || "Alberta",
    exact_address: document.querySelector("#listing-exact-address")?.value.trim() || "",
    description: document.querySelector("#listing-description")?.value.trim() || "",
    length: document.querySelector("#max-length")?.value || "24 ft",
    height: document.querySelector("#max-height")?.value,
    width: document.querySelector("#max-width")?.value,
    surface: document.querySelector("#driveway-surface")?.value,
    slope: document.querySelector("#driveway-slope")?.value,
    orientation: document.querySelector("#parking-orientation")?.value,
    guests: Number(document.querySelector("#max-guests")?.value || 1),
    amenities: checkedValues('input[name="amenity"]'),
    vehicles: checkedValues('input[name="vehicle-fit"]'),
    style: document.querySelector('input[name="host-style"]:checked')?.value || "Quiet Overnight",
    price: Number(document.querySelector("#nightly-price")?.value || 22)
  };
}

function saveDraft() {
  localStorage.setItem(storageKey, JSON.stringify(collectDraft()));
  const status = document.querySelector("#save-status");
  if (status) status.textContent = "Draft saved locally";
}

function restoreDraft() {
  const raw = localStorage.getItem(storageKey);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    const setValue = (selector, value) => {
      const el = document.querySelector(selector);
      if (el && value !== undefined && value !== null && value !== "") el.value = value;
    };
    setValue("#listing-title", draft.title);
    setValue("#listing-city", draft.city);
    setValue("#listing-province", draft.province);
    setValue("#listing-description", draft.description);
    setValue("#max-length", draft.length);
    setValue("#max-height", draft.height);
    setValue("#max-width", draft.width);
    setValue("#driveway-surface", draft.surface);etValue("#max-width", draft.width);
    setValue("#driveway-slope", draft.slope);
    setValue("#parking-orientation", draft.orientation);

    setValue("#max-guests", draft.guests);
    setValue("#nightly-price", draft.price);
    document.querySelectorAll('input[name="amenity"]').forEach(el => el.checked = (draft.amenities || []).includes(el.value));
    document.querySelectorAll('input[name="vehicle-fit"]').forEach(el => el.checked = (draft.vehicles || []).includes(el.value));
    document.querySelectorAll('input[name="host-style"]').forEach(el => el.checked = el.value === draft.style);
  } catch {}
}

function validateStep(step) {
  const panel = document.querySelector(`[data-step="${step}"]`);
  if (!panel) return true;
  const required = [...panel.querySelectorAll("[required]")];
  for (const field of required) {
    if (!field.checkValidity()) {
      field.reportValidity();
      return false;
    }
  }
  if (step === 2 && checkedValues('input[name="vehicle-fit"]').length === 0) {
    alert("Choose at least one vehicle type.");
    return false;
  }
  return true;
}

function showStep(step) {
  currentStep = Math.max(1, Math.min(7, step));
  steps.forEach(el => el.classList.toggle("active", Number(el.dataset.step) === currentStep));
  navItems.forEach(el => el.classList.toggle("active", Number(el.dataset.stepTarget) === currentStep));
  previousButton.disabled = currentStep === 1;
  nextButton.hidden = currentStep === 7;
  controls.classList.toggle("publish-step-controls", currentStep === 7);
  window.scrollTo({ top: 0, behavior: "smooth" });
}

nextButton?.addEventListener("click", () => {
  if (!validateStep(currentStep)) return;
  saveDraft();
  showStep(currentStep + 1);
});
previousButton?.addEventListener("click", () => showStep(currentStep - 1));
navItems.forEach(item => item.addEventListener("click", () => {
  const target = Number(item.dataset.stepTarget);
  if (target > currentStep && !validateStep(currentStep)) return;
  showStep(target);
}));

document.querySelectorAll("#listing-builder input, #listing-builder select, #listing-builder textarea")
  .forEach(el => {
    el.addEventListener("input", saveDraft);
    el.addEventListener("change", saveDraft);
  });

function updatePrice() {
  const value = Number(document.querySelector("#nightly-price")?.value || 22);
  const total = document.querySelector("#traveler-total");
  if (total) total.textContent = `$${value + 4}`;
}
document.querySelector("#nightly-price")?.addEventListener("input", updatePrice);

function renderPhotos() {
  photoGrid.innerHTML = "";
  selectedPhotos.forEach((file, index) => {
    const card = document.createElement("article");
    card.className = "photo-preview-card";
    const img = document.createElement("img");
    img.alt = `Selected driveway photo ${index + 1}`;
    img.src = URL.createObjectURL(file);
    const label = document.createElement("span");
    label.textContent = index === 0 ? "Cover photo" : `Photo ${index + 1}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.textContent = "×";
    remove.setAttribute("aria-label", `Remove photo ${index + 1}`);
    remove.addEventListener("click", () => {
      selectedPhotos.splice(index, 1);
      renderPhotos();
    });
    card.append(img, label, remove);
    photoGrid.appendChild(card);
  });
}

photoInput?.addEventListener("change", () => {
  const files = [...photoInput.files].slice(0, 5);
  const invalid = files.find(file => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 8 * 1024 * 1024);
  if (invalid) {
    alert("Each photo must be JPG, PNG, or WebP and no larger than 8 MB.");
    photoInput.value = "";
    return;
  }
  selectedPhotos = files;
  renderPhotos();
});

function safeFileName(name) {
  const extension = name.split(".").pop().toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  return `${crypto.randomUUID()}.${extension}`;
}

async function uploadPhotos(userId, listingId) {
  const uploaded = [];
  for (let index = 0; index < selectedPhotos.length; index++) {
    const file = selectedPhotos[index];
    document.querySelector("#publish-progress-detail").textContent =
      `Uploading photo ${index + 1} of ${selectedPhotos.length}.`;

    const storagePath = `${userId}/${listingId}/${safeFileName(file.name)}`;
    const { error: uploadError } = await supabase.storage
      .from("listing-photos")
      .upload(storagePath, file, { cacheControl: "3600", upsert: false });

    if (uploadError) throw uploadError;

    const { error: photoError } = await supabase
      .from("listing_photos")
      .insert({ listing_id: listingId, storage_path: storagePath, sort_order: index });

    if (photoError) throw photoError;
    uploaded.push(storagePath);
  }
  return uploaded;
}

document.querySelector("#listing-builder")?.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!validateStep(7)) return;
  if (!supabaseConfigured) {
    publishMessage.textContent = "Supabase is not configured.";
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = "login.html";
    return;
  }

  const draft = collectDraft();
  if (!draft.title || !draft.city || !draft.description) {
    publishMessage.textContent = "Complete the title, city, and description before publishing.";
    return;
  }

  const button = document.querySelector("#publish-listing");
  const progress = document.querySelector("#publish-progress");
  button.disabled = true;
  progress.hidden = false;
  publishMessage.textContent = "";

  try {
    document.querySelector("#publish-progress-detail").textContent = "Saving listing information.";

    const { data: listing, error } = await supabase
      .from("listings")
      .insert({
        host_id: user.id,
        title: draft.title,
        description: draft.description,
        city: draft.city,
        province: draft.province,
        
        nightly_price: draft.price,
        host_style: draft.style,
        max_guests: draft.guests,
        max_vehicle_length: draft.length,
        max_vehicle_height: draft.height ? Number(draft.height) : null,
        max_vehicle_width: draft.width ? Number(draft.width) : null,
        driveway_surface: draft.surface || null,
        driveway_slope: draft.slope || null,
        parking_orientation: draft.orientation || null,
        amenities: [...draft.amenities, ...draft.vehicles.map(item => `Vehicle: ${item}`)],
        status: "published"
      })
      .select()
      .single();

    if (error) throw error;
    const { error: addressError } = await supabase

  .from("listing_private_details")

  .insert({

    listing_id: listing.id,

    exact_address: draft.exact_address

  });

if (addressError) throw addressError;

    if (selectedPhotos.length) {
      await uploadPhotos(user.id, listing.id);
    }

    localStorage.removeItem(storageKey);
    document.querySelector("#publish-progress-title").textContent = "Your Pad is live.";
    document.querySelector("#publish-progress-detail").textContent = "Opening the public listing.";
    publishMessage.textContent = "Published successfully.";
    setTimeout(() => {
      window.location.href = `pad-listing.html?listing=${encodeURIComponent(listing.id)}`;
    }, 900);
  } catch (error) {
    button.disabled = false;
    progress.hidden = true;
    publishMessage.textContent = error.message || "The listing could not be published.";
  }
});

restoreDraft();
updatePrice();
showStep(1);
