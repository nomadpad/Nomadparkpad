import { supabase } from "./supabase-client.js";

/* =========================================================

   PRIVATE ADMIN COMMAND CENTRE

========================================================= */

document.body.style.visibility = "hidden";

const adminSidebar =

  document.querySelector("#adminSidebar");

const adminBackdrop =

  document.querySelector("#adminBackdrop");

const adminMenuButton =

  document.querySelector("#adminMenuButton");

const refreshAdminButton =

  document.querySelector("#refreshAdminData");

const adminName =

  document.querySelector("#adminName");

const platformStatus =

  document.querySelector("#platformStatus");

const activityFeed =

  document.querySelector("#adminActivityFeed");

const newestMembersTable =

  document.querySelector("#newestMembersTable");

/* =========================================================

   HELPERS

========================================================= */

function setText(selector, value) {

  const element =

    document.querySelector(selector);

  if (element) {

    element.textContent =

      value ?? "0";

  }

}

function formatMoney(value) {

  const amount =

    Number(value || 0);

  return new Intl.NumberFormat(

    "en-CA",

    {

      style: "currency",

      currency: "CAD",

      maximumFractionDigits: 2

    }

  ).format(amount);

}

function formatDate(value) {

  if (!value) {

    return "Unknown";

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

function escapeHtml(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}

function startOfTodayIso() {

  const date =

    new Date();

  date.setHours(

    0,

    0,

    0,

    0

  );

  return date.toISOString();

}

function sevenDaysAgoIso() {

  const date =

    new Date();

  date.setDate(

    date.getDate() - 7

  );

  return date.toISOString();

}

/* =========================================================

   MOBILE SIDEBAR

========================================================= */

function openAdminSidebar() {

  adminSidebar?.classList.add("open");

  adminBackdrop?.removeAttribute(

    "hidden"

  );

  adminMenuButton?.setAttribute(

    "aria-expanded",

    "true"

  );

}

function closeAdminSidebar() {

  adminSidebar?.classList.remove("open");

  adminBackdrop?.setAttribute(

    "hidden",

    ""

  );

  adminMenuButton?.setAttribute(

    "aria-expanded",

    "false"

  );

}

adminMenuButton?.addEventListener(

  "click",

  () => {

    const isOpen =

      adminSidebar?.classList.contains(

        "open"

      );

    if (isOpen) {

      closeAdminSidebar();

    } else {

      openAdminSidebar();

    }

  }

);

adminBackdrop?.addEventListener(

  "click",

  closeAdminSidebar

);

document

  .querySelectorAll(".admin-nav-link")

  .forEach((link) => {

    link.addEventListener(

      "click",

      () => {

        document

          .querySelectorAll(

            ".admin-nav-link"

          )

          .forEach((item) => {

            item.classList.remove(

              "active"

            );

          });

        link.classList.add("active");

        closeAdminSidebar();

      }

    );

  });

/* =========================================================

   SECURE ADMIN CHECK

========================================================= */

async function requireAdministrator() {

  const {

    data: {

      user

    },

    error: userError

  } =

    await supabase.auth.getUser();

  if (

    userError ||

    !user

  ) {

    window.location.replace(

      "login.html"

    );

    return null;

  }

  const {

    data: profile,

    error: profileError

  } =

    await supabase

      .from("profiles")

      .select(

        "id, first_name, last_name, role, is_admin"

      )

      .eq(

        "id",

        user.id

      )

      .maybeSingle();

  if (

    profileError ||

    !profile?.is_admin

  ) {

    console.warn(

      "Admin access denied.",

      profileError

    );

    window.location.replace(

      "account.html"

    );

    return null;

  }

  if (adminName) {

    adminName.textContent =

      profile.first_name ||

      "Administrator";

  }

  document.body.style.visibility =

    "visible";

  return {

    user,

    profile

  };

}

/* =========================================================

   COUNT QUERY

========================================================= */

async function getCount(

  table,

  configureQuery

) {

  let query =

    supabase

      .from(table)

      .select(

        "*",

        {

          count: "exact",

          head: true

        }

      );

  if (

    typeof configureQuery ===

    "function"

  ) {

    query =

      configureQuery(query);

  }

  const {

    count,

    error

  } =

    await query;

  if (error) {

    console.error(

      `Could not count ${table}:`,

      error

    );

    return 0;

  }

  return count || 0;

}

/* =========================================================

   PLATFORM METRICS

========================================================= */

async function loadPlatformMetrics() {

  const today =

    startOfTodayIso();

  const weekAgo =

    sevenDaysAgoIso();

  const [

    totalMembers,

    totalListings,

    totalBookings,

    newToday,

    newThisWeek,

    publishedListings,

    draftListings,

    pendingBookings,

    acceptedBookings

  ] =

    await Promise.all([

      getCount("profiles"),

      getCount(

        "listings"

      ),

      getCount(

        "booking_requests"

      ),

      getCount(

        "profiles",

        (query) =>

          query.gte(

            "created_at",

            today

          )

      ),

      getCount(

        "profiles",

        (query) =>

          query.gte(

            "created_at",

            weekAgo

          )

      ),

      getCount(

        "listings",

        (query) =>

          query.eq(

            "status",

            "published"

          )

      ),

      getCount(

        "listings",

        (query) =>

          query.eq(

            "status",

            "draft"

          )

      ),

      getCount(

        "booking_requests",

        (query) =>

          query.eq(

            "status",

            "pending"

          )

      ),

      getCount(

        "booking_requests",

        (query) =>

          query.eq(

            "status",

            "accepted"

          )

      )

    ]);

  setText(

    "#totalMembers",

    totalMembers

  );

  setText(

    "#totalListings",

    totalListings

  );

  setText(

    "#totalBookings",

    totalBookings

  );

  setText(

    "#newToday",

    newToday

  );

  setText(

    "#newThisWeek",

    newThisWeek

  );

  setText(

    "#readyHosts",

    publishedListings

  );

  setText(

    "#publishedListingCount",

    publishedListings

  );

  setText(

    "#draftListingCount",

    draftListings

  );

  setText(

    "#flaggedListingCount",

    0

  );

  setText(

    "#pendingBookingCount",

    pendingBookings

  );

  setText(

    "#acceptedBookingCount",

    acceptedBookings

  );

  setText(

    "#refundCount",

    0

  );

  setText(

    "#travellerDemand",

    0

  );

  setText(

    "#platformRevenue",

    formatMoney(0)

  );

  setText(

    "#grossBookings",

    formatMoney(0)

  );

  setText(

    "#platformFees",

    formatMoney(0)

  );

  setText(

    "#hostPayouts",

    formatMoney(0)

  );

  setText(

    "#stripeReadyHosts",

    0

  );

}

/* =========================================================

   NEWEST MEMBERS

========================================================= */

function memberRoleLabel(role) {

  if (role === "both") {

    return "Host + Traveller";

  }

  if (role === "host") {

    return "Host";

  }

  if (role === "traveler") {

    return "Traveller";

  }

  return role || "Member";

}

async function loadNewestMembers() {

  if (!newestMembersTable) {

    return;

  }

  const {

    data,

    error

  } =

    await supabase

      .from("profiles")

      .select(

        "id, first_name, last_name, role, is_admin, created_at"

      )

      .order(

        "created_at",

        {

          ascending: false

        }

      )

      .limit(8);

  if (error) {

    console.error(

      "Could not load members:",

      error

    );

    return;

  }

  const members =

    data || [];

  newestMembersTable.innerHTML = `

    <div class="admin-table-row admin-table-head">

      <span>Member</span>

      <span>Role</span>

      <span>Joined</span>

      <span>Status</span>

    </div>

  `;

  if (!members.length) {

    newestMembersTable.insertAdjacentHTML(

      "beforeend",

      `

        <div class="admin-empty-table">

          New members will appear here.

        </div>

      `

    );

    return;

  }

  members.forEach((member) => {

    const fullName =

      [

        member.first_name,

        member.last_name

      ]

        .filter(Boolean)

        .join(" ") ||

      "New member";

    const role =

      member.is_admin

        ? "Administrator"

        : memberRoleLabel(

            member.role

          );

    newestMembersTable.insertAdjacentHTML(

      "beforeend",

      `

        <div class="admin-table-row">

          <span>

            ${escapeHtml(fullName)}

          </span>

          <span>

            ${escapeHtml(role)}

          </span>

          <span>

            ${escapeHtml(

              formatDate(

                member.created_at

              )

            )}

          </span>

          <span>

            Active

          </span>

        </div>

      `

    );

  });

}

/* =========================================================

   LIVE ACTIVITY

========================================================= */

function activityItem({

  icon,

  title,

  detail,

  createdAt

}) {

  return `

    <article class="admin-empty-state">

      <span>

        ${escapeHtml(icon)}

      </span>

      <div>

        <strong>

          ${escapeHtml(title)}

        </strong>

        <p>

          ${escapeHtml(detail)}

          ${

            createdAt

              ? ` · ${escapeHtml(

                  formatDate(createdAt)

                )}`

              : ""

          }

        </p>

      </div>

    </article>

  `;

}

async function loadActivityFeed() {

  if (!activityFeed) {

    return;

  }

  const [

    memberResult,

    listingResult,

    bookingResult

  ] =

    await Promise.all([

      supabase

        .from("profiles")

        .select(

          "first_name, last_name, role, created_at"

        )

        .order(

          "created_at",

          {

            ascending: false

          }

        )

        .limit(4),

      supabase

        .from("listings")

        .select(

          "title, city, province, status, created_at"

        )

        .order(

          "created_at",

          {

            ascending: false

          }

        )

        .limit(4),

      supabase

        .from("booking_requests")

        .select(

          "travellers, status, arrival, departure, created_at"

        )

        .order(

          "created_at",

          {

            ascending: false

          }

        )

        .limit(4)

    ]);

  const activity = [];

  if (!memberResult.error) {

    (

      memberResult.data || []

    ).forEach((member) => {

      const name =

        [

          member.first_name,

          member.last_name

        ]

          .filter(Boolean)

          .join(" ") ||

        "A new member";

      activity.push({

        icon: "👤",

        title: `${name} joined`,

        detail:

          memberRoleLabel(

            member.role

          ),

        createdAt:

          member.created_at

      });

    });

  }

  if (!listingResult.error) {

    (

      listingResult.data || []

    ).forEach((listing) => {

      activity.push({

        icon: "🏡",

        title:

          listing.title ||

          "New pad created",

        detail:

          [

            listing.city,

            listing.province,

            listing.status

          ]

            .filter(Boolean)

            .join(" · "),

        createdAt:

          listing.created_at

      });

    });

  }

  if (!bookingResult.error) {

    (

      bookingResult.data || []

    ).forEach((booking) => {

      activity.push({

        icon: "📬",

        title:

          "Booking request received",

        detail:

          [

            booking.travellers

              ? `${booking.travellers} traveller(s)`

              : null,

            booking.status

          ]

            .filter(Boolean)

            .join(" · "),

        createdAt:

          booking.created_at

      });

    });

  }

  activity.sort(

    (a, b) =>

      new Date(

        b.createdAt || 0

      ) -

      new Date(

        a.createdAt || 0

      )

  );

  const recentActivity =

    activity.slice(0, 8);

  if (!recentActivity.length) {

    activityFeed.innerHTML = `

      <article class="admin-empty-state">

        <span>📡</span>

        <div>

          <strong>

            Waiting for activity

          </strong>

          <p>

            New signups, listings and bookings will appear here.

          </p>

        </div>

      </article>

    `;

    return;

  }

  activityFeed.innerHTML =

    recentActivity

      .map(activityItem)

      .join("");

}

/* =========================================================

   LOAD ADMIN ROOM

========================================================= */

async function loadAdminRoom() {

  if (platformStatus) {

    platformStatus.textContent =

      "Loading live marketplace data.";

  }

  try {

    await Promise.all([

      loadPlatformMetrics(),

      loadNewestMembers(),

      loadActivityFeed()

    ]);

    if (platformStatus) {

      platformStatus.textContent =

        "Admin systems online. Marketplace data is current.";

    }

  } catch (error) {

    console.error(

      "Admin room loading error:",

      error

    );

    if (platformStatus) {

      platformStatus.textContent =

        "Some admin information could not be loaded.";

    }

  }

}

/* =========================================================

   START

========================================================= */
async function loadAdminTravellerMap() {
  const mapElement =
    document.getElementById("adminTravellerMap");

  if (!mapElement) {
    return;
  }

  if (!window.google?.maps) {
    console.error(
      "Google Maps is not available in the Admin Room."
    );
    return;
  }

  const adminMap = new google.maps.Map(
    mapElement,
    {
      center: {
        lat: 45.5,
        lng: -100
      },

      zoom: 3,

      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true
    }
  );

const {
  data: adminTravellers,
  error: adminTravellersError
} = await supabase.rpc(
  "get_visible_travellers"
);

if (adminTravellersError) {
  console.error(
    "Could not load admin travellers:",
    adminTravellersError
  );

  return;
}

console.log(
  "ADMIN TRAVELLERS:",
  adminTravellers
);

(adminTravellers || []).forEach(
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

    new google.maps.Marker({
      map: adminMap,

      position: {
        lat: latitude,
        lng: longitude
      },

      title:
        traveller.public_name ||
        "Traveller"
    });
  }
);

}

async function startAdminCommandCentre() {

  const administrator =

    await requireAdministrator();

  if (!administrator) {

    return;

  }

  await loadAdminRoom();

  loadAdminTravellerMap();
}

refreshAdminButton?.addEventListener(

  "click",

  async () => {

    const originalText =

      refreshAdminButton.textContent;

    refreshAdminButton.disabled =

      true;

    refreshAdminButton.textContent =

      "Refreshing...";

    await loadAdminRoom();

    refreshAdminButton.disabled =

      false;

    refreshAdminButton.textContent =

      originalText || "Refresh";

  }

);

startAdminCommandCentre();