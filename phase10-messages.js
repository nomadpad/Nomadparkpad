import { supabase } from "./supabase-client.js";

const conversationParams =

  new URLSearchParams(

    window.location.search

  );

const bookingId =

  conversationParams.get(

    "booking"

  );

const travellerId =

  conversationParams.get(

    "traveller"

  );

let currentUser = null;

let booking = null;

let directTraveller = null;

const conversationMode =

  travellerId

    ? "traveller"

    : bookingId

      ? "booking"

      : null;

function formatTime(value) {
  return new Intl.DateTimeFormat("en-CA", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })
    .format(new Date(value));
}

function renderMessages(messages) {
  const stream = document.querySelector("#message-stream");
  stream.innerHTML = "";
  document.querySelector("#conversation-empty").hidden = Boolean(messages.length);

  messages.forEach(message => {
    const article = document.createElement("article");
    article.className = message.sender_id === currentUser.id ? "message-bubble mine" : "message-bubble theirs";
    const senderName = message.profiles?.first_name || (message.sender_id === currentUser.id ? "You" : "Member");
    article.innerHTML = `<strong>${senderName}</strong><p></p><time>${formatTime(message.created_at)}</time>`;
    article.querySelector("p").textContent = message.body;
    stream.appendChild(article);
  });

  stream.scrollTop = stream.scrollHeight;
}

async function loadConversation() {
if (!conversationMode) {

  document.querySelector("#conversation-title").textContent =

    "No conversation selected";

  document.querySelector("#conversation-subtitle").textContent =

    "Open a booking or choose a traveller from the map.";

  document.querySelector("#real-message-form").hidden = true;

  document.querySelector("#conversation-loading").hidden = true;

  return;

}

if (conversationMode === "traveller") {

  document.querySelector("#conversation-title").textContent =

    "Traveller conversation";

  document.querySelector("#conversation-subtitle").textContent =

    "Loading traveller details...";

  document.querySelector("#real-message-form").hidden = true;

  const { data: auth } =

    await supabase.auth.getUser();

  currentUser = auth.user;

  if (!currentUser) {

    window.location.href = "login.html";

    return;

  }

  const {

    data: travellerProfile,

    error: travellerError

  } = await supabase

    .from("profiles")

    .select(`

      id,

      first_name,

      map_emoji

    `)

    .eq("id", travellerId)

    .maybeSingle();

  if (

    travellerError ||

    !travellerProfile

  ) {

    document.querySelector("#conversation-title").textContent =

      "Traveller unavailable";

    document.querySelector("#conversation-subtitle").textContent =

      "This traveller could not be loaded.";

    document.querySelector("#conversation-loading").hidden = true;

    return;

  }

  directTraveller =

    travellerProfile;

  document.querySelector("#conversation-title").textContent =

    travellerProfile.first_name

      ? `${travellerProfile.map_emoji || "🚐"} ${travellerProfile.first_name}`

      : `${travellerProfile.map_emoji || "🚐"} Nomad Traveller`;

  document.querySelector("#conversation-subtitle").textContent =

    "Direct traveller conversation";

  document.querySelector("#conversation-loading").hidden = true;

  document.querySelector("#real-message-form").hidden = false;

  return;

}

  const { data: auth } = await supabase.auth.getUser();
  currentUser = auth.user;

  const { data: bookingData, error: bookingError } = await supabase
    .from("booking_requests")
    .select("id,status,arrival,departure,traveler_id,listing_id,listings(id,title,host_id)")
    .eq("id", bookingId)
    .single();

  if (bookingError || !bookingData) {
    document.querySelector("#conversation-loading").textContent = bookingError?.message || "Conversation unavailable.";
    return;
  }

  booking = bookingData;
  document.querySelector("#conversation-title").textContent = bookingData.listings?.title || "Booking conversation";
  document.querySelector("#conversation-subtitle").textContent = `${bookingData.arrival} to ${bookingData.departure}`;
  document.querySelector("#conversation-status").textContent = bookingData.status;
  document.querySelector("#conversation-status").className = `status-pill status-${bookingData.status}`;
  document.querySelector("#conversation-trip-link").href = `trip-details.html?booking=${encodeURIComponent(bookingData.id)}`;

  const { data: messages, error } = await supabase
    .from("messages")
    .select("id,body,sender_id,created_at,profiles!messages_sender_id_fkey(first_name)")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });

  document.querySelector("#conversation-loading").hidden = true;
  if (error) {
    document.querySelector("#message-form-message").textContent = error.message;
    return;
  }

  renderMessages(messages || []);
}

document.querySelector("#real-message-form")?.addEventListener("submit", async event => {
  event.preventDefault();
  const input = document.querySelector("#real-message-input");
  const button = document.querySelector("#send-real-message");
  const message = document.querySelector("#message-form-message");
  const body = input.value.trim();
  if (!body || !bookingId || !currentUser) return;

  button.disabled = true;
  const { error } = await supabase
    .from("messages")
    .insert({ booking_id: bookingId, sender_id: currentUser.id, body });

  if (error) {
    button.disabled = false;
    message.textContent = error.message;
    return;
  }

  input.value = "";
  button.disabled = false;
  message.textContent = "";
  await loadConversation();
});

loadConversation();
