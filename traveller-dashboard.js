/* =========================================================

   TRAVELLER COMMAND CENTRE

========================================================= */

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

let dashboardListingMarkers = [];

let currentEmoji = "😎";

let currentTravellerLocation = null;

/* =========================================================

   ELEMENTS

========================================================= */

const mapIdentityButton =

  document.getElementById("mapIdentityButton");

const emojiPicker =

  document.getElementById("emojiPicker");

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

    countDisplay =

      document.createElement("p");

    countDisplay.className =

      "map-filter-count";

    filterSection.appendChild(

      countDisplay

    );

  }

  function activateFilter(button) {

    buttons.forEach((item) => {

      item.classList.remove("is-active");

      item.setAttribute(

        "aria-pressed",

        "false"

      );

    });

    button.classList.add("is-active");

    button.setAttribute(

      "aria-pressed",

      "true"

    );

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

    button.addEventListener(

      "click",

      () => {

        activateFilter(button);

      }

    );

  });

  const activeButton =

    document.querySelector(

      ".map-filter-button.is-active"

    ) || buttons[0];

  activateFilter(activeButton);

}

/* =========================================================

   EMOJI MAP MARKER

========================================================= */

function createEmojiMarkerIcon(

  emoji,

  size = 52

) {

  const safeEmoji =

    emoji || "😎";

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

        stroke="#f36b16"

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

    </svg>

  `;

  return {

    url:

      `data:image/svg+xml;charset=UTF-8,` +

      encodeURIComponent(svg),

    scaledSize:

      new google.maps.Size(

        size,

        size

      ),

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

        icon:

          createEmojiMarkerIcon(

            currentEmoji,

            54

          ),

        title: "You",

        zIndex: 999

      });

    return;

  }

  travellerIdentityMarker.setPosition(

    position

  );

  travellerIdentityMarker.setIcon(

    createEmojiMarkerIcon(

      currentEmoji,

      54

    )

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

  const map =

    new google.maps.Map(

      mapElement,

      {

        center: fallbackLocation,

        zoom: 10,

        disableDefaultUI: false,

        mapTypeControl: false,

        streetViewControl: true,

        fullscreenControl: true

      }

    );

  travellerMapInstance = map;

  /*

    Show the traveller at the fallback

    location immediately. Geolocation

    will move the marker when available.

  */

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

          map.getMapTypeId() ===

          google.maps.MapTypeId.SATELLITE;

        map.setMapTypeId(

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

    return;

  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const travellerLocation = {

        lat:

          position.coords.latitude,

        lng:

          position.coords.longitude

      };

      currentTravellerLocation =

        travellerLocation;

      map.setCenter(

        travellerLocation

      );

      map.setZoom(11);

      updateTravellerIdentityMarker(

        travellerLocation

      );

    },

    () => {

      console.warn(

        "Traveller location could not be loaded."

      );

      updateTravellerIdentityMarker(

        fallbackLocation

      );

    },

    {

      enableHighAccuracy: false,

      timeout: 8000,

      maximumAge: 600000

    }

  );

}

/*

  Google Maps can call this global function

  after its script finishes loading.

*/

window.initTravellerMap =

  initTravellerMap;

/* =========================================================

   PUBLISHED PAD MARKERS

========================================================= */

async function loadDashboardListings() {

  if (

    !window.supabase ||

    !travellerMapInstance

  ) {

    console.warn(

      "Supabase or dashboard map is not ready."

    );

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

          map:

            travellerMapInstance,

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

    const [

      icon,

      condition

    ] =

      WEATHER_CODES[

        weatherCode

      ] || [

        "🌤️",

        "Current conditions"

      ];

    const weatherIcon =

      document.getElementById(

        "weatherIcon"

      );

    const weatherTemperature =

      document.getElementById(

        "weatherTemperature"

      );

    const weatherCondition =

      document.getElementById(

        "weatherCondition"

      );

    const weatherFeelsLike =

      document.getElementById(

        "weatherFeelsLike"

      );

    const weatherWind =

      document.getElementById(

        "weatherWind"

      );

    const weatherRain =

      document.getElementById(

        "weatherRain"

      );

    const weatherSummary =

      document.getElementById(

        "weatherSummary"

      );

    if (weatherIcon) {

      weatherIcon.textContent =

        icon;

    }

    if (weatherTemperature) {

      weatherTemperature.textContent =

        `${temperature}°C`;

    }

    if (weatherCondition) {

      weatherCondition.textContent =

        condition;

    }

    if (weatherFeelsLike) {

      weatherFeelsLike.textContent =

        `${feelsLike}°C`;

    }

    if (weatherWind) {

      weatherWind.textContent =

        `${wind} km/h`;

    }

    if (weatherRain) {

      weatherRain.textContent =

        `${rainChance}%`;

    }

    if (weatherSummary) {

      weatherSummary.textContent =

        getWeatherSummary(

          temperature,

          wind,

          rainChance,

          condition

        );

    }

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

   LOAD SAVED MAP EMOJI

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

  }

  if (!window.supabase) {

    console.warn(

      "Supabase is not ready for emoji loading."

    );

    return;

  }

  const {

    data: { user },

    error: userError

  } =

    await supabase.auth.getUser();

  if (userError || !user) {

    console.error(

      "Could not load signed-in user:",

      userError

    );

    return;

  }

  const {

    data: profile,

    error: profileError

  } =

    await supabase

      .from("profiles")

      .select("map_emoji")

      .eq("id", user.id)

      .maybeSingle();

  if (profileError) {

    console.error(

      "Could not load map emoji:",

      profileError

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

        /*

          Update the map immediately.

          No refresh and no Save button.

        */

        updateTravellerIdentityMarker();

        if (!window.supabase) {

          console.warn(

            "Emoji changed locally, but Supabase is not ready."

          );

          return;

        }

        const {

          data: { user },

          error: userError

        } =

          await supabase.auth.getUser();

        if (userError || !user) {

          console.error(

            "Could not save emoji without a signed-in user:",

            userError

          );

          return;

        }

        const {

          error: updateError

        } =

          await supabase

            .from("profiles")

            .update({

              map_emoji:

                selectedEmoji

            })

            .eq(

              "id",

              user.id

            );

        if (updateError) {

          console.error(

            "Could not save map emoji:",

            updateError

          );

        }

      }

    );

  });

/* =========================================================

   DASHBOARD STARTUP

========================================================= */

document.addEventListener(

  "DOMContentLoaded",

  () => {

    initMapFilters();

    initLocalWeather();

    loadMapEmoji();

    if (window.google?.maps) {

      initTravellerMap();

    }

  }

);