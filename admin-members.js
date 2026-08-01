import { supabase } from "./supabase-client.js";

/* =========================================================

   PRIVATE MEMBER MANAGEMENT

========================================================= */

document.body.style.visibility = "hidden";

/* =========================================================

   ELEMENTS

========================================================= */

const membersSidebar =

  document.getElementById("membersSidebar");

const membersBackdrop =

  document.getElementById("membersBackdrop");

const membersMenuButton =

  document.getElementById("membersMenuButton");

const membersAdminName =

  document.getElementById("membersAdminName");

const refreshMembersButton =

  document.getElementById("refreshMembers");

const memberSearchInput =

  document.getElementById("memberSearchInput");

const memberRoleFilter =

  document.getElementById("memberRoleFilter");

const memberStatusFilter =

  document.getElementById("memberStatusFilter");

const membersLoading =

  document.getElementById("membersLoading");

const membersList =

  document.getElementById("membersList");

const membersEmpty =

  document.getElementById("membersEmpty");

const memberResultsCount =

  document.getElementById("memberResultsCount");

const memberCardTemplate =

  document.getElementById("memberCardTemplate");

/* SUMMARY */

const memberTotalCount =

  document.getElementById("memberTotalCount");

const memberTravellerCount =

  document.getElementById("memberTravellerCount");

const memberHostCount =

  document.getElementById("memberHostCount");

const memberAdminCount =

  document.getElementById("memberAdminCount");

/* DIALOG */

const memberDialog =

  document.getElementById("memberDialog");

const memberDialogClose =

  document.getElementById("memberDialogClose");

const dialogMemberAvatar =

  document.getElementById("dialogMemberAvatar");

const dialogMemberName =

  document.getElementById("dialogMemberName");

const dialogMemberRole =

  document.getElementById("dialogMemberRole");

const dialogMemberEmail =

  document.getElementById("dialogMemberEmail");

const dialogMemberCity =

  document.getElementById("dialogMemberCity");

const dialogMemberJoined =

  document.getElementById("dialogMemberJoined");

const dialogMemberStatus =

  document.getElementById("dialogMemberStatus");

const dialogMemberListings =

  document.getElementById("dialogMemberListings");

const dialogMemberBookings =

  document.getElementById("dialogMemberBookings");

const dialogViewProfile =

  document.getElementById("dialogViewProfile");

/* =========================================================

   STATE

========================================================= */

let allMembers = [];

let currentFilteredMembers = [];

let selectedMember = null;

/* =========================================================

   HELPERS

========================================================= */

function safeText(element, value) {

  if (!element) {

    return;

  }

  element.textContent =

    value ?? "";

}

function escapeHtml(value) {

  return String(value ?? "")

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

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

  ).format(

    new Date(value)

  );

}

function fullName(member) {

  return (

    [

      member?.first_name,

      member?.last_name

    ]

      .filter(Boolean)

      .join(" ") ||

    "Unnamed member"

  );

}

