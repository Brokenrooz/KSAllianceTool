const $ = (id) => document.getElementById(id);

const UNASSIGNED_TAG = "__UNASSIGNED__"; //-- fake alliance for profiles with no assigned alliance tag.

const views = {
  home: $("homeView"),
  alliance: $("allianceView"),
  roster: $("rosterView"),
  leaderboard: $("leaderboardView"),
  update: $("updateView"),
  profile: $("profileView"),
};

const els = {
  // Home
  navAlliancesBtn: $("navAlliancesBtn"),
  navLeaderboardBtn: $("navLeaderboardBtn"),
  navUpdateBtn: $("navUpdateBtn"),
  homeHint: $("homeHint"),

  // Alliance view
  allianceList: $("allianceList"),
  addAllianceBtn: $("addAllianceBtn"),
  editAllianceBtn: $("editAllianceBtn"),
  removeAllianceBtn: $("removeAllianceBtn"),
  viewRosterBtn: $("viewRosterBtn"),
  allianceTitle: $("allianceTitle"),
  allianceInfo: $("allianceInfo"),
  backHomeFromAlliancesBtn: $("backHomeFromAlliancesBtn"),

  // Roster view
  allianceList2: $("allianceList2"),
  backToAllianceBtn: $("backToAllianceBtn"),
  backHomeFromRosterBtn: $("backHomeFromRosterBtn"),
  rosterAllianceTitle: $("rosterAllianceTitle"),
  rosterSearch: $("rosterSearch"),
  rosterBody: $("rosterBody"),
  addMemberBtn: $("addMemberBtn"),
  editMemberBtn: $("editMemberBtn"),
  removeMemberBtn: $("removeMemberBtn"),
  viewProfileBtn: $("viewProfileBtn"),
  openUpdateFromRosterBtn: $("openUpdateFromRosterBtn"),

  // Advanced Profile View
  backtoRosterFromProfileBtn: $("backToRosterFromProfileBtn"),
  backHomeFromProfileBtn: $("backHomeFromProfileBtn"),
  profileTitle: $("profileTitle"),
  profileMeta: $("profileMeta"),
  profileGovSlots: $("profileGovSlots"),
  hero0Name: $("hero0Name"),
  hero1Name: $("hero1Name"),
  hero2Name: $("hero2Name"),
  govTotalsBox: $("govTotalsBox"),
  heroTotalsBox: $("heroTotalsBox"),
  gearTooltip: $("gearTooltip"),

  // Leaderboard view
  backHomeFromLeaderboardBtn: $("backHomeFromLeaderboardBtn"),
  leaderboardSearch: $("leaderboardSearch"),
  leaderboardBody: $("leaderboardBody"),

  // Update view
  backHomeFromUpdateBtn: $("backHomeFromUpdateBtn"),
  goAlliancesFromUpdateBtn: $("goAlliancesFromUpdateBtn"),
  uGid: $("uGid"),
  addUserBtn: $("addUserBtn"),        // now "GID or Name" lookup
  uPower: $("uPower"),
  uMystic: $("uMystic"),
  uSuggest: $("uSuggest"),
  applyUpdateBtn: $("applyUpdateBtn"),
  clearUpdateBtn: $("clearUpdateBtn"),
  importPatchBtn: $("importPatchBtn"),
  exportPatchBtn: $("exportPatchBtn"),
  importPatchFile: $("importPatchFile"),
  updateResult: $("updateResult"),
  updateDeltaBox: $("updateDeltaBox"),
  // Add User modal
  addUserModal: $("addUserModal"),
  auGid: $("auGid"),
  auAlliance: $("auAlliance"),
  auName: $("auName"),
  auAlias: $("auAlias"),
  auTC: $("auTC"),
  auPower: $("auPower"),
  auMystic: $("auMystic"),
  auNotes: $("auNotes"),
  auError: $("auError"),
  auCancel: $("auCancel"),
  auSave: $("auSave"),

  // Member modal
  memberModal: $("memberModal"),
  modalTitle: $("modalTitle"),
  modalCancel: $("modalCancel"),
  modalSave: $("modalSave"),
  mGid: $("mGid"),
  mName: $("mName"),
  aliasBlock: $("aliasBlock") || $("aliasRow"),
  mAlias: $("mAlias"),
  mTC: $("mTC"),
  mPower: $("mPower"),
  mMystic: $("mMystic"),
  mNotes: $("mNotes"),

  // Alliance modal
  allianceModal: $("allianceModal"),
  allianceModalTitle: $("allianceModalTitle"),
  aTag: $("aTag"),
  aName: $("aName"),
  aInfo: $("aInfo"),
  aUseAlias: $("aUseAlias"),
  allianceCancel: $("allianceCancel"),
  allianceSave: $("allianceSave"),

  // Remove alliance modal
  removeAllianceModal: $("removeAllianceModal"),
  removeAllianceText: $("removeAllianceText"),
  removeAllianceInput: $("removeAllianceInput"),
  removeAllianceCancel: $("removeAllianceCancel"),
  removeAllianceConfirmBtn: $("removeAllianceConfirmBtn"),
};

let data = { alliances: [], players: {} };

const state = {
  currentAllianceId: null,
  selectedMemberId: null,

  profileGid: null,
  profileBackView: "roster",

  sortKey: "power",
  sortDir: "desc",
  search: "",

  // Leaderboard view state
  leaderSearch: "",
  leaderSortKey: "power",
  leaderSortDir: "desc",

  memberModalMode: "add",
  allianceModalMode: "add",
  allianceEditOriginalTag: null,
};

// ---------- view helpers ----------
function showView(name) {
  Object.values(views).forEach(v => v?.classList.add("hidden"));
  views[name]?.classList.remove("hidden");
}

