import { supabase, supabaseConfigured } from "./supabase-client.js";

const grid = document.querySelector("#live-listing-grid");
const section = document.querySelector("#live-listings-section");
const count = document.querySelector("#live-result-count");
const loading = document.querySelector("#live-listing-loading");
const empty = document.querySelector("#live-listing-empty");
const searchForm = document.querySelector("#pad-search");
const destination = document.querySelector("#destination");
const vehicle = document.querySelector("#vehicle");
const maxPrice = document.querySelector("#price");
let liveListings = [];

function photoUrl(path) {
  if (!path) return "hero.jpg";
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

function tagIcon(tag) {
  if (tag.includes("power")) return "⚡";
  if (tag.includes("Pet")) return "🐾";
  if (tag.includes("Wi-Fi")) return "📶";
  if (tag.includes("Washroom")) return "🚿";
  if (tag.includes("Water")) return "💧";
  if (tag.includes("Lighting")) return "💡";
  if (tag.includes("Vehicle")) return "🚐";
  return "✓";
}

function render(listings) {
  if (!grid) return;
  grid.innerHTML = "";
  count.textContent = listings.length;
  empty.hidden = listings.length !== 0;

  listings.forEach(listing => {
    const card = document.createElement("article");
    card.className = "listing-card real-listing-card";
    card.dataset.city = listing.city.toLowerCase();
    card.dataset.price = String(listing.nightly_price);
    card.dataset.vehicle = (listing.amenities || []).filter(x => x.startsWith("Vehicle:")).join(" ").toLowerCase();
    card.dataset.tags = (listing.amenities || []).join(" ").toLowerCase();

    const photo = document.createElement("div");
    photo.className = "listing-photo real-listing-photo";
    photo.style.backgroundImage = `url("${photoUrl(listing.cover_photo)}")`;
    const badge = document.createElement("span");
    badge.className = "founding-badge live-badge";
    badge.textContent = "Live Pad";
    photo.appendChild(badge);

    const body = document.createElement("div");
    body.className = "listing-body";
    const top = document.createElement("div");
    top.className = "listing-topline";
    top.innerHTML = `<span>${listing.city}, ${listing.province}</span><strong>$${Number(listing.nightly_price).toFixed(0)} <small>/ night</small></strong>`;

    const title = document.createElement("h3");
    title.textContent = listing.title;
    const desc = document.createElement("p");
    desc.textContent = listing.description.length > 145 ? `${listing.description.slice(0, 145)}…` : listing.description;

    const tags = document.createElement("div");
    tags.className = "tag-row";
    (listing.amenities || []).filter(x => !x.startsWith("Vehicle:")).slice(0, 3).forEach(tag => {
      const span = document.createElement("span");
      span.textContent = `${tagIcon(tag)} ${tag.replace("15-amp ", "")}`;
      tags.appendChild(span);
    });
    if (!tags.children.length) {
      const span = document.createElement("span");
      span.textContent = `🌙 ${listing.host_style}`;
      tags.appendChild(span);
    }

    const footer = document.createElement("div");
    footer.className = "listing-footer";
    const host = document.createElement("span");
    host.textContent = `🏡 Hosted by ${listing.host_name || "a Nomad host"}`;
    const link = document.createElement("a");
    link.className = "view-button";
    link.href = `pad-listing.html?listing=${encodeURIComponent(listing.id)}`;
    link.textContent = "View Pad";
    footer.append(host, link);

    body.append(top, title, desc, tags, footer);
    card.append(photo, body);
    grid.appendChild(card);
  });
}

function filterLive() {
  const query = (destination?.value || "").trim().toLowerCase();
  const vehicleValue = vehicle?.value || "all";
  const priceLimit = Number(maxPrice?.value || 100);

  const filtered = liveListings.filter(listing => {
    const cityMatch = !query ||
      listing.city.toLowerCase().includes(query) ||
      listing.province.toLowerCase().includes(query) ||
      listing.title.toLowerCase().includes(query);
    const priceMatch = Number(listing.nightly_price) <= priceLimit;
    const vehicleTags = (listing.amenities || []).filter(x => x.startsWith("Vehicle:")).join(" ").toLowerCase();
    const vehicleMatch =
      vehicleValue === "all" ||
      (vehicleValue === "van" && vehicleTags.includes("camper van")) ||
      (vehicleValue === "car" && vehicleTags.includes("car")) ||
      (vehicleValue === "small-rv" && vehicleTags.includes("small rv")) ||
      (vehicleValue === "large-rv" && vehicleTags.includes("large rv"));
    return cityMatch && priceMatch && vehicleMatch;
  });

  render(filtered);
}

async function loadLiveListings() {
  if (!supabaseConfigured || !grid) return;
  loading.hidden = false;

  const { data, error } = await supabase
    .from("listings")
    .select(`
      id,title,description,city,province,nightly_price,host_style,max_guests,
      max_vehicle_length,amenities,created_at,host_id,
      listing_photos(storage_path,sort_order),
      profiles!listings_host_id_fkey(first_name)
    `)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  loading.hidden = true;

  if (error) {
    empty.hidden = false;
    empty.querySelector("p").textContent = `Live listings could not load: ${error.message}`;
    return;
  }

  liveListings = (data || []).map(item => ({
    ...item,
    cover_photo: [...(item.listing_photos || [])].sort((a,b) => a.sort_order - b.sort_order)[0]?.storage_path || null,
    host_name: item.profiles?.first_name || ""
  }));

  section.hidden = false;
  render(liveListings);
}

searchForm?.addEventListener("submit", event => {
  event.preventDefault();
  filterLive();
  section?.scrollIntoView({ behavior: "smooth" });
});
vehicle?.addEventListener("change", filterLive);
maxPrice?.addEventListener("change", filterLive);

loadLiveListings();
