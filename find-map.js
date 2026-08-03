/* =========================================================

   TRAVELLER CARDS

========================================================= */

function buildTravellerCard(traveller) {

  const emoji =

    escapeHtml(

      traveller.map_emoji || "🚐"

    );

  const publicName =

    escapeHtml(

      traveller.public_name ||

      "Nomad Traveller"

    );

  const status =

    escapeHtml(

      formatTravellerStatus(

        traveller.traveller_status

      )

    );

  const homeRegion =

    traveller.home_region

      ? `

        <p style="margin:8px 0 0;">

          <strong>From:</strong>

          ${escapeHtml(

            traveller.home_region

          )}

        </p>

      `

      : "";

  const vehicleType =

    traveller.vehicle_type

      ? `

        <p style="margin:8px 0 0;">

          <strong>Travelling in:</strong>

          ${escapeHtml(

            traveller.vehicle_type

          )}

        </p>

      `

      : "";

  const destination =

    traveller.destination

      ? `

        <p style="margin:8px 0 0;">

          <strong>Heading toward:</strong>

          ${escapeHtml(

            traveller.destination

          )}

        </p>

      `

      : "";

  const intro =

    traveller.intro

      ? `

        <div

          style="

            margin-top:12px;

            padding:11px 12px;

            border-radius:12px;

            background:#f5f1e6;

            line-height:1.45;

          "

        >

          ${escapeHtml(

            traveller.intro

          )}

        </div>

      `

      : "";

  const chatStatus =

    traveller.open_to_chat

      ? `

        <div

          style="

            margin-top:12px;

            padding:9px 11px;

            border-radius:12px;

            background:#e8f4ed;

            color:#247248;

            font-weight:700;

            font-size:13px;

          "

        >

          💬 Open to friendly messages

        </div>

      `

      : `

        <div

          style="

            margin-top:12px;

            color:#7b857f;

            font-size:12px;

          "

        >

          Not currently open to messages

        </div>

      `;

  return `

    <div

      style="

        width:270px;

        max-width:100%;

        padding:6px 3px;

        color:#173c31;

        font-family:Arial,sans-serif;

      "

    >

      <div

        style="

          display:flex;

          align-items:center;

          gap:12px;

        "

      >

        <span

          style="

            width:48px;

            height:48px;

            display:flex;

            align-items:center;

            justify-content:center;

            flex:0 0 auto;

            border:3px solid #f36b16;

            border-radius:50%;

            background:#fffaf2;

            font-size:27px;

          "

        >

          ${emoji}

        </span>

        <div>

          <strong

            style="

              display:block;

              font-size:18px;

              line-height:1.2;

            "

          >

            ${publicName}

          </strong>

          <div

            style="

              margin-top:4px;

              color:#66746e;

              font-size:13px;

            "

          >

            ${status}

          </div>

        </div>

      </div>

      ${homeRegion}

      ${vehicleType}

      ${destination}

      ${intro}

      ${chatStatus}

      <p

        style="

          margin:12px 0 0;

          padding-top:10px;

          border-top:1px solid #e1e5df;

          color:#7b857f;

          font-size:11px;

          line-height:1.4;

        "

      >

        📍 Location is approximate for traveller privacy.

      </p>

    </div>

  `;

}

/* =========================================================

   TRAVELLER MARKERS

========================================================= */

function clearTravellerMarkers() {

  if (travellerMarkerClusterer) {

    travellerMarkerClusterer

      .clearMarkers();

    travellerMarkerClusterer =

      null;

  }

  travellerMarkerRecords.forEach(

    ({ marker }) => {

      marker.setMap(null);

    }

  );

  travellerMarkerRecords = [];

}

