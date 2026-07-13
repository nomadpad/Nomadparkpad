import { supabase } from "./supabase-client.js";

const bookingId = new URLSearchParams(window.location.search).get("booking");
let booking = null;
let currentUserId = null;

function formatDate(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "long", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el) el.textContent = value ?? "";
}

function applyStatus(status) {
  const pill = document.querySelector("#trip-status");
  pill.textContent = status;
  pill.className = `status-pill status-${status}`;
  if (["accepted","paid","completed"].includes(status)) {
    document.querySelector("#approval-step").classList.add("done");
    document.querySelector("#conversation-step").classList.add("done");
    setText("#address-message", "The request is accepted. Exact address release is the next safety feature to be built; continue coordinating with the host in messages.");
  }
}

async function loadBooking() {
  if (!bookingId) {
    document.querySelector("main").innerHTML = '<section class="dashboard-empty"><h1>Booking not found</h1></section>';
    return;
  }

  const { data: { user } } = await supabase.auth.getUser();
  currentUserId = user?.id || null;

  const { data, error } = await supabase
    .from("booking_requests")
    .select("id,traveler_id,arrival,departure,travelers,vehicle_type,vehicle_length,pets,message,status,total_amount,listing_id,listings(id,title,city,province,hexact_address,host_id,profiles!listings_host_id_fkey(first_name))")
    .eq("id", bookingId)
    .single();

  if (error || !data) {
    document.querySelector("main").innerHTML = `<section class="dashboard-empty"><h1>Booking unavailable</h1><p>${error?.message || ""}</p></section>`;
    return;
  }

  booking = data;
  setText("#trip-title", data.listings?.title || "Pad booking");
  setText("#trip-location", `${data.listings?.city || ""}, ${data.listings?.province || ""}`);
  setText("#trip-arrival", formatDate(data.arrival));
  setText("#trip-departure", formatDate(data.departure));
  setText("#trip-travelers", String(data.travelers));
  setText("#trip-total", `$${Number(data.total_amount || 0).toFixed(0)}`);
  setText("#trip-vehicle", data.vehicle_type || "Not listed");
  setText("#trip-length", data.vehicle_length || "Not listed");
  setText("#trip-pets", data.pets || "Not listed");
  setText("#trip-host", data.listings?.profiles?.first_name || "Nomad host");
  setText("#trip-original-message", data.message || "No message provided.");
  document.querySelector("#trip-message-link").href = `messages.html?booking=${encodeURIComponent(data.id)}`;
  applyStatus(data.status);

  const cancel = document.querySelector("#cancel-request");
  const travelerOwns = currentUserId === data.traveler_id;
  cancel.hidden = !(travelerOwns && data.status === "pending");
}

document.querySelector("#cancel-request")?.addEventListener("click", async event => {
  if (!booking || booking.status !== "pending") return;
  if (!confirm("Cancel this booking request?")) return;
  event.currentTarget.disabled = true;

  const { error } = await supabase
    .from("booking_requests")
    .update({ status: "cancelled", updated_at: new Date().toISOString() })
    .eq("id", booking.id);

  const message = document.querySelector("#trip-action-message");
  if (error) {
    event.currentTarget.disabled = false;
    message.textContent = error.message;
    return;
  }

  message.textContent = "Request cancelled.";
  setTimeout(() => window.location.reload(), 500);
});

loadBooking();
