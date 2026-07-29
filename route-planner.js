alert("Route planner v3 loaded");
const routePlanner = document.querySelector("#tripPlannerPanel");

const routeButton = document.querySelector("#trip-planner-button");

const routeClose = document.querySelector("#tripPlannerClose");

const routeSearch = document.querySelector("#route-search");

const routeMessage = document.querySelector("#route-message");
const routeOrigin = document.querySelector("#route-origin");

const routeDestination = document.querySelector("#route-destination");

let routePolylines = [];

function filterHostsNearRoute(routePath, maxDistanceMetres = 10000) {

  const hostRecords = window.NPP_HOST_MARKERS || [];

  const clusterer = window.NPP_HOST_MARKER_CLUSTERER;

  const nearbyMarkers = hostRecords

    .filter(record => {

      const hostPosition = new google.maps.LatLng(

        record.position.lat,

        record.position.lng

      );

      return routePath.some(routePoint => {

        const distance =

          google.maps.geometry.spherical.computeDistanceBetween(

            hostPosition,

            routePoint

          );

        return distance <= maxDistanceMetres;

      });

    })

    .map(record => record.marker);

  if (clusterer) {

    clusterer.clearMarkers();

    clusterer.addMarkers(nearbyMarkers);

  }

  return nearbyMarkers.length;

}
function openRoutePlanner() {

  if (!routePlanner) return;

  routePlanner.hidden = false;

  setTimeout(() => {

    routePlanner.scrollIntoView({

      behavior: "smooth",

      block: "start"

    });

  }, 50);

}

function closeRoutePlanner() {

  if (!routePlanner) return;

  routePlanner.hidden = true;

}

routeButton?.addEventListener("click", openRoutePlanner);

routeClose?.addEventListener("click", closeRoutePlanner);

async function runRouteSearch() {
  console.log("Route debug:", {

  routeOrigin,

  routeDestination,

  routeSearch,

  routeMessage,

  googleMaps: Boolean(window.google?.maps),

  mapReady: Boolean(window.NPP_GOOGLE_MAP),

  originValue: routeOrigin?.value,

  destinationValue: routeDestination?.value

});

alert(

  [

    `routeOrigin: ${Boolean(routeOrigin)}`,

    `routeDestination: ${Boolean(routeDestination)}`,

    `routeSearch: ${Boolean(routeSearch)}`,

    `routeMessage: ${Boolean(routeMessage)}`,

    `googleMaps: ${Boolean(window.google?.maps)}`,

    `mapReady: ${Boolean(window.NPP_GOOGLE_MAP)}`,

    `origin: ${routeOrigin?.value || "EMPTY"}`,

    `destination: ${routeDestination?.value || "EMPTY"}`

  ].join("\n")

);


  const origin = routeOrigin?.value.trim();

  const destination = routeDestination?.value.trim();

  const map = window.NPP_GOOGLE_MAP;

  if (!origin || !destination) {

    routeMessage.textContent =

      "Please enter both a starting point and destination.";

    routeMessage.hidden = false;

    return;

  }

  if (!map || !window.google?.maps) {

    routeMessage.textContent =

      "The map is still loading. Please try again.";

    routeMessage.hidden = false;

    return;

  }

  routeSearch.disabled = true;

  routeSearch.textContent = "Finding Route…";

  routeMessage.textContent = "Calculating your driving route…";

  routeMessage.hidden = false;

  try {

    const { Route } =

      await google.maps.importLibrary("routes");

    const result = await Route.computeRoutes({

      origin,

      destination,
region: "ca",
      travelMode: "DRIVING",

      routingPreference: "TRAFFIC_UNAWARE",

      fields: [

        "path",

        "viewport",

        "localizedValues"

      ]

    });

    const route = result.routes?.[0];

    if (!route) {

      throw new Error("No driving route was found.");

    }

    routePolylines.forEach(polyline => {

      polyline.setMap(null);

    });

    routePolylines = route.createPolylines();

    routePolylines.forEach(polyline => {

      polyline.setMap(map);

    });
    const nearbyHostCount =

  filterHostsNearRoute(route.path, 10000);

    if (route.viewport) {

      map.fitBounds(route.viewport);

    }

    const distance =

      route.localizedValues?.distance || "";

    const duration =

      route.localizedValues?.duration || "";

    routeMessage.textContent =

  `Route found${distance ? ` • ${distance}` : ""}` +

  `${duration ? ` • ${duration}` : ""}` +

  ` • ${nearbyHostCount} pad${nearbyHostCount === 1 ? "" : "s"} near route`;
document.querySelector("#traveller-map")
      ?.scrollIntoView({

        behavior: "smooth",

        block: "start"

      });

  } catch (error) {

    console.error("Route search failed:", error);

    routeMessage.textContent =

      error.message || "The route could not be calculated.";

  } finally {

    routeSearch.disabled = false;

    routeSearch.textContent =

      "Find Pads Along My Route";

  }

}
routeSearch?.addEventListener("click", runRouteSearch);
function handleRoutePlannerHash() {

  if (window.location.hash === "#route-planner") {

    openRoutePlanner();

  }

}

