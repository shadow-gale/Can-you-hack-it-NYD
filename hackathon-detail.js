// hackathon-detail.js
import { onAuthChange, getHackathonById, logout } from "./firebase.js";

const params = new URLSearchParams(window.location.search);
const id = params.get("id");

const titleEl = document.getElementById("hack-title");
const dateEl = document.getElementById("hack-date");
const problemEl = document.getElementById("hack-problem");
const skillsList = document.getElementById("skills-list");
const btnLogout = document.getElementById("btn-logout");

onAuthChange(async (user) => {
  if (!user) {
    window.location.href = "index.html";
    return;
  }
  if (!id) {
    titleEl.textContent = "No ID provided";
    return;
  }
  try {
    const data = await getHackathonById(id);
    if (!data) {
      titleEl.textContent = "Not found";
      return;
    }
    titleEl.textContent = data.title || "Untitled";
    dateEl.textContent = data.date ? `Date: ${data.date}` : "";
    problemEl.textContent = data.problemStatement || "No problem statement provided.";
    skillsList.innerHTML = "";
    (data.skillsRequired || []).forEach(s => {
      const li = document.createElement("li");
      li.textContent = s;
      skillsList.appendChild(li);
    });

  } catch (err) {
    console.error(err);
    titleEl.textContent = "Error loading";
    problemEl.textContent = err.message;
  }
});

btnLogout.addEventListener("click", async () => {
  await logout();
  window.location.href = "index.html";
});
