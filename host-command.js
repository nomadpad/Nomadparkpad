import { supabase } from "./supabase-client.js";

/* ==========================================

   ELEMENTS

========================================== */

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

/* STRIPE ELEMENTS */

const payoutBadge =

  document.getElementById("commandPayoutBadge");

const payoutIcon =

  document.getElementById("commandPayoutIcon");

const payoutTitle =

  document.getElementById("commandPayoutTitle");

const payoutMessage =

  document.getElementById("commandPayoutMessage");

const payoutSetupButton =

  document.getElementById("commandPayoutSetup");

const payoutManageButton =

  document.getElementById("commandPayoutManage");

/* ==========================================

   STATE

========================================== */

let currentRadarView =

  "area";

let currentUser =

  null;

let hostListings =

  [];

let hostRequests =

  [];

/* ==========================================

   HELPERS

========================================== */

function safeText(element, value) {

  if (!element) {

    return;

  }

  element.textContent =

    value;

}

function formatMoney(value) {

  const amount =

    Number(value || 0);

  return new Intl.NumberFormat(

    "en-CA",

    {

      style: "currency",

      currency: "CAD",

      maximumFractionDigits: 0

    }

  ).format(amount);

}

function formatDate(value) {

  if (!value) {

    return "Date unavailable";

  }

  return new Intl.DateTimeFormat(

    "en-CA",

    {

      month: "short",

      day: "numeric",

      year: "numeric"

    }

  ).format(

    new Date(value)

  );

}

function hostDisplayName(user) {

  return (

    user?.user_metadata?.first_name ||

    user?.user_metadata?.full_name ||

    user?.email?.split("@")[0] ||

    "Host"

  );

}

/* ==========================================

   MOBILE SIDEBAR

========================================== */

function openSidebar() {

  commandSidebar?.classList.add("open");

  if (sidebarBackdrop) {

    sidebarBackdrop.hidden =

      false;

  }

  mobileMenuButton?.setAttribute(

    "aria-expanded",

    "true"

  );

  document.body.style.overflow =

    "hidden";

}