function memberInitial(member) {

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

function memberCity(member) {

  return member?.city || "Location unavailable";

}

function memberStatus(member) {

  return member?.is_suspended

    ? "Suspended"

    : "Active";

}

/* =========================================================

   MOBILE SIDEBAR

========================================================= */

function openSidebar() {

  membersSidebar?.classList.add("open");

  membersBackdrop?.removeAttribute(

    "hidden"

  );

  membersMenuButton?.setAttribute(

    "aria-expanded",

    "true"

  );

  document.body.style.overflow =

    "hidden";

}

function closeSidebar() {

  membersSidebar?.classList.remove("open");

  membersBackdrop?.setAttribute(

    "hidden",

    ""

  );

  membersMenuButton?.setAttribute(

    "aria-expanded",

    "false"

  );

  document.body.style.overflow =

    "";

}

membersMenuButton?.addEventListener(

  "click",

  () => {

    const isOpen =

      membersSidebar?.classList.contains(

        "open"

      );

    if (isOpen) {

      closeSidebar();

    } else {

      openSidebar();

    }

  }

);

membersBackdrop?.addEventListener(

  "click",

  closeSidebar

);

document.addEventListener(

  "keydown",

  (event) => {

    if (event.key === "Escape") {

      closeSidebar();

      if (memberDialog?.open) {

        memberDialog.close();

      }

    }

  }

);

/* =========================================================

   SECURE ADMIN CHECK

========================================================= */

async function requireAdministrator() {

  const {

    data: { user },

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

        "id,first_name,last_name,role,is_admin"

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

      "Member administration access denied.",

      profileError

    );

    window.location.replace(

      "account.html"

    );

    return null;

  }

  safeText(

    membersAdminName,

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

   LOAD MEMBERS

========================================================= */

async function loadMembers() {

  membersLoading.hidden =

    false;

  membersList.hidden =

    true;

  membersEmpty.hidden =

    true;

  const {

    data,

    error

  } =

    await supabase

      .from("profiles")

      .select(

  "id,first_name,last_name,role,is_admin,city,created_at"

)

      .order(

        "created_at",

        {

          ascending: false

        }

      );

  if (error) {

    console.error(

      "Unable to load members:",

      error

    );

    membersLoading.textContent =

      "Members could not be loaded. Please refresh and try again.";

    return;

  }

  allMembers =

    (data || []).map(

      (member) => ({

        ...member,

        is_suspended: false

      })

    );

  updateSummary();

  applyFilters();

  membersLoading.hidden =

    true;

}

/* =========================================================

   SUMMARY COUNTS

========================================================= */

function updateSummary() {

  const travellers =

    allMembers.filter(

      (member) =>

        member.role === "traveler" ||

        member.role === "both"

    );

  const hosts =

    allMembers.filter(

      (member) =>

        member.role === "host" ||

        member.role === "both"

    );

  const administrators =

    allMembers.filter(

      (member) =>

        member.is_admin

    );

  safeText(

    memberTotalCount,

    String(allMembers.length)

  );

  safeText(

    memberTravellerCount,

    String(travellers.length)

  );

  safeText(

    memberHostCount,

    String(hosts.length)

  );

  safeText(

    memberAdminCount,

    String(administrators.length)

  );

}

/* =========================================================

   FILTERING

========================================================= */

function matchesRole(member, filter) {

  if (filter === "all") {

    return true;

  }

  if (filter === "admin") {

    return Boolean(

      member.is_admin

    );

  }

  return member.role === filter;

}

function matchesStatus(member, filter) {

  if (filter === "all") {

    return true;

  }

  if (filter === "suspended") {

    return Boolean(

      member.is_suspended

    );

  }

  return !member.is_suspended;

}

function applyFilters() {

  const search =

    memberSearchInput?.value

      .trim()

      .toLowerCase() || "";

  const roleFilter =

    memberRoleFilter?.value ||

    "all";

  const statusFilter =

    memberStatusFilter?.value ||

    "all";

  currentFilteredMembers =

    allMembers.filter(

      (member) => {

        const searchableText =

          [

            fullName(member),

            member.city,

            member.province,

            roleLabel(member)

          ]

            .filter(Boolean)

            .join(" ")

            .toLowerCase();

        const matchesSearch =

          !search ||

          searchableText.includes(

            search

          );

        return (

          matchesSearch &&

          matchesRole(

            member,

            roleFilter

          ) &&

          matchesStatus(

            member,

            statusFilter

          )

        );

      }

    );

  renderMembers();

}

memberSearchInput?.addEventListener(

  "input",

  applyFilters

);

memberRoleFilter?.addEventListener(

  "change",

  applyFilters

);

memberStatusFilter?.addEventListener(

  "change",

  applyFilters

);

/* =========================================================

   RENDER MEMBER CARDS

========================================================= */

function renderMembers() {

  membersList.innerHTML =

    "";

  const total =

    currentFilteredMembers.length;

  safeText(

    memberResultsCount,

    `${total} result${total === 1 ? "" : "s"}`

  );

  if (!total) {

    membersList.hidden =

      true;

    membersEmpty.hidden =

      false;

    return;

  }

  membersEmpty.hidden =

    true;

  membersList.hidden =

    false;

  currentFilteredMembers.forEach(

    (member) => {

      const fragment =

        memberCardTemplate

          .content

          .cloneNode(true);

      const card =

        fragment.querySelector(

          ".member-card"

        );

      const avatar =

        fragment.querySelector(

          ".member-card-avatar"

        );

      const name =

        fragment.querySelector(

          ".member-card-name"

        );

      const email =

        fragment.querySelector(

          ".member-card-email"

        );

      const status =

        fragment.querySelector(

          ".member-status-pill"

        );

      const role =

        fragment.querySelector(

          ".member-role"

        );

      const city =

        fragment.querySelector(

          ".member-city"

        );

      const joined =

        fragment.querySelector(

          ".member-joined"

        );

      const viewButton =

        fragment.querySelector(

          ".member-view-button"

        );

      const moreButton =

        fragment.querySelector(

          ".member-more-button"

        );

      safeText(

        avatar,

        memberInitial(member)

      );

      safeText(

        name,

        fullName(member)

      );

      /*

        Email addresses are stored in Supabase Authentication,

        not the public profiles table. We deliberately avoid

        exposing or inventing them here.

      */

      safeText(

        email,

        "Email available through secure admin tools later"

      );

      safeText(

        status,

        memberStatus(member)

      );

      status.classList.toggle(

        "suspended",

        member.is_suspended

      );

      safeText(

        role,

        roleLabel(member)

      );

      safeText(

        city,

        memberCity(member)

      );

      safeText(

        joined,

        `Joined ${formatDate(member.created_at)}`

      );

      card.dataset.memberId =

        member.id;

      viewButton?.addEventListener(

  "click",

  () => {

    window.location.href =

      `admin-member-details.html?id=${encodeURIComponent(member.id)}`;

  }

);

      moreButton?.addEventListener(

        "click",

        () => {

          openMemberDialog(

            member

          );

        }

      );

      membersList.appendChild(

        fragment

      );

    }

  );

}

/* =========================================================

   MEMBER DETAILS

========================================================= */

async function getMemberActivityCounts(

  memberId

) {

  const [

    listingsResult,

    bookingsResult

  ] =

    await Promise.all([

      supabase

        .from("listings")

        .select(

          "*",

          {

            count: "exact",

            head: true

          }

        )

        .eq(

          "host_id",

          memberId

        ),

      /*

        The booking_requests table currently links members

        through listings and traveller data rather than a

        confirmed traveller profile field. We keep this count

        conservative until that relationship is finalized.

      */

      Promise.resolve({

        count: 0,

        error: null

      })

    ]);

  return {

    listings:

      listingsResult.error

        ? 0

        : listingsResult.count || 0,

    bookings:

      bookingsResult.error

        ? 0

        : bookingsResult.count || 0

  };

}

async function openMemberDialog(

  member

) {

  selectedMember =

    member;

  safeText(

    dialogMemberAvatar,

    memberInitial(member)

  );

  safeText(

    dialogMemberName,

    fullName(member)

  );

  safeText(

    dialogMemberRole,

    roleLabel(member)

  );

  safeText(

    dialogMemberEmail,

    "Secure Authentication record"

  );

  safeText(

    dialogMemberCity,

    memberCity(member)

  );

  safeText(

    dialogMemberJoined,

    formatDate(member.created_at)

  );

  safeText(

    dialogMemberStatus,

    memberStatus(member)

  );

  safeText(

    dialogMemberListings,

    "Loading..."

  );

  safeText(

    dialogMemberBookings,

    "Loading..."

  );

  if (

    typeof memberDialog?.showModal ===

    "function"

  ) {

    memberDialog.showModal();

  }

  const counts =

    await getMemberActivityCounts(

      member.id

    );

  safeText(

    dialogMemberListings,

    String(counts.listings)

  );

  safeText(

    dialogMemberBookings,

    String(counts.bookings)

  );

}

memberDialogClose?.addEventListener(

  "click",

  () => {

    memberDialog?.close();

  }

);

memberDialog?.addEventListener(

  "click",

  (event) => {

    if (

      event.target === memberDialog

    ) {

      memberDialog.close();

    }

  }

);

dialogViewProfile?.addEventListener(

  "click",

  () => {

    if (!selectedMember?.id) {

      return;

    }

    window.location.href =

      `public-profile.html?id=${encodeURIComponent(selectedMember.id)}`;

  }

);

/* =========================================================

   REFRESH

========================================================= */

refreshMembersButton?.addEventListener(

  "click",

  async () => {

    const originalText =

      refreshMembersButton.textContent;

    refreshMembersButton.disabled =

      true;

    refreshMembersButton.textContent =

      "Refreshing...";

    await loadMembers();

    refreshMembersButton.disabled =

      false;

    refreshMembersButton.textContent =

      originalText || "Refresh";

  }

);

/* =========================================================

   START

========================================================= */

async function startMemberManagement() {

  const administrator =

    await requireAdministrator();

  if (!administrator) {

    return;

  }

  await loadMembers();

}

startMemberManagement();