const $ = (id) => document.getElementById(id);

const views = {
  intro: $("introView"),
  alliance: $("allianceView"),
  roster: $("rosterView")
};

const els = {
  introContinue: $("introContinue"),
  dataPath: $("dataPath"),

  allianceList: $("allianceList"),
  allianceList2: $("allianceList2"),
  addAllianceBtn: $("addAllianceBtn"),

  allianceTitle: $("allianceTitle"),
  allianceInfo: $("allianceInfo"),
  viewRosterBtn: $("viewRosterBtn"),

  backToAllianceBtn: $("backToAllianceBtn"),

  rosterAllianceTitle: $("rosterAllianceTitle"),
  rosterSearch: $("rosterSearch"),
  rosterBody: $("rosterBody"),

  addMemberBtn: $("addMemberBtn"),
  editMemberBtn: $("editMemberBtn"),
  removeMemberBtn: $("removeMemberBtn"),

  memberModal: $("memberModal"),
  modalTitle: $("modalTitle"),
  modalCancel: $("modalCancel"),
  modalSave: $("modalSave"),

  mGid: $("mGid"),
  mName: $("mName"),
  mAlias: $("mAlias"),
  mTC: $("mTC"),
  mPower: $("mPower"),
  mMystic: $("mMystic"),
  mNotes: $("mNotes")
};


function displayMemberName(member) {
  const name = (member?.name ?? "").trim();
  const alias = (member?.alias ?? "").trim();
  if (name && alias) return `${name} (${alias})`;
  return name || alias || "";
}

function matchesSearch(member, q) {
  if (!q) return true;
  const s = q.toLowerCase();
  const name = (member?.name ?? "").toLowerCase();
  const alias = (member?.alias ?? "").toLowerCase();
  const gid = String(member?.gid ?? "").toLowerCase();
  return name.includes(s) || alias.includes(s) || gid.includes(s);
}

let data = { alliances: [] };

const state = {
  currentAllianceId: null,
  selectedMemberId: null,
  sortKey: "power",
  sortDir: "desc",
  search: "",
  modalMode: "add" // "add" | "edit"
};

function showView(name) {
  Object.values(views).forEach(v => v.classList.add("hidden"));
  views[name].classList.remove("hidden");
}

function normalizeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function newId() {
  return (crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`);
}

function getAlliance() {
  return data.alliances.find(a => a.id === state.currentAllianceId) ?? null;
}

async function loadData() {
  data = await window.kingshotAPI.loadData();
}

async function saveData() {
  await window.kingshotAPI.saveData(data);
}

function renderAllianceList(targetEl, activeId) {
  targetEl.innerHTML = "";
  for (const a of data.alliances) {
    const btn = document.createElement("button");
    btn.className = "listItem" + (a.id === activeId ? " active" : "");
    btn.textContent = a.displayName ?? a.id;
    btn.onclick = () => selectAlliance(a.id);
    targetEl.appendChild(btn);
  }
}

function selectAlliance(id) {
  state.currentAllianceId = id;
  state.selectedMemberId = null;

  const a = getAlliance();
  els.allianceTitle.textContent = a ? (a.displayName ?? a.id) : "—";
  els.allianceInfo.textContent = a ? (a.info ?? "") : "Select an alliance.";
  els.viewRosterBtn.disabled = !a;

  renderAllianceList(els.allianceList, state.currentAllianceId);
  renderAllianceList(els.allianceList2, state.currentAllianceId);
}

function openRoster() {
  const a = getAlliance();
  if (!a) return;

  state.selectedMemberId = null;
  els.editMemberBtn.disabled = true;
  els.removeMemberBtn.disabled = true;

  els.rosterAllianceTitle.textContent = `${a.displayName ?? a.id} Roster`;
  showView("roster");
  renderRoster();
}

function sortMembers(members) {
  const key = state.sortKey;
  const dir = (state.sortDir === "asc") ? 1 : -1;

  return [...members].sort((a, b) => {
    if (key === "name") {
      const av = (a.name ?? "").toLowerCase();
      const bv = (b.name ?? "").toLowerCase();
      return av.localeCompare(bv) * dir;
    }

    const av = normalizeNum(a[key]);
    const bv = normalizeNum(b[key]);

    if (av === bv) {
      // tie breakers: power desc, mystic desc, tc desc, name asc
      const t1 = normalizeNum(b.power) - normalizeNum(a.power);
      if (t1 !== 0) return t1;
      const t2 = normalizeNum(b.mystic) - normalizeNum(a.mystic);
      if (t2 !== 0) return t2;
      const t3 = normalizeNum(b.tc) - normalizeNum(a.tc);
      if (t3 !== 0) return t3;
      return (a.name ?? "").localeCompare(b.name ?? "");
    }

    return (av - bv) * dir;
  });
}

function applySearch(members) {
  const q = (state.search ?? "").trim().toLowerCase();
  if (!q) return members;
  return members.filter(m => (m.name ?? "").toLowerCase().includes(q));
}

function renderSortHeaders() {
  document.querySelectorAll("th.sortable").forEach(th => {
    th.classList.toggle("activeSort", th.dataset.key === state.sortKey);
  });
}

function renderRoster() {
  const a = getAlliance();
  if (!a) return;

  renderSortHeaders();

  const members = a.members ?? [];
  const filtered = applySearch(members);
  const sorted = sortMembers(filtered);

  els.rosterBody.innerHTML = "";
  for (const m of sorted) {
    const tr = document.createElement("tr");
    tr.classList.toggle("selected", m.id === state.selectedMemberId);

    tr.innerHTML = `
      <td>${normalizeNum(m.tc)}</td>
      <td>${m.name ?? ""}</td>
      <td>${normalizeNum(m.power).toLocaleString()}</td>
      <td>${normalizeNum(m.mystic)}</td>
      <td>${m.notes ?? ""}</td>
    `;

    tr.onclick = () => {
      state.selectedMemberId = m.id;
      els.editMemberBtn.disabled = false;
      els.removeMemberBtn.disabled = false;
      renderRoster();
    };

    els.rosterBody.appendChild(tr);
  }
}

function openMemberModal(mode) {
  const a = getAlliance();
  if (!a) return;

  state.modalMode = mode;

  if (mode === "add") {
    els.modalTitle.textContent = "Add Member";
    els.mGid.value = "";
    els.mName.value = "";
  if (els.mAlias) els.mAlias.value = "";
    els.mTC.value = "";
    els.mPower.value = "";
    els.mMystic.value = "";
    els.mNotes.value = "";
  } else {
    const m = (a.members ?? []).find(x => x.id === state.selectedMemberId);
    if (!m) return;

    els.modalTitle.textContent = "Edit Member";
    els.mGid.value = m.gid ?? "";
    els.mName.value = m.name ?? "";
    els.mTC.value = normalizeNum(m.tc);
    els.mPower.value = normalizeNum(m.power);
    els.mMystic.value = normalizeNum(m.mystic);
    els.mNotes.value = m.notes ?? "";
  }

  els.memberModal.classList.remove("hidden");
}

function closeMemberModal() {
  els.memberModal.classList.add("hidden");
}

async function saveMemberFromModal() {
  const a = getAlliance();
  if (!a) return;

  const gid = els.mGid.value.trim();
  const name = els.mName.value.trim();

  if (!name) {
    alert("Name is required.");
    return;
  }

  const memberData = {
    gid: gid || null,
    name,
    tc: normalizeNum(els.mTC.value),
    power: normalizeNum(els.mPower.value),
    mystic: normalizeNum(els.mMystic.value),
    notes: els.mNotes.value.trim(),
    updatedAt: Date.now()
  };

  a.members = a.members ?? [];

  if (state.modalMode === "add") {
    // id strategy:
    // - if gid is supplied, use it as id (stable)
    // - otherwise generate a local uuid
    const id = gid || newId();

    // prevent duplicate gid/id
    if (a.members.some(m => m.id === id || (gid && m.gid === gid))) {
      alert("Duplicate ID/GID in this alliance.");
      return;
    }

    a.members.push({ id, ...memberData });
  } else {
    const idx = a.members.findIndex(m => m.id === state.selectedMemberId);
    if (idx < 0) return;

    const existing = a.members[idx];

    // if editing gid and it collides with someone else, block it
    if (gid && a.members.some(m => m.id !== existing.id && (m.gid === gid || m.id === gid))) {
      alert("That GID is already used by another member.");
      return;
    }

    // keep internal id stable unless you *want* id to become gid
    a.members[idx] = {
      ...existing,
      ...memberData,
      gid: gid || null
    };
  }

  await saveData();
  closeMemberModal();
  renderRoster();
}

// ----- events -----
document.addEventListener("DOMContentLoaded", async () => {
  await loadData();

  els.dataPath.textContent = `Data file: ${await window.kingshotAPI.dataPath()}`;

  // default view
  showView("intro");

  // if at least one alliance exists, preselect first
  if (data.alliances.length > 0) {
    selectAlliance(data.alliances[0].id);
  }

  // alliance lists
  renderAllianceList(els.allianceList, state.currentAllianceId);
  renderAllianceList(els.allianceList2, state.currentAllianceId);
});

els.introContinue.onclick = () => {
  showView("alliance");
  renderAllianceList(els.allianceList, state.currentAllianceId);
};

els.viewRosterBtn.onclick = openRoster;

els.backToAllianceBtn.onclick = () => {
  showView("alliance");
};

els.rosterSearch.addEventListener("input", (e) => {
  state.search = e.target.value;
  renderRoster();
});

document.querySelectorAll("th.sortable").forEach(th => {
  th.addEventListener("click", () => {
    const key = th.dataset.key;

    if (state.sortKey === key) {
      state.sortDir = (state.sortDir === "asc") ? "desc" : "asc";
    } else {
      state.sortKey = key;
      state.sortDir = (key === "name") ? "asc" : "desc";
    }
    renderRoster();
  });
});

els.addMemberBtn.onclick = () => openMemberModal("add");
els.editMemberBtn.onclick = () => openMemberModal("edit");

els.removeMemberBtn.onclick = async () => {
  const a = getAlliance();
  if (!a) return;

  const m = (a.members ?? []).find(x => x.id === state.selectedMemberId);
  if (!m) return;

  if (!confirm(`Remove ${m.name}?`)) return;

  a.members = a.members.filter(x => x.id !== m.id);
  state.selectedMemberId = null;

  await saveData();
  renderRoster();
};

els.modalCancel.onclick = closeMemberModal;
els.modalSave.onclick = saveMemberFromModal;

// Quick alliance add (barebones)
els.addAllianceBtn.onclick = async () => {
  const id = prompt("Alliance ID/tag (e.g., VAL, KOR):")?.trim();
  if (!id) return;

  if (data.alliances.some(a => a.id === id)) {
    alert("Alliance already exists.");
    return;
  }

  data.alliances.push({
    id,
    displayName: id,
    info: "",
    members: []
  });

  await saveData();
  selectAlliance(id);
  renderAllianceList(els.allianceList, state.currentAllianceId);
  renderAllianceList(els.allianceList2, state.currentAllianceId);
};