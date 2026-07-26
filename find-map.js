import {

  supabase,

  supabaseConfigured

} from "./supabase-client.js";

const listButton =

  document.querySelector("#list-view-button");

const mapButton =

  document.querySelector("#map-view-button");

const mapElement =

  document.querySelector("#traveller-map");

const mapMessage =

  document.querySelector("#map-message");

const resultsSection =

  document.querySelector(".example-results-section");

let mapLoaded = false;

let googleMap = null;

function showMessage(text = "") {

  if (!mapMessage) return;

  mapMessage.textContent = text;

  mapMessage.hidden = !text;

}

function setActiveView(view) {

  const showingMap = view === "map";

  listButton?.classList.toggle("active", !showingMap);

  mapButton?.classList.toggle("active", showingMap);

  listButton?.setAttribute(

    "aria-pressed",

    String(!showingMap)

  );

  mapButton?.setAttribute(

    "aria-pressed",

    String(showingMap)

  );

  if (resultsSection) {

    resultsSection.hidden = showingMap;

  }

  if (mapElement) {

    mapElement.hidden = !showingMap;

  }

}

function escapeHtml(value = "") {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}

async function loadListings() {

  if (!supabaseConfigured || !supabase) {

    throw new Error("Supabase is not configured.");

  }

  const { data, error } = await supabase

    .from("listings")

    .select(

      "id, title, city, province, nightly_price, latitude, longitude"

    )

    .eq("status", "published")

    .not("latitude", "is", null)

    .not("longitude", "is", null);

  if (error) {

    throw error;

  }

  return data || [];

}

async function buildMap() {

  if (mapLoaded) {

    window.google?.maps?.event?.trigger(

      googleMap,

      "resize"

    );

    return;

  }

  if (!window.google?.maps) {

    showMessage("Google Maps has not loaded yet.");

    return;

  }

  showMessage("Loading host areas...");

  try {

    const listings = await loadListings();

    googleMap = new google.maps.Map(mapElement, {

      center: {

        lat: 53.5461,

        lng: -113.4938

      },

      zoom: 8,

      mapTypeControl: false,

      streetViewControl: false,

      fullscreenControl: true

    });

    const bounds = new google.maps.LatLngBounds();

    listings.forEach(listing => {

      const position = {

        lat: Number(listing.latitude),

        lng: Number(listing.longitude)

      };

      const marker = new google.maps.Marker({

        map: googleMap,

        position,

        title: listing.title || "Nomad Park Pad"

      });

      const location = [

        listing.city,

        listing.province

      ]

        .filter(Boolean)

        .join(", ");

      const price =

        Number(listing.nightly_price || 0);

      const infoWindow =

        new google.maps.InfoWindow({

          content: `

            <div class="map-popup">

              <strong>

                ${escapeHtml(

                  listing.title || "Nomad Park Pad"

                )}

              </strong>

              <p>

                ${escapeHtml(location)}

              </p>

              <p>

                $${price.toFixed(0)} CAD per night

              </p>

              <a

                href="pad-listing.html?listing=${encodeURIComponent(

                  listing.id

                )}">

                View Pad

              </a>

            </div>

          `

        });

      marker.addListener("click", () => {

        infoWindow.open({

          anchor: marker,

          map: googleMap

        });

      });

      bounds.extend(position);

    });

    if (listings.length === 1) {

      googleMap.setCenter(bounds.getCenter());

      googleMap.setZoom(11);

    } else if (listings.length > 1) {

      googleMap.fitBounds(bounds);

    } else {

      showMessage(

        "No published pads with map locations are available yet."

      );

    }

    mapLoaded = true;

    if (listings.length) {

      showMessage("");

    }

  } catch (error) {

    console.error("Unable to load map listings:", error);

    showMessage(

      error.message ||

      "The map could not be loaded."

    );

  }

}

listButton?.addEventListener("click", () => {

  setActiveView("list");

});

mapButton?.addEventListener("click", async () => {

  setActiveView("map");

  await buildMap();

});

setActiveView("list");