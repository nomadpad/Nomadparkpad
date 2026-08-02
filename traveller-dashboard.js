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

function initMapFilters() {

  const buttons = document.querySelectorAll(".map-filter-button");

  const filterSection = document.querySelector(".dashboard-map-filters");

  if (!buttons.length || !filterSection) {

    return;

  }

  let countDisplay = document.querySelector(".map-filter-count");

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

    const filter = button.dataset.filter || "pads";

    const count = FILTER_COUNTS[filter] ?? 0;

    const label = FILTER_LABELS[filter] || "locations nearby";

    countDisplay.textContent = `${count} ${label}`;

  }

  buttons.forEach((button) => {

    button.setAttribute(

      "aria-pressed",

      button.classList.contains("is-active") ? "true" : "false"

    );

    button.addEventListener("click", () => {

      activateFilter(button);

    });

  });

  const activeButton =

    document.querySelector(".map-filter-button.is-active") || buttons[0];

  activateFilter(activeButton);

}
let travellerMapInstance = null;

let dashboardListingMarkers = [];
function initTravellerMap() {

  const mapElement = document.getElementById("travellerMap");

  if (!mapElement || !window.google?.maps) {

    return;

  }

  const fallbackLocation = {

    lat: 53.5461,

    lng: -113.4938

  };

  const map = new google.maps.Map(mapElement, {

    center: fallbackLocation,

    zoom: 10,

    disableDefaultUI: false,

    mapTypeControl: false,

    streetViewControl: true,

    fullscreenControl: true

  });
  travellerMapInstance = map;

loadDashboardListings();
const satelliteButton = document.querySelector(

  '.map-type-button[data-map-type="satellite"]'

);

if (satelliteButton) {

  satelliteButton.addEventListener("click", () => {

    const isSatellite =

      map.getMapTypeId() === google.maps.MapTypeId.SATELLITE;

    map.setMapTypeId(

      isSatellite

        ? google.maps.MapTypeId.ROADMAP

        : google.maps.MapTypeId.SATELLITE

    );

    satelliteButton.classList.toggle("is-active", !isSatellite);

    const label = satelliteButton.querySelector("span");

    if (label) {

      label.textContent = isSatellite ? "Satellite" : "Map";

    }

  });

}
  if (!navigator.geolocation) {

    return;

  }

  navigator.geolocation.getCurrentPosition(

    (position) => {

      const travellerLocation = {

        lat: position.coords.latitude,

        lng: position.coords.longitude

      };

      map.setCenter(travellerLocation);

      map.setZoom(11);

    },

    () => {

      console.warn("Traveller location could not be loaded.");

    }

  );

}
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

function getWeatherSummary(temperature, wind, rain, condition) {

  if (rain >= 60) {

    return `${condition}. Keep the rain gear close.`;

  }

  if (wind >= 35) {

    return `${condition}. Strong winds may affect outdoor plans.`;

  }

  if (temperature >= 25) {

    return `${condition}. A warm day for exploring nearby.`;

  }

  if (temperature <= 5) {

    return `${condition}. Bundle up before heading out.`;

  }

  return `${condition}. Comfortable conditions for the road.`;

}

async function loadLocalWeather(latitude, longitude) {

  const loading = document.getElementById("weatherLoading");

  const content = document.getElementById("weatherContent");

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

    const response = await fetch(url);

    if (!response.ok) {

      throw new Error(`Weather request failed: ${response.status}`);

    }

    const data = await response.json();

    const current = data.current;

    if (!current) {

      throw new Error("Current weather was unavailable.");

    }

    const currentHour = current.time?.slice(0, 13);

    const hourlyIndex = data.hourly?.time?.findIndex((time) =>

      time.startsWith(currentHour)

    );

    const rainChance =

      hourlyIndex >= 0

        ? data.hourly.precipitation_probability[hourlyIndex] ?? 0

        : 0;

    const temperature = Math.round(current.temperature_2m);

    const feelsLike = Math.round(current.apparent_temperature);

    const wind = Math.round(current.wind_speed_10m);

    const weatherCode = current.weather_code;

    const [icon, condition] =

      WEATHER_CODES[weatherCode] || ["🌤️", "Current conditions"];

    document.getElementById("weatherIcon").textContent = icon;

    document.getElementById("weatherTemperature").textContent =

      `${temperature}°C`;

    document.getElementById("weatherCondition").textContent = condition;

    document.getElementById("weatherFeelsLike").textContent =

      `${feelsLike}°C`;

    document.getElementById("weatherWind").textContent = `${wind} km/h`;

    document.getElementById("weatherRain").textContent = `${rainChance}%`;

    document.getElementById("weatherSummary").textContent =

      getWeatherSummary(temperature, wind, rainChance, condition);

    loading.remove();

content.hidden = false;

  } catch (error) {

    console.error(error);

    loading.textContent =

      "Local weather could not be loaded. Tap refresh to try again.";

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
async function loadDashboardListings() {

  if (!window.supabase || !travellerMapInstance) {

    console.warn("Supabase or dashboard map is not ready.");

    return;

  }

  const { data, error } = await supabase

    .from("listings")

    .select(

      "id, title, city, province, nightly_price, latitude, longitude, status"

    )

    .eq("status", "published")

    .not("latitude", "is", null)

    .not("longitude", "is", null);

  if (error) {

    console.error("Could not load dashboard listings:", error);

    return;

  }

  dashboardListingMarkers.forEach((marker) => {

    marker.setMap(null);

  });

  dashboardListingMarkers = [];

  (data || []).forEach((listing) => {

    const latitude = Number(listing.latitude);

    const longitude = Number(listing.longitude);

    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {

      return;

    }

    const marker = new google.maps.Marker({

      map: travellerMapInstance,

      position: {

        lat: latitude,

        lng: longitude

      },

      title: listing.title || "Nomad Park Pad"

    });

    dashboardListingMarkers.push(marker);

  });

  updateDashboardListingCount();

}

function updateDashboardListingCount() {

  const countDisplay = document.querySelector(".map-filter-count");

  if (!countDisplay) {

    return;

  }

  const count = dashboardListingMarkers.length;

  const word = count === 1 ? "location" : "locations";

  countDisplay.textContent = `${count} ${word} nearby`;

}
window.initTravellerMap = initTravellerMap;
document.addEventListener("DOMContentLoaded", () => {

  initMapFilters();

  initLocalWeather();

  if (window.google?.maps) {

    initTravellerMap();

  }

});
const mapIdentityButton = document.getElementById("mapIdentityButton");

const emojiPicker = document.getElementById("emojiPicker");

mapIdentityButton?.addEventListener("click", () => {

  emojiPicker.hidden = !emojiPicker.hidden;

});

document.querySelectorAll("#emojiPicker .emoji-grid button").forEach(button => {

  button.addEventListener("click", () => {

    mapIdentityButton.textContent = button.textContent;

    emojiPicker.hidden = true;

    // Temporary local save

    localStorage.setItem("npp-map-emoji", button.textContent);

  });

});

const savedEmoji = localStorage.getItem("npp-map-emoji");

if (savedEmoji) {

  mapIdentityButton.textContent = savedEmoji;

}