// ---------- numeric helpers ----------
function normalizeNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function newId() {
  return crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ---------- TC helpers ----------
function normalizeTc(raw) {
  const s = String(raw ?? "").trim().toUpperCase();
  if (!s) return { label: "", rank: 0 };

  const tg = s.match(/^(?:TG|TRUEGOLD)\s*([1-5])$/);
  if (tg) {
    const n = parseInt(tg[1], 10);
    return { label: `TG${n}`, rank: 30 + n };
  }

  const n = parseInt(s, 10);
  if (Number.isFinite(n) && String(n) === s && n >= 1 && n <= 30) {
    return { label: String(n), rank: n };
  }

  return { label: "", rank: 0 };
}
const tcLabel = (raw) => normalizeTc(raw).label;
const tcRank = (raw) => normalizeTc(raw).rank;

// ---------- power helpers ----------
function parsePowerInput(raw) {
  const s0 = String(raw ?? "").trim().toLowerCase().replace(/,/g, "");
  if (!s0) return null;

  const suf = s0.match(/^([0-9]*\.?[0-9]+)\s*([kmb])$/i);
  if (suf) {
    const num = parseFloat(suf[1]);
    const unit = suf[2].toLowerCase();
    if (!Number.isFinite(num)) return null;
    const mult = unit === "k" ? 1e3 : unit === "m" ? 1e6 : 1e9;
    return Math.round(num * mult);
  }

  if (s0.includes(".")) {
    const num = parseFloat(s0);
    if (!Number.isFinite(num)) return null;
    return Math.round(num * 1e6);
  }

  const n = parseInt(s0, 10);
  if (!Number.isFinite(n)) return null;

  if (s0.length <= 4) return Math.round(n * 1e6);
  return Math.round(n);
}

function formatPower(nRaw) {
  const n = normalizeNum(nRaw);

  const fmt = (value, div, suffix) => {
    const v = value / div;
    const isInt = Math.abs(v - Math.round(v)) < 1e-9;
    return `${isInt ? Math.round(v) : v.toFixed(1)}${suffix}`;
  };

  if (n >= 1e9) return fmt(n, 1e9, "b");
  if (n >= 1e6) return fmt(n, 1e6, "m");
  if (n >= 1e3) return fmt(n, 1e3, "k");
  return String(Math.round(n));
}

function formatDeltaNum(diff, formatter) {
  if (diff === 0) return "no change";
  const sign = diff > 0 ? "+" : "-";
  return `${sign}${formatter(Math.abs(diff))}`;
}

function formatDeltaPower(diff) {
  if (diff === 0) return "no change";
  const sign = diff > 0 ? "+" : "-";
  return `${sign}${formatPower(Math.abs(diff))}`;
}

// ---------- data model / migration ----------
function ensurePlayersStore() {
  if (!data.players || typeof data.players !== "object") data.players = {};
}

function migrateAlliance(a) {
  // Older schema: {id/displayName} etc.
  if (!a.tag) a.tag = a.id ?? "";
  if (!a.name) a.name = a.name ?? a.displayName ?? a.tag ?? "";
  if (!a.id) a.id = a.tag;
  if (!Array.isArray(a.members)) a.members = [];
  if (a.info == null) a.info = "";
  if (typeof a.useAlias !== "boolean") a.useAlias = true;
  return a;
}

function allianceLabel(a) {
  const tag = (a.tag ?? a.id ?? "").toUpperCase();
  const name = a.name ?? a.displayName ?? tag;
  return `[${tag}] ${name}`;
}

function getUnassignedMembers() {
  // Global profiles that are NOT in any roster and have no allianceTag ("None"/blank). -X
  ensurePlayersStore();
  const inRoster = new Set();
  for (const a of (data.alliances ?? [])) for (const m of (a.members ?? [])) {
    const gid = String(m.gid ?? m.id ?? "").trim();
    if (gid) inRoster.add(gid);
  }
  const rows = [];
  for (const [gid, p] of Object.entries(data.players ?? {})) {
    if (!gid) continue;
    if (inRoster.has(gid)) continue;
    const tag = String(p.allianceTag ?? "").trim();
    if (tag && tag !== "None") continue;
    rows.push({
      id: gid, gid,
      name: (p.name ?? "").trim(),
      alias: (p.alias ?? "").trim(),
      tc: p.tc ?? "",
      power: normalizeNum(p.power),
      mystic: normalizeNum(p.mystic),
      notes: (p.notes ?? "").trim(),
      updatedAt: normalizeNum(p.updatedAt) || 0,
    });
  }
  return rows;
}

function getAllianceByTag(tag) {
  if (tag === UNASSIGNED_TAG) {
    return {
      id: UNASSIGNED_TAG,
      tag: "None",
      name: "Unassigned",
      info: "Profiles with no alliance tag assigned.",
      members: getUnassignedMembers(),
    };
  }
  return data.alliances.find(a => (a.id ?? a.tag) === tag) ?? null;
}

function getCurrentAlliance() {
  return getAllianceByTag(state.currentAllianceId);
}

function setAllianceButtonsEnabled(enabled) {
  els.viewRosterBtn.disabled = !enabled;
  els.editAllianceBtn.disabled = !enabled;
  els.removeAllianceBtn.disabled = !enabled;
}

function upsertPlayerProfileFromMember(m) {
  ensurePlayersStore();
  const gid = String(m?.gid ?? m?.id ?? "").trim();
  if (!gid) return;

  const profile = {
    gid,
    name: (m.name ?? "").trim(),
    alias: (m.alias ?? "").trim(),
    tc: tcLabel(m.tc),
    power: normalizeNum(m.power),
    mystic: normalizeNum(m.mystic),
    notes: (m.notes ?? "").trim(),
    updatedAt: normalizeNum(m.updatedAt) || Date.now(),
  };

  const existing = data.players[gid];
  if (existing) {
    data.players[gid] = {
      ...existing,
      ...Object.fromEntries(Object.entries(profile).filter(([k, v]) => {
        if (k === "power" || k === "mystic" || k === "updatedAt") return true;
        return v !== "" && v != null;
      }))
    };
  } else {
    data.players[gid] = profile;
  }
}

function migratePlayersFromRosters() {
  ensurePlayersStore();
  for (const a of data.alliances) {
    for (const m of (a.members ?? [])) {
      const gid = String(m.gid ?? m.id ?? "").trim();
      if (gid) {
        m.gid = gid;
        m.id = gid; // enforce stability
      }
      upsertPlayerProfileFromMember(m);
    }
  }
}

// ---------- persistence ----------
async function loadData() {
  data = await window.kingshotAPI.loadData();
  if (!data || typeof data !== "object" || !Array.isArray(data.alliances)) {
    data = { alliances: [], players: {} };
  }
  data.alliances = data.alliances.map(migrateAlliance);
  ensurePlayersStore();
  migratePlayersFromRosters();
}

async function saveData() {
  ensurePlayersStore();
  await window.kingshotAPI.saveData(data);
}

// ---------- rendering (alliances) ----------
function renderAllianceList(targetEl, activeTag) {
  if (!targetEl) return;
  targetEl.innerHTML = "";

  const calcAlliancePower = (a) => (a?.members ?? []).reduce((sum, m) => sum + normalizeNum(m?.power), 0); // sum member power
  const alliancesSorted = [...(data.alliances ?? [])].sort((a, b) => {
    const d = calcAlliancePower(b) - calcAlliancePower(a);
    if (d !== 0) return d;
    return String(a?.tag ?? a?.id ?? "").localeCompare(String(b?.tag ?? b?.id ?? ""));
  });

  for (const a of alliancesSorted) {
    const tag = (a.id ?? a.tag);
    const btn = document.createElement("button");
    btn.className = "listItem" + (tag === activeTag ? " active" : "");
    btn.textContent = allianceLabel(a);
    btn.onclick = () => selectAlliance(tag);
    targetEl.appendChild(btn);
  }

  // Pseudo-tab: profiles that exist only in global cache with no allianceTag. -X
  const unassignedCount = getUnassignedMembers().length;
  const ubtn = document.createElement("button");
  ubtn.className = "listItem" + (UNASSIGNED_TAG === activeTag ? " active" : "");
  ubtn.textContent = unassignedCount ? `[None] Unassigned (${unassignedCount})` : "[None] Unassigned";
  ubtn.onclick = () => selectAlliance(UNASSIGNED_TAG);
  targetEl.appendChild(ubtn);
}

function selectAlliance(tag) {
  state.currentAllianceId = tag;
  state.selectedMemberId = null;

  const a = getCurrentAlliance();
  if (!a) {
    els.allianceTitle.textContent = "—";
    els.allianceInfo.textContent = "Select an alliance.";
    setAllianceButtonsEnabled(false);
  } else {
    if (tag === UNASSIGNED_TAG) {
      els.allianceTitle.textContent = "[None] Unassigned";
      els.allianceInfo.textContent = a.info ?? "Profiles with no alliance tag assigned.";
      setAllianceButtonsEnabled(true);
      if (els.editAllianceBtn) els.editAllianceBtn.disabled = true; // pseudo-alliance -X
      if (els.removeAllianceBtn) els.removeAllianceBtn.disabled = true; // pseudo-alliance -X
    } else {
      els.allianceTitle.textContent = allianceLabel(a);
      els.allianceInfo.textContent = a.info ?? "";
      setAllianceButtonsEnabled(true);
    }
  }

  renderAllianceList(els.allianceList, state.currentAllianceId);
  renderAllianceList(els.allianceList2, state.currentAllianceId);

  if (!views.roster.classList.contains("hidden")) {
    state.search = "";
    els.rosterSearch.value = "";
    openRoster(false);
  }
}

// ---------- roster ----------
function effectiveNameForSort(m, useAlias) {
  if (useAlias) {
    const a = (m.alias ?? "").trim();
    if (a) return a;
  }
  return (m.name ?? "").trim();
}

function displayName(m, useAlias) {
  const n = (m.name ?? "").trim();
  const a = (m.alias ?? "").trim();
  if (useAlias && a) return `${n} (${a})`;
  return n;
}

function applySearch(members, useAlias) {
  const q = (state.search ?? "").trim().toLowerCase();
  if (!q) return members;
  return members.filter(m => {
    const name = (m.name ?? "").toLowerCase();
    const alias = (m.alias ?? "").toLowerCase();
    return name.includes(q) || (useAlias && alias.includes(q));
  });
}

function powerRankList(members) {
  // Returns array of member ids sorted by power desc with tie breakers
  return [...members].sort((a, b) => {
    const p = normalizeNum(b.power) - normalizeNum(a.power);
    if (p !== 0) return p;
    const my = normalizeNum(b.mystic) - normalizeNum(a.mystic);
    if (my !== 0) return my;
    const tc = tcRank(b.tc) - tcRank(a.tc);
    if (tc !== 0) return tc;
    return effectiveNameForSort(a, false).localeCompare(effectiveNameForSort(b, false));
  }).map(m => m.id);
}

function sortMembers(members, useAlias, rankMap) {
  const key = state.sortKey;
  const dir = state.sortDir === "asc" ? 1 : -1;

  return [...members].sort((a, b) => {
    if (key === "name") {
      return effectiveNameForSort(a, useAlias).toLowerCase()
        .localeCompare(effectiveNameForSort(b, useAlias).toLowerCase()) * dir;
    }

    if (key === "tc") {
      return (tcRank(a.tc) - tcRank(b.tc)) * dir;
    }

    if (key === "rank") {
      // rank: smaller is better
      const ra = rankMap[a.id] ?? 999999;
      const rb = rankMap[b.id] ?? 999999;
      return (ra - rb) * dir;
    }

    const av = normalizeNum(a[key]);
    const bv = normalizeNum(b[key]);
    return (av - bv) * dir;
  });
}

function renderSortHeaders() {
  document.querySelectorAll("th.sortable").forEach(th => {
    th.classList.toggle("activeSort", th.dataset.key === state.sortKey);
  });
}

function openRoster(forceShow = true) {
  const a = getCurrentAlliance();
  if (!a) return;

  state.selectedMemberId = null;
  els.editMemberBtn.disabled = true;
  els.removeMemberBtn.disabled = true;
  if (els.viewProfileBtn) els.viewProfileBtn.disabled = true;

  // Special title for the unassigned pseudo-tab.
  els.rosterAllianceTitle.textContent =
    (state.currentAllianceId === UNASSIGNED_TAG)
      ? "[None] Unassigned Roster"
      : `${allianceLabel(a)} Roster`;

  if (forceShow) showView("roster");
  renderRoster();
}

function renderRoster() {
  const a = getCurrentAlliance();
  if (!a) return;

  renderSortHeaders();

  const members = a.members ?? [];
  const useAlias = true;

  const filtered = applySearch(members, useAlias);
  const rankedIds = powerRankList(filtered);
  const rankMap = Object.fromEntries(rankedIds.map((id, idx) => [id, idx + 1]));

  const sorted = sortMembers(filtered, useAlias, rankMap);

  els.rosterBody.innerHTML = "";
  for (const m of sorted) {
    const tr = document.createElement("tr");
    tr.classList.toggle("selected", m.id === state.selectedMemberId);

    const fullPower = normalizeNum(m.power).toLocaleString();
    const rank = rankMap[m.id] ?? "";

    tr.innerHTML = `
      <td>${tcLabel(m.tc)}</td>
      <td>${displayName(m, useAlias)}</td>
      <td>${rank}</td>
      <td title="${fullPower}">${formatPower(m.power)}</td>
      <td>${normalizeNum(m.mystic)}</td>
      <td>${m.notes ?? ""}</td>
    `;

    tr.ondblclick = () => {
      openProfileView(m.id, "roster");
    };

    tr.onclick = () => {
      state.selectedMemberId = m.id;
      els.editMemberBtn.disabled = false;
      els.removeMemberBtn.disabled = false;
      if (els.viewProfileBtn) els.viewProfileBtn.disabled = false;
      renderRoster();
    };

    els.rosterBody.appendChild(tr);
  }
}

// ---------- profile view (advanced)   ----------
function openProfileView(gid, backView = "roster") {
  const id = String(gid ?? "").trim();
  if (!id) return;
  state.profileGid = id;
  state.profileBackView = backView;
  showView("profile");
  renderProfileView();
}

function closeProfileView() {
  const back = state.profileVackView ?? "roster";
  showView(back);
  if (back === "roster") renderRoster();
  if (back === "leaderboard") renderLeaderboard();
}

function findMemberRecordByGid(gid) {
  const id = String(gid ?? "").trim();
  if (!id) return null;

  // prefer current alliance context
  const cur = getCurrentAlliance();
  if (cur && state.currentAllianceId !== UNASSIGNED_TAG) {
    const m = (cur.members ?? []).find(x => String(x.gid ?? x.id ?? "").trim() === id);
    if (m) return { member: m, alliance: cur, source: "currentRoster" };
  }

  // search alliance all
  for (const a of (data.alliances ?? [])) {
    const m = (a.members ?? []).find(x => String(x.gid ?? x.id ?? "").trim() === id);
    if (m) return { member: m, alliance: a, source: "anyRoster" };
  }

  // fallback: global profile(s) cache
  ensurePlayersStore();
  const p = data.players?.[id];
  if (p) return { member: p, alliance: null, source: "players" };

  return null;
}

function buildSlotTooltip(slotData, label) {
  if (!slotData) return `${label}\n\nEmpty slot.`;
  const lines = [];
  lines.push(slotData.name ?? label);
  if (slotData.tier != null) lines.push(`Tier: ${slotData.tier}`);
  if (slotData.level != null) lines.push(`Level: ${slotData.level}`);
  if (slotData.charm) lines.push(`Charm: ${slotData.charm}${slotData.charmLevel ? ` (Lv.${slotData.charmLevel})` : ""}`);
  if (slotData.stats && typeof slotData.stats === "object") {
    lines.push("");
    for (const [k, v] of Object.entries(slotData.stats)) {
      lines.push(`${k}: +${v}`);
    }
  }
  return lines.join("\n");
}

function showGearTooltip(text, x, y) {
  if (!els.gearTooltip) return;
  els.gearTooltip.textContent = text;
  els.gearTooltip.classList.remove("hidden");
  moveGeartooltip(x, y);
}

function moveGearTooltip(x, y) {
  if (!els.gearTooltip) return;
  const pad = 14;
  els.gearTooltip.style.left = `${x + pad}px`;
  els.gearTooltip.style.top = `${y + pad}px`;
}

function hideGearTooltip() {
  if (!els.gearTooltip) return;
  els.gearTooltip.classList.add("hidden");
}

function renderProfileView() {
  const gid = state.profileGid;
  const rec = findMemberRecordByGid(gid);

  if (!rec) {
    if (els.profileTitle) els.profileTitle.textContent = "Member Profile";
    if (els.profileMeta) els.profileMeta.textContent = `Not found for GID: ${gid}`;
    return;
  }

  const useAlias = true;
  const m = rec.member;
  const a = rec.alliance;

  const tag = a ? (a.tag ?? a.id ?? "") : (m.allianceTag ?? "None");
  const nameLabel = displayName(m, useAlias);
  const levelLabel = tcLabel(m.tc);
  const powerLabel = formatPower(m.power);
  const mysticLabel = normalizeNum(m.mystic);

  if (els.profileTitle) els.profileTitle.textContent = `${nameLabel} — Profile`;
  if (els.profileMeta) {
    const left = (tag && tag !== "None") ? `[${tag}]` : "[None]";
    els.profileMeta.textContent = `${left}  •  TC/TG: ${levelLabel}  •  Power: ${powerLabel}  •  Mystic: ${mysticLabel}  •  GID: ${gid}`;
  }

  // Pull profile/gear data from global cache if existing
  ensurePlayersStore();
  const p = data.players?.[gid] ?? {};
  const prof = p.profile ?? p.gear ?? {};
  const governor = prof.governor ?? prof.gov ?? {};
  const govSlots = governor.slots ?? {};

  // Wire governor slots
  if (els.profileGovSlots) {
    els.profileGovSlots.querySelectorAll(".gearSlot").forEach(el => {
      const slotKey = el.dataset.slot;
      const slotData = govSlots?.[slotKey];
      el.textContent = slotData?.short ?? el.textContent;
      const tip = buildSlotTooltip(slotData, `Governor Slot ${slotKey}`);
      el.onmouseenter = (e) => showGearTooltip(tip, e.clientX, e.clientY);
      el.onmousemove = (e) => moveGearTooltip(e.clientX, e.clientY);
      el.onmouseleave = () => hideGearTooltip();
    });
  }

  // Heroes 
  const heroes = prof.heroes ?? [];
  if (els.hero0Name) els.hero0Name.textContent = heroes?.[0]?.name ?? "Hero 1";
  if (els.hero1Name) els.hero1Name.textContent = heroes?.[1]?.name ?? "Hero 2";
  if (els.hero2Name) els.hero2Name.textContent = heroes?.[2]?.name ?? "Hero 3";

  // Totals placeholders
  if (els.govTotalsBox) els.govTotalsBox.textContent = "Governor totals: (no data yet)";
  if (els.heroTotalsBox) els.heroTotalsBox.textContent = "Hero totals: (no data yet)";
}

// ---------- leaderboard (all members) ----------
function collectLeaderboardRows() {
  const rows = [];
  const inRoster = new Set();

  // 1) Alliance roster members (authoritative alliance)
  for (const a of (data.alliances ?? [])) {
    const tag = String(a.tag ?? a.id ?? "") || "None";
    const aname = a.name ?? a.displayName ?? tag;
    const useAlias = true;

    for (const m of (a.members ?? [])) {
      const gid = String(m.gid ?? m.id ?? "").trim();
      if (gid) inRoster.add(gid);

      rows.push({
        _key: gid ? `gid:${gid}` : `${tag}::${m.name ?? ""}`,
        gid,
        allianceTag: tag,
        allianceLabel: tag === "None" ? "[None]" : `[${tag}] ${aname}`,
        name: m.name ?? "",
        alias: m.alias ?? "",
        displayName: displayName(m, useAlias),
        sortName: effectiveNameForSort(m, useAlias),
        tc: m.tc,
        level: tcLabel(m.tc),
        power: normalizeNum(m.power),
        mystic: normalizeNum(m.mystic),
      });
    }
  }

  // 2) Standalone profiles (global cache) NOT currently in any alliance roster
  ensurePlayersStore();
  for (const [gid, p] of Object.entries(data.players ?? {})) {
    if (!gid) continue;
    if (inRoster.has(gid)) continue;

    const tag = String(p.allianceTag ?? "").trim() || "None";
    const name = (p.name ?? "").trim() || gid;
    const alias = p.alias ?? "";
    const display = alias ? `${name} (${alias})` : name;

    rows.push({
      _key: `gid:${gid}`,
      gid,
      allianceTag: tag,
      allianceLabel: tag === "None" ? "[None]" : `[${tag}]`,
      name,
      alias,
      displayName: display,
      sortName: (alias || name),
      tc: p.tc,
      level: tcLabel(p.tc),
      power: normalizeNum(p.power),
      mystic: normalizeNum(p.mystic),
    });
  }

  // Global power rank (ties: mystic, level, name)
  const ranked = [...rows].sort((a, b) => {
    const p = b.power - a.power;
    if (p !== 0) return p;
    const my = b.mystic - a.mystic;
    if (my !== 0) return my;
    const lv = tcRank(b.tc) - tcRank(a.tc);
    if (lv !== 0) return lv;
    return a.sortName.toLowerCase().localeCompare(b.sortName.toLowerCase());
  });

  const rankMap = new Map();
  ranked.forEach((r, i) => rankMap.set(r._key, i + 1));

  return rows.map(r => ({ ...r, rank: rankMap.get(r._key) ?? "" }));
}

function applyLeaderboardSearch(rows) {
  const q = (state.leaderSearch ?? "").trim().toLowerCase();
  if (!q) return rows;

  return rows.filter(r => {
    return (
      r.allianceTag.toLowerCase().includes(q) ||
      r.allianceLabel.toLowerCase().includes(q) ||
      r.displayName.toLowerCase().includes(q) ||
      (r.alias ?? "").toLowerCase().includes(q)
    );
  });
}

function sortLeaderboard(rows) {
  const key = state.leaderSortKey;
  const dir = state.leaderSortDir === "asc" ? 1 : -1;

  return [...rows].sort((a, b) => {
    if (key === "name") {
      return a.sortName.toLowerCase().localeCompare(b.sortName.toLowerCase()) * dir;
    }
    if (key === "alliance") {
      return a.allianceTag.toLowerCase().localeCompare(b.allianceTag.toLowerCase()) * dir;
    }
    if (key === "level") {
      return (tcRank(a.tc) - tcRank(b.tc)) * dir;
    }
    if (key === "rank") {
      // smaller rank is "higher"
      return (normalizeNum(a.rank) - normalizeNum(b.rank)) * dir;
    }
    if (key === "power") {
      return (a.power - b.power) * dir;
    }
    if (key === "mystic") {
      return (a.mystic - b.mystic) * dir;
    }
    return 0;
  });
}

function renderLeaderboardSortHeaders() {
  document.querySelectorAll("#leaderboardView .lbColHeader [data-lkey]").forEach(th => {
    th.classList.toggle("activeLSort", th.dataset.lkey === state.leaderSortKey);
  });
}

function renderLeaderboard() {
  if (!els.leaderboardBody) return;

  const rowsAll = collectLeaderboardRows();
  const rowsFiltered = applyLeaderboardSearch(rowsAll);
  const rowsSorted = sortLeaderboard(rowsFiltered);

  renderLeaderboardSortHeaders();

  els.leaderboardBody.innerHTML = "";
  for (const r of rowsSorted) {
    const tr = document.createElement("tr");
    const fullPower = r.power.toLocaleString();

    tr.innerHTML = `
      <td title="${r.allianceLabel}">${r.allianceTag}</td>
      <td>${r.displayName}</td>
      <td>${r.level}</td>
      <td>${r.rank}</td>
      <td title="${fullPower}">${formatPower(r.power)}</td>
      <td>${r.mystic}</td>
    `;
    els.leaderboardBody.appendChild(tr);
  }
}

// ---------- member modal ----------
function openMemberModal(mode) {
  const a = getCurrentAlliance();
  if (!a) return;

  state.memberModalMode = mode;
  if (els.aliasBlock) els.aliasBlock.classList.remove("hidden");
  if (els.mGid) els.mGid.readOnly = (mode !== "add");

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
    if (els.mAlias) els.mAlias.value = m.alias ?? "";
    els.mTC.value = tcLabel(m.tc);
    els.mPower.value = formatPower(m.power);
    els.mMystic.value = normalizeNum(m.mystic);
    els.mNotes.value = m.notes ?? "";
  }

  els.memberModal.classList.remove("hidden");
  if (els.mName) els.mName.focus();
  els.mGid.focus();
}

