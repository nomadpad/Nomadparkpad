import { supabase } from "./supabase-client.js";

/* =========================================================

   NOMAD PARK PAD

   TRAVELLER COMMAND CENTRE

========================================================= */

const NEARBY_TRAVELLER_RADIUS_KM = 3000;

const sharedGroupBadgesByTravellerId = new Map();

const FILTER_COUNTS = {

  pads: 37,

  instant: 8,

  ev: 6,

  packages: 4,

  events: 12,

  featured: 5

};

const FILTER_LABELS = {

  pads: "locations nearby",

  instant: "instant pads nearby",

  ev: "EV hosts nearby",

  packages: "package hosts nearby",

  events: "events nearby",

  featured: "featured hosts nearby"

};

const WEATHER_CODES = {

  0: ["☀️", "Clear sky"],

  1: ["🌤️", "Mainly clear"],

  2: ["⛅", "Partly cloudy"],

  3: ["☁️", "Overcast"],

  45: ["🌫️", "Foggy"],

  48: ["🌫️", "Icy fog"],

  51: ["🌦️", "Light drizzle"],

  53: ["🌦️", "Drizzle"],

  55: ["🌧️", "Heavy drizzle"],

  61: ["🌦️", "Light rain"],

  63: ["🌧️", "Rain"],

  65: ["🌧️", "Heavy rain"],

  71: ["🌨️", "Light snow"],

  73: ["🌨️", "Snow"],

  75: ["❄️", "Heavy snow"],

  80: ["🌦️", "Rain showers"],

  81: ["🌧️", "Rain showers"],

  82: ["⛈️", "Heavy showers"],

  95: ["⛈️", "Thunderstorm"],

  96: ["⛈️", "Thunderstorm with hail"],

  99: ["⛈️", "Heavy thunderstorm"]

};

/* =========================================================

   STATE

========================================================= */

let travellerMapInstance = null;

let travellerIdentityMarker = null;

let travellerInfoWindow = null;

let dashboardListingMarkers = [];

let nearbyTravellerMarkers = [];

let currentEmoji = "😎";

let currentTravellerLocation = null;

let travellerMapIsVisible = false;

/* =========================================================

   ELEMENTS

========================================================= */

const mapIdentityButton =

  document.getElementById("mapIdentityButton");

const emojiPicker =

  document.getElementById("emojiPicker");

const travellerMapVisibleToggle =

  document.getElementById("travellerMapVisible");

const travellerCardEditorToggle =

  document.getElementById("travellerCardEditorToggle");

const travellerCardEditorBody =

  document.getElementById("travellerCardEditorBody");

const travellerCardForm =

  document.getElementById("travellerCardForm");

const travellerPublicName =

  document.getElementById("travellerPublicName");

const travellerHomeRegion =

  document.getElementById("travellerHomeRegion");

const travellerVehicleType =

  document.getElementById("travellerVehicleType");

const travellerDestination =

  document.getElementById("travellerDestination");

const travellerIntro =

  document.getElementById("travellerIntro");

const travellerOpenToChat =

  document.getElementById("travellerOpenToChat");

const travellerCardPreviewEmoji =

  document.getElementById("travellerCardPreviewEmoji");

const travellerCardPreviewName =

  document.getElementById("travellerCardPreviewName");

const travellerCardPreviewDetails =

  document.getElementById("travellerCardPreviewDetails");

const travellerCardMessage =

  document.getElementById("travellerCardMessage");

const travellerCardSaveButton =

  document.getElementById("travellerCardSaveButton");

/* =========================================================

   AUTH

========================================================= */

async function getSignedInUser() {

  try {

    const { data, error } =

      await supabase.auth.getSession();

    if (error) {

      console.error("Session lookup failed:", error);

      return null;

    }

    return data?.session?.user || null;

  } catch (error) {

    console.error("Account lookup crashed:", error);

    return null;

  }

}
function updateTravellerMemberSince(user) {

  const memberSinceElement =

    document.getElementById("travellerMemberSince");

  if (!memberSinceElement) {

    return;

  }

  const createdAt = user?.created_at;

  if (!createdAt) {

    memberSinceElement.textContent = "Member";

    return;

  }

  const createdDate = new Date(createdAt);

  memberSinceElement.textContent =

    createdDate.toLocaleDateString("en-CA", {

      month: "long",

      year: "numeric"

    });

}

