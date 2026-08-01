import { supabase } from "./supabase-client.js";

/* =========================================================

   PRIVATE BOOKING MANAGEMENT

========================================================= */

document.body.style.visibility = "hidden";

/* =========================================================

   ELEMENTS

========================================================= */

const sidebar =

  document.getElementById("bookingsSidebar");

const backdrop =

  document.getElementById("bookingsBackdrop");

const menuButton =

  document.getElementById("bookingsMenuButton");

const adminName =

  document.getElementById("bookingsAdminName");

const refreshButton =

  document.getElementById("refreshBookings");

const searchInput =

  document.getElementById("bookingSearchInput");

const statusFilter =

  document.getElementById("bookingStatusFilter");

const sortFilter =

  document.getElementById("bookingSortFilter");

const dateFilter =

  document.getElementById("bookingDateFilter");

const loadingState =

  document.getElementById("bookingsLoading");

const bookingsList =

  document.getElementById("bookingsList");

const emptyState =

  document.getElementById("bookingsEmpty");

const resultsCount =

  document.getElementById("bookingResultsCount");

const cardTemplate =

  document.getElementById("bookingCardTemplate");

/* SUMMARY */

const pendingCount =

  document.getElementById("bookingPendingCount");

const acceptedCount =

  document.getElementById("bookingAcceptedCount");

const activeCount =

  document.getElementById("bookingActiveCount");

const completedCount =

  document.getElementById("bookingCompletedCount");

const cancelledCount =

  document.getElementById("bookingCancelledCount");

const refundedCount =

  document.getElementById("bookingRefundedCount");

/* DIALOG */

const bookingDialog =

  document.getElementById("bookingDialog");

const dialogClose =

  document.getElementById("bookingDialogClose");

const dialogIcon =

  document.getElementById("dialogBookingIcon");

const dialogTitle =

  document.getElementById("dialogBookingTitle");

const dialogStatus =

  document.getElementById("dialogBookingStatus");

const dialogTraveller =

  document.getElementById("dialogBookingTraveller");

const dialogHost =

  document.getElementById("dialogBookingHost");

const dialogListing =

  document.getElementById("dialogBookingListing");

const dialogCheckin =

  document.getElementById("dialogBookingCheckin");

const dialogCheckout =

  document.getElementById("dialogBookingCheckout");

const dialogNights =

  document.getElementById("dialogBookingNights");

const dialogAmount =

  document.getElementById("dialogBookingAmount");

const dialogId =

  document.getElementById("dialogBookingId");

const dialogOpenTraveller =

  document.getElementById("dialogOpenTraveller");

const dialogOpenHost =

  document.getElementById("dialogOpenHost");

const dialogOpenListing =

  document.getElementById("dialogOpenListing");

/* =========================================================

   STATE

========================================================= */

let allBookings = [];

let filteredBookings = [];

let selectedBooking = null;

let profilesById = new Map();

/* =========================================================

   HELPERS

========================================================= */

function setText(element, value) {

  if (element) {

    element.textContent = value ?? "";

  }

}

function normalizedStatus(booking) {

  return String(

    booking?.status || "pending"

  ).toLowerCase();

}

