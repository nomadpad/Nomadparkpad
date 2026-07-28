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
let directionsRenderer = null;

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
window.NPP_GOOGLE_MAP = googleMap;
    const bounds = new google.maps.LatLngBounds();
const markers = [];

  const hostMarkerRecords = []; 
   listings.forEach(listing => {

      const position = {

        lat: Number(listing.latitude),

        lng: Number(listing.longitude)

      };

      const marker = new google.maps.Marker({

      map: null,

        position,

        title: listing.title || "Nomad Park Pad"

      });
      markers.push(marker);
      hostMarkerRecords.push({

  marker,

  listing,

  position

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
    window.NPP_HOST_MARKERS = hostMarkerRecords;
    if (markers.length && window.markerClusterer?.MarkerClusterer) {

  const hostMarkerClusterer =

    new window.markerClusterer.MarkerClusterer({

      map: googleMap,

      markers

    });

  window.NPP_HOST_MARKER_CLUSTERER =

    hostMarkerClusterer;

}

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

  if (window.google?.maps && googleMap) {

    window.google.maps.event.trigger(googleMap, "resize");

  }

});
setActiveView("map");

buildMap();
document.querySelectorAll(".explorer-chip").forEach((chip) => {

  chip.addEventListener("click", () => {

    chip.classList.toggle("active");

  });

});
const mapOnly =

  new URLSearchParams(window.location.search).get("mapOnly") === "true";

if (mapOnly) {

  document.querySelectorAll(".hide-on-map-only").forEach((element) => {

    element.hidden = true;

  });

}
const mapSearchButton =

  document.querySelector("#map-search-button");

const mapSearchPanel =

  document.querySelector("#mapSearchPanel");
  const tripPlannerButton =

  document.querySelector("#trip-planner-button");
  const tripPlannerPanel =

  document.querySelector("#tripPlannerPanel");

mapSearchButton?.addEventListener("click", () => {

  mapSearchPanel.hidden = false
tripPlannerPanel.hidden = true;
  mapSearchButton.hidden = true;

  tripPlannerButton.hidden = false;

});

tripPlannerButton?.addEventListener("click", () => {

  mapSearchPanel.hidden = true;

  tripPlannerPanel.hidden = false;

  tripPlannerButton.hidden = true;

  mapSearchButton.hidden = false;

});
const mapSearchInput =

  document.querySelector("#mapSearchInput");

const mapSearchSubmit =

  document.querySelector("#mapSearchSubmit");

mapSearchSubmit?.addEventListener("click", () => {

  const query = mapSearchInput?.value.trim();

  if (!query || !googleMap || !window.google?.maps) return;

  const geocoder = new window.google.maps.Geocoder();

  geocoder.geocode({ address: query }, (results, status) => {

    if (status !== "OK" || !results?.[0]) {

      showMessage("Location not found.");

      return;

    }

    googleMap.setCenter(results[0].geometry.location);

    googleMap.setZoom(14);
    if (navigator.geolocation) {

  navigator.geolocation.getCurrentPosition((position) => {

    const origin = {

      lat: position.coords.latitude,

      lng: position.coords.longitude

    };

    const destination =

      results[0].geometry.location;

    const directionsService =

      new google.maps.DirectionsService();

    directionsRenderer?.setMap(null);

directionsRenderer =

      new google.maps.DirectionsRenderer({

        map: googleMap

      });

    directionsService.route(

      {

        origin,

        destination,

        travelMode: google.maps.TravelMode.DRIVING

      },

      (routeResult, routeStatus) => {

        if (routeStatus === "OK") {

          directionsRenderer.setDirections(routeResult);

        }

      }

    );

  });

}
sessionStorage.setItem(

  "routeDestination",

  results[0].formatted_address

);
    showMessage("");

});
});