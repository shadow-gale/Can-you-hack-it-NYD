// profile.js (ES module) — Edit / Cancel / Save + Firebase (if available) fallback to localStorage
const ARTICLE = document.getElementById("profileCard");
const editBtn = document.getElementById("editProfileBtn");
const saveBtn = document.getElementById("saveBtn");
const cancelBtn = document.getElementById("cancelSaveBtn");
const editActions = document.getElementById("editActions");

// view elements
const view = {
  fullName: document.getElementById("fullName"),
  subtitle: document.getElementById("subtitle"),
  email: document.getElementById("email"),
  phone: document.getElementById("phone"),
  location: document.getElementById("location"),
  bio: document.getElementById("bio"),
  profiles: document.getElementById("profiles"),
  skillsContainer: document.getElementById("skills"),
  avatarInitial: document.getElementById("avatarInitial"),
  profilePhoto: document.getElementById("profilePhoto"),
  updatedAt: document.getElementById("updatedAt"),
};

// edit inputs
const inputs = {
  fullname: document.getElementById("input_fullname"),
  subtitle: document.getElementById("input_subtitle"),
  email: document.getElementById("input_email"),
  phone: document.getElementById("input_phone"),
  location: document.getElementById("input_location"),
  bio: document.getElementById("input_bio"),
  linkedin: document.getElementById("input_linkedin"),
  github: document.getElementById("input_github"),
  skills: document.getElementById("input_skills"),
};

const STORAGE_KEY = "linkedup_profile_v1";
let originalValues = {};

// --- helpers ---
function nowFormatted() {
  const n = new Date();
  return n.toLocaleString("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function renderSkills(str) {
  const wrap = view.skillsContainer;
  wrap.innerHTML = "";
  const clean = (str || "").split(",").map(s => s.trim()).filter(Boolean);
  if (clean.length === 0) {
    wrap.innerHTML = `<div class="chip primary">Not added yet</div>`;
    return;
  }
  clean.forEach(skill => {
    const d = document.createElement("div");
    d.className = "chip";
    d.textContent = skill;
    wrap.appendChild(d);
  });
}

function renderProfiles(linkedin, github) {
  const wrap = view.profiles;
  wrap.innerHTML = "";
  if (!linkedin && !github) {
    wrap.innerHTML = `<span class="text-gray-500">No profiles linked yet</span>`;
    return;
  }
  const fragments = [];
  if (linkedin) {
    const a = document.createElement("a");
    a.href = linkedin;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "LinkedIn";
    a.className = "text-blue-600 underline";
    fragments.push(a);
  }
  if (github) {
    const a = document.createElement("a");
    a.href = github;
    a.target = "_blank";
    a.rel = "noopener noreferrer";
    a.textContent = "GitHub";
    a.className = "text-gray-600 underline";
    fragments.push(a);
  }
  fragments.forEach((el, i) => {
    wrap.appendChild(el);
    if (i < fragments.length - 1) {
      const sep = document.createElement("span");
      sep.className = "text-gray-400 px-2";
      sep.textContent = "•";
      wrap.appendChild(sep);
    }
  });
}

function loadFromDOM() {
  const skillsText = Array.from(view.skillsContainer.querySelectorAll(".chip")).map(c => c.textContent).join(", ");
  return {
    fullname: view.fullName.textContent.trim() || "",
    subtitle: view.subtitle.textContent.trim() || "",
    email: view.email.textContent.trim() === "—" ? "" : view.email.textContent.trim(),
    phone: view.phone.textContent.trim() === "—" ? "" : view.phone.textContent.trim(),
    location: view.location.textContent.trim() === "—" ? "" : view.location.textContent.trim(),
    bio: view.bio.textContent.trim() === "No bio yet." ? "" : view.bio.textContent.trim(),
    linkedin: "",
    github: "",
    skills: (skillsText && skillsText !== "Not added yet") ? skillsText : "",
    updatedAt: view.updatedAt.textContent.trim() || "",
  };
}

function loadProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.warn("Failed to parse saved profile", e);
  }
  return loadFromDOM();
}

