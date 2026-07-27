const routePlanner = document.querySelector("#route-planner");

const routeClose = document.querySelector("#route-close");

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

routeClose?.addEventListener("click", closeRoutePlanner);

routeSearch?.addEventListener("click", async () => {

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

});

if (window.location.hash === "#route-planner") {

  openRoutePlanner();

}

window.addEventListener("hashchange", () => {

  if (window.location.hash === "#route-planner") {

    openRoutePlanner();

  }

});