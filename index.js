// index.js — Modal + Join form handling (no top-level Firebase imports; saves profile then redirects)
document.addEventListener("DOMContentLoaded", () => {
    // DOM refs
    const openButtons = Array.from(
      [document.getElementById("joinNowBtn"), document.getElementById("joinNowBtnDuplicate")]
    ).filter(Boolean);
  
    const modal = document.getElementById("joinModal");
    const backdrop = document.getElementById("joinModalBackdrop");
    const btnClose = document.getElementById("joinModalClose");
    const btnCancel = document.getElementById("joinModalCancel");
    const form = document.getElementById("joinModalForm");
    const yearEl = document.getElementById("year");
  
    // set footer year
    if (yearEl) yearEl.textContent = new Date().getFullYear();
  
    // ensure animated gradient element exists
    function ensureAnimatedGradient() {
      if (!backdrop) return null;
      let ag = backdrop.querySelector(".animated-gradient");
      if (!ag) {
        ag = document.createElement("div");
        ag.className = "animated-gradient hidden";
        ag.setAttribute("aria-hidden", "true");
        backdrop.insertBefore(ag, backdrop.firstChild);
      }
      return ag;
    }
    const animatedGradient = ensureAnimatedGradient();
  
    function openModal() {
      if (!modal) return;
      modal.classList.remove("hidden");
      modal.classList.add("show", "flex");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("modal-open");
  
      // show background animation if not reduced-motion
      if (animatedGradient) {
        animatedGradient.classList.remove("hidden");
        const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (!mq.matches && backdrop) backdrop.classList.add("animate-gradient");
      }
  
      // focus first input
      const first = modal.querySelector("input, select, textarea, button");
      if (first) first.focus();
  
      document.addEventListener("keydown", onKeydown);
    }
  
    function closeModal() {
      if (!modal) return;
      if (backdrop) backdrop.classList.remove("animate-gradient");
      if (animatedGradient) setTimeout(() => animatedGradient.classList.add("hidden"), 260);
  
      modal.classList.remove("show", "flex");
      modal.classList.add("hidden");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("modal-open");
      document.removeEventListener("keydown", onKeydown);
    }
  
    function onKeydown(e) {
      if (e.key === "Escape") closeModal();
    }
  
    openButtons.forEach((b) => b.addEventListener("click", (ev) => { ev.preventDefault(); openModal(); }));
  
    if (btnClose) btnClose.addEventListener("click", (e) => { e.preventDefault(); closeModal(); });
    if (btnCancel) btnCancel.addEventListener("click", (e) => { e.preventDefault(); closeModal(); });
  
    // backdrop click closes
    if (backdrop) backdrop.addEventListener("click", (e) => { closeModal(); });
  
    // click outside panel (modal root) closes
    if (modal) {
      modal.addEventListener("click", (e) => {
        if (e.target === modal) closeModal();
      });
    }
  
    // allow Enter to open modal when not typing
    window.addEventListener("keydown", (e) => {
      if (e.key !== "Enter") return;
      const active = document.activeElement;
      const tag = active && active.tagName ? active.tagName.toLowerCase() : null;
      const typing = ["input", "textarea", "select"];
      if (!typing.includes(tag)) {
        if (modal && modal.classList.contains("hidden")) openModal();
      }
    });
  
    // Join form submit handler: save to localStorage (profile key used by profile.js) + redirect to profile.html
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
  
        const fullname = (form.fullname && form.fullname.value || "").trim();
        const email = (form.email && form.email.value || "").trim();
        const password = (form.password && form.password.value || "").trim();
        const interest = (form.interest && form.interest.value || "").trim();
  
        // basic validation
        if (!fullname) { alert("Please enter your full name."); form.fullname.focus(); return; }
        if (!email || !/^\S+@\S+\.\S+$/.test(email)) { alert("Please enter a valid email."); form.email.focus(); return; }
        if (!password || password.length < 6) { alert("Password should be at least 6 characters."); form.password.focus(); return; }
  
        // Build profile object in the exact shape profile.js expects
        const profile = {
          fullname,
          subtitle: `${interest ? interest + " enthusiast" : ""}`.trim(),
          email,
          phone: "",
          location: "",
          bio: "",
          linkedin: "",
          github: "",
          skills: "",
          updatedAt: new Date().toLocaleString("en-IN", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })
        };
  
        // 1) Save profile to the key profile.js reads: linkedup_profile_v1
        try {
          localStorage.setItem("linkedup_profile_v1", JSON.stringify(profile));
          console.log("Saved current profile to linkedup_profile_v1");
        } catch (err) {
          console.warn("Failed to save profile to localStorage:", err);
        }
  
        // 2) Also append to joined-users list (for admin / demo)
        try {
          const key = "linkedup_joined_users_v1";
          const raw = localStorage.getItem(key);
          const arr = raw ? JSON.parse(raw) : [];
          arr.push({
            id: `local-${Date.now()}`,
            fullname, email, interest,
            createdAt: new Date().toISOString()
          });
          localStorage.setItem(key, JSON.stringify(arr));
        } catch (err) {
          console.warn("Failed to save joined users list:", err);
        }
  
        // 3) Close modal and redirect to profile.html (same folder)
        closeModal();
  
        // small UX delay to let modal close animation finish
        setTimeout(() => {
          // If you want query params, you could pass ?demo=1
          window.location.href = "profile.html";
        }, 180);
      });
    }
  
  }); // DOMContentLoaded end
  
