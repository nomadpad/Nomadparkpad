import { supabase } from "./supabase-client.js";

document.addEventListener("DOMContentLoaded", async () => {
  const groupRoomName =
    document.getElementById("groupRoomName");

  const groupRoomDescription =
    document.getElementById("groupRoomDescription");

  const groupRoomBadge =
    document.getElementById("groupRoomBadge");

  const groupRoomJoinCode =
    document.getElementById("groupRoomJoinCode");

  const groupMembersLoading =
    document.getElementById("groupMembersLoading");


  // =========================================
  // GET GROUP ID FROM URL
  // =========================================

  const params = new URLSearchParams(
    window.location.search
  );

  const groupId = params.get("id");


  if (!groupId) {
    groupRoomName.textContent = "Group Not Found";

    groupRoomDescription.textContent =
      "No group was selected.";

    if (groupMembersLoading) {
      groupMembersLoading.innerHTML = `
        <span>⚠️</span>
        <h3>Missing group information</h3>
      `;
    }

    return;
  }


  // =========================================
  // CHECK CURRENT USER
  // =========================================

  const {
    data: { user },
    error: userError
  } = await supabase.auth.getUser();


  if (userError || !user) {
    window.location.href = "login.html";
    return;
  }


  // =========================================
  // LOAD GROUP
  // =========================================

  const {
    data: group,
    error: groupError
  } = await supabase
    .from("traveller_groups")
    .select(`
      id,
      name,
      description,
      badge,
      join_code,
      created_by,
      created_at
    `)
    .eq("id", groupId)
    .single();


  if (groupError || !group) {
    console.error(
      "Group room: unable to load group.",
      groupError
    );

    groupRoomName.textContent =
      "Group Not Available";

    groupRoomDescription.textContent =
      "This group does not exist or you do not have access to it.";

    if (groupMembersLoading) {
      groupMembersLoading.innerHTML = `
        <span>🔒</span>
        <h3>Private group</h3>
        <p>You must be a member of this group to view it.</p>
      `;
    }

    return;
  }


  // =========================================
  // GET THIS USER'S MEMBERSHIP
  // =========================================

  const {
    data: membership,
    error: membershipError
  } = await supabase
    .from("traveller_group_members")
    .select(`
      role,
      joined_at
    `)
    .eq("group_id", groupId)
    .eq("user_id", user.id)
    .maybeSingle();


  if (membershipError) {
    console.error(
      "Group room: membership check failed.",
      membershipError
    );
  }


  // =========================================
  // DISPLAY GROUP
  // =========================================

  groupRoomName.textContent =
    group.name;

  groupRoomDescription.textContent =
    group.description ||
    "Private Nomad Park Pad map group.";

  groupRoomBadge.textContent =
    group.badge || "👥";


  // Only show the private join code
  // to the group owner for now.

  if (
    membership &&
    membership.role === "owner"
  ) {
    groupRoomJoinCode.textContent =
      group.join_code;
  } else {
    groupRoomJoinCode.textContent =
      "PRIVATE";
  }


  // =========================================
  // MEMBER AREA - TEMPORARY
  // =========================================

  if (groupMembersLoading) {
    groupMembersLoading.innerHTML = `
      <span>${group.badge || "👥"}</span>

      <h3>
        ${
          membership?.role === "owner"
            ? "You are the organizer"
            : "You are a member"
        }
      </h3>

      <p>
        Member list coming next.
      </p>
    `;
  }
});