function formatDate(value) {

  if (!value) {

    return "Unavailable";

  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {

    return "Unavailable";

  }

  return new Intl.DateTimeFormat(

    "en-CA",

    {

      month: "short",

      day: "numeric",

      year: "numeric"

    }

  ).format(date);

}

function formatMoney(value) {

  const amount = Number(value);

  if (!Number.isFinite(amount)) {

    return "Amount unavailable";

  }

  return new Intl.NumberFormat(

    "en-CA",

    {

      style: "currency",

      currency: "CAD",

      maximumFractionDigits: 2

    }

  ).format(amount);

}

function calculateNights(arrival, departure) {

  if (!arrival || !departure) {

    return 0;

  }

  const start = new Date(arrival);

  const end = new Date(departure);

  if (

    Number.isNaN(start.getTime()) ||

    Number.isNaN(end.getTime())

  ) {

    return 0;

  }

  const milliseconds =

    end.getTime() - start.getTime();

  return Math.max(

    0,

    Math.round(

      milliseconds /

      (1000 * 60 * 60 * 24)

    )

  );

}

function bookingListing(booking) {

  return booking?.listings || null;

}

function listingTitle(booking) {

  return (

    bookingListing(booking)?.title ||

    "Pad unavailable"

  );

}

function listingHostId(booking) {

  return (

    bookingListing(booking)?.host_id ||

    null

  );

}

function profileName(profileId) {

  const profile =

    profilesById.get(profileId);

  if (!profile) {

    return "Unavailable";

  }

  return (

    [

      profile.first_name,

      profile.last_name

    ]

      .filter(Boolean)

      .join(" ") ||

    "Unnamed member"

  );

}

function hostName(booking) {

  return profileName(

    listingHostId(booking)

  );

}

function travellerName(booking) {

  /*

    The current booking table stores traveller quantity and

    trip details, but its confirmed traveller-profile field

    has not yet been established in the code we inspected.

    We therefore show an honest generic label.

  */

  const travellerCount =

    Number(booking?.travellers);

  if (

    Number.isFinite(travellerCount) &&

    travellerCount > 0

  ) {

    return `${travellerCount} traveller${

      travellerCount === 1 ? "" : "s"

    }`;

  }

  return "Traveller";

}

function bookingAmount(booking) {

  const possibleAmount =

    booking?.total_amount ??

    booking?.amount ??

    booking?.booking_total;

  return formatMoney(possibleAmount);

}

function statusIcon(status) {

  const icons = {

    pending: "📬",

    accepted: "✅",

    active: "🚐",

    completed: "🏁",

    cancelled: "❌",

    refunded: "↩️"

  };

  return icons[status] || "📅";

}

function statusLabel(status) {

  return status

    .charAt(0)

    .toUpperCase() +

    status.slice(1);

}

/* =========================================================

   MOBILE SIDEBAR

========================================================= */

function openSidebar() {

  sidebar?.classList.add("open");

  backdrop?.removeAttribute("hidden");

  menuButton?.setAttribute(

    "aria-expanded",

    "true"

  );

  document.body.style.overflow =

    "hidden";

}

function closeSidebar() {

  sidebar?.classList.remove("open");

  backdrop?.setAttribute("hidden", "");

  menuButton?.setAttribute(

    "aria-expanded",

    "false"

  );

  document.body.style.overflow = "";

}

menuButton?.addEventListener(

  "click",

  () => {

    if (sidebar?.classList.contains("open")) {

      closeSidebar();

    } else {

      openSidebar();

    }

  }

);

backdrop?.addEventListener(

  "click",

  closeSidebar

);

document.addEventListener(

  "keydown",

  (event) => {

    if (event.key === "Escape") {

      closeSidebar();

      if (bookingDialog?.open) {

        bookingDialog.close();

      }

    }

  }

);

/* =========================================================

   ADMIN SECURITY CHECK

========================================================= */

async function requireAdministrator() {

  const {

    data: { user },

    error: userError

  } =

    await supabase.auth.getUser();

  if (userError || !user) {

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

        "id,first_name,last_name,role,is_admin"

      )

      .eq("id", user.id)

      .maybeSingle();

  if (

    profileError ||

    !profile?.is_admin

  ) {

    console.warn(

      "Booking administration access denied.",

      profileError

    );

    window.location.replace(

      "account.html"

    );

    return null;

  }

  setText(

    adminName,

    profile.first_name ||

      "Administrator"

  );

  document.body.style.visibility =

    "visible";

  return {

    user,

    profile

  };

}

/* =========================================================

   LOAD RELATED PROFILES

========================================================= */

async function loadRelatedProfiles(bookings) {

  const profileIds =

    [

      ...new Set(

        bookings

          .flatMap((booking) => [

            listingHostId(booking),

            booking.traveler_id,

            booking.traveller_id,

            booking.user_id

          ])

          .filter(Boolean)

      )

    ];

  profilesById = new Map();

  if (!profileIds.length) {

    return;

  }

  const {

    data,

    error

  } =

    await supabase

      .from("profiles")

      .select(

        "id,first_name,last_name"

      )

      .in("id", profileIds);

  if (error) {

    console.warn(

      "Could not load booking profiles:",

      error

    );

    return;

  }

  (data || []).forEach((profile) => {

    profilesById.set(

      profile.id,

      profile

    );

  });

}

/* =========================================================

   LOAD BOOKINGS

========================================================= */

async function loadBookings() {

  loadingState.hidden = false;

  bookingsList.hidden = true;

  emptyState.hidden = true;

  const {

    data,

    error

  } =

  await supabase

    .from("booking_requests")

    .select("*")

    .order(

      "created_at",

      {

        ascending: false

      }

    );

  if (error) {

    console.error(

      "Could not load bookings:",

      error

    );

    loadingState.textContent =

      "Bookings could not be loaded. Please refresh and try again.";

    return;

  }

  allBookings = data || [];

  await loadRelatedProfiles(

    allBookings

  );

  updateSummary();

  applyFilters();

  loadingState.hidden = true;

}

/* =========================================================

   SUMMARY COUNTS

========================================================= */

function updateSummary() {

  const countStatus =

    (status) =>

      allBookings.filter(

        (booking) =>

          normalizedStatus(booking) ===

          status

      ).length;

  setText(

    pendingCount,

    String(countStatus("pending"))

  );

  setText(

    acceptedCount,

    String(countStatus("accepted"))

  );

  setText(

    activeCount,

    String(countStatus("active"))

  );

  setText(

    completedCount,

    String(countStatus("completed"))

  );

  setText(

    cancelledCount,

    String(countStatus("cancelled"))

  );

  setText(

    refundedCount,

    String(countStatus("refunded"))

  );

}

/* =========================================================

   FILTERING AND SORTING

========================================================= */

function applyFilters() {

  const search =

    searchInput?.value

      .trim()

      .toLowerCase() || "";

  const selectedStatus =

    statusFilter?.value || "all";

  const selectedSort =

    sortFilter?.value || "newest";

  const selectedDate =

    dateFilter?.value || "";

  filteredBookings =

    allBookings.filter((booking) => {

      const searchable =

        [

          travellerName(booking),

          hostName(booking),

          listingTitle(booking),

          normalizedStatus(booking),

          booking.vehicle_type

        ]

          .filter(Boolean)

          .join(" ")

          .toLowerCase();

      const matchesSearch =

        !search ||

        searchable.includes(search);

      const matchesStatus =

        selectedStatus === "all" ||

        normalizedStatus(booking) ===

          selectedStatus;

      const matchesDate =

        !selectedDate ||

        String(booking.arrival || "")

          .startsWith(selectedDate);

      return (

        matchesSearch &&

        matchesStatus &&

        matchesDate

      );

    });

  filteredBookings.sort(

    (first, second) => {

      if (selectedSort === "oldest") {

        return (

          new Date(first.created_at || 0) -

          new Date(second.created_at || 0)

        );

      }

      if (selectedSort === "checkin") {

        return (

          new Date(first.arrival || 0) -

          new Date(second.arrival || 0)

        );

      }

      if (selectedSort === "amount") {

        const firstAmount =

          Number(

            first.total_amount ??

            first.amount ??

            first.booking_total ??

            0

          );

        const secondAmount =

          Number(

            second.total_amount ??

            second.amount ??

            second.booking_total ??

            0

          );

        return secondAmount - firstAmount;

      }

      return (

        new Date(second.created_at || 0) -

        new Date(first.created_at || 0)

      );

    }

  );

  renderBookings();

}

searchInput?.addEventListener(

  "input",

  applyFilters

);

statusFilter?.addEventListener(

  "change",

  applyFilters

);

sortFilter?.addEventListener(

  "change",

  applyFilters

);

dateFilter?.addEventListener(

  "change",

  applyFilters

);

/* =========================================================

   RENDER BOOKINGS

========================================================= */

function renderBookings() {

  bookingsList.innerHTML = "";

  const total =

    filteredBookings.length;

  setText(

    resultsCount,

    `${total} result${total === 1 ? "" : "s"}`

  );

  if (!total) {

    bookingsList.hidden = true;

    emptyState.hidden = false;

    return;

  }

  emptyState.hidden = true;

  bookingsList.hidden = false;

  filteredBookings.forEach((booking) => {

    const fragment =

      cardTemplate

        .content

        .cloneNode(true);

    const statusColumnIcon =

      fragment.querySelector(

        ".booking-status-icon"

      );

    const statusPill =

      fragment.querySelector(

        ".booking-status-pill"

      );

    const pad =

      fragment.querySelector(

        ".booking-card-pad"

      );

    const route =

      fragment.querySelector(

        ".booking-card-route"

      );

    const traveller =

      fragment.querySelector(

        ".booking-card-traveller"

      );

    const host =

      fragment.querySelector(

        ".booking-card-host"

      );

    const dates =

      fragment.querySelector(

        ".booking-card-dates"

      );

    const nights =

      fragment.querySelector(

        ".booking-card-nights"

      );

    const amount =

      fragment.querySelector(

        ".booking-card-amount"

      );

    const created =

      fragment.querySelector(

        ".booking-card-created"

      );

    const viewButton =

      fragment.querySelector(

        ".booking-view-button"

      );

    const listingButton =

      fragment.querySelector(

        ".booking-open-listing-button"

      );

    const moreButton =

      fragment.querySelector(

        ".booking-more-button"

      );

    const status =

      normalizedStatus(booking);

    setText(

      statusColumnIcon,

      statusIcon(status)

    );

    setText(

      statusPill,

      statusLabel(status)

    );

    statusPill.classList.add(status);

    setText(

      pad,

      listingTitle(booking)

    );

    setText(

      route,

      `${travellerName(booking)} → ${hostName(booking)}`

    );

    setText(

      traveller,

      `Traveller: ${travellerName(booking)}`

    );

    setText(

      host,

      `Host: ${hostName(booking)}`

    );

    setText(

      dates,

      `${formatDate(booking.arrival)} – ${formatDate(booking.departure)}`

    );

    const nightCount =

      calculateNights(

        booking.arrival,

        booking.departure

      );

    setText(

      nights,

      `${nightCount} night${

        nightCount === 1 ? "" : "s"

      }`

    );

    setText(

      amount,

      bookingAmount(booking)

    );

    setText(

      created,

      `Requested ${formatDate(booking.created_at)}`

    );

    viewButton?.addEventListener(

      "click",

      () => {

        openBookingDialog(booking);

      }

    );

    moreButton?.addEventListener(

      "click",

      () => {

        openBookingDialog(booking);

      }

    );

    listingButton?.addEventListener(

      "click",

      () => {

        const listingId =

          bookingListing(booking)?.id;

        if (!listingId) {

          return;

        }

        window.location.href =

          `listing-preview.html?id=${encodeURIComponent(listingId)}`;

      }

    );

    bookingsList.appendChild(

      fragment

    );

  });

}

/* =========================================================

   BOOKING DETAILS DIALOG

========================================================= */

function openBookingDialog(booking) {

  selectedBooking = booking;

  const status =

    normalizedStatus(booking);

  const nightCount =

    calculateNights(

      booking.arrival,

      booking.departure

    );

  setText(

    dialogIcon,

    statusIcon(status)

  );

  setText(

    dialogTitle,

    listingTitle(booking)

  );

  setText(

    dialogStatus,

    statusLabel(status)

  );

  setText(

    dialogTraveller,

    travellerName(booking)

  );

  setText(

    dialogHost,

    hostName(booking)

  );

  setText(

    dialogListing,

    listingTitle(booking)

  );

  setText(

    dialogCheckin,

    formatDate(booking.arrival)

  );

  setText(

    dialogCheckout,

    formatDate(booking.departure)

  );

  setText(

    dialogNights,

    `${nightCount} night${

      nightCount === 1 ? "" : "s"

    }`

  );

  setText(

    dialogAmount,

    bookingAmount(booking)

  );

  setText(

    dialogId,

    booking.id

  );

  if (

    typeof bookingDialog?.showModal ===

    "function"

  ) {

    bookingDialog.showModal();

  }

}

dialogClose?.addEventListener(

  "click",

  () => {

    bookingDialog?.close();

  }

);

bookingDialog?.addEventListener(

  "click",

  (event) => {

    if (event.target === bookingDialog) {

      bookingDialog.close();

    }

  }

);

/* =========================================================

   DIALOG LINKS

========================================================= */

dialogOpenHost?.addEventListener(

  "click",

  () => {

    const hostId =

      listingHostId(selectedBooking);

    if (!hostId) {

      return;

    }

    window.location.href =

      `admin-member-details.html?id=${encodeURIComponent(hostId)}`;

  }

);

dialogOpenListing?.addEventListener(

  "click",

  () => {

    const listingId =

      bookingListing(selectedBooking)?.id;

    if (!listingId) {

      return;

    }

    window.location.href =

      `listing-preview.html?id=${encodeURIComponent(listingId)}`;

  }

);

dialogOpenTraveller?.addEventListener(

  "click",

  () => {

    const travellerId =

      selectedBooking?.traveler_id ||

      selectedBooking?.traveller_id ||

      selectedBooking?.user_id;

    if (!travellerId) {

      window.alert(

        "This booking does not yet include a confirmed traveller profile link."

      );

      return;

    }

    window.location.href =

      `admin-member-details.html?id=${encodeURIComponent(travellerId)}`;

  }

);

/* =========================================================

   REFRESH

========================================================= */

refreshButton?.addEventListener(

  "click",

  async () => {

    const originalText =

      refreshButton.textContent;

    refreshButton.disabled = true;

    refreshButton.textContent =

      "Refreshing...";

    await loadBookings();

    refreshButton.disabled = false;

    refreshButton.textContent =

      originalText || "Refresh";

  }

);

/* =========================================================

   START

========================================================= */

async function startBookingManagement() {

  const administrator =

    await requireAdministrator();

  if (!administrator) {

    return;

  }

  await loadBookings();

}

startBookingManagement();