/* =========================================================

   MAP FILTERS

========================================================= */

function initMapFilters() {

  const buttons =

    document.querySelectorAll(".map-filter-button");

  const filterSection =

    document.querySelector(".dashboard-map-filters");

  if (!buttons.length || !filterSection) {

    return;

  }

  let countDisplay =

    document.querySelector(".map-filter-count");

  if (!countDisplay) {

    countDisplay = document.createElement("p");

    countDisplay.className = "map-filter-count";

    filterSection.appendChild(countDisplay);

  }

  function activateFilter(button) {

    buttons.forEach((item) => {

      item.classList.remove("is-active");

      item.setAttribute("aria-pressed", "false");

    });

    button.classList.add("is-active");

    button.setAttribute("aria-pressed", "true");

    const filter =

      button.dataset.filter || "pads";

    const count =

      FILTER_COUNTS[filter] ?? 0;

    const label =

      FILTER_LABELS[filter] ||

      "locations nearby";

    countDisplay.textContent =

      `${count} ${label}`;

  }

  buttons.forEach((button) => {

    button.setAttribute(

      "aria-pressed",

      button.classList.contains("is-active")

        ? "true"

        : "false"

    );

    button.addEventListener("click", () => {

      activateFilter(button);

    });

  });

  const activeButton =

    document.querySelector(

      ".map-filter-button.is-active"

    ) || buttons[0];

  activateFilter(activeButton);

}

/* =========================================================

   EMOJI MARKERS

========================================================= */

