const nearbyToggle =

  document.getElementById("notifyNearbyNomads");

const nearbyOptions =

  document.querySelector(".nearby-radius-options");

const roadSafetyToggle =

  document.getElementById("notifyRoadSafety");

const roadSafetyOptions =

  document.querySelector(".road-alert-options");

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

nearbyToggle?.addEventListener(

  "change",

  updateNotificationOptionStates

);

roadSafetyToggle?.addEventListener(

  "change",

  updateNotificationOptionStates

);

updateNotificationOptionStates();