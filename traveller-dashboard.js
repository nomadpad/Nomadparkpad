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

    mapTypeControl: true,

    streetViewControl: true,

    fullscreenControl: true,
    mapTypeControlOptions: {

  position: google.maps.ControlPosition.TOP_CENTER

},

  });

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

window.initTravellerMap = initTravellerMap;
document.addEventListener("DOMContentLoaded", () => {

  initMapFilters();

  if (window.google?.maps) {

    initTravellerMap();

  }

});