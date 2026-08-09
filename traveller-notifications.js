import {

  supabase

} from "./supabase-client.js";
const nearbyToggle =

  document.getElementById("notifyNearbyNomads");

const nearbyOptions =

  document.querySelector(".nearby-radius-options");

const roadSafetyToggle =

  document.getElementById("notifyRoadSafety");

const roadSafetyOptions =

  document.querySelector(".road-alert-options");

  const nearbyRadiusSlider =

  document.getElementById("nearbyRadiusSlider");

const nearbyRadiusValue =

  document.getElementById("nearbyRadiusValue");

  const directMessagesToggle =

  document.getElementById("notifyDirectMessages");

  const hostMessagesToggle =

  document.getElementById("notifyHostMessages");

  const bookingUpdatesToggle =

  document.getElementById("notifyBookingUpdates");

  const stayRemindersToggle =

  document.getElementById("notifyStayReminders");

function updateNotificationOptionStates() {

  if (nearbyOptions && nearbyToggle) {

    nearbyOptions.classList.toggle(

      "disabled",

      !nearbyToggle.checked

    );

    nearbyOptions

      .querySelectorAll("input")

      .forEach((input) => {

        input.disabled = !nearbyToggle.checked;

      });

  }

  if (roadSafetyOptions && roadSafetyToggle) {

    roadSafetyOptions.classList.toggle(

      "disabled",

      !roadSafetyToggle.checked

    );

    roadSafetyOptions

      .querySelectorAll("input")

      .forEach((input) => {

        input.disabled = !roadSafetyToggle.checked;

      });

  }

}
/* =========================================================

   LOAD SAVED NOTIFICATION SETTINGS

========================================================= */

async function loadNotificationPreferences() {

  const {

    data: { user }

  } = await supabase.auth.getUser();

  if (!user) return;

  const { data: profile, error } =

    await supabase

      .from("profiles")

      .select(`

        notify_direct_messages,

        notify_host_messages,

        notify_booking_updates,

        notify_stay_reminders,

        notify_nearby_nomads,

        nearby_radius_km,

        notify_road_safety,

        road_alert_area

      `)

      .eq("id", user.id)

      .maybeSingle();

  if (error) {

    console.error(

      "Could not load notification settings:",

      error

    );

    return;

  }

  if (!profile) return;

  document.getElementById(

    "notifyDirectMessages"

  ).checked =

    profile.notify_direct_messages ?? true;

  document.getElementById(

    "notifyHostMessages"

  ).checked =

    profile.notify_host_messages ?? true;

  document.getElementById(

    "notifyBookingUpdates"

  ).checked =

    profile.notify_booking_updates ?? true;

  document.getElementById(

    "notifyStayReminders"

  ).checked =

    profile.notify_stay_reminders ?? true;

  nearbyToggle.checked =

    profile.notify_nearby_nomads ?? false;

  roadSafetyToggle.checked =

    profile.notify_road_safety ?? true;

  const nearbyRadius =

  profile.nearby_radius_km ?? 5;

if (nearbyRadiusSlider) {

  nearbyRadiusSlider.value = nearbyRadius;

}

if (nearbyRadiusValue) {

  nearbyRadiusValue.textContent =

    `${nearbyRadius} km`;

}

  const roadArea =

    profile.road_alert_area || "both";

  const roadRadio =

    document.querySelector(

      `input[name="roadAlertArea"][value="${roadArea}"]`

    );

  if (roadRadio) {

    roadRadio.checked = true;

  }

  updateNotificationOptionStates();

}

nearbyRadiusSlider?.addEventListener(

  "input",

  () => {

    if (nearbyRadiusValue) {

      nearbyRadiusValue.textContent =

        `${nearbyRadiusSlider.value} km`;

    }

  }

);

nearbyRadiusSlider?.addEventListener(

  "change",

  async () => {

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =

      await supabase

        .from("profiles")

        .update({

          nearby_radius_km:

            Number(nearbyRadiusSlider.value)

        })

        .eq("id", user.id);

    if (error) {

      console.error(

        "Could not save nearby radius:",

        error

      );

    }

  }

);

nearbyToggle?.addEventListener(

  "change",

  async () => {

    updateNotificationOptionStates();

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =

      await supabase

        .from("profiles")

        .update({

          notify_nearby_nomads:

            nearbyToggle.checked

        })

        .eq("id", user.id);

    if (error) {

      console.error(

        "Could not save Nomads Nearby setting:",

        error

      );

    }

  }

);

roadSafetyToggle?.addEventListener(

  "change",

  updateNotificationOptionStates

);

directMessagesToggle?.addEventListener(

  "change",

  async () => {

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =

      await supabase

        .from("profiles")

        .update({

          notify_direct_messages:

            directMessagesToggle.checked

        })

        .eq("id", user.id);

    if (error) {

      console.error(

        "Could not save Direct Messages setting:",

        error

      );

    }

  }

);

hostMessagesToggle?.addEventListener(

  "change",

  async () => {

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =

      await supabase

        .from("profiles")

        .update({

          notify_host_messages:

            hostMessagesToggle.checked

        })

        .eq("id", user.id);

    if (error) {

      console.error(

        "Could not save Host Messages setting:",

        error

      );

    }

  }

);

bookingUpdatesToggle?.addEventListener(

  "change",

  async () => {

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =

      await supabase

        .from("profiles")

        .update({

          notify_booking_updates:

            bookingUpdatesToggle.checked

        })

        .eq("id", user.id);

    if (error) {

      console.error(

        "Could not save Booking Updates setting:",

        error

      );

    }

  }

);

stayRemindersToggle?.addEventListener(

  "change",

  async () => {

    const {

      data: { user }

    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } =

      await supabase

        .from("profiles")

        .update({

          notify_stay_reminders:

            stayRemindersToggle.checked

        })

        .eq("id", user.id);

    if (error) {

      console.error(

        "Could not save Arrival & Stay setting:",

        error

      );

    }

  }

);

loadNotificationPreferences();