function closeMemberModal() {
  els.memberModal.classList.add("hidden");
}

function autofillFromGid() {
  ensurePlayersStore();
  const gid = (els.mGid.value ?? "").trim();
  if (!gid) return;
  const p = data.players[gid];
  if (!p) return;

  if (!els.mName.value.trim()) els.mName.value = p.name ?? "";
  if (els.mAlias && !els.mAlias.value.trim()) els.mAlias.value = p.alias ?? "";
  if (!els.mTC.value.trim()) els.mTC.value = p.tc ?? "";
  if (!els.mPower.value.trim()) els.mPower.value = formatPower(p.power ?? 0);
  if (!String(els.mMystic.value ?? "").trim()) els.mMystic.value = normalizeNum(p.mystic ?? 0);
  if (!els.mNotes.value.trim()) els.mNotes.value = p.notes ?? "";
}

async function saveMemberFromModal() {
  const a = getCurrentAlliance();
  if (!a) return;

  const gid = (els.mGid.value ?? "").trim();
  if (!gid) {
    alert("GID is REQUIRED.");
    els.mGid.focus();
    return;
  }

  const name = (els.mName.value ?? "").trim();
  if (!name) {
    alert("Name is required.");
    els.mName.focus();
    return;
  }

  const tcParsed = normalizeTc(els.mTC.value);
  if (!tcParsed.rank) {
    alert("TC must be 1–30 or TG1–TG5.");
    els.mTC.focus();
    return;
  }

  const powerParsed = parsePowerInput(els.mPower.value);
  const power = powerParsed ?? 0;
  const mystic = normalizeNum(els.mMystic.value);
  const notes = (els.mNotes.value ?? "").trim();
  const alias = (els.mAlias?.value ?? "").trim();

  const memberData = {
    id: gid,
    gid,
    name,
    alias,
    tc: tcParsed.label,
    power,
    mystic,
    notes,
    updatedAt: Date.now(),
  };

  if (state.currentAllianceId === UNASSIGNED_TAG) {
    // Unassigned pseudo-tab: update global profile cache only
    ensurePlayersStore();
    const existing = data.players[gid] ?? {};
    data.players[gid] = { ...existing, ...memberData, allianceTag: "None" };
    await saveData();
    closeMemberModal();
    state.selectedMemberId = gid;
    renderRoster();
    return;
  }

  a.members = a.members ?? [];

  if (state.memberModalMode === "add") {
    if (a.members.some(m => (m.gid ?? m.id) === gid)) {
      alert("That GID is already in this alliance.");
      return;
    }
    a.members.push(memberData);
    state.selectedMemberId = gid;
  } else {
    const idx = a.members.findIndex(m => m.id === state.selectedMemberId);
    if (idx < 0) return;

    // Prevent collisions if someone changes gid (rare)
    if (a.members.some((m, i) => i !== idx && (m.gid ?? m.id) === gid)) {
      alert("That GID is already in this alliance.");
      return;
    }

    a.members[idx] = memberData;
    state.selectedMemberId = gid;
  }

  upsertPlayerProfileFromMember(memberData);

  await saveData();
  closeMemberModal();
  renderRoster();
}

