import { supabase, supabaseConfigured } from "./supabase-client.js";

const listingId = new URLSearchParams(window.location.search).get("listing");
let listing = null;
 let calendarMonth = new Date();

let unavailableDates = new Set();

const calendarGrid = document.querySelector("#booking-calendar-grid");

const calendarTitle = document.querySelector("#calendar-month");

const calendarPrev = document.querySelector("#calendar-prev");

const calendarNext = document.querySelector("#calendar-next");
function dateKey(date) {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

}
function renderCalendar() {

  if (!calendarGrid || !calendarTitle) return;

  calendarGrid.innerHTML = "";

  const year = calendarMonth.getFullYear();

  const month = calendarMonth.getMonth();

  calendarTitle.textContent = calendarMonth.toLocaleDateString("en-CA", {

    month: "long",

    year: "numeric"

  });

  const firstDay = new Date(year, month, 1);

  const lastDay = new Date(year, month + 1, 0);

  for (let i = 0; i < firstDay.getDay(); i += 1) {

    const empty = document.createElement("div");

    empty.className = "calendar-day empty";

    calendarGrid.appendChild(empty);

  }

  for (let day = 1; day <= lastDay.getDate(); day += 1) {

    const date = new Date(year, month, day);

    const key = dateKey(date);

    const button = document.createElement("button");

    button.type = "button";

    button.className = "calendar-day";

    button.textContent = String(day);

    if (unavailableDates.has(key)) {

      button.classList.add("unavailable");

      button.disabled = true;

    }

    calendarGrid.appendChild(button);

  }

}
async function loadUnavailableDates() {

  if (!listingId) return;

  const { data: bookings, error } = await supabase

    .from("booking_requests")

    .select("arrival,departure")

    .eq("listing_id", listingId)

    .in("status", ["accepted", "paid"]);

  if (error) {

    console.error("Could not load unavailable dates:", error);

    renderCalendar();

    return;

  }

  unavailableDates = new Set();

  (bookings || []).forEach(booking => {

    const current = new Date(`${booking.arrival}T12:00:00`);

    const departure = new Date(`${booking.departure}T12:00:00`);

    while (current < departure) {

      unavailableDates.add(dateKey(current));

      current.setDate(current.getDate() + 1);

    }

  });

  renderCalendar();

}
calendarPrev?.addEventListener("click", () => {

  calendarMonth.setMonth(calendarMonth.getMonth() - 1);

  renderCalendar();

});

calendarNext?.addEventListener("click", () => {

  calendarMonth.setMonth(calendarMonth.getMonth() + 1);

  renderCalendar();

});
function money(value) {
  return `$${Number(value || 0).toFixed(0)}`;
}

function nightsBetween(start, end) {
  if (!start || !end) return 1;
  const a = new Date(`${start}T12:00:00`);
  const b = new Date(`${end}T12:00:00`);
  const nights = Math.round((b - a) / 86400000);
  return Math.max(1, nights);
}

function publicPhoto(path) {
  if (!path) return "hero.jpg";
  return supabase.storage.from("listing-photos").getPublicUrl(path).data.publicUrl;
}

function updateEstimate() {
  if (!listing) return;
  const arrival = document.querySelector("#request-arrival").value;
  const departure = document.querySelector("#request-departure").value;
  const nights = nightsBetween(arrival, departure);
  const subtotal = nights * Number(listing.nightly_price);
  document.querySelector("#summary-nights").textContent = nights;
  document.querySelector("#summary-subtotal").textContent = money(subtotal);
  document.querySelector("#summary-total").textContent = money(subtotal + 4);
}

