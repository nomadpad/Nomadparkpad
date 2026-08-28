import {

  supabase,

  supabaseConfigured

} from "./supabase-client.js";

/* =========================================================

   NOMAD PARK PAD

   NORTH AMERICA EXPLORER MAP

========================================================= */

const listButton =

  document.querySelector("#list-view-button");

const mapButton =

  document.querySelector("#map-view-button");

const mapElement =

  document.querySelector("#traveller-map");

const mapMessage =

  document.querySelector("#map-message");

const resultsSection =

  document.querySelector(

    ".example-results-section"

  );

const mapSearchButton =

  document.querySelector(

    "#map-search-button"

  );

const mapSearchPanel =

  document.querySelector(

    "#mapSearchPanel"

  );

const tripPlannerButton =

  document.querySelector(

    "#trip-planner-button"

  );

const tripPlannerPanel =

  document.querySelector(

    "#tripPlannerPanel"

  );

const tripStartInput =

  document.querySelector(

    "#tripStartInput"

  );

const tripDestinationInput =

  document.querySelector(

    "#tripDestinationInput"

  );

const tripPlannerSubmit =

  document.querySelector(

    "#tripPlannerSubmit"

  );

const mapSearchInput =

  document.querySelector(

    "#mapSearchInput"

  );

const mapSearchSubmit =

  document.querySelector(

    "#mapSearchSubmit"

  );

/* =========================================================

   STATE

========================================================= */

let mapLoaded = false;

let googleMap = null;

let directionsRenderer = null;

let userMarker = null;

let hostMarkerClusterer = null;

let travellerMarkerClusterer = null;

let travellerInfoWindow = null;

let currentUser = null;

let currentUserEmoji = "🧭";

let currentUserLocation = null;

let hostMarkerRecords = [];

let travellerMarkerRecords = [];

/* =========================================================

   HELPERS

========================================================= */

function showMessage(text = "") {

  if (!mapMessage) {

    return;

  }

  mapMessage.textContent = text;

  mapMessage.hidden = !text;

}

