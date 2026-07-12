import { supabase } from "./supabase-client.js";

function formatDate(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", year: "numeric" })
    .format(new Date(`${value}T12:00:00`));
}

function requestCard(request) {
  const article = document.createElement("article");
  article.className = "traveler-request-card";
  article.innerHTML = `
    <div class="traveler-request-main">
      <span class="status-pill status-${request.status}">${request.status}</span>
      <h3>${request.listings?.title || "Pad"}</h3>
      <p>${request.listings?.city || ""}, ${request.listings?.province || ""}</p>
      <div class="request-date-line">${formatDate(request.arrival)} → ${formatDate(request.departure)}</div>
      <div class="request-facts">
        <span>🚐 ${request.vehicle_type || "Vehicle"}</span>
        <span>👥 ${request.travelers}</span>
        <span>💰 $${Number(request.total_amount || 0).toFixed(0)}</span>
      </div>
    </div>
    <div class="traveler-request-actions">
      <a class="btn btn-primary" href="trip-details.html?booking=${encodeURIComponent(request.id)}">View Details</a>
      <a class="secondary-button" href="messages.html?booking=${encodeURIComponent(request.id)}">Message Host</a>
    </div>
  `;
  return article;
}

async function loadDashboard() {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  const loading = document.querySelector("#traveler-request-loading");
  loading.hidden = false;

  const { data, error } = await supabase
    .from("booking_requests")
    .select("id,arrival,departure,travelers,vehicle_type,status,total_amount,created_at,listings(id,title,city,province)")
    .eq("traveler_id", user.id)
    .order("created_at", { ascending: false });

  loading.hidden = true;

  if (error) {
    document.querySelector("#traveler-request-list").textContent = error.message;
    return;
  }

  const list = document.querySelector("#traveler-request-list");
  list.innerHTML = "";
  (data || []).forEach(item => list.appendChild(requestCard(item)));
  document.querySelector("#traveler-request-empty").hidden = Boolean((data || []).length);

  document.querySelector("#traveler-pending-count").textContent = (data || []).filter(x => x.status === "pending").length;
  document.querySelector("#traveler-accepted-count").textContent = (data || []).filter(x => ["accepted","paid"].includes(x.status)).length;
  document.querySelector("#traveler-completed-count").textContent = (data || []).filter(x => x.status === "completed").length;
}

document.querySelector("#refresh-traveler-dashboard")?.addEventListener("click", loadDashboard);
loadDashboard();