function setMinimumDates() {
  const today = new Date();
  today.setHours(12,0,0,0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const iso = d => d.toISOString().split("T")[0];
  const arrival = document.querySelector("#request-arrival");
  const departure = document.querySelector("#request-departure");
  arrival.min = iso(today);
  departure.min = iso(tomorrow);
  if (!arrival.value) arrival.value = iso(tomorrow);
  if (!departure.value) departure.value = iso(dayAfter);
}

async function loadListing() {
  if (!listingId || !supabaseConfigured) {
    document.querySelector("#booking-form-message").textContent = "A live listing ID is required.";
    return;
  }

  const { data, error } = await supabase
    .from("listings")
    .select("id,title,city,province,nightly_price,max_guests,max_vehicle_length,amenities,listing_photos(storage_path,sort_order)")
    .eq("id", listingId)
    .eq("status", "published")
    .single();

  if (error || !data) {
    document.querySelector("#booking-form-message").textContent = error?.message || "Listing not found.";
    return;
  }

  listing = data;
  document.querySelector("#request-heading").textContent = `Request ${data.title}.`;
  document.querySelector("#summary-title").textContent = data.title;
  document.querySelector("#summary-location").textContent = `${data.city}, ${data.province}`;
  document.querySelector("#summary-nightly").textContent = money(data.nightly_price);
  document.querySelector("#back-to-listing").href = `pad-listing.html?listing=${encodeURIComponent(data.id)}`;
  document.querySelector("#request-travelers").value = String(Math.min(2, data.max_guests || 2));

  const photos = [...(data.listing_photos || [])].sort((a,b) => a.sort_order - b.sort_order);
  document.querySelector("#booking-cover").style.backgroundImage = `url("${publicPhoto(photos[0]?.storage_path)}")`;
  updateEstimate();
}

document.querySelector("#request-arrival")?.addEventListener("change", event => {
  const departure = document.querySelector("#request-departure");
  const selected = new Date(`${event.target.value}T12:00:00`);
  const next = new Date(selected);
  next.setDate(next.getDate() + 1);
  departure.min = next.toISOString().split("T")[0];
  if (!departure.value || new Date(`${departure.value}T12:00:00`) <= selected) {
    departure.value = next.toISOString().split("T")[0];
  }
  updateEstimate();
});
document.querySelector("#request-departure")?.addEventListener("change", updateEstimate);

document.querySelector("#real-booking-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const form = event.currentTarget;
  const message = document.querySelector("#booking-form-message");
  const button = document.querySelector("#send-booking-request");
  const progress = document.querySelector("#request-progress");

  if (!listing) {
    message.textContent = "The listing is still loading.";
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    return;
  }

  const arrival = document.querySelector("#request-arrival").value;
  const departure = document.querySelector("#request-departure").value;
  if (nightsBetween(arrival, departure) < 1 || departure <= arrival) {
    message.textContent = "Departure must be after arrival.";
    return;
  }

  const nights = nightsBetween(arrival, departure);
  const total =

  Math.round((nights * Number(listing.nightly_price) + 4) * 1.05 * 100) / 100;
const { data: conflicts, error: conflictError } = await supabase

  .from("booking_requests")

  .select("id")

  .eq("listing_id", listing.id)

  .in("status", ["accepted", "paid"])

  .lt("arrival", departure)

  .gt("departure", arrival)

  .limit(1);

if (conflictError) {

  message.textContent = "Could not check availability. Please try again.";

  return;

}

if (conflicts?.length) {

  message.textContent = "Those dates are no longer available. Please choose different dates.";

  return;

}
  button.disabled = true;
  progress.hidden = false;
  message.textContent = "";

  const { data: booking, error } = await supabase
    .from("booking_requests")
    .insert({
      listing_id: listing.id,
      traveler_id: user.id,
      arrival,
      departure,
      travelers: Number(document.querySelector("#request-travelers").value),
      vehicle_type: document.querySelector("#request-vehicle").value,
      vehicle_length: document.querySelector("#request-length").value.trim(),
      pets: document.querySelector("#request-pets").value,
      message: document.querySelector("#request-message").value.trim(),
      status: "pending",
      total_amount: total
    })
    .select()
    .single();

  if (error) {

  button.disabled = false;

  progress.hidden = true;

  if (error.message.includes("booking_requests_no_duplicate_pending_idx")) {

    message.innerHTML =

      'You already have a pending request for this listing. <a href="traveler-dashboard.html">Open My Trips</a> to message the host.';

  } else {

    message.textContent = error.message;

  }

  return;

}

  message.textContent = "Booking request sent.";
  setTimeout(() => {
    window.location.href = `trip-details.html?booking=${encodeURIComponent(booking.id)}`;
  }, 700);
});

setMinimumDates();
loadListing();
loadUnavailableDates();
