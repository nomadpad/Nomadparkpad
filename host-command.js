const mobileMenuButton =

  document.getElementById("mobileMenuButton");

const commandSidebar =

  document.getElementById("commandSidebar");

const sidebarClose =

  document.getElementById("sidebarClose");

const sidebarBackdrop =

  document.getElementById("sidebarBackdrop");

const radarTabs =

  Array.from(

    document.querySelectorAll(".radar-tab")

  );

const radarDistance =

  document.getElementById("radarDistance");

const radarMap =

  document.getElementById("radarMap");

const demandBubbles =

  Array.from(

    document.querySelectorAll(".demand-bubble")

  );

const pauseListingButton =

  document.querySelector(

    ".quick-actions-card button"

  );

let currentRadarView =

  "area";

function openSidebar() {

  commandSidebar?.classList.add("open");

  sidebarBackdrop.hidden =

    false;

  mobileMenuButton?.setAttribute(

    "aria-expanded",

    "true"

  );

  document.body.style.overflow =

    "hidden";

}

function closeSidebar() {

  commandSidebar?.classList.remove("open");

  sidebarBackdrop.hidden =

    true;

  mobileMenuButton?.setAttribute(

    "aria-expanded",

    "false"

  );

  document.body.style.overflow =

    "";

}

mobileMenuButton?.addEventListener(

  "click",

  openSidebar

);

sidebarClose?.addEventListener(

  "click",

  closeSidebar

);

sidebarBackdrop?.addEventListener(

  "click",

  closeSidebar

);

document.addEventListener(

  "keydown",

  (event) => {

    if (event.key === "Escape") {

      closeSidebar();

    }

  }

);

document

  .querySelectorAll(".sidebar-link")

  .forEach((link) => {

    link.addEventListener(

      "click",

      () => {

        if (window.innerWidth <= 820) {

          closeSidebar();

        }

      }

    );

  });

function setRadarView(view) {

  currentRadarView =

    view;

  radarTabs.forEach((tab) => {

    tab.classList.toggle(

      "active",

      tab.dataset.radarView === view

    );

  });

  radarMap?.setAttribute(

    "data-radar-view",

    view

  );

  demandBubbles.forEach(

    (bubble, index) => {

      let visible =

        true;

      if (view === "demand") {

        visible =

          index < 3;

      }

      if (view === "arrivals") {

        visible =

          index === 1;

      }

      bubble.hidden =

        !visible;

    }

  );

}

radarTabs.forEach((tab) => {

  tab.addEventListener(

    "click",

    () => {

      setRadarView(

        tab.dataset.radarView

      );

    }

  );

});

radarDistance?.addEventListener(

  "change",

  () => {

    const distance =

      Number(radarDistance.value);

    radarMap?.style.setProperty(

      "--radar-distance",

      distance

    );

    demandBubbles.forEach(

      (bubble) => {

        bubble.animate(

          [

            {

              transform: "scale(0.96)",

              opacity: 0.72

            },

            {

              transform: "scale(1)",

              opacity: 1

            }

          ],

          {

            duration: 220,

            easing: "ease-out"

          }

        );

      }

    );

  }

);

demandBubbles.forEach((bubble) => {

  bubble.addEventListener(

    "click",

    () => {

      const message =

        bubble.getAttribute("aria-label");

      window.alert(

        `${message}\n\nTraveller activity is anonymous until a booking is confirmed.`

      );

    }

  );

});

pauseListingButton?.addEventListener(

  "click",

  () => {

    const confirmed =

      window.confirm(

        "Pause your listing?\n\nTravellers will no longer be able to book it until you make it live again."

      );

    if (!confirmed) {

      return;

    }

    pauseListingButton.innerHTML = `

      <span>▶️</span>

      Resume Listing

      <strong>›</strong>

    `;

  }

);

function updateGreeting() {

  const heading =

    document.querySelector(

      ".welcome-row h1"

    );

  if (!heading) {

    return;

  }

  const hour =

    new Date().getHours();

  let greeting =

    "Good evening";

  if (hour < 12) {

    greeting =

      "Good morning";

  } else if (hour < 18) {

    greeting =

      "Good afternoon";

  }

  heading.textContent =

    `${greeting}, Daniel! 🌲`;

}

function restorePublishedPrice() {

  const savedPrice =

    sessionStorage.getItem(

      "nomadNightlyPrice"

    );

  if (!savedPrice) {

    return;

  }

  const nightlyRate =

    document.querySelector(

      ".pad-metrics div:first-child strong"

    );

  if (nightlyRate) {

    nightlyRate.textContent =

      `$${savedPrice}`;

  }

}

function markPublishedListing() {

  const published =

    sessionStorage.getItem(

      "nomadListingPublished"

    );

  if (published !== "true") {

    return;

  }

  const liveBadge =

    document.querySelector(

      ".live-badge"

    );

  if (liveBadge) {

    liveBadge.textContent =

      "Live";

  }

}

window.addEventListener(

  "resize",

  () => {

    if (window.innerWidth > 820) {

      closeSidebar();

    }

  }

);

updateGreeting();

restorePublishedPrice();

markPublishedListing();

setRadarView(currentRadarView);