function setActiveView(view) {

  const showingMap =

    view === "map";

  listButton?.classList.toggle(

    "active",

    !showingMap

  );

  mapButton?.classList.toggle(

    "active",

    showingMap

  );

  listButton?.setAttribute(

    "aria-pressed",

    String(!showingMap)

  );

  mapButton?.setAttribute(

    "aria-pressed",

    String(showingMap)

  );

  if (resultsSection) {

    resultsSection.hidden =

      showingMap;

  }

  if (mapElement) {

    mapElement.hidden =

      !showingMap;

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

function formatTravellerStatus(status) {

  const labels = {

    available:

      "Available",

    looking_for_pad:

      "Looking for a pad",

    staying_with_host:

      "Staying with a host",

    offline:

      "Offline"

  };

  return (

    labels[status] ||

    "Travelling"

  );

}

/* =========================================================

   DATA

========================================================= */

async function getSignedInUser() {

  if (

    !supabaseConfigured ||

    !supabase

  ) {

    return null;

  }

  const {

    data,

    error

  } =

    await supabase.auth.getSession();

  if (error) {

    console.error(

      "Could not load user session:",

      error

    );

    return null;

  }

  return (

    data?.session?.user ||

    null

  );

}

async function loadCurrentUserProfile() {

  currentUser =

    await getSignedInUser();

  if (!currentUser) {

    return;

  }

  const {

    data: profile,

    error

  } =

    await supabase

      .from("profiles")

      .select(

        `

          map_emoji,

          traveller_latitude,

          traveller_longitude

        `

      )

      .eq(

        "id",

        currentUser.id

      )

      .maybeSingle();

  if (error) {

    console.error(

      "Could not load current traveller profile:",

      error

    );

    return;

  }

  currentUserEmoji =

    profile?.map_emoji ||

    "🧭";

  const latitude =

    Number(

      profile?.traveller_latitude

    );

  const longitude =

    Number(

      profile?.traveller_longitude

    );

  if (

    Number.isFinite(latitude) &&

    Number.isFinite(longitude)

  ) {

    currentUserLocation = {

      lat: latitude,

      lng: longitude

    };

  }

}

async function loadListings() {

  if (

    !supabaseConfigured ||

    !supabase

  ) {

    throw new Error(

      "Supabase is not configured."

    );

  }

  const {

    data,

    error

  } =

    await supabase

      .from("listings")

      .select(

        `

          id,

          title,

          city,

          province,

          nightly_price,

          latitude,

          longitude

        `

      )

      .eq(

        "status",

        "published"

      )

      .not(

        "latitude",

        "is",

        null

      )

      .not(

        "longitude",

        "is",

        null

      );

  if (error) {

    throw error;

  }

  return data || [];

}

async function loadVisibleTravellers() {

  if (

    !supabaseConfigured ||

    !supabase

  ) {

    return [];

  }

  const {

    data,

    error

  } =

    await supabase.rpc(

      "get_visible_travellers"

    );

  if (error) {

    console.error(

      "Could not load visible travellers:",

      error

    );

    return [];

  }

  return data || [];

}

/* =========================================================

   MARKER ICONS

========================================================= */

function createEmojiMarkerIcon(

  emoji,

  size = 42,

  ringColor = "#0d3b2f",

  groupBadge = ""

) {

  const safeEmoji = emoji || "🚐";

  const safeGroupBadge = groupBadge || "";

  const badgeSize = Math.round(size * 0.48);

  const svg = `

    <svg

      xmlns="http://www.w3.org/2000/svg"

      width="${size}"

      height="${size}"

      viewBox="0 0 ${size} ${size}"

    >

      <circle

        cx="${size / 2}"

        cy="${size / 2}"

        r="${size / 2 - 3}"

        fill="#fffaf2"

        stroke="${ringColor}"

        stroke-width="4"

      />

      <circle

        cx="${size / 2}"

        cy="${size / 2}"

        r="${size / 2 - 8}"

        fill="#ffffff"

        stroke="#0d3b2f"

        stroke-width="1.5"

      />

      <text

        x="50%"

        y="53%"

        text-anchor="middle"

        dominant-baseline="middle"

        font-size="${size * 0.5}"

      >${safeEmoji}</text>


      ${
        safeGroupBadge
          ? `
            <circle
              cx="${size - badgeSize / 2 - 2}"
              cy="${badgeSize / 2 + 2}"
              r="${badgeSize / 2}"
              fill="#fffaf2"
              stroke="#d6a437"
              stroke-width="3"
            />

            <text
              x="${size - badgeSize / 2 - 2}"
              y="${badgeSize / 2 + 3}"
              text-anchor="middle"
              dominant-baseline="middle"
              font-size="${badgeSize * 0.82}"
            >${safeGroupBadge}</text>
          `
          : ""
      }

    </svg>

  `;

  return {

    url:
      "data:image/svg+xml;charset=UTF-8," +
      encodeURIComponent(svg),

    scaledSize:
      new google.maps.Size(size, size),

    anchor:
      new google.maps.Point(
        size / 2,
        size / 2
      )

  };

}

/* =========================================================

   YOUR MARKER

========================================================= */

function placeCurrentUserMarker() {

  if (

    !googleMap ||

    !window.google?.maps

  ) {

    return;

  }

  const fallbackLocation = {

    lat: 53.5461,

    lng: -113.4938

  };

  const position =

    currentUserLocation ||

    fallbackLocation;

  if (!userMarker) {

    userMarker =

      new google.maps.Marker({

        map: googleMap,

        position,

        icon:

          createEmojiMarkerIcon(

            currentUserEmoji,

            52,

            "#f36b16"

          ),

        title: "You",

        zIndex: 999

      });

  } else {

    userMarker.setPosition(

      position

    );

    userMarker.setIcon(

      createEmojiMarkerIcon(

        currentUserEmoji,

        52,

        "#f36b16"

      )

    );

  }

}

function centreOnCurrentLocation() {

  if (

    !navigator.geolocation ||

    !googleMap

  ) {

    placeCurrentUserMarker();

    return;

  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      currentUserLocation = {

        lat:

          position.coords.latitude,

        lng:

          position.coords.longitude

      };

      placeCurrentUserMarker();

    },

    () => {

      placeCurrentUserMarker();

    },

    {

      enableHighAccuracy: false,

      timeout: 8000,

      maximumAge: 600000

    }

  );

}

/* =========================================================

   HOST MARKERS

========================================================= */

function clearHostMarkers() {

  if (hostMarkerClusterer) {

    hostMarkerClusterer.clearMarkers();

    hostMarkerClusterer = null;

  }

  hostMarkerRecords.forEach(

    ({ marker }) => {

      marker.setMap(null);

    }

  );

  hostMarkerRecords = [];

}

function addHostMarkers(

  listings,

  bounds

) {

  clearHostMarkers();

  const markers = [];

  listings.forEach((listing) => {

    const latitude =

      Number(

        listing.latitude

      );

    const longitude =

      Number(

        listing.longitude

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

    const marker =

      new google.maps.Marker({

        map: null,

        position,

        title:

          listing.title ||

          "Nomad Park Pad",

        icon:

          createEmojiMarkerIcon(

            "🏠",

            38,

            "#0d3b2f"

          )

      });

    const location = [

      listing.city,

      listing.province

    ]

      .filter(Boolean)

      .join(", ");

    const price =

      Number(

        listing.nightly_price || 0

      );

    const infoWindow =

      new google.maps.InfoWindow({

        content: `

          <div class="map-popup">

            <strong>

              ${escapeHtml(

                listing.title ||

                "Nomad Park Pad"

              )}

            </strong>

            <p>

              ${escapeHtml(location)}

            </p>

            <p>

              $${price.toFixed(0)}

              CAD per night

            </p>

            <a

              href="pad-listing.html?listing=${encodeURIComponent(

                listing.id

              )}"

            >

              View Pad

            </a>

          </div>

        `

      });

    marker.addListener(

      "click",

      () => {

        infoWindow.open({

          anchor: marker,

          map: googleMap

        });

      }

    );

    markers.push(marker);

    hostMarkerRecords.push({

      marker,

      listing,

      position

    });

    bounds.extend(position);

  });

  window.NPP_HOST_MARKERS =

    hostMarkerRecords;

  if (

    markers.length &&

    window.markerClusterer

      ?.MarkerClusterer

  ) {

    hostMarkerClusterer =

      new window.markerClusterer

        .MarkerClusterer({

          map: googleMap,

          markers

        });

    window.NPP_HOST_MARKER_CLUSTERER =

      hostMarkerClusterer;

  } else {

    markers.forEach(

      (marker) =>

        marker.setMap(

          googleMap

        )

    );

  }

}

/* =========================================================

   TRAVELLER CARDS

========================================================= */

function buildTravellerCard(

  traveller

) {

  const emoji =

    escapeHtml(

      traveller.map_emoji ||

      "🚐"

    );

  const status =

    escapeHtml(

      formatTravellerStatus(

        traveller.traveller_status

      )

    );

  const destination =

    traveller.destination

      ? `

        <p style="margin:8px 0 0;">

          <strong>

            Heading toward:

          </strong>

          ${escapeHtml(

            traveller.destination

          )}

        </p>

      `

      : "";

  const intro =

    traveller.intro

      ? `

        <p style="margin:8px 0 0;">

          ${escapeHtml(

            traveller.intro

          )}

        </p>

      `

      : "";

  return `

    <div

      style="

        max-width:260px;

        padding:4px 2px;

        color:#173c31;

        font-family:Arial,sans-serif;

      "

    >

      <div

        style="

          display:flex;

          align-items:center;

          gap:10px;

        "

      >

        <span style="font-size:32px;">

          ${emoji}

        </span>

        <div>

          <strong style="font-size:17px;">

          ${escapeHtml(traveller.public_name || "Traveller")}

          </strong>

          <div

            style="

              margin-top:2px;

              color:#66746e;

              font-size:13px;

            "

          >

            Active on the road

          </div>

        </div>

      </div>

      <p style="margin:10px 0 0;">

        <strong>Status:</strong>

        ${status}

      </p>

      ${intro}
<p

  style="

    margin:10px 0 0;

    color:#66746e;

    font-size:12px;

  "

>

  Member since ${escapeHtml(

    new Date(traveller.created_at).toLocaleDateString(

      "en-CA",

      {

        month: "long",

        year: "numeric"

      }

    )

  )}

<p style="margin:10px 0 0;color:#7b857f;font-size:12px;">Approximate location only</p>
<div

  style="

    display:flex;

    justify-content:space-between;

    align-items:center;

    margin-top:14px;

    padding-top:10px;

    border-top:1px solid #e5e7eb;

  "

>

  ${

    traveller.open_to_chat

      ? `

        <button

          type="button"

          class="traveller-card-message-button"

          data-traveller-id="${escapeHtml(

            traveller.traveller_id || ""

          )}"

          aria-label="Message traveller"

          title="Message traveller"

          style="

            width:42px;

            height:42px;

            border:0;

            border-radius:50%;

            background:#0d3b2f;

            font-size:20px;

            cursor:pointer;

          "

        >

          💬

        </button>

      `

      : `

        <span></span>

      `

  }

  <button

    type="button"

    class="traveller-card-report-button"

    data-traveller-id="${escapeHtml(

      traveller.traveller_id || ""

    )}"

    aria-label="Report traveller"

    title="Report traveller"

    style="

      border:0;

      background:transparent;

      color:#6b7280;

      font-size:12px;

      text-decoration:underline;

      cursor:pointer;

    "

  >

    Report

  </button>

</div>
  `;

}

