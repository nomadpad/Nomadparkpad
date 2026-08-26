document.addEventListener("DOMContentLoaded", () => {
  const createGroupButton = document.getElementById("createGroupButton");
  const createGroupPanel = document.getElementById("createGroupPanel");
  const closeCreateGroup = document.getElementById("closeCreateGroup");

  if (!createGroupButton || !createGroupPanel) {
    console.warn("Groups: create group controls not found.");
    return;
  }

  // Open Create Group panel
  createGroupButton.addEventListener("click", () => {
    createGroupPanel.hidden = false;

    createGroupPanel.scrollIntoView({
      behavior: "smooth",
      block: "start"
    });
  });

  // Close Create Group panel
  if (closeCreateGroup) {
    closeCreateGroup.addEventListener("click", () => {
      createGroupPanel.hidden = true;
    });
  }

  // Select one group map badge
  const iconChoices = document.querySelectorAll(".group-icon-choice");

  iconChoices.forEach((button) => {
    button.addEventListener("click", () => {
      iconChoices.forEach((choice) => {
        choice.classList.remove("selected");
        choice.setAttribute("aria-pressed", "false");
      });

      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");
    });
  });
});