// ---------- alliance modal ----------
function openAllianceModal(mode) {
  state.allianceModalMode = mode;

  if (mode === "add") {
    els.allianceModalTitle.textContent = "Add Alliance";
    els.aTag.value = "";
    els.aName.value = "";
    els.aInfo.value = "";
    if (els.aUseAlias) els.aUseAlias.checked = false; //-- Legacy checkbox removed from HTML.

  } else {
    const a = getCurrentAlliance();
    if (!a) return;

    els.allianceModalTitle.textContent = "Edit Alliance";
    els.aTag.value = (a.tag ?? a.id ?? "").toUpperCase();
    els.aName.value = a.name ?? (a.tag ?? a.id ?? "");
    els.aInfo.value = a.info ?? "";
    state.allianceEditOriginalTag = (a.id ?? a.tag);
  }

  els.allianceModal.classList.remove("hidden");
  els.aTag.focus();
}

function closeAllianceModal() {
  els.allianceModal.classList.add("hidden");
}

async function saveAllianceFromModal() {
  const tag = (els.aTag.value ?? "").trim();
  const name = (els.aName.value ?? "").trim();
  const info = (els.aInfo.value ?? "").trim();

  if (!tag) { alert("Tag is required."); return; }
  if (!name) { alert("Alliance Name is required."); return; }

  if (state.allianceModalMode === "add") {
    if (data.alliances.some(a => (a.id ?? a.tag) === tag)) {
      alert("That tag already exists.");
      return;
    }
    data.alliances.push({ id: tag, tag, name, info, members: [] });
    await saveData();
    closeAllianceModal();
    selectAlliance(tag);
    return;
  }

  const originalTag = state.allianceEditOriginalTag;
  const a = getAllianceByTag(originalTag);
  if (!a) return;

  if (tag !== originalTag && data.alliances.some(x => (x.id ?? x.tag) === tag)) {
    alert("That tag already exists.");
    return;
  }

  a.id = tag;
  a.tag = tag;
  a.name = name;
  a.info = info;


  if (state.currentAllianceId === originalTag) state.currentAllianceId = tag;

  await saveData();
  closeAllianceModal();
  selectAlliance(state.currentAllianceId);
}

