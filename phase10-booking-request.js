import { supabase, supabaseConfigured } from "./supabase-client.js";

const listingId = new URLSearchParams(window.location.search).get("listing");
let listing = null;

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
  const total = nights * Number(listing.nightly_price) + 4;

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
    message.textContent = error.message;
    return;
  }

  message.textContent = "Booking request sent.";
  setTimeout(() => {
    window.location.href = `trip-details.html?booking=${encodeURIComponent(booking.id)}`;
  }, 700);
});

setMinimumDates();
loadListing();