function createEmojiMarkerIcon(

  emoji,

  size = 52,

  ringColor = "#f36b16",

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

function updateTravellerIdentityMarker(

  position = currentTravellerLocation

) {

  if (

    !travellerMapInstance ||

    !window.google?.maps ||

    !position

  ) {

    return;

  }

  currentTravellerLocation = position;

  if (!travellerIdentityMarker) {

    travellerIdentityMarker =

      new google.maps.Marker({

        map: travellerMapInstance,

        position,

        icon: createEmojiMarkerIcon(

          currentEmoji,

          54,

          "#f36b16"

        ),

        title: "You",

        zIndex: 999

      });

    return;

  }

  travellerIdentityMarker.setPosition(position);

  travellerIdentityMarker.setIcon(

    createEmojiMarkerIcon(

      currentEmoji,

      54,

      "#f36b16"

    )

  );

}

/* =========================================================

   LOCATION AND PRIVACY

========================================================= */

function makeLocationApproximate(value) {

  return Number(

    Number(value).toFixed(2)

  );

}

async function saveTravellerMapLocation() {

  const user =

    await getSignedInUser();

  if (

    !user ||

    !currentTravellerLocation

  ) {

    return false;

  }

  const { error } =

    await supabase

      .from("profiles")

      .update({

        traveller_map_visible: true,

        traveller_latitude:

          makeLocationApproximate(

            currentTravellerLocation.lat

          ),

        traveller_longitude:

          makeLocationApproximate(

            currentTravellerLocation.lng

          ),

        traveller_location_updated_at:

          new Date().toISOString(),

        traveller_status: "available"

      })

      .eq("id", user.id);

  if (error) {

    console.error(

      "Traveller visibility update failed:",

      error

    );

    alert(

      "Your traveller-map setting could not be saved: " +

      error.message

    );

    return false;

  }

  travellerMapIsVisible = true;

  localStorage.setItem(

    "npp-traveller-map-visible",

    "true"

  );

  await loadNearbyTravellers();

  return true;

}

async function hideTravellerFromMap() {

  const user =

    await getSignedInUser();

  if (!user) {

    return false;

  }

  const { error } =

    await supabase

      .from("profiles")

      .update({

        traveller_map_visible: false,

        traveller_latitude: null,

        traveller_longitude: null,

        traveller_location_updated_at: null,

        traveller_status: "offline"

      })

      .eq("id", user.id);

  if (error) {

    console.error(

      "Could not hide traveller:",

      error

    );

    return false;

  }

  travellerMapIsVisible = false;

  localStorage.setItem(

    "npp-traveller-map-visible",

    "false"

  );

  await loadNearbyTravellers();

  return true;

}

async function loadTravellerVisibility() {

  if (!travellerMapVisibleToggle) {

    return;

  }

  const user =

    await getSignedInUser();

  if (!user) {

    return;

  }

  const {

    data: profile,

    error

  } =

    await supabase

      .from("profiles")

      .select("traveller_map_visible")

      .eq("id", user.id)

      .maybeSingle();

  if (error) {

    console.error(

      "Could not load map visibility:",

      error

    );

    return;

  }

  travellerMapIsVisible =

    profile?.traveller_map_visible === true;

  travellerMapVisibleToggle.checked =

    travellerMapIsVisible;
if (travellerMapIsVisible) {

  await saveTravellerMapLocation();

}
  localStorage.setItem(

    "npp-traveller-map-visible",

    travellerMapIsVisible

      ? "true"

      : "false"

  );

}

function initTravellerVisibilityToggle() {

  if (!travellerMapVisibleToggle) {

    return;

  }

  travellerMapVisibleToggle.addEventListener(

    "change",

    async () => {

      const wantsToBeVisible =

        travellerMapVisibleToggle.checked;

      travellerMapVisibleToggle.disabled =

        true;

      try {

        if (wantsToBeVisible) {

          const saved =

            await saveTravellerMapLocation();

          if (!saved) {

            travellerMapVisibleToggle.checked =

              false;

            travellerMapIsVisible =

              false;

          }

        } else {

          const hidden =

            await hideTravellerFromMap();

          if (!hidden) {

            travellerMapVisibleToggle.checked =

              true;

          }

        }

      } finally {

        travellerMapVisibleToggle.disabled =

          false;

      }

    }

  );

}

/* =========================================================

   PUBLIC TRAVELLER CARD EDITOR

========================================================= */

function setTravellerCardMessage(

  text = "",

  type = ""

) {

  if (!travellerCardMessage) {

    return;

  }

  travellerCardMessage.textContent =

    text;

  travellerCardMessage.classList.remove(

    "is-success",

    "is-error"

  );

  if (type) {

    travellerCardMessage.classList.add(

      type

    );

  }

}

function updateTravellerCardPreview() {

  const publicName =

    travellerPublicName?.value.trim() ||

    "Nomad Traveller";

  const homeRegion =

    travellerHomeRegion?.value.trim();

  const vehicleType =

    travellerVehicleType?.value.trim();

  const details = [

    homeRegion,

    vehicleType

  ].filter(Boolean);

  if (travellerCardPreviewEmoji) {

    travellerCardPreviewEmoji.textContent =

      currentEmoji || "😎";

  }

  if (travellerCardPreviewName) {

    travellerCardPreviewName.textContent =

      publicName;

  }

  if (travellerCardPreviewDetails) {

    travellerCardPreviewDetails.textContent =

      details.length

        ? details.join(" • ")

        : "Add a home region and travel setup.";

  }

}

function initTravellerCardEditorToggle() {

  travellerCardEditorToggle?.addEventListener(

    "click",

    () => {

      const isOpen =

        travellerCardEditorToggle.getAttribute(

          "aria-expanded"

        ) === "true";

      travellerCardEditorToggle.setAttribute(

        "aria-expanded",

        String(!isOpen)

      );

      if (travellerCardEditorBody) {

        travellerCardEditorBody.hidden =

          isOpen;

      }

    }

  );

}

async function loadTravellerCardEditor() {

  if (!travellerCardForm) {

    return;

  }

  const user =

    await getSignedInUser();

  if (!user) {

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

          traveller_public_name,

          traveller_home_region,

          traveller_vehicle_type,

          traveller_destination,

          traveller_intro,

          traveller_open_to_chat

        `

      )

      .eq("id", user.id)

      .maybeSingle();

  if (error) {

    console.error(

      "Could not load traveller card:",

      error

    );

    setTravellerCardMessage(

      "Your traveller card could not be loaded.",

      "is-error"

    );

    return;

  }

  if (travellerPublicName) {

    travellerPublicName.value =

      profile?.traveller_public_name || "";

  }

  if (travellerHomeRegion) {

    travellerHomeRegion.value =

      profile?.traveller_home_region || "";

  }

  if (travellerVehicleType) {

    travellerVehicleType.value =

      profile?.traveller_vehicle_type || "";

  }

  if (travellerDestination) {

    travellerDestination.value =

      profile?.traveller_destination || "";

  }

  if (travellerIntro) {

    travellerIntro.value =

      profile?.traveller_intro || "";

  }

  if (travellerOpenToChat) {

    travellerOpenToChat.checked =

      profile?.traveller_open_to_chat === true;

  }

  updateTravellerCardPreview();

}

function initTravellerCardPreview() {

  const previewFields = [

    travellerPublicName,

    travellerHomeRegion,

    travellerVehicleType,

    travellerDestination,

    travellerIntro

  ];

  previewFields.forEach((field) => {

    field?.addEventListener(

      "input",

      updateTravellerCardPreview

    );

  });

  travellerOpenToChat?.addEventListener(

    "change",

    updateTravellerCardPreview

  );

}

function initTravellerCardForm() {

  travellerCardForm?.addEventListener(

    "submit",

    async (event) => {

      event.preventDefault();

      const user =

        await getSignedInUser();

      if (!user) {

        setTravellerCardMessage(

          "Please log in again before saving.",

          "is-error"

        );

        return;

      }

      const publicName =

        travellerPublicName?.value.trim() || null;

      const homeRegion =

        travellerHomeRegion?.value.trim() || null;

      const vehicleType =

        travellerVehicleType?.value.trim() || null;

      const destination =

        travellerDestination?.value.trim() || null;

      const intro =

        travellerIntro?.value.trim() || null;

      const openToChat =

        travellerOpenToChat?.checked === true;

      if (

        publicName &&

        publicName.length > 40

      ) {

        setTravellerCardMessage(

          "Your public name is too long.",

          "is-error"

        );

        return;

      }

      travellerCardSaveButton.disabled =

        true;

      travellerCardSaveButton.textContent =

        "Saving…";

      setTravellerCardMessage("");

      const { error } =

        await supabase

          .from("profiles")

          .update({

            traveller_public_name:

              publicName,

            traveller_home_region:

              homeRegion,

            traveller_vehicle_type:

              vehicleType,

            traveller_destination:

              destination,

            traveller_intro:

              intro,

            traveller_open_to_chat:

              openToChat

          })

          .eq("id", user.id);

      travellerCardSaveButton.disabled =

        false;

      travellerCardSaveButton.textContent =

        "Save Traveller Card";

      if (error) {

        console.error(

          "Could not save traveller card:",

          error

        );

        setTravellerCardMessage(

          "Your traveller card could not be saved: " +

          error.message,

          "is-error"

        );

        return;

      }

      setTravellerCardMessage(

        "Traveller card saved.",

        "is-success"

      );

      updateTravellerCardPreview();

      await loadNearbyTravellers();

    }

  );

}

/* =========================================================

   NEARBY TRAVELLERS

========================================================= */

function clearNearbyTravellerMarkers() {

  nearbyTravellerMarkers.forEach(

    (marker) => {

      marker.setMap(null);

    }

  );

  nearbyTravellerMarkers = [];

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

  const statusLabels = {

    available: "Available",

    looking_for_pad: "Looking for a pad",

    staying_with_host:

      "Staying with a host",

    offline: "Offline"

  };

  return (

    statusLabels[status] ||

    "Travelling"

  );

}

function buildTravellerCard(traveller) {

  const distanceNumber =

    Number(traveller.distance_km);

  const distance =

    Number.isFinite(distanceNumber)

      ? `${distanceNumber.toFixed(1)} km away`

      : "Nearby";

  const emoji =

    escapeHtml(

      traveller.map_emoji || "🚐"

    );

  const publicName =

    escapeHtml(

      traveller.public_name ||

      "Nearby Nomad"

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

        <p style="margin:8px 0 0;">

          ${escapeHtml(

            traveller.intro

          )}

        </p>

      `

      : "";

  const chatStatus =

    traveller.open_to_chat

      ? `

        <p

          style="

            margin:10px 0 0;

            color:#2f8b57;

            font-weight:700;

          "

        >

          💬 Open to friendly messages

        </p>

      `

      : "";

  return `

    <div

      style="

        max-width:270px;

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

            ${publicName}

          </strong>

          <div

            style="

              margin-top:2px;

              color:#66746e;

              font-size:13px;

            "

          >

            ${escapeHtml(distance)}

          </div>

        </div>

      </div>

      <p style="margin:10px 0 0;">

        <strong>Status:</strong>

        ${status}

      </p>

      ${homeRegion}

      ${vehicleType}

      ${destination}

      ${intro}

      ${chatStatus}

      <p

        style="

          margin:10px 0 0;

          color:#7b857f;

          font-size:12px;

        "

      >

        Approximate location only

      </p>

    </div>

  `;

}

async function loadNearbyTravellers() {

  if (

    !travellerMapInstance ||

    !currentTravellerLocation

  ) {

    return;

  }

  const user =

    await getSignedInUser();

  if (!user) {

    return;

  }

// Load the signed-in traveller's group memberships.
const {
  data: myGroupMemberships,
  error: myGroupsError
} = await supabase
  .from("traveller_group_members")
  .select("group_id")
  .eq("user_id", user.id);

if (myGroupsError) {
  console.error(
    "Could not load traveller groups:",
    myGroupsError
  );
}

// Reset shared group badge cache for this map load.
sharedGroupBadgesByTravellerId.clear();

const myGroupIds =
  (myGroupMemberships || [])
    .map((membership) => membership.group_id)
    .filter(Boolean);

if (myGroupIds.length > 0) {
  const {
    data: sharedMemberships,
    error: sharedMembershipsError
  } = await supabase
    .from("traveller_group_members")
    .select(`
      user_id,
      group_id,
      traveller_groups (
        badge
      )
    `)
    .in("group_id", myGroupIds);

  if (sharedMembershipsError) {
    console.error(
      "Could not load shared group members:",
      sharedMembershipsError
    );
  } else {
    (sharedMemberships || []).forEach(
      (membership) => {
        if (
          membership.user_id &&
          membership.user_id !== user.id &&
          membership.traveller_groups?.badge
        ) {
          sharedGroupBadgesByTravellerId.set(
            membership.user_id,
            membership.traveller_groups.badge
          );
        }
      }
    );
}
}

  const {

    data,

    error

  } =

    await supabase.rpc(

      "get_nearby_travellers",

      {

        viewer_latitude:

          currentTravellerLocation.lat,

        viewer_longitude:

          currentTravellerLocation.lng,

        radius_km:

          NEARBY_TRAVELLER_RADIUS_KM

      }

    );

  if (error) {

    console.error(

      "Could not load nearby travellers:",

      error

    );

    return;

  }

  clearNearbyTravellerMarkers();

  (data || []).forEach(

    (traveller) => {

      const latitude =

        Number(traveller.latitude);

      const longitude =

        Number(traveller.longitude);

      if (

        !Number.isFinite(latitude) ||

        !Number.isFinite(longitude)

      ) {

        return;

      }

      const sharedGroupBadge =
  sharedGroupBadgesByTravellerId.get(
    traveller.traveller_id
  ) || "";

const marker =
  new google.maps.Marker({

    map: travellerMapInstance,

    position: {
      lat: latitude,
      lng: longitude
    },

    icon: createEmojiMarkerIcon(
      traveller.map_emoji || "🚐",
      46,
      "#0d3b2f",
      sharedGroupBadge
    ),

    title:
      traveller.public_name ||
      "Nearby traveller",

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

            map: travellerMapInstance,

            anchor: marker

          });

        }

      );

      nearbyTravellerMarkers.push(

        marker

      );

    }

  );

}