// ---------- remove alliance modal ----------
function openRemoveAllianceModal() {
  const a = getCurrentAlliance();
  if (!a) return;

  els.removeAllianceText.textContent =
    `You are removing ${allianceLabel(a)}.\nThis will purge ALL roster data for this alliance.`;

  els.removeAllianceInput.value = "";
  els.removeAllianceModal.classList.remove("hidden");
  els.removeAllianceInput.focus();
}

function closeRemoveAllianceModal() {
  els.removeAllianceModal.classList.add("hidden");
}

async function confirmRemoveAlliance() {
  const a = getCurrentAlliance();
  if (!a) return;

  const typed = (els.removeAllianceInput.value ?? "").trim().toUpperCase();
  if (typed !== "DELETE") {
    alert('Type DELETE to confirm.');
    return;
  }

  data.alliances = data.alliances.filter(x => (x.id ?? x.tag) !== (a.id ?? a.tag));
  await saveData();
  closeRemoveAllianceModal();

  if (data.alliances.length > 0) {
    selectAlliance(data.alliances[0].id ?? data.alliances[0].tag);
  } else {
    state.currentAllianceId = null;
    els.allianceTitle.textContent = "—";
    els.allianceInfo.textContent = "Select an alliance.";
    setAllianceButtonsEnabled(false);
    renderAllianceList(els.allianceList, null);
    renderAllianceList(els.allianceList2, null);
  }
}


// ---------- add user (standalone profile) ----------

function clearAddUserValidation() {
  els.auAlliance?.classList.remove("invalid");
  els.auGid?.classList.remove("invalid");
  els.auName?.classList.remove("invalid");
  els.auTC?.classList.remove("invalid");
  if (els.auError) {
    els.auError.textContent = "";
    els.auError.classList.add("hidden");
  }
}
function setAddUserError(msg, fieldEl = null) {
  if (fieldEl) fieldEl.classList.add("invalid");
  if (els.auError) {
    els.auError.textContent = msg;
    els.auError.classList.remove("hidden");
  } else {
    alert(msg);
  }
}
function findAllianceByTagExact(tag) {
  if (!tag) return null;
  return (data.alliances ?? []).find(a => (a.tag ?? a.id ?? "") === tag) ?? null;
}

function openAddUserModal() {
  if (!els.addUserModal) return;
  els.auGid.value = "";
  els.auAlliance.value = "";
  els.auName.value = "";
  els.auAlias.value = "";
  els.auTC.value = "";
  els.auPower.value = "";
  els.auMystic.value = "";
  els.auNotes.value = "";
  els.addUserModal.classList.remove("hidden");
  clearAddUserValidation();
  els.auGid.focus();
}

function closeAddUserModal() {
  els.addUserModal?.classList.add("hidden");
}

async function saveAddUserFromModal() {
  clearAddUserValidation();

  const gid = (els.auGid.value ?? "").trim();
  if (!gid) {
    setAddUserError("GID is REQUIRED.", els.auGid);
    els.auGid.focus();
    return;
  }

  const name = (els.auName.value ?? "").trim();
  if (!name) {
    setAddUserError("Name is required.", els.auName);
    els.auName.focus();
    return;
  }

  const tcParsed = normalizeTc(els.auTC.value);
  if (!tcParsed.rank) {
    setAddUserError("Level must be TC 1–30 or TG1–TG5.", els.auTC);
    els.auTC.focus();
    return;
  }

  const tag = (els.auAlliance.value ?? "").trim(); // optional, case-sensitive
  const alias = (els.auAlias.value ?? "").trim();
  const notes = (els.auNotes.value ?? "").trim();

  // If a tag is provided, it MUST already exist.
  let alliance = null;
  if (tag) {
    alliance = findAllianceByTagExact(tag);
    if (!alliance) {
      setAddUserError(`Unknown alliance tag "${tag}". Add the alliance first, or leave it blank for [None].`, els.auAlliance);
      els.auAlliance.focus();
      return;
    }
  }

  const powerParsed = parsePowerInput(els.auPower.value);
  const mysticParsed = normalizeNum(els.auMystic.value);

  ensurePlayersStore();
  const existing = data.players[gid] ?? {};

  const powerVal = powerParsed ?? (existing.power ?? 0);
  const mysticVal = Number.isFinite(mysticParsed) ? mysticParsed : (existing.mystic ?? 0);

  // 1) Save/update global profile cache
  data.players[gid] = {
    ...existing,
    gid,
    name,
    alias,
    tc: tcParsed.label,
    power: powerVal,
    mystic: mysticVal,
    notes,
    updatedAt: Date.now(),
    allianceTag: tag || (existing.allianceTag ?? "None"),
  };

  // 2) If tag exists, also add/update in that alliance roster
  if (alliance) {
    if (!Array.isArray(alliance.members)) alliance.members = [];
    const idx = alliance.members.findIndex(m => String(m.gid ?? m.id ?? "").trim() === gid);
    const memberPatch = { gid, name, alias, tc: tcParsed.label, power: powerVal, mystic: mysticVal, notes };

    if (idx >= 0) {
      alliance.members[idx] = { ...alliance.members[idx], ...memberPatch };
    } else {
      alliance.members.push(memberPatch);
    }
  }

  await saveData();

  // Provide feedback in update panel (right-side box) if present
  if (els.updateDeltaBox) {
    const showTag = tag ? `[${tag}]` : "[None]";
    els.updateDeltaBox.textContent = [
      `Player: ${name}`,
      `Alliance: ${showTag}`,
      `Power: ${formatPower(normalizeNum(powerVal))}`,
      `Mystic: ${normalizeNum(mysticVal)}`,
      alliance ? `Roster: added/updated in ${showTag}` : "Roster: not in an alliance",
    ].join("\\n");
  }

  closeAddUserModal();

  // Refresh visible views
  if (views.leaderboard && !views.leaderboard.classList.contains("hidden")) renderLeaderboard();
  if (alliance && views.roster && !views.roster.classList.contains("hidden")) renderRoster();
}

