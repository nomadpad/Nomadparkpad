import { supabase, supabaseConfigured } from "./supabase-client.js";

async function currentUser() {
  if (!supabaseConfigured) return null;
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function publishListing() {
  const user = await currentUser();
  if (!user) throw new Error("Log in as a host before publishing a listing.");

  const raw = localStorage.getItem("nomadParkPadListingDraft");
  const draft = raw ? JSON.parse(raw) : {};

  const payload = {
    host_id: user.id,
    title: draft.title || "Quiet Garden Driveway",
    description: draft.description || "",
    city: draft.city || "",
    province: draft.province || "Alberta",
    exact_address: draft.exact_address || "",
    nightly_price: Number(draft.price || 22),
    host_style: draft.style || "Quiet Overnight",
    max_guests: Number(draft.guests || 4),
    max_vehicle_length: draft.length || "24 ft",
    amenities: Array.isArray(draft.amenities) ? draft.amenities : [],
    status: "published"
  };

  const { data, error } = await supabase
    .from("listings")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function createBookingRequest() {
  const user = await currentUser();
  if (!user) throw new Error("Log in before sending a booking request.");

  const listingId = new URLSearchParams(window.location.search).get("listing");
  if (!listingId) throw new Error("A real listing ID is required in the page URL.");

  const arrival = document.querySelector("#request-arrival")?.value;
  const departure = document.querySelector("#request-departure")?.value;
  const travelersText = document.querySelector("#request-travelers")?.value || "1";
  const travelers = Number(travelersText.match(/\d+/)?.[0] || 1);

  const payload = {
    listing_id: listingId,
    traveler_id: user.id,
    arrival,
    departure,
    travelers,
    vehicle_type: document.querySelector("#request-vehicle")?.value || "",
    vehicle_length: document.querySelector("#request-length")?.value || "",
    pets: document.querySelector("#request-pets")?.value || "",
    message: document.querySelector("#request-message")?.value || "",
    status: "pending",
    total_amount: Number((document.querySelector("#request-total")?.textContent || "0").replace("$", ""))
  };

  const { data, error } = await supabase
    .from("booking_requests")
    .insert(payload)
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function sendMessage(bookingId, body) {
  const user = await currentUser();
  if (!user) throw new Error("Log in before sending a message.");

  const { data, error } = await supabase
    .from("messages")
    .insert({
      booking_id: bookingId,
      sender_id: user.id,
      body
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

async function loadMessages(bookingId) {
  const { data, error } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data || [];
}

window.NPP_DATA = {
  configured: supabaseConfigured,
  publishListing,
  createBookingRequest,
  sendMessage,
  loadMessages
};

document.querySelector("#save-real-listing")?.addEventListener("click", async (event) => {
  const button = event.currentTarget;
  const message = document.querySelector(".publish-message");
  button.disabled = true;
  button.textContent = "Publishing...";

  try {
    const listing = await publishListing();
    button.textContent = "Published";
    if (message) {
      message.textContent = `Listing saved to the database. Listing ID: ${listing.id}`;
    }
  } catch (error) {
    button.disabled = false;
    button.textContent = "Publish to Database";
    if (message) message.textContent = error.message;
  }
});

const bookingForm = document.querySelector("#booking-request-form");
if (bookingForm) {
  bookingForm.addEventListener("submit", async (event) => {
    if (!supabaseConfigured) return;
    event.preventDefault();
    const message = document.querySelector(".request-message");
    const button = bookingForm.querySelector('button[type="submit"]');
    button.disabled = true;
    button.textContent = "Sending...";

    try {
      const booking = await createBookingRequest();
      button.textContent = "Request Sent";
      if (message) message.textContent = `Real booking request created. Request ID: ${booking.id}`;
    } catch (error) {

  button.disabled = false;

  button.textContent = "Send Booking Request";

  message.textContent = error.message.includes("booking_requests_no_duplicate_pending_idx")

    ? "You already have a pending request for this listing. Open My Trips to message the host."

    : error.message;

}

}, true);
}

const messageForm = document.querySelector("#message-form");
if (messageForm && supabaseConfigured) {
  const bookingId = new URLSearchParams(window.location.search).get("booking");
  if (bookingId) {
    messageForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const input = document.querySelector("#message-input");
      if (!input?.value.trim()) return;

      try {
        await sendMessage(bookingId, input.value.trim());
        input.value = "";
        window.location.reload();
      } catch (error) {
        alert(error.message);
      }
    }, true);
  }
}