/* =========================================================

   TRAVELLER MAP

========================================================= */

function initTravellerMap() {

  const mapElement =

    document.getElementById(

      "travellerMap"

    );

  if (

    !mapElement ||

    !window.google?.maps

  ) {

    return;

  }

  if (travellerMapInstance) {

    google.maps.event.trigger(

      travellerMapInstance,

      "resize"

    );

    return;

  }

  const fallbackLocation = {

    lat: 53.5461,

    lng: -113.4938

  };

  travellerMapInstance =

    new google.maps.Map(

      mapElement,

      {

        center: fallbackLocation,

        zoom: 10,
gestureHandling: "greedy",
        disableDefaultUI: false,

        mapTypeControl: false,

        streetViewControl: true,

        fullscreenControl: true

      }

    );
travellerMapInstance.setOptions({

  gestureHandling: "greedy",

  draggable: true,

  scrollwheel: true

});
  currentTravellerLocation =

    fallbackLocation;

  updateTravellerIdentityMarker(

    fallbackLocation

  );

  loadDashboardListings();

  const satelliteButton =

    document.querySelector(

      '.map-type-button[data-map-type="satellite"]'

    );

  if (satelliteButton) {

    satelliteButton.addEventListener(

      "click",

      () => {

        const isSatellite =

          travellerMapInstance.getMapTypeId() ===

          google.maps.MapTypeId.SATELLITE;

        travellerMapInstance.setMapTypeId(

          isSatellite

            ? google.maps.MapTypeId.ROADMAP

            : google.maps.MapTypeId.SATELLITE

        );

        satelliteButton.classList.toggle(

          "is-active",

          !isSatellite

        );

        const label =

          satelliteButton.querySelector(

            "span"

          );

        if (label) {

          label.textContent =

            isSatellite

              ? "Satellite"

              : "Map";

        }

      }

    );

  }

  if (!navigator.geolocation) {

    loadNearbyTravellers();

    return;

  }

  navigator.geolocation.getCurrentPosition(

    async (position) => {

      const travellerLocation = {

        lat:

          position.coords.latitude,

        lng:

          position.coords.longitude

      };

      currentTravellerLocation =

        travellerLocation;

      travellerMapInstance.setCenter(

        travellerLocation

      );

      travellerMapInstance.setZoom(11);

      updateTravellerIdentityMarker(

        travellerLocation

      );

      await loadNearbyTravellers();

    },

    async () => {

      console.warn(

        "Traveller location could not be loaded."

      );

      updateTravellerIdentityMarker(

        fallbackLocation

      );

      await loadNearbyTravellers();

    },

    {

      enableHighAccuracy: false,

      timeout: 8000,

      maximumAge: 600000

    }

  );

}