// ---------- update view ----------
function showUpdateResult(text) {
  if (!els.updateResult) return;
  els.updateResult.style.display = "block";
  els.updateResult.textContent = text;
}

function setUpdateDeltaBox(text) {
  if (!els.updateDeltaBox) return;
  els.updateDeltaBox.textContent = text;
}

function clearUpdateUI() {
  els.uGid.value = "";
  hideSuggestions();
  els.uPower.value = "";
  els.uMystic.value = "";
  if (els.updateResult) {
    els.updateResult.style.display = "none";
    els.updateResult.textContent = "";
  }
  if (els.updateDeltaBox) {
    els.updateDeltaBox.textContent = "No updates yet.";
  }
}

function downloadTextFile(filename, text, mine = "application/json") {
  // file exp via browser download
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => { URL.revokeObjectURL(url); a.remove(); }, 0);
}

function buildContributionRows() {
  // Builds a deduped patch from current cache (alliances first, then standalone profiles)
  ensurePlayersStore();

  const rowsByGid = new Map();
  const inRoster = new Set();

  for (const a of (data.alliances ?? [])) {
    const tag = String(a.tag ?? a.id ?? "").trim();
    for (const m of (a.members ?? [])) {
      const gid = String(m.gid ?? m.id ?? "").trim();
      if (!gid) continue;
      inRoster.add(gid);

      rowsByGid.set(gid, {
        gid,
        tag,
        name: (m.name ?? "").trim(),
        alias: (m.alias ?? "").trim(),
        tc: (m.tc ?? "").trim(),
        power: normalizeNum(m.power),
        mystic: normalizeNum(m.mystic),
        notes: (m.notes ?? "").trim(),
      });
    }
  }

  for (const [gid, p] of Object.entries(data.players ?? {})) {
    if (!gid) continue;
    if (inRoster.has(gid)) continue;

    const tag = String(p.allianceTag ?? "").trim() || "None";
    rowsByGid.set(gid, {
      gid,
      tag,
      name: (p.name ?? "").trim(),
      alias: (p.alias ?? "").trim(),
      tc: (p.tc ?? "").trim(),
      power: normalizeNum(p.power),
      mystic: normalizeNum(p.mystic),
      notes: (p.notes ?? "").trim(),
    });
  }

  return [...rowsByGid.values()];
}

function exportContributionPatch() {
  const rows = buildContributionRows();
  const payload = {
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    rows,
  };

  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const filename = `kslookup_patch_${yyyy}-${mm}-${dd}.json`;

  downloadTextFile(filename, JSON.stringify(payload, null, 2));
  showUpdateResult(`Exported patch: ${filename}\nRows: ${rows.length}`);
}

function parseCsvLoose(text) {
  // Minimal CSV parser (supports quoted fields)
  const rows = [];
  let row = [];
  let cur = "";
  let inQ = false;

  const pushCell = () => { row.push(cur); cur = ""; };
  const pushRow = () => {
    if (row.length === 1 && String(row[0] ?? "").trim() === "") return;
    rows.push(row);
    row = [];
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    const next = text[i + 1];

    if (inQ) {
      if (ch === '"' && next === '"') { cur += '"'; i++; continue; }
      if (ch === '"') { inQ = false; continue; }
      cur += ch;
      continue;
    }

    if (ch === '"') { inQ = true; continue; }
    if (ch === ",") { pushCell(); continue; }
    if (ch === "\n") { pushCell(); pushRow(); continue; }
    if (ch === "\r") continue;
    cur += ch;
  }
  pushCell(); pushRow();
  return rows;
}

async function importPatchText(text, filename = "") {
  const trimmed = String(text ?? "").trim();
  if (!trimmed) { alert("Import failed: empty file."); return; }

  let rows = null;

  // JSON path
  if (filename.toLowerCase().endsWith(".json") || trimmed.startsWith("{") || trimmed.startsWith("[")) {
    const parsed = JSON.parse(trimmed);
    if (Array.isArray(parsed)) rows = parsed;
    else if (parsed && Array.isArray(parsed.rows)) rows = parsed.rows;
    else throw new Error("JSON patch must be an array or { rows: [...] }");
  } else {
    // CSV path
    const table = parseCsvLoose(trimmed);
    const header = (table.shift() ?? []).map(h => String(h ?? "").trim().toLowerCase());
    const idx = (k) => header.indexOf(k);

    const iG = idx("gid");
    const iT = idx("tag");
    const iN = idx("name");
    const iA = idx("alias");
    const iTC = idx("tc");
    const iP = idx("power");
    const iM = idx("mystic");
    const iNo = idx("notes");

    rows = table.map(r => ({
      gid: r[iG],
      tag: r[iT],
      name: r[iN],
      alias: r[iA],
      tc: r[iTC],
      power: r[iP],
      mystic: r[iM],
      notes: r[iNo],
    }));
  }

  // Apply
  ensurePlayersStore();
  const now = Date.now();

  let upserts = 0;
  let rosterUpserts = 0;
  const missingTags = new Set();

  const findAllianceByTagExact = (tag) =>
    (data.alliances ?? []).find(a => (a.tag ?? a.id ?? "") === tag) ?? null;

  for (const r of (rows ?? [])) {
    const gid = String(r?.gid ?? "").trim();
    if (!gid) continue;

    const tagRaw = String(r?.tag ?? "").trim();
    const tag = (tagRaw && tagRaw !== "None") ? tagRaw : "";

    const name = String(r?.name ?? "").trim();
    const alias = String(r?.alias ?? "").trim();
    const tc = String(r?.tc ?? "").trim();

    let power = 0;
    if (typeof r?.power === "number") power = Math.round(r.power);
    else power = parsePowerInput(String(r?.power ?? "").trim()) ?? normalizeNum(r?.power);

    let mystic = 0;
    if (typeof r?.mystic === "number") mystic = Math.round(r.mystic);
    else mystic = normalizeNum(String(r?.mystic ?? "").trim());

    const notes = String(r?.notes ?? "").trim();

    // Cache upsert (always)
    const existing = data.players[gid] ?? {};
    data.players[gid] = {
      ...existing,
      gid,
      name: name || existing.name || "",
      alias: alias || existing.alias || "",
      tc: tc || existing.tc || "",
      power: Number.isFinite(power) ? power : (existing.power ?? 0),
      mystic: Number.isFinite(mystic) ? mystic : (existing.mystic ?? 0),
      notes: notes || existing.notes || "",
      updatedAt: now,
      allianceTag: "None",
    };

    // Roster upsert if alliance exists
    if (tag) {
      const a = findAllianceByTagExact(tag);
      if (!a) {
        missingTags.add(tag);
      } else {
        data.players[gid].allianceTag = tag;
        if (!Array.isArray(a.members)) a.members = [];
        const mi = a.members.findIndex(m => String(m.gid ?? m.id ?? "").trim() === gid);
        const mp = { gid, name, alias, tc, power, mystic, notes };
        if (mi >= 0) a.members[mi] = { ...a.members[mi], ...mp };
        else a.members.push(mp);
        rosterUpserts++;
      }
    }

    upserts++;
  }

  await saveData();

  // Refresh visible views
  if (views.leaderboard && !views.leaderboard.classList.contains("hidden")) renderLeaderboard();
  if (views.roster && !views.roster.classList.contains("hidden")) renderRoster();
  renderAllianceList?.(els.allianceList, state.currentAllianceId);
  renderAllianceList?.(els.allianceList2, state.currentAllianceId);

  const missing = missingTags.size ? `\nMissing alliance tags (imported as [None]): ${[...missingTags].join(", ")}` : "";
  showUpdateResult(`Imported patch file: ${filename || "(unknown)"}\nRows processed: ${upserts}\nRoster upserts: ${rosterUpserts}${missing}`);
}


