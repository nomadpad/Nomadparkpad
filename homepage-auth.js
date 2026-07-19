import { supabase } from "./supabase-client.js";

const guestLinks = document.querySelectorAll(".guest-menu-link");

const memberLinks = document.querySelectorAll(".member-menu-link");

async function updateHomepageMenu() {

  const {

    data: { session }

  } = await supabase.auth.getSession();

  const signedIn = Boolean(session);

  guestLinks.forEach(link => {

    link.hidden = signedIn;

  });

  memberLinks.forEach(link => {

    link.hidden = !signedIn;

  });

}

updateHomepageMenu();