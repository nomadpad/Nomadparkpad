import { supabase } from "./supabase-client.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function statusClass(status) {
  return `status-${status}`;
}

async function currentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

async function changeStatus(bookingId, status, button) {

  button.disabled = true;

  const { error } = await supabase

    .from("booking_requests")

    .update({

      status,

      updated_at: new Date().toISOString()

    })

    .eq("id", bookingId);

  if (error) {

    button.disabled = false;

    const isOverlap =

      error.message.includes("booking_requests_no_overlapping_accepted") ||

      error.code === "23P01";

    alert(

      isOverlap

        ? "This parking pad is already booked for some or all of those dates. Decline this request or choose another booking."

        : error.message

    );

    return;

  }

  await loadDashboard();

}
async function refundBooking(bookingId, button) {

  const confirmed = window.confirm(

    "Refund this booking in full? This will return the traveler’s payment and reverse the host payout."

  );

  if (!confirmed) return;

  const originalText = button.textContent;

  try {

    button.disabled = true;

    button.textContent = "Refunding...";

    const { data, error } = await supabase.functions.invoke(

      "refund-booking",

      {

        body: {

          bookingId,

        },

      }

    );

    if (error) throw error;

    if (!data?.success) {

      throw new Error(data?.error || "The refund could not be completed.");

    }

    alert("Refund completed successfully.");

    await loadDashboard();

  } catch (error) {

    console.error("Refund error:", error);

    alert(

      error?.message ||

        "The refund could not be completed. Please try again."

    );

    button.disabled = false;

    button.textContent = originalText;

  }

}
function requestCard(request) {
  const card = document.createElement("article");
  card.className = "host-request-card";

  const traveler = request.profiles?.first_name || "Traveler";
  const listing = request.listings?.title || "Pad";
  const status = request.status || "pending";

  card.innerHTML = `
    <div class="request-card-top">
      <div>
        <span class="status-pill ${statusClass(status)}">${status}</span>
        <h3>${listing}</h3>
        <p>${traveler} · ${formatDate(request.arrival)} to ${formatDate(request.departure)}</p>
      </div>
      <strong>$${Number(request.total_amount || 0).toFixed(0)}</strong>
    </div>
    <div class="request-facts">
      <span>👥 ${request.travelers} traveler${request.travelers === 1 ? "" : "s"}</span>
      <span>🚐 ${request.vehicle_type || "Vehicle not listed"}</span>
      <span>↔ ${request.vehicle_length || "Length not listed"}</span>
      <span>🐾 ${request.pets || "No pet details"}</span>
    </div>
    <blockquote>${request.message || "No message provided."}</blockquote>
    <div class="request-card-actions"></div>
  `;

  const actions = card.querySelector(".request-card-actions");
  const details = document.createElement("a");
  details.className = "secondary-button";
  details.href = `trip-details.html?booking=${encodeURIComponent(request.id)}`;
  details.textContent = "View Details";
  actions.appendChild(details);

  const messages = document.createElement("a");
  messages.className = "secondary-button";
  messages.href = `messages.html?booking=${encodeURIComponent(request.id)}`;
  messages.textContent = "Message";
  actions.appendChild(messages);
if (status === "paid") {

  const refund = document.createElement("button");

  refund.className = "danger-button";

  refund.type = "button";

  refund.textContent = "Refund Booking";

  refund.addEventListener("click", () =>

    refundBooking(request.id, refund)

  );

  actions.appendChild(refund);

}
  if (status === "pending") {
    const accept = document.createElement("button");
    accept.className = "btn btn-primary";
    accept.type = "button";
    accept.textContent = "Accept";
    accept.addEventListener("click", () => changeStatus(request.id, "accepted", accept));

    const decline = document.createElement("button");
    decline.className = "danger-button";
    decline.type = "button";
    decline.textContent = "Decline";
    decline.addEventListener("click", () => changeStatus(request.id, "declined", decline));
    actions.prepend(accept, decline);
  }

  return card;
}

function listingCard(listing) {
  const card = document.createElement("article");
  card.className = "host-listing-row";
  card.innerHTML = `
    <div><span class="status-pill status-${listing.status}">${listing.status}</span><h3>${listing.title}</h3><p>${listing.city}, ${listing.province}</p></div>
    <div class="host-listing-row-actions"><strong>$${Number(listing.nightly_price).toFixed(0)} / night</strong><a class="secondary-button" href="pad-listing.html?listing=${encodeURIComponent(listing.id)}">View</a>
    <a class="secondary-button" href="edit-arrival-note.html?listing=${encodeURIComponent(listing.id)}">Edit arrival note</a></div>
  `;
  return card;
}

async function loadDashboard() {
  const user = await currentUser();
  if (!user) return;

  const loading = document.querySelector("#host-request-loading");
  loading.hidden = false;

  const [{ data: listings, error: listingError }, { data: requests, error: requestError }] = await Promise.all([
    supabase.from("listings")
      .select("id,title,city,province,nightly_price,status,created_at")
      .eq("host_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("booking_requests")
      .select("id,arrival,departure,travelers,vehicle_type,vehicle_length,pets,message,status,total_amount,created_at,listing_id,traveler_id,listings!inner(id,title,host_id),profiles!booking_requests_traveler_id_fkey(first_name)")
      .eq("listings.host_id", user.id)
      .order("created_at", { ascending: false })
  ]);

  loading.hidden = true;

  if (listingError || requestError) {
    const list = document.querySelector("#host-request-list");
    list.textContent = listingError?.message || requestError?.message || "Dashboard could not load.";
    return;
  }

  const requestList = document.querySelector("#host-request-list");
  requestList.innerHTML = "";
  (requests || []).forEach(item => requestList.appendChild(requestCard(item)));
  document.querySelector("#host-request-empty").hidden = Boolean((requests || []).length);

  const listingList = document.querySelector("#host-listing-list");
  listingList.innerHTML = "";
  (listings || []).forEach(item => listingList.appendChild(listingCard(item)));
  document.querySelector("#host-listing-empty").hidden = Boolean((listings || []).length);

  document.querySelector("#host-pending-count").textContent = (requests || []).filter(x => x.status === "pending").length;
  document.querySelector("#host-accepted-count").textContent = (requests || []).filter(x => ["accepted","paid","completed"].includes(x.status)).length;
  document.querySelector("#host-listing-count").textContent = (listings || []).filter(x => x.status === "published").length;
}

document.querySelector("#refresh-host-dashboard")?.addEventListener("click", loadDashboard);
loadDashboard();