function findPlayerByLookup(lookupRaw) {
  const lookup = (lookupRaw ?? "").trim();
  if (!lookup) return { ok: false, error: "Lookup is empty." };

  ensurePlayersStore();

  // 1) Try GID direct hit
  if (data.players[lookup]) {
    return { ok: true, gid: lookup, source: "gid" };
  }

  // 2) Try matching any member gid/id directly
  for (const a of data.alliances) {
    for (const m of (a.members ?? [])) {
      const gid = String(m.gid ?? m.id ?? "").trim();
      if (gid && gid === lookup) {
        return { ok: true, gid, source: "gid" };
      }
    }
  }

  // 3) Name match (exact, case-insensitive)
  const target = lookup.toLowerCase();
  const matches = new Set();

  for (const a of data.alliances) {
    for (const m of (a.members ?? [])) {
      const nm = String(m.name ?? "").trim().toLowerCase();
      if (nm && nm === target) {
        const gid = String(m.gid ?? m.id ?? "").trim();
        if (gid) matches.add(gid);
      }
    }
  }

  for (const [gid, p] of Object.entries(data.players)) {
    const nm = String(p?.name ?? "").trim().toLowerCase();
    if (nm && nm === target) matches.add(gid);
  }

  const arr = [...matches];
  if (arr.length === 1) return { ok: true, gid: arr[0], source: "name" };
  if (arr.length === 0) return { ok: false, error: "No player found for that GID/Name." };

  return { ok: false, error: `Multiple players matched that name (unexpected). Matched GIDs: ${arr.join(", ")}` };
}

function isLikelyGid(s) {
  // GID: exactly 8 digits
  return /^\d{8}$/.test(String(s ?? "").trim());
}

function hideSuggestions() {
  if (!els.uSuggest) return;
  els.uSuggest.classList.add("hidden");
  els.uSuggest.innerHTML = "";
}

function showSuggestions(items, onPick) {
  if (!els.uSuggest) return;
  if (!items || items.length === 0) return hideSuggestions();

  els.uSuggest.innerHTML = items.map(x =>
    `<div class="sugItem" data-name="${escapeHtml(x.name)}">${escapeHtml(x.name)}</div>`
  ).join("");

  els.uSuggest.classList.remove("hidden");

  els.uSuggest.querySelectorAll(".sugItem").forEach(div => {
    div.addEventListener("click", () => onPick(div.getAttribute("data-name")));
  });
}

