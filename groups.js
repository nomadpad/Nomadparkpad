import { supabase } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  const createGroupButton = document.getElementById("createGroupButton");
  const createGroupPanel = document.getElementById("createGroupPanel");
  const closeCreateGroup = document.getElementById("closeCreateGroup");

  const saveGroupButton = document.getElementById("saveGroupButton");
  const groupNameInput = document.getElementById("groupName");
  const groupDescriptionInput =
    document.getElementById("groupDescription");

  const groupsList = document.getElementById("groupsList");
  const groupsEmptyState =
    document.getElementById("groupsEmptyState");

  const iconChoices =
    document.querySelectorAll(".group-icon-choice");

  let selectedIcon = "";

  // =========================================
  // OPEN CREATE GROUP PANEL
  // =========================================

  if (createGroupButton && createGroupPanel) {
    createGroupButton.addEventListener("click", () => {
      createGroupPanel.hidden = false;

      createGroupPanel.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  }

  // =========================================
  // CLOSE CREATE GROUP PANEL
  // =========================================

  if (closeCreateGroup && createGroupPanel) {
    closeCreateGroup.addEventListener("click", () => {
      createGroupPanel.hidden = true;
    });
  }

  // =========================================
  // SELECT MAP BADGE
  // =========================================

  iconChoices.forEach((button) => {
    button.addEventListener("click", () => {
      iconChoices.forEach((choice) => {
        choice.classList.remove("selected");
        choice.setAttribute("aria-pressed", "false");
      });

      button.classList.add("selected");
      button.setAttribute("aria-pressed", "true");

      selectedIcon =
        button.dataset.icon ||
        button.textContent.trim();
    });
  });

  // =========================================
  // GENERATE PRIVATE JOIN CODE
  // =========================================

  function generateJoinCode() {
    const characters = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

    let code = "";

    for (let i = 0; i < 6; i += 1) {
      code += characters.charAt(
        Math.floor(Math.random() * characters.length)
      );
    }

    return code;
  }

  // =========================================
  // GET CURRENT USER
  // =========================================

  async function getCurrentUser() {
    const {
      data: { user },
      error
    } = await supabase.auth.getUser();

    if (error) {
      console.error("Groups: unable to get user.", error);
      return null;
    }

    return user;
  }

  // =========================================
  // CREATE GROUP
  // =========================================

  if (saveGroupButton) {
    saveGroupButton.addEventListener("click", async () => {
      const groupName =
        groupNameInput?.value.trim() || "";

      const groupDescription =
        groupDescriptionInput?.value.trim() || "";

      if (!groupName) {
        alert("Please enter a group name.");
        groupNameInput?.focus();
        return;
      }

      if (!selectedIcon) {
        alert("Please choose a map badge.");
        return;
      }

      const user = await getCurrentUser();

      if (!user) {
        alert("Please log in before creating a group.");
        return;
      }

      saveGroupButton.disabled = true;
      saveGroupButton.textContent = "CREATING...";

      try {
        let joinCode = generateJoinCode();

        // Check that the code is not already being used.
        let attempts = 0;

        while (attempts < 5) {
          const { data: existingGroup } = await supabase
            .from("traveller_groups")
            .select("id")
            .eq("join_code", joinCode)
            .maybeSingle();

          if (!existingGroup) {
            break;
          }

          joinCode = generateJoinCode();
          attempts += 1;
        }

        const {
          data: newGroup,
          error: groupError
        } = await supabase
          .from("traveller_groups")
          .insert({
            name: groupName,
            description: groupDescription || null,
            badge: selectedIcon,
            join_code: joinCode,
            created_by: user.id
          })
          .select()
          .single();

        if (groupError) {
          throw groupError;
        }

        // Add the creator as the first member.
        const { error: memberError } = await supabase
          .from("traveller_group_members")
          .insert({
            group_id: newGroup.id,
            user_id: user.id,
            role: "owner"
          });

        if (memberError) {
          console.error(
            "Groups: group created but owner membership failed.",
            memberError
          );
        }

        alert(
          `Group created!\n\nPrivate join code: ${joinCode}`
        );

        if (groupNameInput) {
          groupNameInput.value = "";
        }

        if (groupDescriptionInput) {
          groupDescriptionInput.value = "";
        }

        iconChoices.forEach((choice) => {
          choice.classList.remove("selected");
          choice.setAttribute("aria-pressed", "false");
        });

        selectedIcon = "";

        if (createGroupPanel) {
          createGroupPanel.hidden = true;
        }

        await loadMyGroups();
      } catch (error) {
        console.error("Groups: create group failed.", error);

        alert(
          error?.message ||
          "We couldn't create your group. Please try again."
        );
      } finally {
        saveGroupButton.disabled = false;
        saveGroupButton.textContent = "CREATE MY GROUP";
      }
    });
  }

  // =========================================
  // LOAD MY GROUPS
  // =========================================

  async function loadMyGroups() {
    if (!groupsList || !groupsEmptyState) {
      return;
    }

    const user = await getCurrentUser();

    if (!user) {
      return;
    }

    const {
      data: memberships,
      error
    } = await supabase
      .from("traveller_group_members")
      .select(`
        role,
        traveller_groups (
          id,
          name,
          description,
          badge,
          join_code,
          created_by
        )
      `)
      .eq("user_id", user.id);

    if (error) {
      console.error("Groups: unable to load groups.", error);
      return;
    }

    groupsList.innerHTML = "";

    if (!memberships || memberships.length === 0) {
      groupsEmptyState.hidden = false;
      return;
    }

    groupsEmptyState.hidden = true;

    memberships.forEach((membership) => {
      const group = membership.traveller_groups;

      if (!group) {
        return;
      }

      const card = document.createElement("article");
      card.className = "group-card";

      const icon = document.createElement("div");
      icon.className = "group-card-icon";
      icon.textContent = group.badge || "👥";

      const content = document.createElement("div");
      content.className = "group-card-content";

      const title = document.createElement("h3");
      title.textContent = group.name;

      const description = document.createElement("p");

      description.textContent =
        group.description ||
        "Private Nomad Park Pad map group.";

      content.appendChild(title);
      content.appendChild(description);

      // Show the private code to the group owner.
      if (membership.role === "owner") {
        const code = document.createElement("div");
        code.className = "group-join-code";

        code.innerHTML = `
          <span>PRIVATE JOIN CODE</span>
          <strong>${group.join_code}</strong>
        `;

        content.appendChild(code);
      }

// Open this group's private room.
const viewGroupButton = document.createElement("a");

viewGroupButton.className = "group-view-button";

viewGroupButton.href =
  `group.html?id=${encodeURIComponent(group.id)}`;

viewGroupButton.textContent = "VIEW GROUP";

content.appendChild(viewGroupButton);

      card.appendChild(icon);
      card.appendChild(content);

      groupsList.appendChild(card);
    });
  }

  // =========================================
  // INITIAL LOAD
  // =========================================

  await loadMyGroups();
});