function addTravellerMarkers(

  travellers,

  bounds

) {

  clearTravellerMarkers();

  const markers = [];

  travellers.forEach(

    (traveller) => {

      const latitude =

        Number(

          traveller.latitude

        );

      const longitude =

        Number(

          traveller.longitude

        );

      if (

        !Number.isFinite(latitude) ||

        !Number.isFinite(longitude)

      ) {

        return;

      }

      const position = {

        lat: latitude,

        lng: longitude

      };

      const publicName =

        traveller.public_name ||

        "Nomad Traveller";

      const marker =

        new google.maps.Marker({

          map: null,

          position,

          title: publicName,

          icon:

            createEmojiMarkerIcon(

              traveller.map_emoji ||

              "🚐",

              44,

              "#f36b16"

            ),

          zIndex: 600

        });

      marker.addListener(

        "click",

        () => {

          if (!travellerInfoWindow) {

            travellerInfoWindow =

              new google.maps.InfoWindow();

          }

          travellerInfoWindow.setContent(

            buildTravellerCard(

              traveller

            )

          );

          travellerInfoWindow.open({

            map: googleMap,

            anchor: marker

          });

        }

      );

      markers.push(marker);

      travellerMarkerRecords.push({

        marker,

        traveller,

        position

      });

      bounds.extend(position);

    }

  );

  window.NPP_TRAVELLER_MARKERS =

    travellerMarkerRecords;

  if (

    markers.length &&

    window.markerClusterer

      ?.MarkerClusterer

  ) {

    travellerMarkerClusterer =

      new window.markerClusterer

        .MarkerClusterer({

          map: googleMap,

          markers

        });

    window.NPP_TRAVELLER_MARKER_CLUSTERER =

      travellerMarkerClusterer;

  } else {

    markers.forEach(

      (marker) => {

        marker.setMap(

          googleMap
        );

      }

    );

  }

}
);
/* =========================================================

   BUILD MAP

========================================================= */

async function buildMap() {

  if (mapLoaded) {

    window.google?.maps?.event?.trigger(

      googleMap,

      "resize"

    );

    return;

  }

  if (!window.google?.maps) {

    showMessage(

      "Google Maps has not loaded yet."

    );

    return;

  }

  showMessage(

    "Loading hosts and travellers..."

  );

  try {

    await loadCurrentUserProfile();

    const [

      listings,

      travellers

    ] = await Promise.all([

      loadListings(),

      loadVisibleTravellers()

    ]);

    googleMap = new google.maps.Map(

      mapElement,

      {

        center: {

          lat: 49.5,

          lng: -104.5

        },

        zoom: 4,

        mapTypeControl: false,

        streetViewControl: false,

        fullscreenControl: true

      }

    );

    window.NPP_GOOGLE_MAP =

      googleMap;

    const bounds =

      new google.maps.LatLngBounds();

    addHostMarkers(

      listings,

      bounds

    );

    addTravellerMarkers(

      travellers,

      bounds

    );

    centreOnCurrentLocation();

    const totalMarkers =

      listings.length +

      travellers.length;

    if (totalMarkers > 1) {

      googleMap.fitBounds(

        bounds,

        70

      );

    } else if (totalMarkers === 1) {

      googleMap.setCenter(

        bounds.getCenter()

      );

      googleMap.setZoom(8);

    } else {

      googleMap.setCenter({

        lat: 49.5,

        lng: -104.5

      });

      googleMap.setZoom(4);

      showMessage(

        "No published pads or visible travellers are available yet."

      );

    }

    mapLoaded = true;

    if (totalMarkers) {

      showMessage("");

    }

  } catch (error) {

    console.error(

      "Unable to load explorer map:",

      error

    );

    showMessage(

      error.message ||

      "The map could not be loaded."

    );

  }

}

/* =========================================================

   LIST AND MAP VIEWS

========================================================= */

listButton?.addEventListener(

  "click",

  () => {

    setActiveView("list");

  }

);

mapButton?.addEventListener(

  "click",

  async () => {

    setActiveView("map");

    await buildMap();

    if (

      window.google?.maps &&

      googleMap

    ) {

      window.google.maps.event.trigger(

        googleMap,

        "resize"

      );

    }

  }

);

