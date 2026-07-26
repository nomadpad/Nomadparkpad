import {

  supabase,

  supabaseConfigured

} from "./supabase-client.js";

const guestLinks =

  document.querySelectorAll(".guest-view-link");

const travellerLinks =

  document.querySelectorAll(".traveller-view-link");

const hostLinks =

  document.querySelectorAll(".host-view-link");

function showLinks(group) {

  guestLinks.forEach(link => {

    link.hidden = group !== "guest";

  });

  travellerLinks.forEach(link => {

    link.hidden = group !== "traveller";

  });

  hostLinks.forEach(link => {

    link.hidden = group !== "host";

  });

}

async function updateListingMenu() {

  if (!supabaseConfigured || !supabase) {

    showLinks("guest");

    return;

  }

  const {

    data: { user }

  } = await supabase.auth.getUser();

  if (!user) {

    showLinks("guest");

    return;

  }

  const params =

    new URLSearchParams(window.location.search);

  const listingId = params.get("listing");

  if (!listingId) {

    showLinks("traveller");

    return;

  }

  const {

    data: listing,

    error

  } = await supabase

    .from("listings")

    .select("host_id")

    .eq("id", listingId)

    .maybeSingle();

  if (error) {

    console.error(

      "Unable to determine listing owner:",

      error

    );

    showLinks("traveller");

    return;

  }

  const ownsListing =

    listing?.host_id === user.id;

  showLinks(ownsListing ? "host" : "traveller");

}

updateListingMenu();