// Minimal HTML escape (names can include unicode, but still safe)
function escapeHtml(str) {
  return String(str ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getNameIndex() {
  // Returns unique list of names we can update by (from players cache + members)
  const map = new Map(); // lower -> original
  ensurePlayersStore();

  for (const [gid, p] of Object.entries(data.players)) {
    const n = String(p?.name ?? "").trim();
    if (!n) continue;
    const k = n.toLowerCase();
    if (!map.has(k)) map.set(k, n);
  }

  for (const a of (data.alliances ?? [])) {
    for (const m of (a.members ?? [])) {
      const n = String(m?.name ?? "").trim();
      if (!n) continue;
      const k = n.toLowerCase();
      if (!map.has(k)) map.set(k, n);
    }
  }

  return [...map.values()];
}

function suggestNames(query) {
  const q = String(query ?? "").trim().toLowerCase();
  if (!q) return [];
  const names = getNameIndex();

  // startswith first, then contains
  const starts = [];
  const contains = [];
  for (const n of names) {
    const k = n.toLowerCase();
    if (k.startsWith(q)) starts.push(n);
    else if (k.includes(q)) contains.push(n);
  }

  const all = [...starts.sort(), ...contains.sort()];
  return all.slice(0, 10).map(name => ({ name }));
}

function getDisplayNameForGid(gid) {
  ensurePlayersStore();
  const p = data.players[gid];
  if (p?.name) return p.name;
  // fallback: search alliance members
  for (const a of data.alliances) {
    const m = (a.members ?? []).find(x => (x.gid ?? x.id) === gid);
    if (m?.name) return m.name;
  }
  return gid;
}

function getCurrentPowerMysticForGid(gid) {
  ensurePlayersStore();
  const p = data.players[gid];
  if (p) return { power: normalizeNum(p.power), mystic: normalizeNum(p.mystic) };

  // fallback from members
  for (const a of data.alliances) {
    for (const m of (a.members ?? [])) {
      if ((m.gid ?? m.id) === gid) {
        return { power: normalizeNum(m.power), mystic: normalizeNum(m.mystic) };
      }
    }
  }
  return { power: 0, mystic: 0 };
}

async function applyUpdate() {
  const lookup = (els.uGid.value ?? "").trim();
  if (!lookup) {
    alert("Player (GID or Name) is REQUIRED.");
    els.uGid.focus();
    return;
  }

  const found = findPlayerByLookup(lookup);
  if (!found.ok) {
    alert(found.error);
    return;
  }

  const gid = found.gid;
  const name = getDisplayNameForGid(gid);

  const old = getCurrentPowerMysticForGid(gid);

  const powerStr = (els.uPower.value ?? "").trim();
  const mysticStr = String(els.uMystic.value ?? "").trim();

  const powerNew = powerStr ? parsePowerInput(powerStr) : null;
  const mysticNew = mysticStr ? normalizeNum(mysticStr) : null;

  if (powerNew === null && mysticNew === null) {
    alert("Nothing to update. Enter Power and/or Mystic.");
    return;
  }

  ensurePlayersStore();
  if (!data.players[gid]) data.players[gid] = { gid, name };

  let touchedAlliances = 0;
  let touchedMembers = 0;

  for (const a of data.alliances) {
    let changedAlliance = false;
    for (const m of (a.members ?? [])) {
      const mgid = String(m.gid ?? m.id ?? "").trim();
      if (mgid !== gid) continue;

      if (powerNew !== null) m.power = powerNew;
      if (mysticNew !== null) m.mystic = mysticNew;
      m.updatedAt = Date.now();

      upsertPlayerProfileFromMember(m);

      touchedMembers++;
      changedAlliance = true;
    }
    if (changedAlliance) touchedAlliances++;
  }

  // Update global profile cache even if member not found in rosters (rare)
  const p = data.players[gid];
  if (powerNew !== null) p.power = powerNew;
  if (mysticNew !== null) p.mystic = mysticNew;
  p.updatedAt = Date.now();

  await saveData();

  const now = getCurrentPowerMysticForGid(gid);
  const dp = (powerNew === null) ? 0 : (now.power - old.power);
  const dm = (mysticNew === null) ? 0 : (now.mystic - old.mystic);

  const deltaBox = [
    `Player: ${name}`,
    `Previous Power: ${formatPower(old.power)}`,
    `Power: ${powerNew === null ? "no change" : formatDeltaPower(dp)} (now ${formatPower(now.power)})`,
    `Mystic: ${mysticNew === null ? "no change" : formatDeltaNum(dm, (x) => String(x))} (now ${now.mystic})`,
  ].join("\n");

  setUpdateDeltaBox(deltaBox);

  const result = [
    `Updated via ${found.source.toUpperCase()}: ${lookup}`,
    `Resolved GID: ${gid}`,
    `Player: ${name}`,
    `Touched alliances: ${touchedAlliances}`,
    `Touched member entries: ${touchedMembers}`,
  ].join("\n");

  showUpdateResult(result);
}

// ---------- navigation wiring ----------
function goHome() { showView("home"); }
function goAlliances() { showView("alliance"); renderAllianceList(els.allianceList, state.currentAllianceId); }

function goLeaderboard() { showView("leaderboard"); renderLeaderboard(); }
function goUpdate() { showView("update"); }

// ---------- events ----------
document.addEventListener("DOMContentLoaded", async () => {
  try {
    await loadData();

    // Start on home splash
    showView("home");
    if (els.homeHint) els.homeHint.textContent = "Tip: Use Update to change Power/Mystic across all alliances by GID or Name.";

    // Default selection: none (so it doesn't always show VAL)
    if (data.alliances.length > 0) {
      // keep a remembered selection if possible, else null
      state.currentAllianceId = state.currentAllianceId ?? (data.alliances[0].id ?? data.alliances[0].tag);
    }

    // Home nav
    els.navAlliancesBtn?.addEventListener("click", () => goAlliances());
    els.navLeaderboardBtn?.addEventListener("click", () => goLeaderboard());
    els.navUpdateBtn?.addEventListener("click", () => goUpdate());

    // Alliance view buttons
    els.backHomeFromAlliancesBtn?.addEventListener("click", () => goHome());
    els.addAllianceBtn?.addEventListener("click", () => openAllianceModal("add"));
    els.editAllianceBtn?.addEventListener("click", () => openAllianceModal("edit"));
    els.removeAllianceBtn?.addEventListener("click", () => openRemoveAllianceModal());
    els.viewRosterBtn?.addEventListener("click", () => openRoster(true));

    // Roster view buttons
    els.backToAllianceBtn?.addEventListener("click", () => goAlliances());
    els.backHomeFromRosterBtn?.addEventListener("click", () => goHome());
    els.addMemberBtn?.addEventListener("click", () => openMemberModal("add"));
    els.editMemberBtn?.addEventListener("click", () => openMemberModal("edit"));
    els.viewProfileBtn?.addEventListener("click", () => openProfileView(state.selectedMemberId, "roster"));
    els.removeMemberBtn?.addEventListener("click", async () => {
      try {
        const a = getCurrentAlliance();
        if (!a) return;

        if (state.currentAllianceId === UNASSIGNED_TAG) {
          // Unassigned pseudo-tab: removal deletes the standalone profile record. -X
          ensurePlayersStore();
          const gid = String(state.selectedMemberId ?? "").trim();
          const p = data.players?.[gid];
          if (!gid || !p) return;
          const label = (p.name ?? "").trim() || gid;
          if (!confirm(`Remove ${label}? (This deletes the standalone profile)`)) return;
          delete data.players[gid];
          state.selectedMemberId = null;
          await saveData();
          renderRoster();
          return;
        }

        const m = (a.members ?? []).find(x => x.id === state.selectedMemberId);
        if (!m) return;

        upsertPlayerProfileFromMember(m);
        await saveData();

        if (!confirm(`Remove ${m.name}? (Profile kept for quick re-add)`)) return;

        a.members = (a.members ?? []).filter(x => x.id !== m.id);
        state.selectedMemberId = null;
        await saveData();
        renderRoster();
      } catch (e) {
        console.error(e);
        alert("Remove member failed: " + (e?.message ?? String(e)));
      }
    });

    els.openUpdateFromRosterBtn?.addEventListener("click", () => {
      const gid = state.selectedMemberId;
      if (gid) els.uGid.value = gid;
      goUpdate();
      els.uGid.focus();
    });

    // profile view buttons
    els.backToRosterFromProfileBtn?.addEventListener("click", () => closeProfileView());
    els.backHomeFromProfileBtn?.addEventListener("click", () => {
      state.profileBackView = "home";
      goHome();
    });

    // Search/sort
    els.rosterSearch?.addEventListener("input", (e) => {
      state.search = e.target.value ?? "";
      renderRoster();
    });

    document.querySelectorAll("th.sortable").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.dataset.key;
        if (state.sortKey === key) {
          state.sortDir = state.sortDir === "asc" ? "desc" : "asc";
        } else {
          state.sortKey = key;
          state.sortDir = (key === "name" || key === "rank") ? "asc" : "desc";
        }
        renderRoster();
      });
    });

    // Alliance modal buttons
    els.allianceCancel?.addEventListener("click", (e) => { e.preventDefault(); closeAllianceModal(); });
    els.allianceSave?.addEventListener("click", async () => {
      try { await saveAllianceFromModal(); }
      catch (e) { console.error(e); alert("Save failed: " + (e?.message ?? String(e))); }
    });

    // Remove alliance modal
    els.removeAllianceCancel?.addEventListener("click", (e) => { e.preventDefault(); closeRemoveAllianceModal(); });
    els.removeAllianceConfirmBtn?.addEventListener("click", async () => {
      try { await confirmRemoveAlliance(); }
      catch (e) { console.error(e); alert("Remove failed: " + (e?.message ?? String(e))); }
    });

    // Member modal buttons
    els.modalCancel?.addEventListener("click", (e) => { e.preventDefault(); closeMemberModal(); });
    els.modalSave?.addEventListener("click", async () => {
      try { await saveMemberFromModal(); }
      catch (e) { console.error(e); alert("Save failed: " + (e?.message ?? String(e))); }
    });

    // Autofill on GID input
    els.mGid?.addEventListener("input", () => {
      if (state.memberModalMode === "add") autofillFromGid();
    });

    // Leaderboard back
    els.backHomeFromLeaderboardBtn?.addEventListener("click", () => goHome());


    // Leaderboard search
    els.leaderboardSearch?.addEventListener("input", (e) => {
      state.leaderSearch = e.target.value ?? "";
      renderLeaderboard();
    });

    // Leaderboard sort headers
    document.querySelectorAll("#leaderboardView .lbColHeader [data-lkey]").forEach(th => {
      th.addEventListener("click", () => {
        const key = th.dataset.lkey;
        if (!key) return;

        if (state.leaderSortKey === key) {
          state.leaderSortDir = state.leaderSortDir === "asc" ? "desc" : "asc";
        } else {
          state.leaderSortKey = key;
          // sensible defaults
          state.leaderSortDir = (key === "name" || key === "alliance" || key === "level") ? "asc" : "desc";
          if (key === "rank") state.leaderSortDir = "asc";
        }
        renderLeaderboard();
      });
    });
    // Update view navigation
    els.backHomeFromUpdateBtn?.addEventListener("click", () => goHome());
    els.goAlliancesFromUpdateBtn?.addEventListener("click", () => goAlliances());

    // Update actions
    els.addUserBtn?.addEventListener("click", () => openAddUserModal());

    els.exportPathBtn?.addEventListener("click", () => {
      try { exportContributionPatch(); }
      catch (e) { console.error(e); alert("Export failed: " + (e?.message ?? String(e))); }
    });

    els.importPatchBtn?.addEventListener("click", () => {

      els.importPatchFile?.click();
    });

    els.importPatchFile?.addEventListener("change", async (e) => {
      try {
        const file = e?.target?.files?.[0];
        if (!file) return;
        const text = await (file.text ? file.text() : new Promise((res, rej) => {
          const r = new FileReader();
          r.onload = () => res(String(r.result ?? ""));
          r.onerror = () => rej(r.error);
          r.readAsText(file);
        }));
        await importPatchText(text, file.name);
      } catch (err) {
        console.error(err);
        alert("Import failed: " + (err?.message ?? String(err)));
      } finally {
        if (els.importPatchFile) els.importPatchFile.value = ""; // allow re-import same file
      }
    });

    els.applyUpdateBtn?.addEventListener("click", async () => {
      try { await applyUpdate(); }
      catch (e) { console.error(e); alert("Update failed: " + (e?.message ?? String(e))); }
    });

    els.applyUpdateBtn?.addEventListener("click", async () => {
      try { await applyUpdate(); }
      catch (e) { console.error(e); alert("Update failed: " + (e?.message ?? String(e))); }
    });
    els.clearUpdateBtn?.addEventListener("click", () => clearUpdateUI());

    // Add User modal actions
    els.auCancel?.addEventListener("click", (e) => { e.preventDefault(); closeAddUserModal(); });
    els.auSave?.addEventListener("click", async () => {
      try { await saveAddUserFromModal(); }
      catch (e) { console.error(e); alert("Add user failed: " + (e?.message ?? String(e))); }
    });

    // Enter to apply update when focus is in update fields
    // Typeahead suggestions: when input is NOT an 8-digit GID, show matching names
    els.uGid?.addEventListener("input", (e) => {
      const val = String(e.target.value ?? "").trim();
      if (!val) return hideSuggestions();
      if (isLikelyGid(val)) return hideSuggestions();
      const items = suggestNames(val);
      showSuggestions(items, (pickedName) => {
        els.uGid.value = pickedName;
        hideSuggestions();
        els.uPower?.focus();
      });
    });

    // Hide suggestions when leaving the field
    els.uGid?.addEventListener("blur", () => {
      // slight delay so click can register
      setTimeout(() => hideSuggestions(), 150);
    });

    [els.uGid, els.uPower, els.uMystic].forEach(inp => {
      inp?.addEventListener("keydown", (e) => {
        if (e.key === "Enter") els.applyUpdateBtn?.click();
      });
    });

    // ESC closes modals (quick release)
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      if (!els.removeAllianceModal.classList.contains("hidden")) return closeRemoveAllianceModal();
      if (!els.allianceModal.classList.contains("hidden")) return closeAllianceModal();
      if (!els.memberModal.classList.contains("hidden")) return closeMemberModal();
      if (els.addUserModal && !els.addUserModal.classList.contains("hidden")) return closeAddUserModal();
    });

    // Initial render lists
    renderAllianceList(els.allianceList, state.currentAllianceId);
    renderAllianceList(els.allianceList2, state.currentAllianceId);

    // If a selection exists, populate alliance info (but DO NOT auto-show anything)
    if (state.currentAllianceId) selectAlliance(state.currentAllianceId);
    else setAllianceButtonsEnabled(false);

    // Update view delta box default
    if (els.updateDeltaBox) els.updateDeltaBox.textContent = "No updates yet.";

  } catch (err) {
    console.error(err);
    alert("Startup failed: " + (err?.message ?? String(err)));
  }
});
