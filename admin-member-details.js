import { supabase } from "./supabase-client.js";

/* =========================================================

   PRIVATE MEMBER DETAILS

========================================================= */

document.body.style.visibility = "hidden";

/* =========================================================

   ELEMENTS

========================================================= */

const sidebar =

  document.getElementById("memberDetailsSidebar");

const backdrop =

  document.getElementById("memberDetailsBackdrop");

const menuButton =

  document.getElementById("memberDetailsMenuButton");

const adminName =

  document.getElementById("memberDetailsAdminName");

const pageStatus =

  document.getElementById("memberDetailsStatus");

const heroName =

  document.getElementById("memberDetailsName");

const heroHeadline =

  document.getElementById("memberDetailsHeadline");

const profileName =

  document.getElementById("memberDetailsProfileName");

const profileAvatar =

  document.getElementById("memberDetailsAvatar");

const profileRole =

  document.getElementById("memberDetailsRole");

const profileEmail =

  document.getElementById("memberDetailsEmail");

const profileCity =

  document.getElementById("memberDetailsCity");

const profileJoined =

  document.getElementById("memberDetailsJoined");

const profileId =

  document.getElementById("memberDetailsId");

const statusBadge =

  document.getElementById("memberDetailsStatusBadge");

const travellerAccess =

  document.getElementById("memberTravellerAccess");

const hostAccess =

  document.getElementById("memberHostAccess");

const adminAccess =

  document.getElementById("memberAdminAccess");

const stripeStatus =

  document.getElementById("memberStripeStatus");

const listingCount =

  document.getElementById("memberListingCount");

const publishedCount =

  document.getElementById("memberPublishedCount");

const bookingCount =

  document.getElementById("memberBookingCount");

const reviewCount =

  document.getElementById("memberReviewCount");

const travellerBookings =

  document.getElementById("memberTravellerBookings");

const savedPads =

  document.getElementById("memberSavedPads");

const reviewsWritten =

  document.getElementById("memberReviewsWritten");

const reportCount =

  document.getElementById("memberReportCount");

const openPublicProfileButton =

  document.getElementById("memberOpenPublicProfile");

const viewListingsButton =

  document.getElementById("memberViewListings");

const viewBookingsButton =

  document.getElementById("memberViewBookings");

/* =========================================================

   STATE

========================================================= */

let selectedMember = null;

/* =========================================================

   HELPERS

========================================================= */

function setText(element, value) {

  if (element) {

    element.textContent = value ?? "";

  }

}

function fullName(member) {

  return (

    [member?.first_name, member?.last_name]

      .filter(Boolean)

      .join(" ") || "Unnamed member"

  );

}

function initial(member) {

  return fullName(member)

    .charAt(0)

    .toUpperCase();

}

