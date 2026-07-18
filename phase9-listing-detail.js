import { supabase, supabaseConfigured } from "./supabase-client.js";

const listingId = new URLSearchParams(window.location.search).get("listing");

function publicPhoto(path) {
  const { data } = supabase.storage.from("listing-photos").getPublicUrl(path);
  return data.publicUrl;
}

function setText(selector, value) {
  const el = document.querySelector(selector);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

async function loadListing() {
  if (!listingId || !supabaseConfigured) return;

  const { data: listing, error } = await supabase
    .from("listings")
    .select(`
      id,title,description,city,province,nightly_price,host_style,max_guests,
      max_vehicle_length,max_vehicle_height,menities,host_id,
      listing_photos(storage_path,sort_order),
      profiles!listings_host_id_fkey(first_name,city)
    `)
    .eq("id", listingId)
    .eq("status", "published")
    .single();
if (error) alert(error.message);
  if (error || !listing) {
    document.querySelector("main").innerHTML =
      '<section class="listing-not-found"><span>🧭</span><h1>Pad not found</h1><p>This listing may have been paused or removed.</p><a class="btn btn-primary" href="find-a-pad.html">Find another Pad</a></section>';
    return;
  }

  document.title = `${listing.title} | Nomad Park Pad`;
  setText("#listing-title", listing.title);
  setText("#listing-location", `${listing.city}, ${listing.province}`);
  setText("#listing-description", listing.description);
  setText("#listing-price", `$${Number(listing.nightly_price).toFixed(0)}`);
  setText("#listing-style", listing.host_style);
  setText("#listing-guests", listing.max_guests);
  setText("#listing-length", listing.max_vehicle_length);
  setText("#listing-height", listing.max_vehicle_height ? `${listing.max_vehicle_height} m` : "Not specified");
  setText("#host-name", listing.profiles?.first_name || "Nomad host");
  setText("#booking-price", `$${Number(listing.nightly_price).toFixed(0)}`);

  const requestLink = document.querySelector("#real-booking-link");
  if (requestLink) requestLink.href = `booking-request.html?listing=${encodeURIComponent(listing.id)}`;

  const amenities = document.querySelector("#listing-amenities");
  if (amenities) {
    amenities.innerHTML = "";
    (listing.amenities || []).filter(x => !x.startsWith("Vehicle:")).forEach(item => {
      const span = document.createElement("span");
      span.textContent = `✓ ${item}`;
      amenities.appendChild(span);
    });
  }

  const vehicleList = document.querySelector("#listing-vehicles");
  if (vehicleList) {
    const vehicles = (listing.amenities || []).filter(x => x.startsWith("Vehicle:")).map(x => x.replace("Vehicle: ", ""));
    vehicleList.textContent = vehicles.length ? vehicles.join(", ") : "Contact host";
  }

  const photos = [...(listing.listing_photos || [])].sort((a,b) => a.sort_order - b.sort_order);
  const gallery = document.querySelector("#real-gallery");
  if (gallery && photos.length) {
    gallery.innerHTML = "";
    photos.slice(0, 5).forEach((photo, index) => {
      const div = document.createElement("div");
      div.className = index === 0 ? "gallery-photo gallery-main" : "gallery-photo";
      div.style.backgroundImage = `url("${publicPhoto(photo.storage_path)}")`;
      gallery.appendChild(div);
    });
  }
}

loadListing();