/* =========================================================

   TRAVELLER MARKERS

========================================================= */

function clearTravellerMarkers() {

  if (

    travellerMarkerClusterer

  ) {

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

      const marker =

        new google.maps.Marker({

          map: null,

          position,

          title:

  traveller.public_name || "Traveller",

          icon:

            createEmojiMarkerIcon(

              traveller.map_emoji ||

              "🚐",

              42,

              "#f36b16"

            ),

          zIndex: 600

        });

      marker.addListener(

        "click",

        () => {

          if (!travellerInfoWindow) {

            travellerInfoWindow =

              new google.maps

                .InfoWindow();

          }

          travellerInfoWindow

            .setContent(

              buildTravellerCard(

                traveller

              )

            );

          travellerInfoWindow.open({

            map: googleMap,

            anchor: marker

          });
google.maps.event.addListenerOnce(

  travellerInfoWindow,

  "domready",

  () => {

    const messageButton =

      document.querySelector(

        ".traveller-card-message-button"

      );

    if (!messageButton) {

      return;

    }

    messageButton.addEventListener(

      "click",

      () => {

        const travellerId =

          messageButton.dataset.travellerId;

        if (!travellerId) {

          alert(

            "This traveller could not be opened."

          );

          return;

        }

        window.location.href =

          `messages.html?traveller=${encodeURIComponent(

            travellerId

          )}`;

      }

    );

  }

);
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

markers.forEach((marker) => {
  marker.setMap(googleMap);
});

travellerMarkerClusterer = null;

window.NPP_TRAVELLER_MARKER_CLUSTERER = null;
} 

/* =========================================================

   BUILD MAP

========================================================= */

async function buildMap() {

  if (mapLoaded) {

    window.google?.maps?.event

      ?.trigger(

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

    ] =

      await Promise.all([

        loadListings(),

        loadVisibleTravellers()

      ]);
      
    googleMap =

      new google.maps.Map(

        mapElement,

        {

          center: {

            lat: 49.5,

            lng: -104.5

          },

          zoom: 4,
gestureHandling: "greedy",
          mapTypeControl:

            false,

          streetViewControl:

            false,

          fullscreenControl:

            true

        }

      );
googleMap.setOptions({

  gestureHandling: "greedy",

  draggable: true,

  scrollwheel: true

});
    window.NPP_GOOGLE_MAP =

      googleMap;

    const bounds =

      new google.maps

        .LatLngBounds();

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

    } else if (

      totalMarkers === 1

    ) {

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

      window.google.maps.event

        .trigger(

          googleMap,

          "resize"

        );

    }

  }

);

setActiveView("map");

buildMap();

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

      mapSearchInput?.value

        .trim();

    if (

      !query ||

      !googleMap ||

      !window.google?.maps

    ) {

      return;

    }

    const geocoder =

      new window.google.maps

        .Geocoder();

    geocoder.geocode(

      {

        address: query

      },

      (

        results,

        status

      ) => {

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

          results[0]

            .geometry

            .location;

        googleMap.setCenter(

          destinationLocation

        );

        googleMap.setZoom(14);

        if (

          navigator.geolocation

        ) {

          navigator.geolocation

            .getCurrentPosition(

              (position) => {

                const origin =

                  routeStart || {

                    lat:

                      position.coords

                        .latitude,

                    lng:

                      position.coords

                        .longitude

                  };

                const destination =

                  routeDestination ||

                  destinationLocation;

                const directionsService =

                  new google.maps

                    .DirectionsService();

                directionsRenderer

                  ?.setMap(null);

                directionsRenderer =

                  new google.maps

                    .DirectionsRenderer({

                      map:

                        googleMap

                    });

                directionsService.route(

                  {

                    origin,

                    destination,

                    travelMode:

                      google.maps

                        .TravelMode

                        .DRIVING

                  },

                  (

                    routeResult,

                    routeStatus

                  ) => {

                    if (

                      routeStatus ===

                      "OK"

                    ) {

                      directionsRenderer

                        .setDirections(

                          routeResult

                        );

                    }

                  }

                );

              }

            );

        }

        sessionStorage.setItem(

          "routeDestination",

          results[0]

            .formatted_address

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

      tripStartInput?.value

        .trim();

    const destination =

      tripDestinationInput

        ?.value

        .trim();

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

      new google.maps

        .DirectionsService();

    directionsRenderer

      ?.setMap(null);

    directionsRenderer =

      new google.maps

        .DirectionsRenderer({

          map: googleMap

        });

    directionsService.route(

      {

        origin,

        destination,

        travelMode:

          google.maps

            .TravelMode

            .DRIVING

      },

      (

        routeResult,

        routeStatus

      ) => {

        if (

          routeStatus !== "OK"

        ) {

          alert(

            `Route error: ${routeStatus}`

          );

          return;

        }

        directionsRenderer

          .setDirections(

            routeResult

          );

        showMessage("");

      }

    );

  }

);