function closeSidebar() {

  commandSidebar?.classList.remove("open");

  if (sidebarBackdrop) {

    sidebarBackdrop.hidden =

      true;

  }

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

window.addEventListener(

  "resize",

  () => {

    if (window.innerWidth > 820) {

      closeSidebar();

    }

  }

);

/* ==========================================

   HOST RADAR

========================================== */

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

    radarMap?.setAttribute(

      "data-distance",

      String(distance)

    );

    demandBubbles.forEach(

      (bubble) => {

        bubble.animate(

          [

            {

              transform: "scale(0.96)",

              opacity: 0.7

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

/* ==========================================

   GREETING AND PROFILE

========================================== */

function updateHostIdentity(user) {

  const name =

    hostDisplayName(user);

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

  const welcomeHeading =

  document.getElementById(

    "hostGreetingHeading"

  );

  safeText(

    welcomeHeading,

    `${greeting}, ${name}! 🌲`

  );

  const profileName =

    document.querySelector(

      ".host-profile-chip strong"

    );

  safeText(

    profileName,

    name

  );

  const avatar =

    document.querySelector(

      ".host-avatar"

    );

  safeText(

    avatar,

    name.charAt(0).toUpperCase()

  );

}

/* ==========================================

   DASHBOARD COUNTS

========================================== */

function updateSummaryCounts() {

  const pendingRequests =

    hostRequests.filter(

      (request) =>

        request.status === "pending"

    );

  const acceptedRequests =

    hostRequests.filter(

      (request) =>

        request.status === "accepted"

    );

  const publishedListings =

    hostListings.filter(

      (listing) =>

        listing.status === "published" ||

        listing.status === "live"

    );

  const summaryCards =

    document.querySelectorAll(

      ".summary-card"

    );

  const pendingNumber =

    summaryCards[0]?.querySelector(

      ".summary-number"

    );

  safeText(

    pendingNumber,

    String(pendingRequests.length)

  );

  const publishedNumber =

    summaryCards[3]?.querySelector(

      ".summary-number"

    );

  safeText(

    publishedNumber,

    String(publishedListings.length)

  );

  const navigationCounts =

    document.querySelectorAll(

      ".nav-count"

    );

  safeText(

    navigationCounts[0],

    String(pendingRequests.length)

  );

  const requestCount =

    document.querySelector(

      ".request-count"

    );

  safeText(

    requestCount,

    String(pendingRequests.length)

  );

  updateUpcomingStay(

    acceptedRequests

  );

  renderRequestPreviews(

    pendingRequests

  );

}

function updateUpcomingStay(acceptedRequests) {

  const futureAccepted =

    acceptedRequests

      .filter(

        (request) =>

          request.arrival &&

          new Date(request.arrival) >= new Date()

      )

      .sort(

        (a, b) =>

          new Date(a.arrival) -

          new Date(b.arrival)

      );

  const nextArrival =

    futureAccepted[0];

  if (!nextArrival) {

    return;

  }

  const cards =

    document.querySelectorAll(

      ".summary-card"

    );

  const arrivalCard =

    cards[1];

  safeText(

    arrivalCard?.querySelector(

      ".summary-date"

    ),

    formatDate(

      nextArrival.arrival

    ).replace(

      `, ${new Date(nextArrival.arrival).getFullYear()}`,

      ""

    )

  );

  safeText(

    arrivalCard?.querySelector("h2"),

    "Confirmed stay"

  );

  safeText(

    arrivalCard?.querySelector(

      "p:not(.summary-eyebrow)"

    ),

    nextArrival.vehicle_type ||

      "Traveller"

  );

}

/* ==========================================

   LISTING CARD

========================================== */

function updatePrimaryListing() {

  const listing =

    hostListings[0];

  if (!listing) {

    showNoListingState();

    return;

  }

  const title =

    document.querySelector(

      ".pad-information h3"

    );

  safeText(

    title,

    listing.title ||

      "Your Nomad Park Pad"

  );

  const location =

    document.querySelector(

      ".pad-location"

    );

  const locationText =

    [

      listing.city,

      listing.province

    ]

      .filter(Boolean)

      .join(", ");

  safeText(

    location,

    locationText

      ? `📍 ${locationText}`

      : "📍 Location added"

  );

  const nightlyRate =

    document.querySelector(

      ".pad-metrics div:first-child strong"

    );

  safeText(

    nightlyRate,

    formatMoney(

      listing.nightly_price

    )

  );

  const liveBadge =

    document.querySelector(

      ".live-badge"

    );

  const isPublished =

    listing.status === "published" ||

    listing.status === "live";

  safeText(

    liveBadge,

    isPublished

      ? "Live"

      : listing.status || "Draft"

  );

  liveBadge?.classList.toggle(

    "draft",

    !isPublished

  );

  const editLink =

    document.querySelector(

      ".pad-actions a:first-child"

    );

  if (editLink && listing.id) {

    editLink.href =

      `edit-listing.html?id=${encodeURIComponent(listing.id)}`;

  }

  const calendarLink =

    document.querySelector(

      ".pad-actions a:nth-child(2)"

    );

  if (calendarLink && listing.id) {

    calendarLink.href =

      `host-availability.html?listing=${encodeURIComponent(listing.id)}`;

  }

}

function showNoListingState() {

  const padCard =

    document.querySelector(

      ".pad-card"

    );

  if (!padCard) {

    return;

  }

  padCard.innerHTML = `

    <div class="pad-image">

      <div class="pad-image-placeholder">

        🏡

      </div>

    </div>

    <div class="pad-information">

      <p class="pad-location">

        No published pad yet

      </p>

      <h3>

        Create your first Nomad Park Pad

      </h3>

      <p>

        Complete the host setup to publish your first listing.

      </p>

    </div>

    <div class="pad-actions">

      <a href="host-onboarding.html">

        Create Pad

      </a>

    </div>

  `;

}

/* ==========================================

   REQUEST PREVIEWS

========================================== */

function renderRequestPreviews(requests) {

  const requestSection =

    document.getElementById(

      "bookingRequests"

    );

  if (!requestSection) {

    return;

  }

  requestSection

    .querySelectorAll(

      ".request-preview"

    )

    .forEach(

      (element) =>

        element.remove()

    );

  const actionButton =

    requestSection.querySelector(

      ".full-width-side-button"

    );

  const previewRequests =

    requests.slice(0, 2);

  previewRequests

    .reverse()

    .forEach((request) => {

      const preview =

        document.createElement(

          "article"

        );

      preview.className =

        "request-preview";

      const travellerName =

        request.traveler_name ||

        request.travellers ||

        "Traveller";

      const initial =

        String(travellerName)

          .charAt(0)

          .toUpperCase();

      const dateRange =

        request.arrival && request.departure

          ? `${formatDate(request.arrival)} – ${formatDate(request.departure)}`

          : "Dates requested";

      const needs =

        [

          request.vehicle_type,

          request.pets

            ? "Pets"

            : ""

        ]

          .filter(Boolean)

          .join(" · ");

      preview.innerHTML = `

        <div class="request-avatar">

          ${initial}

        </div>

        <div>

          <strong>

            ${travellerName}

          </strong>

          <span>

            ${dateRange}

          </span>

          <small>

            ${needs || "Booking request"}

          </small>

        </div>

      `;

      requestSection.insertBefore(

        preview,

        actionButton

      );

    });

  if (previewRequests.length === 0) {

    const emptyPreview =

      document.createElement(

        "article"

      );

    emptyPreview.className =

      "request-preview";

    emptyPreview.innerHTML = `

      <div class="request-avatar">

        ✓

      </div>

      <div>

        <strong>

          No pending requests

        </strong>

        <span>

          You are all caught up.

        </span>

        <small>

          New requests will appear here.

        </small>

      </div>

    `;

    requestSection.insertBefore(

      emptyPreview,

      actionButton

    );

  }

}

/* ==========================================

   LOAD SUPABASE DATA

========================================== */

async function getCurrentUser() {

  const {

    data: { user },

    error

  } =

    await supabase.auth.getUser();

  if (error) {

    throw error;

  }

  return user;

}

async function loadHostDashboard() {

  try {

    currentUser =
  await getCurrentUser();

if (!currentUser) {
  return;
}

const {
  data: hostProfile,
  error: hostProfileError
} =
  await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", currentUser.id)
    .maybeSingle();

if (hostProfileError) {
  console.warn(
    "Could not load host profile name:",
    hostProfileError
  );
}

if (hostProfile?.first_name) {
  currentUser.user_metadata = {
    ...(currentUser.user_metadata || {}),
    first_name: hostProfile.first_name
  };
}

updateHostIdentity(
  currentUser
);

    const [

      listingsResult,

      requestsResult

    ] =

      await Promise.all([

        supabase

          .from("listings")

          .select(

            "id,title,city,province,nightly_price,status,created_at"

          )

          .eq(

            "host_id",

            currentUser.id

          )

          .order(

            "created_at",

            {

              ascending: false

            }

          ),

        supabase
  .from("booking_requests")
  .select(
    "id,arrival,departure,travellers,vehicle_type,vehicle_length,pets,message,status,created_at,listings!inner(host_id)"
  )
  .eq(
    "listings.host_id",
    currentUser.id
  )

          .order(

            "created_at",

            {

              ascending: false

            }

          )

      ]);

    if (listingsResult.error) {

      throw listingsResult.error;

    }

    if (requestsResult.error) {

      throw requestsResult.error;

    }

    hostListings =

      listingsResult.data || [];

    hostRequests =

      requestsResult.data || [];

    updateSummaryCounts();

    updatePrimaryListing();

  } catch (error) {

   console.error(
  "Host command data error:",
  JSON.stringify({
    code: error?.code,
    message: error?.message,
    details: error?.details,
    hint: error?.hint
  })
);

    const welcomeText =

      document.querySelector(

        ".welcome-row p:not(.command-kicker)"

      );

    if (welcomeText) {
  welcomeText.hidden = false;
}

safeText(
  welcomeText,
  "We could not load all live host information. Please refresh and try again."
);

  }

}

/* ==========================================

   STRIPE PAYOUT STATUS

========================================== */

function setPayoutStatus({

  badgeText,

  badgeClass,

  icon,

  title,

  message,

  showSetup = false,

  showManage = false

}) {

  if (payoutBadge) {

    payoutBadge.className =

      `payout-status-badge ${badgeClass}`;

    payoutBadge.textContent =

      badgeText;

  }

  safeText(

    payoutIcon,

    icon

  );

  safeText(

    payoutTitle,

    title

  );

  safeText(

    payoutMessage,

    message

  );

  if (payoutSetupButton) {

    payoutSetupButton.hidden =

      !showSetup;

  }

  if (payoutManageButton) {

    payoutManageButton.hidden =

      !showManage;

  }

}

async function loadStripeStatus() {

  try {

    const {

      data: { session },

      error: sessionError

    } =

      await supabase.auth.getSession();

    if (sessionError || !session) {

      setPayoutStatus({

        badgeText: "Login required",

        badgeClass: "restricted",

        icon: "🔐",

        title: "Login required",

        message:

          "Please log in again to view your payout account."

      });

      return;

    }

    const {

      data,

      error

    } =

      await supabase.functions.invoke(

        "get-stripe-account-status"

      );

    if (error) {

      throw error;

    }

    if (!data?.connected) {

      setPayoutStatus({

        badgeText: "Setup needed",

        badgeClass: "action-required",

        icon: "🏦",

        title: "Connect Stripe",

        message:

          "Complete payout setup before accepting paid bookings.",

        showSetup: true

      });

      return;

    }

    if (

      data.payouts_enabled &&

      data.details_submitted

    ) {

      setPayoutStatus({

        badgeText: "Ready",

        badgeClass: "ready",

        icon: "✅",

        title: "Payouts ready",

        message:

          "Your Stripe account is connected and ready to receive host earnings.",

        showManage: true

      });

      return;

    }

    if (data.disabled_reason) {

      setPayoutStatus({

        badgeText: "Restricted",

        badgeClass: "restricted",

        icon: "⚠️",

        title: "Action required",

        message:

          "Stripe requires additional information before payouts can begin.",

        showManage: true

      });

      return;

    }

    setPayoutStatus({

      badgeText: "Incomplete",

      badgeClass: "action-required",

      icon: "📝",

      title: "Finish payout setup",

      message:

        "Complete Stripe onboarding to activate host payouts.",

      showSetup: true

    });

  } catch (error) {

    console.error(

      "Stripe status error:",

      error

    );

    setPayoutStatus({

      badgeText: "Unavailable",

      badgeClass: "restricted",

      icon: "⚠️",

      title: "Could not check payouts",

      message:

        error?.message ||

        "Refresh the page and try again."

    });

  }

}

payoutSetupButton?.addEventListener(

  "click",

  async () => {

    const originalText =

      payoutSetupButton.textContent;

    try {

      payoutSetupButton.disabled =

        true;

      payoutSetupButton.textContent =

        "Opening Stripe...";

      const {

        data,

        error

      } =

        await supabase.functions.invoke(

          "create-stripe-onboarding-link"

        );

      if (error) {

        throw error;

      }

      if (!data?.url) {

        throw new Error(

          "Stripe onboarding link was not returned."

        );

      }

      window.location.href =

        data.url;

    } catch (error) {

      console.error(

        "Stripe onboarding error:",

        error

      );

      payoutSetupButton.disabled =

        false;

      payoutSetupButton.textContent =

        originalText ||

        "Set Up Payouts";

      window.alert(

        error?.message ||

        "Could not open Stripe setup."

      );

    }

  }

);

payoutManageButton?.addEventListener(

  "click",

  async () => {

    const originalText =

      payoutManageButton.textContent;

    try {

      payoutManageButton.disabled =

        true;

      payoutManageButton.textContent =

        "Opening Stripe...";

      const {

        data,

        error

      } =

        await supabase.functions.invoke(

          "create-stripe-login-link"

        );

      if (error) {

        throw error;

      }

      if (!data?.url) {

        throw new Error(

          "Stripe management link was not returned."

        );

      }

      window.location.href =

        data.url;

    } catch (error) {

      console.error(

        "Stripe management error:",

        error

      );

      payoutManageButton.disabled =

        false;

      payoutManageButton.textContent =

        originalText ||

        "Manage Payout Account";

      window.alert(

        error?.message ||

        "Could not open Stripe payout management."

      );

    }

  }

);

/* ==========================================

   PAUSE LISTING DEMO CONTROL

========================================== */

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

/* ==========================================

   START

========================================== */

setRadarView(

  currentRadarView

);

loadHostDashboard();

/*

  Show a useful default immediately.

  Stripe can update this afterward if it responds.

*/

setPayoutStatus({

  badgeText: "Setup needed",

  badgeClass: "action-required",

  icon: "🏦",

  title: "Connect Stripe",

  message:

    "Complete payout setup before accepting paid bookings.",

  showSetup: true,

  showManage: false

});

/*

  Check the real Stripe status in the background.

*/

loadStripeStatus();