if (document.readyState === "loading") {

  document.addEventListener(

    "DOMContentLoaded",

    handleRoutePlannerHash

  );

} else {

  handleRoutePlannerHash();

}

window.addEventListener(

  "hashchange",

  handleRoutePlannerHash

);
async function initializeTripAutocomplete() {

  if (!window.google?.maps?.places) return;

  const startInput = document.getElementById("tripStartInput");

  const destinationInput = document.getElementById("tripDestinationInput");

  if (!startInput || !destinationInput) return;

  const options = {

    fields: ["formatted_address", "geometry", "name"],

    types: ["geocode"],

    componentRestrictions: { country: ["ca", "us"] }

  };

  new google.maps.places.Autocomplete(startInput, options);

  new google.maps.places.Autocomplete(destinationInput, options);

}

function waitForTripAutocomplete() {

  if (window.google?.maps?.places) {

    initializeTripAutocomplete();

    return;

  }

  setTimeout(waitForTripAutocomplete, 300);

}

waitForTripAutocomplete();
const tripUseLocation = document.getElementById("tripUseLocation");

const tripStartGroup = document.querySelector(".trip-start-group");

const tripStartField = document.getElementById("tripStartInput");

const tripDestinationField = document.getElementById("tripDestinationInput");

tripStartField?.addEventListener("focus", () => {

  tripUseLocation.style.display = "inline-flex";

});

tripDestinationField?.addEventListener("focus", () => {

  tripUseLocation.style.display = "none";

});

  tripUseLocation?.addEventListener("pointerdown", (event) => {

  event.preventDefault();

  const startInput = document.getElementById("tripStartInput");

  if (!navigator.geolocation) {

    alert("Location is not supported on this device.");

    return;

  }

  tripUseLocation.disabled = true;

  tripUseLocation.textContent = "Finding location...";

  navigator.geolocation.getCurrentPosition(

    async ({ coords }) => {

      try {

        const geocoder = new google.maps.Geocoder();

        const result = await geocoder.geocode({

          location: {

            lat: coords.latitude,

            lng: coords.longitude

          }

        });

        startInput.value =

          result.results?.[0]?.formatted_address || "Current location";

      } catch (error) {

        startInput.value = "Current location";

      } finally {

        tripUseLocation.disabled = false;

        tripUseLocation.textContent = "📍 Use My Location";

      }

    },

    () => {

      alert("Please allow location access and try again.");

      tripUseLocation.disabled = false;

      tripUseLocation.textContent = "📍 Use My Location";

    },

    {

      enableHighAccuracy: true,

      timeout: 10000

    }

  );

});
const tripPlannerSubmit = document.getElementById("tripPlannerSubmit");

const tripStartInput = document.getElementById("tripStartInput");

const tripDestinationInput = document.getElementById("tripDestinationInput");

const routeParams = new URLSearchParams(window.location.search);

const routeStart = routeParams.get("start");

const routeDestinationParam =

  routeParams.get("destination");

if (routeStart && tripStartInput) {

  tripStartInput.value = routeStart;

}

if (routeDestinationParam && tripDestinationInput) {

  tripDestinationInput.value = routeDestinationParam;

}

if (routeStart && routeDestinationParam) {

  routeOrigin.value = routeStart;

  routeDestination.value = routeDestinationParam;

  function runRouteWhenMapIsReady(attempt = 0) {

  const mapIsReady =

    window.NPP_GOOGLE_MAP &&

    window.google?.maps;

  if (mapIsReady) {

    runRouteSearch();

    return;

  }

  if (attempt < 40) {

    setTimeout(() => {

      runRouteWhenMapIsReady(attempt + 1);

    }, 250);

  }

}

runRouteWhenMapIsReady();
tripPlannerSubmit?.addEventListener("click", () => {

  const start = tripStartInput?.value.trim();

  const destination = tripDestinationInput?.value.trim();

  if (!start || !destination) {

    alert("Please enter both a starting point and destination.");

    return;

  }

  routeOrigin.value = start;

  routeDestination.value = destination;
closeRoutePlanner();
  routeSearch.click();

});