function roleLabel(member) {

  if (member?.is_admin) {

    return "Administrator";

  }

  if (member?.role === "both") {

    return "Host + Traveller";

  }

  if (member?.role === "host") {

    return "Host";

  }

  if (member?.role === "traveler") {

    return "Traveller";

  }

  return "Member";

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

function hasTravellerAccess(member) {

  return (

    member?.role === "traveler" ||

    member?.role === "both"

  );

}

function hasHostAccess(member) {

  return (

    member?.role === "host" ||

    member?.role === "both"

  );

}

function getMemberId() {

  const params =

    new URLSearchParams(

      window.location.search

    );

  return params.get("id");

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

      "Member details access denied.",

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

   COUNT HELPERS

========================================================= */

async function countRows(

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

    query = configureQuery(query);

  }

  const {

    count,

    error

  } =

    await query;

  if (error) {

    console.warn(

      `Could not count ${table}:`,

      error

    );

    return 0;

  }

  return count || 0;

}

/* =========================================================

   LOAD MEMBER PROFILE

========================================================= */

async function loadMemberProfile(memberId) {

  const {

    data,

    error

  } =

    await supabase

      .from("profiles")

      .select(

        "id,first_name,last_name,role,is_admin,city,created_at"

      )

      .eq("id", memberId)

      .maybeSingle();

  if (error || !data) {

    throw new Error(

      error?.message ||

      "Member profile was not found."

    );

  }

  selectedMember = data;

  const name = fullName(data);

  const role = roleLabel(data);

  const city =

    data.city ||

    "Location unavailable";

  setText(heroName, name);

  setText(

    heroHeadline,

    `${role} · ${city} · Joined ${formatDate(data.created_at)}`

  );

  setText(profileName, name);

  setText(profileAvatar, initial(data));

  setText(profileRole, role);

  setText(

    profileEmail,

    "Secure Authentication record"

  );

  setText(profileCity, city);

  setText(

    profileJoined,

    formatDate(data.created_at)

  );

  setText(profileId, data.id);

  setText(statusBadge, "Active");

  setText(

    travellerAccess,

    hasTravellerAccess(data)

      ? "Yes"

      : "No"

  );

  setText(

    hostAccess,

    hasHostAccess(data)

      ? "Yes"

      : "No"

  );

  setText(

    adminAccess,

    data.is_admin

      ? "Yes"

      : "No"

  );

  setText(

    stripeStatus,

    hasHostAccess(data)

      ? "Checking..."

      : "Not applicable"

  );

}

/* =========================================================

   LOAD MEMBER ACTIVITY

========================================================= */

async function loadMemberActivity(memberId) {

  const [

    listings,

    published,

    hostBookings,

    hostReviews,

    saved,

    writtenReviews

  ] =

    await Promise.all([

      countRows(

        "listings",

        (query) =>

          query.eq("host_id", memberId)

      ),

      countRows(

        "listings",

        (query) =>

          query

            .eq("host_id", memberId)

            .eq("status", "published")

      ),

      countRows(

        "booking_requests",

        (query) =>

          query.eq("host_id", memberId)

      ),

      countRows(

        "reviews",

        (query) =>

          query.eq("reviewee_id", memberId)

      ),

      countRows(

        "saved_pads",

        (query) =>

          query.eq("user_id", memberId)

      ),

      countRows(

        "reviews",

        (query) =>

          query.eq("reviewer_id", memberId)

      )

    ]);

  setText(

    listingCount,

    String(listings)

  );

  setText(

    publishedCount,

    String(published)

  );

  setText(

    bookingCount,

    String(hostBookings)

  );

  setText(

    reviewCount,

    String(hostReviews)

  );

  setText(

    travellerBookings,

    "0"

  );

  setText(

    savedPads,

    String(saved)

  );

  setText(

    reviewsWritten,

    String(writtenReviews)

  );

  setText(reportCount, "0");

}

/* =========================================================

   STRIPE STATUS

========================================================= */

async function loadStripeStatus(memberId) {

  if (!hasHostAccess(selectedMember)) {

    return;

  }

  /*

    Stripe Connect status is checked through your existing

    secure payout function. If that function currently only

    checks the logged-in host, this safely falls back to

    "Unavailable" for other members.

  */

  try {

    const {

      data,

      error

    } =

      await supabase.functions.invoke(

        "stripe-account-status",

        {

          body: {

            user_id: memberId

          }

        }

      );

    if (error) {

      throw error;

    }

    if (

      data?.payouts_enabled &&

      data?.details_submitted

    ) {

      setText(

        stripeStatus,

        "Connected"

      );

      return;

    }

    if (data?.connected) {

      setText(

        stripeStatus,

        "Setup incomplete"

      );

      return;

    }

    setText(

      stripeStatus,

      "Not connected"

    );

  } catch (error) {

    console.warn(

      "Stripe status unavailable:",

      error

    );

    setText(

      stripeStatus,

      "Unavailable"

    );

  }

}

/* =========================================================

   ACTION BUTTONS

========================================================= */

openPublicProfileButton?.addEventListener(

  "click",

  () => {

    if (!selectedMember?.id) {

      return;

    }

    window.location.href =

      `public-profile.html?id=${encodeURIComponent(selectedMember.id)}`;

  }

);

viewListingsButton?.addEventListener(

  "click",

  () => {

    if (!selectedMember?.id) {

      return;

    }

    window.location.href =

      `admin-command.html#listings`;

  }

);

viewBookingsButton?.addEventListener(

  "click",

  () => {

    if (!selectedMember?.id) {

      return;

    }

    window.location.href =

      `admin-command.html#bookings`;

  }

);

/* =========================================================

   START

========================================================= */

async function startMemberDetails() {

  const administrator =

    await requireAdministrator();

  if (!administrator) {

    return;

  }

  const memberId =

    getMemberId();

  if (!memberId) {

    setText(

      pageStatus,

      "No member was selected."

    );

    setText(

      heroName,

      "Member not selected"

    );

    setText(

      heroHeadline,

      "Return to the member directory and choose a member."

    );

    return;

  }

  try {

    setText(

      pageStatus,

      "Loading member profile and marketplace activity..."

    );

    await loadMemberProfile(memberId);

    await Promise.all([

      loadMemberActivity(memberId),

      loadStripeStatus(memberId)

    ]);

    setText(

      pageStatus,

      "Member information is current."

    );

  } catch (error) {

    console.error(

      "Member details error:",

      error

    );

    setText(

      pageStatus,

      error?.message ||

      "Member details could not be loaded."

    );

    setText(

      heroName,

      "Member unavailable"

    );

    setText(

      heroHeadline,

      "The selected member could not be retrieved."

    );

  }

}

startMemberDetails();