import { supabase } from "./supabase-client.js";

/* =========================================================

   PRIVATE LISTING MANAGEMENT

========================================================= */

document.body.style.visibility = "hidden";

/* =========================================================

   ELEMENTS

========================================================= */

const sidebar =

  document.getElementById("listingsSidebar");

const backdrop =

  document.getElementById("listingsBackdrop");

const menuButton =

  document.getElementById("listingsMenuButton");

const adminName =

  document.getElementById("listingsAdminName");

const refreshButton =

  document.getElementById("refreshListings");

const searchInput =

  document.getElementById("listingSearchInput");

const statusFilter =

  document.getElementById("listingStatusFilter");

const sortFilter =

  document.getElementById("listingSortFilter");

const loadingState =

  document.getElementById("listingsLoading");

const listingsGrid =

  document.getElementById("listingsGrid");

const emptyState =

  document.getElementById("listingsEmpty");

const resultsCount =

  document.getElementById("listingResultsCount");

const cardTemplate =

  document.getElementById("listingCardTemplate");

/* SUMMARY */

const totalCount =

  document.getElementById("listingTotalCount");

const publishedCount =

  document.getElementById("listingPublishedCount");

const draftCount =

  document.getElementById("listingDraftCount");

const pausedCount =

  document.getElementById("listingPausedCount");

const flaggedCount =

  document.getElementById("listingFlaggedCount");

/* DIALOG */

const listingDialog =

  document.getElementById("listingDialog");

const dialogClose =

  document.getElementById("listingDialogClose");

const dialogImage =

  document.getElementById("dialogListingImage");

const dialogStatus =

  document.getElementById("dialogListingStatus");

const dialogTitle =

  document.getElementById("dialogListingTitle");

const dialogLocation =

  document.getElementById("dialogListingLocation");

const dialogHost =

  document.getElementById("dialogListingHost");

const dialogPrice =

  document.getElementById("dialogListingPrice");

const dialogCreated =

  document.getElementById("dialogListingCreated");

const dialogId =

  document.getElementById("dialogListingId");

const dialogOpenListing =

  document.getElementById("dialogOpenListing");

const dialogOpenHost =

  document.getElementById("dialogOpenHost");

/* =========================================================

   STATE

========================================================= */

let allListings = [];

let filteredListings = [];

let selectedListing = null;

let hostProfiles = new Map();

/* =========================================================

   HELPERS

========================================================= */

function setText(element, value) {

  if (element) {

    element.textContent = value ?? "";

  }

}

function formatDate(value) {

  if (!value) {

    return "Unavailable";

  }

  return new Intl.DateTimeFormat(

    "en-CA",

    {

      month: "short",

      day: "numeric",

      year: "numeric"

    }

  ).format(new Date(value));

}

function formatMoney(value) {

  const amount = Number(value);

  if (!Number.isFinite(amount)) {

    return "Price unavailable";

  }

  return new Intl.NumberFormat(

    "en-CA",

    {

      style: "currency",

      currency: "CAD",

      maximumFractionDigits: 0

    }

  ).format(amount);

}

function listingTitle(listing) {

  return listing?.title || "Untitled Pad";

}

function listingLocation(listing) {

  return (

    [listing?.city, listing?.province]

      .filter(Boolean)

      .join(", ") ||

    "Location unavailable"

  );

}

function normalizedStatus(listing) {

  return String(

    listing?.status || "draft"

  ).toLowerCase();

}

function hostName(listing) {

  const profile =

    hostProfiles.get(listing?.host_id);

  if (!profile) {

    return "Host unavailable";

  }

  return (

    [profile.first_name, profile.last_name]

      .filter(Boolean)

      .join(" ") ||

    "Unnamed host"

  );

}