setActiveView("map");

async function startExplorerMap() {

  let attempts = 0;

  const maximumAttempts = 40;

  while (

    !window.google?.maps &&

    attempts < maximumAttempts

  ) {

    await new Promise((resolve) => {

      window.setTimeout(

        resolve,

        250

      );

    });

    attempts += 1;

  }

  if (!window.google?.maps) {

    showMessage(

      "Google Maps could not be loaded. Please refresh the page."

    );

    console.error(

      "Google Maps was unavailable after waiting 10 seconds."

    );

    return;

  }

  await buildMap();

}

startExplorerMap();

/* =========================================================

   EXPLORER FILTER CHIPS

========================================================= */

document

  .querySelectorAll(

    ".explorer-chip"

  )

  .forEach((chip) => {

    chip.addEventListener(

      "click",

      () => {

        chip.classList.toggle(

          "active"

        );

      }

    );

  });

/* =========================================================

   URL PARAMETERS

========================================================= */

const routeParams =

  new URLSearchParams(

    window.location.search

  );

const mapOnly =

  routeParams.get("mapOnly") ===

  "true";

const routeStart =

  routeParams.get("start");

const routeDestination =

  routeParams.get(

    "destination"

  );

if (mapOnly) {

  document

    .querySelectorAll(

      ".hide-on-map-only"

    )

    .forEach((element) => {

      element.hidden = true;

    });

}

if (

  routeStart &&

  tripStartInput

) {

  tripStartInput.value =

    routeStart;

}

if (

  routeDestination &&

  tripDestinationInput

) {

  tripDestinationInput.value =

    routeDestination;

}

/* =========================================================

   MAP SEARCH PANEL

========================================================= */

mapSearchButton?.addEventListener(

  "click",

  () => {

    if (mapSearchPanel) {

      mapSearchPanel.hidden =

        false;

    }

    if (tripPlannerPanel) {

      tripPlannerPanel.hidden =

        true;

    }

    mapSearchButton.hidden =

      true;

    if (tripPlannerButton) {

      tripPlannerButton.hidden =

        false;

    }

  }

);

tripPlannerButton?.addEventListener(

  "click",

  () => {

    window.location.href =

      "trip-planner.html";

  }

);

/* =========================================================

   MAP SEARCH

========================================================= */

mapSearchSubmit?.addEventListener(

  "click",

  () => {

    const query =

      mapSearchInput?.value.trim();

    if (

      !query ||

      !googleMap ||

      !window.google?.maps

    ) {

      return;

    }

    const geocoder =

      new google.maps.Geocoder();

    geocoder.geocode(

      {

        address: query

      },

      (results, status) => {

        if (

          status !== "OK" ||

          !results?.[0]

        ) {

          showMessage(

            "Location not found."

          );

          return;

        }

        const destinationLocation =

          results[0].geometry.location;

        googleMap.setCenter(

          destinationLocation

        );

        googleMap.setZoom(14);

        sessionStorage.setItem(

          "routeDestination",

          results[0].formatted_address

        );

        showMessage("");

      }

    );

  }

);

/* =========================================================

   TRIP PLANNER

========================================================= */

tripPlannerSubmit?.addEventListener(

  "click",

  () => {

    const origin =

      tripStartInput?.value.trim();

    const destination =

      tripDestinationInput?.value.trim();

    if (

      !origin ||

      !destination ||

      !googleMap ||

      !window.google?.maps

    ) {

      showMessage(

        "Enter a starting point and destination."

      );

      return;

    }

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

        travelMode:

          google.maps.TravelMode.DRIVING

      },

      (

        routeResult,

        routeStatus

      ) => {

        if (routeStatus !== "OK") {

          alert(

            `Route error: ${routeStatus}`

          );

          return;

        }

        directionsRenderer.setDirections(

          routeResult

        );

        showMessage("");

      }

    );

  }

);