window.initTravellerMap =

  initTravellerMap;

/* =========================================================

   PUBLISHED PAD MARKERS

========================================================= */

async function loadDashboardListings() {

  if (

    !travellerMapInstance ||

    !supabase

  ) {

    return;

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

          longitude,

          status

        `

      )

      .eq("status", "published")

      .not("latitude", "is", null)

      .not("longitude", "is", null);

  if (error) {

    console.error(

      "Could not load dashboard listings:",

      error

    );

    return;

  }

  dashboardListingMarkers.forEach(

    (marker) => {

      marker.setMap(null);

    }

  );

  dashboardListingMarkers = [];

  (data || []).forEach(

    (listing) => {

      const latitude =

        Number(listing.latitude);

      const longitude =

        Number(listing.longitude);

      if (

        !Number.isFinite(latitude) ||

        !Number.isFinite(longitude)

      ) {

        return;

      }

      const marker =

        new google.maps.Marker({

          map: travellerMapInstance,

          position: {

            lat: latitude,

            lng: longitude

          },

          title:

            listing.title ||

            "Nomad Park Pad"

        });

      dashboardListingMarkers.push(

        marker

      );

    }

  );

  updateDashboardListingCount();

}

function updateDashboardListingCount() {

  const countDisplay =

    document.querySelector(

      ".map-filter-count"

    );

  if (!countDisplay) {

    return;

  }

  const count =

    dashboardListingMarkers.length;

  const word =

    count === 1

      ? "location"

      : "locations";

  countDisplay.textContent =

    `${count} ${word} nearby`;

}

/* =========================================================

   WEATHER

========================================================= */

function getWeatherSummary(

  temperature,

  wind,

  rain,

  condition

) {

  if (rain >= 60) {

    return (

      `${condition}. ` +

      "Keep the rain gear close."

    );

  }

  if (wind >= 35) {

    return (

      `${condition}. ` +

      "Strong winds may affect outdoor plans."

    );

  }

  if (temperature >= 25) {

    return (

      `${condition}. ` +

      "A warm day for exploring nearby."

    );

  }

  if (temperature <= 5) {

    return (

      `${condition}. ` +

      "Bundle up before heading out."

    );

  }

  return (

    `${condition}. ` +

    "Comfortable conditions for the road."

  );

}

async function loadLocalWeather(

  latitude,

  longitude

) {

  const loading =

    document.getElementById(

      "weatherLoading"

    );

  const content =

    document.getElementById(

      "weatherContent"

    );

  try {

    const url =

      "https://api.open-meteo.com/v1/forecast" +

      `?latitude=${encodeURIComponent(latitude)}` +

      `&longitude=${encodeURIComponent(longitude)}` +

      "&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m" +

      "&hourly=precipitation_probability" +

      "&temperature_unit=celsius" +

      "&wind_speed_unit=kmh" +

      "&timezone=auto" +

      "&forecast_days=1";

    const response =

      await fetch(url);

    if (!response.ok) {

      throw new Error(

        `Weather request failed: ${response.status}`

      );

    }

    const data =

      await response.json();

    const current =

      data.current;

    if (!current) {

      throw new Error(

        "Current weather was unavailable."

      );

    }

    const currentHour =

      current.time?.slice(0, 13);

    const hourlyIndex =

      data.hourly?.time?.findIndex(

        (time) =>

          time.startsWith(

            currentHour

          )

      );

    const rainChance =

      hourlyIndex >= 0

        ? data.hourly

            .precipitation_probability[

              hourlyIndex

            ] ?? 0

        : 0;

    const temperature =

      Math.round(

        current.temperature_2m

      );

    const feelsLike =

      Math.round(

        current.apparent_temperature

      );

    const wind =

      Math.round(

        current.wind_speed_10m

      );

    const weatherCode =

      current.weather_code;

    const [icon, condition] =

      WEATHER_CODES[weatherCode] || [

        "🌤️",

        "Current conditions"

      ];

    const values = {

      weatherIcon: icon,

      weatherTemperature:

        `${temperature}°C`,

      weatherCondition:

        condition,

      weatherFeelsLike:

        `${feelsLike}°C`,

      weatherWind:

        `${wind} km/h`,

      weatherRain:

        `${rainChance}%`,

      weatherSummary:

        getWeatherSummary(

          temperature,

          wind,

          rainChance,

          condition

        )

    };

    Object.entries(values).forEach(

      ([id, value]) => {

        const element =

          document.getElementById(id);

        if (element) {

          element.textContent =

            value;

        }

      }

    );

    loading?.remove();

    if (content) {

      content.hidden = false;

    }

  } catch (error) {

    console.error(error);

    if (loading) {

      loading.textContent =

        "Local weather could not be loaded. Tap refresh to try again.";

    }

  }

}

function initLocalWeather() {

  const fallbackLocation = {

    latitude: 53.5461,

    longitude: -113.4938

  };

  if (!navigator.geolocation) {

    loadLocalWeather(

      fallbackLocation.latitude,

      fallbackLocation.longitude

    );

    return;

  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      loadLocalWeather(

        position.coords.latitude,

        position.coords.longitude

      );

    },

    () => {

      loadLocalWeather(

        fallbackLocation.latitude,

        fallbackLocation.longitude

      );

    },

    {

      enableHighAccuracy: false,

      timeout: 8000,

      maximumAge: 600000

    }

  );

}

/* =========================================================

   SAVED EMOJI

========================================================= */

async function loadMapEmoji() {

  const localEmoji =

    localStorage.getItem(

      "npp-map-emoji"

    );

  if (localEmoji) {

    currentEmoji =

      localEmoji;

    if (mapIdentityButton) {

      mapIdentityButton.textContent =

        localEmoji;

    }

    updateTravellerIdentityMarker();

    updateTravellerCardPreview();

  }

  const user =

    await getSignedInUser();

  if (!user) {

    return;

  }

  const {

    data: profile,

    error

  } =

    await supabase

      .from("profiles")

      .select("map_emoji")

      .eq("id", user.id)

      .maybeSingle();

  if (error) {

    console.error(

      "Could not load map emoji:",

      error

    );

    return;

  }

  currentEmoji =

    profile?.map_emoji ||

    localEmoji ||

    "😎";

  if (mapIdentityButton) {

    mapIdentityButton.textContent =

      currentEmoji;

  }

  localStorage.setItem(

    "npp-map-emoji",

    currentEmoji

  );

  updateTravellerIdentityMarker();

  updateTravellerCardPreview();

}

/* =========================================================

   EMOJI PICKER

========================================================= */

mapIdentityButton?.addEventListener(

  "click",

  () => {

    if (emojiPicker) {

      emojiPicker.hidden =

        !emojiPicker.hidden;

    }

  }

);

document

  .querySelectorAll(

    "#emojiPicker .emoji-grid button"

  )

  .forEach((emojiButton) => {

    emojiButton.addEventListener(

      "click",

      async () => {

        const selectedEmoji =

          emojiButton.textContent.trim();

        currentEmoji =

          selectedEmoji;

        if (mapIdentityButton) {

          mapIdentityButton.textContent =

            selectedEmoji;

        }

        if (emojiPicker) {

          emojiPicker.hidden = true;

        }

        localStorage.setItem(

          "npp-map-emoji",

          selectedEmoji

        );

        updateTravellerIdentityMarker();

        updateTravellerCardPreview();

        const user =

          await getSignedInUser();

        if (!user) {

          return;

        }

        const { error } =

          await supabase

            .from("profiles")

            .update({

              map_emoji:

                selectedEmoji

            })

            .eq("id", user.id);

        if (error) {

          console.error(

            "Could not save map emoji:",

            error

          );

        }

      }

    );

  });

  async function loadTravellerGreeting(user) {

  const greetingElement =

    document.querySelector("#travellerGreeting");

  const nameElement =

    document.querySelector("#travellerName");

  if (!greetingElement || !nameElement) {

    return;

  }

  const hour = new Date().getHours();

  let greeting = "Good evening";

  if (hour < 12) {

    greeting = "Good morning";

  } else if (hour < 18) {

    greeting = "Good afternoon";

  }

  const { data: profile, error } = await supabase

    .from("profiles")

    .select("first_name")

    .eq("id", user.id)

    .maybeSingle();

  if (error) {

    console.error("Could not load traveller name:", error);

  }

  greetingElement.textContent = `${greeting},`;

  nameElement.textContent =

    `${profile?.first_name || "Traveller"}!`;

}

/* =========================================================

   STARTUP

========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  async () => {
    const user = await getSignedInUser();
if (!user) {

  return;

}

await loadTravellerGreeting(user);
updateTravellerMemberSince(user);

    initMapFilters();

    initLocalWeather();

    initTravellerVisibilityToggle();

    initTravellerCardEditorToggle();

    initTravellerCardPreview();

    initTravellerCardForm();

    loadMapEmoji();

    loadTravellerVisibility();

    loadTravellerCardEditor();

    if (window.google?.maps) {

      initTravellerMap();

    }

  }

);