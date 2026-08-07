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
async function loadDirectConversationList() {
  const list = document.querySelector("#conversation-list");
  const loading = document.querySelector("#conversation-loading");
  const stream = document.querySelector("#message-stream");
  const empty = document.querySelector("#conversation-empty");
  const form = document.querySelector("#real-message-form");
  const title = document.querySelector("#conversation-title");
  const subtitle = document.querySelector("#conversation-subtitle");
  const status = document.querySelector("#conversation-status");

title.textContent = "Map Chats";
subtitle.textContent = "Stay connected on the road.";
status.textContent = "";
status.hidden = true;

  stream.hidden = true;
  empty.hidden = true;
  form.hidden = true;
  list.hidden = true;
  loading.hidden = false;

  const { data: auth } = await supabase.auth.getUser();
  currentUser = auth.user;

  if (!currentUser) {
    window.location.href = "login.html";
    return;
  }

  const { data: messages, error: messagesError } = await supabase
    .from("direct_messages")
    .select("sender_id, recipient_id, body, created_at")
    .or(
      `sender_id.eq.${currentUser.id},recipient_id.eq.${currentUser.id}`
    )
    .order("created_at", { ascending: false });

  if (messagesError) {
    loading.hidden = true;
    subtitle.textContent = messagesError.message;
    return;
  }

  const latestByPerson = new Map();

  (messages || []).forEach((message) => {
    const otherUserId =
      message.sender_id === currentUser.id
        ? message.recipient_id
        : message.sender_id;

    if (!latestByPerson.has(otherUserId)) {
      latestByPerson.set(otherUserId, message);
    }
  });

  const otherUserIds = [...latestByPerson.keys()];

  loading.hidden = true;
  list.innerHTML = "";
  list.hidden = false;

  if (!otherUserIds.length) {
    list.innerHTML = `
      <div class="conversation-empty">
        <span>💬</span>
        <h3>No direct conversations yet</h3>
        <p>Choose a traveller from the map to begin chatting.</p>
      </div>
    `;
    return;
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, first_name, map_emoji")
    .in("id", otherUserIds);

  if (profilesError) {
    subtitle.textContent = profilesError.message;
    return;
  }

  const profileById = new Map(
    (profiles || []).map((profile) => [profile.id, profile])
  );

  otherUserIds.forEach((otherUserId) => {
    const profile = profileById.get(otherUserId);
    const latestMessage = latestByPerson.get(otherUserId);

    const link = document.createElement("a");
    link.className = "direct-conversation-item";
    link.href =
      `messages.html?traveller=${encodeURIComponent(otherUserId)}`;

    const heading = document.createElement("strong");
    heading.textContent =
      `${profile?.map_emoji || "🚐"} ` +
      `${profile?.first_name || "Nomad Traveller"}`;

    const preview = document.createElement("span");
    preview.textContent = latestMessage?.body || "Open conversation";

    const time = document.createElement("small");
    time.textContent = latestMessage?.created_at
      ? new Date(latestMessage.created_at).toLocaleString()
      : "";

    link.append(heading, preview, time);
    list.appendChild(link);
  });
}
async function loadConversation() {
  const { data: mapChatsAuth } =
  await supabase.auth.getUser();

const mapChatsUser = mapChatsAuth?.user;

if (mapChatsUser) {
  const { data: mapChatsProfile, error: mapChatsProfileError } =
    await supabase
      .from("traveler_profiles")
.select(`
  profile_photo_url,
  profile_photo_position_x,
  profile_photo_position_y,
  profile_photo_zoom
`)
.eq("user_id", mapChatsUser.id)
      .maybeSingle();

  if (mapChatsProfileError) {
    console.error(
      "Could not load Map Chats profile:",
      mapChatsProfileError
    );
  }

  const mapChatsPhoto =
    document.querySelector("#conversation-profile-photo");

  const mapChatsPlaceholder =
    document.querySelector("#map-chats-profile-placeholder");

  if (mapChatsProfile?.profile_photo_url && mapChatsPhoto) {
    mapChatsPhoto.src =
      mapChatsProfile.profile_photo_url;

    mapChatsPhoto.style.objectPosition =
      `${mapChatsProfile.profile_photo_position_x ?? 50}% ` +
      `${mapChatsProfile.profile_photo_position_y ?? 50}%`;

    mapChatsPhoto.style.transform =
      `scale(${mapChatsProfile.profile_photo_zoom ?? 1})`;

   mapChatsPhoto.alt = "Traveller profile photo";

    mapChatsPhoto.hidden = false;

    if (mapChatsPlaceholder) {
      mapChatsPlaceholder.hidden = true;
    }
  }
}
if (!conversationMode) {
  await loadDirectConversationList();
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
    const { data: travellerPhotoProfile } = await supabase

  .from("public_traveler_photos")

  .select(`

    profile_photo_url,

    profile_photo_position_x,

    profile_photo_position_y,

    profile_photo_zoom

  `)

  .eq("user_id", travellerId)

  .maybeSingle();
  
const conversationProfilePhoto =

  document.querySelector("#conversation-profile-photo");

if (travellerPhotoProfile?.profile_photo_url) {

  conversationProfilePhoto.src =
travellerPhotoProfile.profile_photo_url;

conversationProfilePhoto.style.objectPosition =
`${travellerPhotoProfile?.profile_photo_position_x ?? 50}% ` +

`${travellerPhotoProfile?.profile_photo_position_y ?? 50}%`;

conversationProfilePhoto.style.transform =
`scale(${travellerPhotoProfile?.profile_photo_zoom ?? 1})`;

  conversationProfilePhoto.alt =

    `${travellerProfile.first_name || "Traveller"} profile photo`;

  conversationProfilePhoto.hidden = false;

} else {

  conversationProfilePhoto.removeAttribute("src");
conversationProfilePhoto.style.objectPosition = "50% 50%";

conversationProfilePhoto.style.transform = "scale(1)";
  conversationProfilePhoto.alt = "";

  conversationProfilePhoto.hidden = true;

}
  document.querySelector("#conversation-title").textContent =

    travellerProfile.first_name

      ? `${travellerProfile.map_emoji || "🚐"} ${travellerProfile.first_name}`

      : `${travellerProfile.map_emoji || "🚐"} Nomad Traveller`;

  document.querySelector("#conversation-subtitle").textContent =

  "Map chats";

  document.querySelector("#conversation-loading").hidden = true;

  document.querySelector("#real-message-form").hidden = false;
const { data: directMessages, error: directMessagesError } =

  await supabase

    .from("direct_messages")

    .select("id, sender_id, recipient_id, body, created_at")

    .or(

      `and(sender_id.eq.${currentUser.id},recipient_id.eq.${travellerId}),and(sender_id.eq.${travellerId},recipient_id.eq.${currentUser.id})`

    )

    .order("created_at", { ascending: true });

if (directMessagesError) {

  document.querySelector("#message-form-message").textContent =

    directMessagesError.message;

  return;

}

renderMessages(directMessages || []);
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
  if (

  !body ||

  !currentUser ||

  (conversationMode !== "traveller" && !bookingId)

) {

  return;

}

  button.disabled = true;
  let insertError = null;

if (conversationMode === "traveller") {

  const { error } = await supabase

    .from("direct_messages")

    .insert({

      sender_id: currentUser.id,

      recipient_id: travellerId,

      body

    });

  insertError = error;

} else {

  const { error } = await supabase

    .from("messages")

    .insert({

      booking_id: bookingId,

      sender_id: currentUser.id,

      body

    });

  insertError = error;

}

  if (insertError) {
    button.disabled = false;
  message.textContent =

  insertError.message;
    return;
  }

  input.value = "";
  button.disabled = false;
  message.textContent = "";
  await loadConversation();
});
const directMessagesChannel = supabase

  .channel("direct-messages-live")

  .on(

    "postgres_changes",

    {

      event: "INSERT",

      schema: "public",

      table: "direct_messages"

    },

    async (payload) => {

      if (

        conversationMode !== "traveller" ||

        !currentUser ||

        !travellerId

      ) {

        return;

      }

      const newMessage = payload.new;

      const belongsToConversation =

        (newMessage.sender_id === currentUser.id &&

          newMessage.recipient_id === travellerId) ||

        (newMessage.sender_id === travellerId &&

          newMessage.recipient_id === currentUser.id);

      if (belongsToConversation) {

        await loadConversation();

      }

    }

  )

  .subscribe();
loadConversation();