// PERSIST: tries firebase.js -> module.saveProfile(profile) (if exists) else fallback to localStorage
async function persistProfile(profile) {
  // try to dynamic import firebase.js and call an exported saveProfile(profile) if available
  try {
    const mod = await import('./firebase.js');
    // prefer named export saveProfile
    if (mod && typeof mod.saveProfile === 'function') {
      await mod.saveProfile(profile);
      console.log("Saved profile via firebase.js -> saveProfile()");
      return { ok: true, via: 'firebase.saveProfile' };
    }

    // try alternative common export names
    if (mod && typeof mod.saveProfileToFirestore === 'function') {
      await mod.saveProfileToFirestore(profile);
      console.log("Saved profile via firebase.js -> saveProfileToFirestore()");
      return { ok: true, via: 'firebase.saveProfileToFirestore' };
    }

    // if firebase.js exports 'db' or 'firestore' but no helper, don't attempt Firestore SDK here (unsafe)
    console.warn("firebase.js imported but no saveProfile helper found. Falling back to localStorage.");
  } catch (err) {
    console.warn("Could not import ./firebase.js or firebase save helper failed:", err);
  }

  // fallback: localStorage
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    console.log("Saved profile to localStorage");
    return { ok: true, via: 'localStorage' };
  } catch (err) {
    console.error("Failed to save profile to localStorage:", err);
    return { ok: false, error: err };
  }
}

function persistProfileSyncLocal(profile) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
    return true;
  } catch (e) {
    console.warn("localStorage save failed", e);
    return false;
  }
}

function applyToView(profile) {
  view.fullName.textContent = profile.fullname || "Full Name";
  view.subtitle.textContent = profile.subtitle || "Subtitle / Institution";
  view.email.textContent = profile.email || "—";
  view.phone.textContent = profile.phone || "—";
  view.location.textContent = profile.location || "—";
  view.bio.textContent = profile.bio || "No bio yet.";
  renderProfiles(profile.linkedin || "", profile.github || "");
  renderSkills(profile.skills || "");
  view.updatedAt.textContent = profile.updatedAt || "—";
  const name = (profile.fullname || "").trim();
  view.avatarInitial.textContent = name ? name[0].toUpperCase() : (view.avatarInitial.textContent || "A");
}

function enterEditMode() {
  const cur = loadProfile();
  inputs.fullname.value = cur.fullname || "";
  inputs.subtitle.value = cur.subtitle || "";
  inputs.email.value = cur.email || "";
  inputs.phone.value = cur.phone || "";
  inputs.location.value = cur.location || "";
  inputs.bio.value = cur.bio || "";
  inputs.linkedin.value = cur.linkedin || "";
  inputs.github.value = cur.github || "";
  inputs.skills.value = cur.skills || "";

  originalValues = { ...cur };

  ARTICLE.classList.add("editing");
  setTimeout(() => inputs.fullname.focus(), 120);
}

function exitEditMode() {
  ARTICLE.classList.remove("editing");
}

// --- handlers ---
function onEditClick() {
  enterEditMode();
}

function onCancelClick() {
  applyToView(originalValues);
  // also restore localStorage preview (if you want to discard unsaved localStorage edits)
  exitEditMode();
}

async function onSaveClick() {
  const profile = {
    fullname: inputs.fullname.value.trim(),
    subtitle: inputs.subtitle.value.trim(),
    email: inputs.email.value.trim(),
    phone: inputs.phone.value.trim(),
    location: inputs.location.value.trim(),
    bio: inputs.bio.value.trim(),
    linkedin: inputs.linkedin.value.trim(),
    github: inputs.github.value.trim(),
    skills: inputs.skills.value.trim(),
    updatedAt: nowFormatted(),
  };

  // Optimistic UI update
  applyToView(profile);

  // Try persist (firebase -> fallback localStorage)
  const res = await persistProfile(profile);
  if (!res.ok) {
    // if persist failed, at least ensure local sync
    persistProfileSyncLocal(profile);
    console.warn("Persist failed, saved locally.");
  }

  exitEditMode();
}

// --- bind events ---
editBtn.addEventListener("click", onEditClick);
cancelBtn.addEventListener("click", onCancelClick);
saveBtn.addEventListener("click", onSaveClick);

// keyboard shortcuts while editing (Esc -> cancel, Ctrl/Cmd+S -> save)
document.addEventListener("keydown", (e) => {
  if (!ARTICLE.classList.contains("editing")) return;
  if (e.key === "Escape") {
    e.preventDefault();
    onCancelClick();
  }
  if ((e.ctrlKey || e.metaKey) && (e.key === "s" || e.key === "S")) {
    e.preventDefault();
    onSaveClick();
  }
});

// initial load
document.addEventListener("DOMContentLoaded", () => {
  const profile = loadProfile();
  applyToView(profile);
});