function listingImage(listing) {

  /*

    We use a safe fallback until listing-photo storage

    fields are confirmed and connected.

  */

  return listing?.image_url || "hero.jpg";

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

      if (listingDialog?.open) {

        listingDialog.close();

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

    window.location.replace("login.html");

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

      "Listing administration access denied.",

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

   LOAD HOST PROFILES

========================================================= */

async function loadHostProfiles(listings) {

  const hostIds =

    [

      ...new Set(

        listings

          .map((listing) => listing.host_id)

          .filter(Boolean)

      )

    ];

  hostProfiles = new Map();

  if (!hostIds.length) {

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

      .in("id", hostIds);

  if (error) {

    console.warn(

      "Could not load host profiles:",

      error

    );

    return;

  }

  (data || []).forEach((profile) => {

    hostProfiles.set(

      profile.id,

      profile

    );

  });

}

/* =========================================================

   LOAD LISTINGS

========================================================= */

async function loadListings() {

  loadingState.hidden = false;

  listingsGrid.hidden = true;

  emptyState.hidden = true;

  const {

    data,

    error

  } =

    await supabase

      .from("listings")

      .select(

        "id,host_id,title,city,province,nightly_price,status,created_at"

      )

      .order(

        "created_at",

        {

          ascending: false

        }

      );

  if (error) {

    console.error(

      "Could not load listings:",

      error

    );

    loadingState.textContent =

      "Listings could not be loaded. Please refresh and try again.";

    return;

  }

  allListings = data || [];

  await loadHostProfiles(allListings);

  updateSummary();

  applyFilters();

  loadingState.hidden = true;

}

/* =========================================================

   SUMMARY COUNTS

========================================================= */

function updateSummary() {

  const published =

    allListings.filter(

      (listing) =>

        normalizedStatus(listing) ===

          "published" ||

        normalizedStatus(listing) ===

          "live"

    );

  const drafts =

    allListings.filter(

      (listing) =>

        normalizedStatus(listing) ===

        "draft"

    );

  const paused =

    allListings.filter(

      (listing) =>

        normalizedStatus(listing) ===

          "paused" ||

        normalizedStatus(listing) ===

          "inactive"

    );

  const flagged =

    allListings.filter(

      (listing) =>

        normalizedStatus(listing) ===

        "flagged"

    );

  setText(

    totalCount,

    String(allListings.length)

  );

  setText(

    publishedCount,

    String(published.length)

  );

  setText(

    draftCount,

    String(drafts.length)

  );

  setText(

    pausedCount,

    String(paused.length)

  );

  setText(

    flaggedCount,

    String(flagged.length)

  );

}

/* =========================================================

   FILTERING AND SORTING

========================================================= */

function matchesStatus(listing, filter) {

  if (filter === "all") {

    return true;

  }

  const status =

    normalizedStatus(listing);

  if (filter === "published") {

    return (

      status === "published" ||

      status === "live"

    );

  }

  if (filter === "paused") {

    return (

      status === "paused" ||

      status === "inactive"

    );

  }

  return status === filter;

}

function applyFilters() {

  const search =

    searchInput?.value

      .trim()

      .toLowerCase() || "";

  const selectedStatus =

    statusFilter?.value || "all";

  const selectedSort =

    sortFilter?.value || "newest";

  filteredListings =

    allListings.filter((listing) => {

      const searchable =

        [

          listingTitle(listing),

          listingLocation(listing),

          hostName(listing),

          normalizedStatus(listing)

        ]

          .join(" ")

          .toLowerCase();

      const matchesSearch =

        !search ||

        searchable.includes(search);

      return (

        matchesSearch &&

        matchesStatus(

          listing,

          selectedStatus

        )

      );

    });

  filteredListings.sort(

    (first, second) => {

      if (selectedSort === "oldest") {

        return (

          new Date(first.created_at || 0) -

          new Date(second.created_at || 0)

        );

      }

      if (selectedSort === "title") {

        return listingTitle(first)

          .localeCompare(

            listingTitle(second)

          );

      }

      if (selectedSort === "city") {

        return listingLocation(first)

          .localeCompare(

            listingLocation(second)

          );

      }

      return (

        new Date(second.created_at || 0) -

        new Date(first.created_at || 0)

      );

    }

  );

  renderListings();

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

/* =========================================================

   RENDER LISTINGS

========================================================= */

function renderListings() {

  listingsGrid.innerHTML = "";

  const total =

    filteredListings.length;

  setText(

    resultsCount,

    `${total} result${total === 1 ? "" : "s"}`

  );

  if (!total) {

    listingsGrid.hidden = true;

    emptyState.hidden = false;

    return;

  }

  emptyState.hidden = true;

  listingsGrid.hidden = false;

  filteredListings.forEach((listing) => {

    const fragment =

      cardTemplate

        .content

        .cloneNode(true);

    const card =

      fragment.querySelector(

        ".listing-card"

      );

    const image =

      fragment.querySelector(

        ".listing-card-image"

      );

    const status =

      fragment.querySelector(

        ".listing-status-pill"

      );

    const location =

      fragment.querySelector(

        ".listing-card-location"

      );

    const title =

      fragment.querySelector(

        ".listing-card-title"

      );

    const host =

      fragment.querySelector(

        ".listing-card-host"

      );

    const price =

      fragment.querySelector(

        ".listing-card-price"

      );

    const created =

      fragment.querySelector(

        ".listing-card-created"

      );

    const viewButton =

      fragment.querySelector(

        ".listing-view-button"

      );

    const previewButton =

      fragment.querySelector(

        ".listing-preview-button"

      );

    const moreButton =

      fragment.querySelector(

        ".listing-more-button"

      );

    const statusValue =

      normalizedStatus(listing);

    image.src =

      listingImage(listing);

    image.alt =

      listingTitle(listing);

    image.addEventListener(

      "error",

      () => {

        image.src = "hero.jpg";

      },

      {

        once: true

      }

    );

    setText(

      status,

      statusValue === "live"

        ? "Published"

        : statusValue

            .charAt(0)

            .toUpperCase() +

          statusValue.slice(1)

    );

    status.classList.add(

      statusValue === "live"

        ? "published"

        : statusValue

    );

    setText(

      location,

      listingLocation(listing)

    );

    setText(

      title,

      listingTitle(listing)

    );

    setText(

      host,

      `Host: ${hostName(listing)}`

    );

    setText(

      price,

      formatMoney(

        listing.nightly_price

      )

    );

    setText(

      created,

      `Created ${formatDate(

        listing.created_at

      )}`

    );

    card.dataset.listingId =

      listing.id;

    viewButton?.addEventListener(

      "click",

      () => {

        openListingDialog(listing);

      }

    );

    moreButton?.addEventListener(

      "click",

      () => {

        openListingDialog(listing);

      }

    );

    previewButton?.addEventListener(

      "click",

      () => {

        window.location.href =

          `listing-preview.html?id=${encodeURIComponent(listing.id)}`;

      }

    );

    listingsGrid.appendChild(

      fragment

    );

  });

}

/* =========================================================

   LISTING DETAILS DIALOG

========================================================= */

function openListingDialog(listing) {

  selectedListing = listing;

  const statusValue =

    normalizedStatus(listing);

  dialogImage.src =

    listingImage(listing);

  dialogImage.alt =

    listingTitle(listing);

  dialogImage.addEventListener(

    "error",

    () => {

      dialogImage.src = "hero.jpg";

    },

    {

      once: true

    }

  );

  setText(

    dialogStatus,

    statusValue === "live"

      ? "Published"

      : statusValue

          .charAt(0)

          .toUpperCase() +

        statusValue.slice(1)

  );

  dialogStatus.className =

    `listing-status-pill ${

      statusValue === "live"

        ? "published"

        : statusValue

    }`;

  setText(

    dialogTitle,

    listingTitle(listing)

  );

  setText(

    dialogLocation,

    listingLocation(listing)

  );

  setText(

    dialogHost,

    hostName(listing)

  );

  setText(

    dialogPrice,

    formatMoney(

      listing.nightly_price

    )

  );

  setText(

    dialogCreated,

    formatDate(

      listing.created_at

    )

  );

  setText(

    dialogId,

    listing.id

  );

  if (

    typeof listingDialog?.showModal ===

    "function"

  ) {

    listingDialog.showModal();

  }

}

dialogClose?.addEventListener(

  "click",

  () => {

    listingDialog?.close();

  }

);

listingDialog?.addEventListener(

  "click",

  (event) => {

    if (event.target === listingDialog) {

      listingDialog.close();

    }

  }

);

dialogOpenListing?.addEventListener(

  "click",

  () => {

    if (!selectedListing?.id) {

      return;

    }

    window.location.href =

      `listing-preview.html?id=${encodeURIComponent(selectedListing.id)}`;

  }

);

dialogOpenHost?.addEventListener(

  "click",

  () => {

    if (!selectedListing?.host_id) {

      return;

    }

    window.location.href =

      `admin-member-details.html?id=${encodeURIComponent(selectedListing.host_id)}`;

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

    await loadListings();

    refreshButton.disabled = false;

    refreshButton.textContent =

      originalText || "Refresh";

  }

);

/* =========================================================

   START

========================================================= */

async function startListingManagement() {

  const administrator =

    await requireAdministrator();

  if (!administrator) {

    return;

  }

  await loadListings();

}

startListingManagement();