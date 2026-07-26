import {

  supabase,

  supabaseConfigured

} from "./supabase-client.js";

const loadingCard = document.querySelector("#listings-loading");

const emptyCard = document.querySelector("#listings-empty");

const listingsGrid = document.querySelector("#my-listings-grid");

const message = document.querySelector("#listings-message");

function showMessage(text, isError = false) {

  if (!message) return;

  message.textContent = text;

  message.classList.toggle("error", isError);

}

function escapeHtml(value = "") {

  return String(value)

    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");

}

function formatPrice(value) {

  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-CA", {

    style: "currency",

    currency: "CAD",

    minimumFractionDigits: 0

  }).format(amount);

}

function renderListing(listing) {

  const card = document.createElement("article");

  card.className = "listing-management-card";

  card.dataset.listingId = listing.id;

  const isPublished = listing.status === "published";

  const nextStatus = isPublished ? "unpublished" : "published";

  const buttonText = isPublished ? "Unpublish" : "Publish";

  card.innerHTML = `

    <div class="listing-management-content">

      <div class="listing-status-row">

        <span class="listing-status ${

          isPublished ? "is-published" : "is-unpublished"

        }">

          ${isPublished ? "Published" : "Unpublished"}

        </span>

      </div>

      <h2>${escapeHtml(listing.title || "Untitled Pad")}</h2>

      <p class="listing-location">

        ${escapeHtml(listing.city || "")}${

          listing.province

            ? `, ${escapeHtml(listing.province)}`

            : ""

        }

      </p>

      <p class="listing-price">

        ${formatPrice(listing.nightly_price)} per night

      </p>

      <div class="listing-management-actions">

        <a

          class="btn btn-primary"

          href="pad-listing.html?listing=${encodeURIComponent(listing.id)}">

          View

        </a>

        <button

          class="btn btn-secondary listing-status-button"

          type="button"

          data-listing-id="${escapeHtml(listing.id)}"

          data-next-status="${nextStatus}">

          ${buttonText}

        </button>

      </div>

    </div>

  `;

  return card;

}

async function updateListingStatus(button) {

  const listingId = button.dataset.listingId;

  const nextStatus = button.dataset.nextStatus;

  if (!listingId || !nextStatus) return;

  const actionText =

    nextStatus === "published" ? "publish" : "unpublish";

  const confirmed = window.confirm(

    `Are you sure you want to ${actionText} this pad?`

  );

  if (!confirmed) return;

  button.disabled = true;

  button.textContent =

    nextStatus === "published"

      ? "Publishing..."

      : "Unpublishing...";

  showMessage("");

  const {

    data: { user },

    error: userError

  } = await supabase.auth.getUser();

  if (userError || !user) {

    window.location.href = "login.html";

    return;

  }

  const { error } = await supabase

    .from("listings")

    .update({

      status: nextStatus

    })

    .eq("id", listingId)

    .eq("host_id", user.id);

  if (error) {

    console.error("Unable to update listing status:", error);

    showMessage(

      error.message || "Unable to update this listing.",

      true

    );

    button.disabled = false;

    button.textContent =

      nextStatus === "published"

        ? "Publish"

        : "Unpublish";

    return;

  }

  showMessage(

    nextStatus === "published"

      ? "Your pad is now published."

      : "Your pad has been unpublished."

  );

  await loadListings();

}

async function loadListings() {

  loadingCard.hidden = false;

  emptyCard.hidden = true;

  listingsGrid.innerHTML = "";

  showMessage("");

  if (!supabaseConfigured || !supabase) {

    loadingCard.hidden = true;

    showMessage("Supabase is not configured.", true);

    return;

  }

  const {

    data: { user },

    error: userError

  } = await supabase.auth.getUser();

  if (userError || !user) {

    window.location.href = "login.html";

    return;

  }

  const { data: listings, error } = await supabase

    .from("listings")

    .select(`

      id,

      title,

      city,

      province,

      nightly_price,

      status,

      created_at

    `)

    .eq("host_id", user.id)

    .order("created_at", {

      ascending: false

    });

  loadingCard.hidden = true;

  if (error) {

    console.error("Unable to load listings:", error);

    showMessage(

      error.message || "Unable to load your listings.",

      true

    );

    return;

  }

  if (!listings?.length) {

    emptyCard.hidden = false;

    return;

  }

  listings.forEach(listing => {

    listingsGrid.appendChild(renderListing(listing));

  });

}

listingsGrid?.addEventListener("click", event => {

  const button = event.target.closest(

    ".listing-status-button"

  );

  if (!button) return;

  updateListingStatus(button);

});

loadListings();