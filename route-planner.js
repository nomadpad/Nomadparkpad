const routePlanner = document.querySelector("#route-planner");

const routeClose = document.querySelector("#route-close");

const routeSearch = document.querySelector("#route-search");

const routeMessage = document.querySelector("#route-message");

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

routeSearch?.addEventListener("click", () => {

  if (routeMessage) {

    routeMessage.textContent =

      "Route search is ready for the Google routing connection.";

    routeMessage.hidden = false;

  }

  const map = document.querySelector("#traveller-map");

  setTimeout(() => {

    map?.scrollIntoView({

      behavior: "smooth",

      block: "start"

    });

  }, 300);

});

if (window.location.hash === "#route-planner") {

  openRoutePlanner();

}

window.addEventListener("hashchange", () => {

  if (window.location.hash === "#route-planner") {

    openRoutePlanner();

  }

});