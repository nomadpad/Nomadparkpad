const roleSelect = document.querySelector("#profile-role");

const payoutSection = document.querySelector("#host-payout-settings");

function updateHostSettings() {

  if (!roleSelect || !payoutSection) return;

  const role = roleSelect.value.toLowerCase();

  payoutSection.hidden = !["host", "both"].includes(role);

}

roleSelect?.addEventListener("change", updateHostSettings);

setTimeout(updateHostSettings, 500);