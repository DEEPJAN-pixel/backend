console.log("FRONT-END SCRIPT LOADED ✔️");

// =========================
// VIMP Frontend Script
// Backend: Node + MySQL (Aiven)
// Some legacy modules still use localStorage for now
// =========================

// -------------------------
// 1. Config & LocalStorage Init
// -------------------------

let API_BASE;
if (
  window.location.origin.startsWith("http://localhost") ||
  window.location.origin.startsWith("http://127.0.0.1") ||
  window.location.origin.startsWith("file:")
) {
  // Local dev: backend on port 4000
  API_BASE = "http://localhost:4000";
} else {
  // Production: same origin as Railway app
  API_BASE = window.location.origin;
}

// Legacy local storage collections (still used by some pages)
if (!localStorage.getItem("students")) localStorage.setItem("students", JSON.stringify([]));
if (!localStorage.getItem("mentors")) localStorage.setItem("mentors", JSON.stringify([]));
if (!localStorage.getItem("employers")) localStorage.setItem("employers", JSON.stringify([]));
if (!localStorage.getItem("admins")) localStorage.setItem("admins", JSON.stringify([]));
if (!localStorage.getItem("internships")) localStorage.setItem("internships", JSON.stringify([]));
if (!localStorage.getItem("applications")) localStorage.setItem("applications", JSON.stringify([]));
if (!localStorage.getItem("tasks")) localStorage.setItem("tasks", JSON.stringify([]));
if (!localStorage.getItem("notifications")) localStorage.setItem("notifications", JSON.stringify({}));

let loggedInUser = null;
try {
  loggedInUser = JSON.parse(localStorage.getItem("loggedInUser")) || null;
} catch (e) {
  loggedInUser = null;
}

// -------------------------
// 2. Helper Functions
// -------------------------
function saveToLocal(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function loadFromLocal(key) {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  try {
    return JSON.parse(raw) || [];
  } catch (e) {
    return [];
  }
}

// simple local notifications (still localStorage-based)
function addNotification(email, message, type = "info") {
  if (!email) return;
  let all = {};
  try {
    all = JSON.parse(localStorage.getItem("notifications")) || {};
  } catch (e) {
    all = {};
  }
  if (!all[email]) all[email] = [];
  all[email].push({ message, type, date: new Date().toISOString(), read: false });
  localStorage.setItem("notifications", JSON.stringify(all));
}

function getNotifications(email) {
  if (!email) return [];
  try {
    const all = JSON.parse(localStorage.getItem("notifications")) || {};
    return all[email] || [];
  } catch (e) {
    return [];
  }
}

// -------------------------
// 3. Login / Signup Tabs (index.html)
// -------------------------
function initTabs() {
  const loginBtn = document.getElementById("tab-login-btn");
  const signupBtn = document.getElementById("tab-signup-btn");
  const loginTab = document.getElementById("tab-login");
  const signupTab = document.getElementById("tab-signup");

  if (!loginBtn || !signupBtn || !loginTab || !signupTab) return;

  loginTab.classList.add("is-active");
  signupTab.classList.remove("is-active");

  loginBtn.addEventListener("click", () => {
    loginBtn.classList.add("is-active");
    signupBtn.classList.remove("is-active");
    loginTab.classList.add("is-active");
    signupTab.classList.remove("is-active");
  });

  signupBtn.addEventListener("click", () => {
    signupBtn.classList.add("is-active");
    loginBtn.classList.remove("is-active");
    signupTab.classList.add("is-active");
    loginTab.classList.remove("is-active");
  });
}

// -------------------------
// 4. Global logout (top-level)
// -------------------------
document.addEventListener("click", (e) => {
  if (e.target.matches(".logout") || (e.target.closest && e.target.closest(".logout"))) {
    localStorage.removeItem("loggedInUser");
    localStorage.removeItem("authToken");
    loggedInUser = null;
    window.location.href = "index.html";
  }
});

// -------------------------
// 5. Protect pages that need login
// -------------------------
function protectPage() {
  const pagesNeedingLogin = [
    "student-dashboard",
    "student-tasks",
    "student-applications",
    "certificates",
    "profile",
    "notifications",
    "internship-search",
    "employer-dashboard",
    "post-internship",
    "mentor-dashboard",
    "mentor-profile",
    "admin-dashboard",
    "application-review",
    "task-management",
    "employer-profile"
  ];

  const current = document.body.dataset.page;

  let sessionUser = null;
  try {
    sessionUser = JSON.parse(localStorage.getItem("loggedInUser"));
  } catch (e) {
    sessionUser = null;
  }
  if (sessionUser) {
    loggedInUser = sessionUser;
  }

  if (pagesNeedingLogin.includes(current) && !sessionUser) {
    window.location.replace("index.html");
  }
}

// -------------------------
// 6. Sidebar toggle
// -------------------------
function initSidebarToggle() {
  const toggleBtn = document.getElementById("sidebar-toggle");
  const appShell = document.querySelector(".app");
  if (!toggleBtn || !appShell) return;
  toggleBtn.addEventListener("click", () => {
    appShell.classList.toggle("is-collapsed");
  });
}

// -------------------------
// 7. Page Loaders
// -------------------------
const pageLoaders = {

  // =======================
  // INDEX (login + signup)
  // =======================
  "index": function () {
    initTabs();

    // SIGNUP → backend
    const signupForm = document.getElementById("signupForm");
    if (signupForm) {
      signupForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = signupForm.querySelector("#signup-name").value.trim();
        const email = signupForm.querySelector("#signup-email").value.trim();
        const pass = signupForm.querySelector("#signup-password").value.trim();
        const role = signupForm.querySelector("#signup-role").value;

        const errBox = document.getElementById("signup-error");
        const okBox = document.getElementById("signup-success");

        if (!name || !email || !pass || !role) {
          if (errBox) {
            errBox.textContent = "All fields are required.";
            errBox.hidden = false;
          }
          return;
        }

        if (errBox) errBox.hidden = true;
        if (okBox) okBox.hidden = true;

        try {
          const res = await fetch(`${API_BASE}/api/auth/signup`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password: pass, role })
          });

          const data = await res.json();

          if (!res.ok || data.status !== "ok") {
            if (errBox) {
              errBox.textContent = data.message || "Sign up failed. Please try again.";
              errBox.hidden = false;
            }
            return;
          }

          if (okBox) {
            okBox.textContent = "Account created! You can now log in.";
            okBox.hidden = false;
          }
          signupForm.reset();
        } catch (err) {
          console.error("Signup error:", err);
          if (errBox) {
            errBox.textContent = "Network error. Please try again.";
            errBox.hidden = false;
          }
        }
      });
    }

    // LOGIN → backend
    const loginForm = document.getElementById("loginForm");
    if (loginForm) {
      loginForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const email = loginForm.querySelector("#login-email").value.trim();
        const pass = loginForm.querySelector("#login-password").value.trim();
        const errBox = document.getElementById("login-error");

        if (!email || !pass) {
          if (errBox) {
            errBox.textContent = "Email and password are required.";
            errBox.hidden = false;
          }
          return;
        }

        if (errBox) errBox.hidden = true;

        try {
          const res = await fetch(`${API_BASE}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password: pass })
          });

          const data = await res.json();

          if (!res.ok || data.status !== "ok") {
            if (errBox) {
              errBox.textContent = data.message || "Invalid email or password!";
              errBox.hidden = false;
            }
            return;
          }

          const user = data.user || {};
          const roleSingle = user.role;

          const logged = {
            id: user.id,
            email: user.email,
            role: roleSingle,
            name: user.name || ""
          };

          localStorage.setItem("authToken", data.token || "");
          localStorage.setItem("loggedInUser", JSON.stringify(logged));

          window.location.href = `${roleSingle}-dashboard.html`;
        } catch (err) {
          console.error("Login error:", err);
          if (errBox) {
            errBox.textContent = "Network error. Please try again.";
            errBox.hidden = false;
          }
        }
      });
    }
  },

  "employer-subscription": async function () {
    const user = loadFromLocal("loggedInUser");
    if (!user || user.role !== "employer") {
      location.href = "index.html";
      return;
    }

    // Load plan
    const res = await fetch(`${API_BASE}/api/subscription/${user.id}`);
    const data = await res.json();
    const currentPlan = data.plan;

    const freeBtn = document.getElementById("upgradeBtn");

    if (currentPlan === "plus") {
      freeBtn.textContent = "Active Plan";
      freeBtn.disabled = true;
    } else {
      freeBtn.textContent = "Upgrade to PLUS";
      freeBtn.disabled = false;
    }

    freeBtn.addEventListener("click", async () => {
      const up = await fetch(`${API_BASE}/api/subscription/upgrade`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employer_id: user.id })
      });

      const x = await up.json();
      if (x.status === "ok") {
        alert("Subscription upgraded!");
        location.reload();
      }
    });
  },

  // =======================
  // STUDENT DASHBOARD
  // =======================
  "student-dashboard": async function () {
    if (!loggedInUser || loggedInUser.role !== "student") return;

    const studentId = loggedInUser.id;
    const emailSpan = document.getElementById("student-email");
    if (emailSpan) emailSpan.textContent = loggedInUser.email;

    const kpiCards = document.querySelectorAll(".kpi-card");
    const appsSection = document.getElementById("apps");
    if (!appsSection) return;

    appsSection.innerHTML = "<h3>Recent Applications</h3>";

    // ============================
    // 1) LOAD KPI FROM BACKEND
    // ============================
    try {
      const kpiRes = await fetch(`${API_BASE}/api/student/dashboard/${studentId}`);
      const kpi = await kpiRes.json();

      if (kpi.status === "ok") {
        // Applications KPI
        if (kpiCards[0]) {
          kpiCards[0].querySelector(".kpi-value").textContent = kpi.apps.total;
          kpiCards[0].querySelector(".kpi-sub").textContent =
            `${kpi.apps.accepted} Accepted / ${kpi.apps.pending} Pending`;
        }

        // Tasks KPI
        if (kpiCards[1]) {
          kpiCards[1].querySelector(".kpi-value").textContent = kpi.tasks.total;
          kpiCards[1].querySelector(".kpi-sub").textContent =
            `${kpi.tasks.completed} Completed / ${kpi.tasks.pending} Pending`;
        }

        // Certificates KPI
        if (kpiCards[2]) {
          kpiCards[2].querySelector(".kpi-value").textContent = kpi.certificates.total;
        }

        // Progress KPI
        if (kpiCards[3]) {
          kpiCards[3].querySelector(".kpi-value").textContent = kpi.tasks.percent + "%";
          const bar = kpiCards[3].querySelector(".progress span");
          if (bar) bar.style.setProperty("--p", kpi.tasks.percent + "%");
        }
      }
    } catch (err) {
      console.error("KPI LOAD ERROR:", err);
    }

    // ============================
    // 2) LOAD RECENT APPLICATIONS
    // ============================
    try {
      const res = await fetch(`${API_BASE}/api/applications/student/${studentId}`);
      const data = await res.json();

      if (data.status !== "ok" || !data.applications.length) {
        appsSection.innerHTML += "<div class='empty'>No applications yet.</div>";
        return;
      }

      const table = document.createElement("table");
      table.className = "table";
      table.innerHTML =
        "<thead><tr><th>Internship</th><th>Status</th></tr></thead>";

      const tbody = document.createElement("tbody");

      data.applications.slice(0, 5).forEach(app => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
                <td>${app.internship_title}</td>
                <td>${app.status}</td>
            `;
        tbody.appendChild(tr);
      });

      table.appendChild(tbody);
      appsSection.appendChild(table);
    } catch (err) {
      console.error("Recent applications error:", err);
      appsSection.innerHTML += "<div class='empty'>Server error loading applications.</div>";
    }
  },

  // =======================
  // STUDENT TASKS (DB)
  // =======================
  "student-tasks": async function () {
    if (!loggedInUser || loggedInUser.role !== "student") return;

    const tbody = document.querySelector("tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    try {
      const res = await fetch(`${API_BASE}/api/student/tasks/${loggedInUser.id}`);
      const data = await res.json();

      if (data.status !== "ok") {
        tbody.innerHTML = "<tr><td colspan='4'>Server error loading tasks.</td></tr>";
        return;
      }

      const tasks = data.tasks || [];
      if (!tasks.length) {
        tbody.innerHTML = "<tr><td colspan='4'>No tasks assigned yet.</td></tr>";
        return;
      }

      tasks.forEach(t => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
        <td>${t.title}</td>
        <td>${t.due_date || ""}</td>
        <td>${t.status || "Assigned"}</td>
        <td><button class="btn mark-done">Complete</button></td>
      `;
        const btn = tr.querySelector(".mark-done");
        btn.addEventListener("click", async () => {
          try {
            await fetch(`${API_BASE}/api/student/tasks/${t.id}/complete`, {
              method: "POST"
            });
            // Just refresh table
            location.reload();
          } catch (err) {
            console.error("TASK COMPLETE ERROR:", err);
          }
        });
        tbody.appendChild(tr);
      });
    } catch (err) {
      console.error("TASK LIST ERROR:", err);
      tbody.innerHTML = "<tr><td colspan='4'>Server error loading tasks.</td></tr>";
    }
  },

  // =======================
  // STUDENT APPLICATIONS PAGE (DB)
  // =======================
  "student-applications": function () {
    if (!loggedInUser || loggedInUser.role !== "student") return;

    const tbody = document.getElementById("application-list");
    if (!tbody) return;
    tbody.innerHTML = "";

    (async function () {
      try {
        const res = await fetch(`${API_BASE}/api/applications/student/${loggedInUser.id}`);
        const data = await res.json();

        if (data.status !== "ok") {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td colspan="2" class="empty">Error loading applications.</td>`;
          tbody.appendChild(tr);
          return;
        }

        const apps = data.applications || [];

        if (apps.length === 0) {
          const tr = document.createElement("tr");
          tr.innerHTML = `<td colspan="2" class="empty">No applications yet.</td>`;
          tbody.appendChild(tr);
          return;
        }

        apps.forEach(app => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
            <td>${app.internship_title}</td>
            <td>${app.status}</td>
          `;
          tbody.appendChild(tr);
        });
      } catch (err) {
        console.error("My Applications Page Error:", err);
        const tr = document.createElement("tr");
        tr.innerHTML = `<td colspan="2" class="empty">Server error.</td>`;
        tbody.appendChild(tr);
      }
    })();
  },

  // =======================
  // CERTIFICATES (backend)
  // =======================
  "certificates": async function () {
    if (!loggedInUser || loggedInUser.role !== "student") return;

    const studentId = loggedInUser.id;
    const section = document.getElementById("certificates-list");
    if (!section) return;

    section.innerHTML = "<h3>Certificates</h3>";

    try {
      // Fetch certificates from backend
      const res = await fetch(`${API_BASE}/api/certificates/student/${studentId}`);
      const data = await res.json();

      if (data.status !== "ok") {
        section.innerHTML += "<div class='empty'>Could not load certificates.</div>";
        return;
      }

      const certs = data.certificates || [];

      if (!certs.length) {
        section.innerHTML += "<div class='empty'>No certificates yet.</div>";
        return;
      }

      // Render certificates
      certs.forEach(cert => {
        const div = document.createElement("div");
        div.className = "cert-item";
        div.innerHTML = `🏅 ${cert.title}`;
        section.appendChild(div);
      });

    } catch (err) {
      console.error("Certificate load error:", err);
      section.innerHTML += "<div class='empty'>Server error loading certificates.</div>";
    }
  },

  // =======================
  // STUDENT PROFILE (DB)
  // =======================
  "profile": async function () {
    if (!loggedInUser || loggedInUser.role !== "student") return;

    const id = loggedInUser.id;

    // 1) FETCH PROFILE FROM DB
    try {
      const res = await fetch(`${API_BASE}/api/student/profile/${id}`);
      const data = await res.json();
      if (data.status !== "ok") return;

      const user = data.profile;

      // LEFT CARD
      document.getElementById("profile-name-display").textContent = user.name || "";
      document.getElementById("profile-email-display").textContent = user.email;
      document.getElementById("profile-address-display").textContent =
        user.address ? "📍 " + user.address : "📍 No address added";

      const photoEl = document.getElementById("profile-photo");
      photoEl.src = user.photo || "default-avatar.png";

      // FORM FILL
      const form = document.getElementById("profileForm");
      form.name.value = user.name || "";
      form.email.value = user.email;  // disabled input
      form.address.value = user.address || "";
      form.bio.value = user.bio || "";

      const successBox = document.getElementById("profile-success");

      // 2) UPDATE PROFILE
      form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const payload = {
          id,
          name: form.name.value.trim(),
          address: form.address.value.trim(),
          bio: form.bio.value.trim()
        };

        const updateRes = await fetch(
          `${API_BASE}/api/student/profile/update`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );

        const out = await updateRes.json();
        if (out.status === "ok") {
          successBox.style.display = "block";
          successBox.textContent = "Profile updated!";
          setTimeout(() => (successBox.style.display = "none"), 2000);
        }
      });

      // 3) PHOTO UPLOAD
      const uploadInput = document.getElementById("photo-upload");
      const changeBtn = document.getElementById("change-photo-btn");
      const removeBtn = document.getElementById("remove-photo-btn");

      changeBtn.onclick = () => uploadInput.click();

      uploadInput.onchange = () => {
        const file = uploadInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result;

          await fetch(`${API_BASE}/api/student/profile/photo`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id, photo: base64 })
          });

          photoEl.src = base64;

          successBox.style.display = "block";
          successBox.textContent = "Profile photo updated!";
          setTimeout(() => (successBox.style.display = "none"), 2000);
        };
        reader.readAsDataURL(file);
      };

      // 4) REMOVE PHOTO
      removeBtn.onclick = async () => {
        await fetch(`${API_BASE}/api/student/profile/photo`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, photo: "" })
        });

        photoEl.src = "default-avatar.png";

        successBox.style.display = "block";
        successBox.textContent = "Profile photo removed!";
        setTimeout(() => (successBox.style.display = "none"), 2000);
      };
    } catch (err) {
      console.error("PROFILE FETCH ERROR:", err);
    }
  },

  // =======================
  // NOTIFICATIONS (backend)
  // =======================
  "notifications": async function () {
    if (!loggedInUser) return;
    const listEl = document.getElementById("notifications-list");
    if (!listEl) return;

    listEl.innerHTML = "Loading...";

    try {
      const res = await fetch(`${API_BASE}/api/student/notifications/${loggedInUser.id}`);
      const data = await res.json();

      if (data.status !== "ok") {
        listEl.innerHTML = "<div class='empty'>Error loading notifications.</div>";
        return;
      }

      const notes = data.notifications || [];
      if (!notes.length) {
        listEl.innerHTML = "<div class='empty'>No notifications.</div>";
        return;
      }

      listEl.innerHTML = "";
      notes.forEach(n => {
        const div = document.createElement("div");
        div.className = "note " + (n.is_read ? "read" : "unread");
        div.innerHTML = `
        <strong>${(n.type || "INFO").toUpperCase()}</strong> — ${n.message}
        <div class="time">${new Date(n.created_at).toLocaleString()}</div>
      `;
        div.addEventListener("click", async () => {
          if (n.is_read) return;
          try {
            await fetch(`${API_BASE}/api/student/notifications/${n.id}/read`, {
              method: "POST"
            });
            div.classList.add("read");
          } catch (err) {
            console.error("NOTIFICATION READ ERROR:", err);
          }
        });
        listEl.appendChild(div);
      });
    } catch (err) {
      console.error("NOTIFICATIONS ERROR:", err);
      listEl.innerHTML = "<div class='empty'>Server error loading notifications.</div>";
    }
  },

  // =======================
  // INTERNSHIP SEARCH (student) – BACKEND
  // =======================
  "internship-search": function () {
    if (!loggedInUser || loggedInUser.role !== "student") return;

    const container = document.getElementById("internship-list");
    const searchInput = document.getElementById("search-input");
    const searchBtn = document.getElementById("search-btn");

    if (!container || !searchInput || !searchBtn) return;

    let internships = [];

    function renderList(list) {
      container.innerHTML = "";

      if (!list || list.length === 0) {
        container.innerHTML = "<div class='empty'>No internships found.</div>";
        return;
      }

      list.forEach(i => {
        const card = document.createElement("article");
        card.className = "internship-card";

        card.innerHTML = `
        <header class="internship-card__header">
          <div class="internship-card__title">
            <h2>${i.title || "Untitled Position"}</h2>
            <p class="internship-card__company">
              ${i.company || "Unknown Company"}
            </p>
          </div>
          <span class="badge badge--pill">Internship</span>
        </header>

        <div class="internship-card__meta">
          <span class="meta-item">
            <span class="meta-label">Location</span>
            <span class="meta-value">${i.location || "Not specified"}</span>
          </span>

          ${i.mode ? `
          <span class="meta-item">
            <span class="meta-label">Mode</span>
            <span class="meta-value">${i.mode}</span>
          </span>` : ""}

          ${i.type ? `
          <span class="meta-item">
            <span class="meta-label">Type</span>
            <span class="meta-value">${i.type}</span>
          </span>` : ""}
        </div>

        <p class="internship-card__description">${i.description || ""}</p>

        <footer class="internship-card__footer">
          <button class="btn apply-btn" style="padding:6px 10px;font-size:14px;background:#eee;color:#333;border:1px solid #ccc;border-radius:6px;">
            Apply
          </button>
        </footer>
      `;

        const btn = card.querySelector(".apply-btn");
        btn.addEventListener("click", () => {
          applyFor(i);
          btn.textContent = "Applied ✓";
          btn.style.background = "#ccc";
          btn.style.color = "#555";
          btn.style.border = "1px solid #999";
          btn.style.cursor = "default";
          btn.disabled = true;
        });

        container.appendChild(card);
      });
    }

    async function applyFor(internship) {
      try {
        const res = await fetch(`${API_BASE}/api/applications`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            internship_id: internship.id,
            student_id: loggedInUser.id
          })
        });

        const data = await res.json();

        if (data.status === "ok") {
          console.log("Application submitted.");
        } else {
          alert(data.message || "Could not apply.");
        }
      } catch (err) {
        console.error("Apply error:", err);
        alert("Server error.");
      }
    }

    function performSearch() {
      const term = searchInput.value.toLowerCase().trim();
      if (!term) return renderList(internships);

      const results = internships.filter(i =>
        (i.title || "").toLowerCase().includes(term) ||
        (i.company || "").toLowerCase().includes(term) ||
        (i.location || "").toLowerCase().includes(term) ||
        (i.description || "").toLowerCase().includes(term) ||
        (i.mode || "").toLowerCase().includes(term) ||
        (i.type || "").toLowerCase().includes(term)
      );

      renderList(results);
    }

    searchBtn.addEventListener("click", performSearch);
    searchInput.addEventListener("keydown", e => {
      if (e.key === "Enter") {
        e.preventDefault();
        performSearch();
      }
    });

    searchInput.addEventListener("input", () => {
      performSearch();
    });

    async function loadFromBackend() {
      try {
        const res = await fetch(`${API_BASE}/api/internships/all`);
        const data = await res.json();

        if (!res.ok || data.status !== "ok") {
          console.error("Failed to load internships:", data);
          container.innerHTML =
            "<div class='empty'>Could not load internships from server.</div>";
          return;
        }

        internships = (data.internships || []).map(row => ({
          id: row.id,
          title: row.title,
          description: row.description,
          location: row.location,
          mode: row.mode,
          type: row.type,
          stipend: row.stipend,
          company: row.company || "VIMP Employer"
        }));

        renderList(internships);
      } catch (err) {
        console.error("Fetch internships error:", err);
        container.innerHTML =
          "<div class='empty'>Server not responding. Try again later.</div>";
      }
    }

    loadFromBackend();
  },

  // =======================
  // EMPLOYER DASHBOARD (still local for now)
  // =======================
  "employer-dashboard": function () {
    const stored = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    if (!stored || stored.role !== "employer") return;

    const employerEmail = stored.email;
    const welcomeEl = document.getElementById("employer-welcome");

    if (welcomeEl) {
      const name = stored.name || stored.company || stored.email;
      welcomeEl.textContent = `Welcome, ${name}`;
    }

    const allInternships = loadFromLocal("internships") || [];
    const myInternships = allInternships.filter(i => i.employerEmail === employerEmail);

    const totalInternshipsEl = document.getElementById("kpi-total-internships");
    if (totalInternshipsEl) totalInternshipsEl.textContent = myInternships.length;

    const applications = loadFromLocal("applications") || [];
    const myApps = applications.filter(a =>
      myInternships.some(i => i.id === a.internshipId)
    );

    const totalApplicantsEl = document.getElementById("kpi-total-applicants");
    if (totalApplicantsEl) totalApplicantsEl.textContent = myApps.length;

    const pending = myApps.filter(a => (a.status || "").toLowerCase() === "pending").length;
    const pendingEl = document.getElementById("kpi-pending-apps");
    if (pendingEl) pendingEl.textContent = pending;

    const table = document.getElementById("employer-internship-table");
    if (!table) return;

    table.innerHTML = "";

    if (myInternships.length === 0) {
      table.innerHTML = `
        <tr><td colspan="3" style="text-align:center;color:#666;">No internships posted yet.</td></tr>
      `;
      return;
    }

    myInternships.forEach(int => {
      const applicants = myApps.filter(a => a.internshipId === int.id).length;

      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${int.title}</td>
        <td>${applicants}</td>
        <td>${int.location}</td>
      `;

      table.appendChild(row);
    });
  },

  // =======================
  // MENTOR PROFILE (still local)
  // =======================
  "mentor-profile": function () {
    if (!loggedInUser || loggedInUser.role !== "mentor") return;

    const mentors = loadFromLocal("mentors");
    const user = mentors.find(m => m.email === loggedInUser.email);
    if (!user) return;

    const form = document.getElementById("mentorProfileForm");
    if (!form) return;

    const nameDisplay = document.getElementById("mentor-name-display");
    const emailDisplay = document.getElementById("mentor-email-display");
    const addrDisplay = document.getElementById("mentor-address-display");
    const skillsText = document.getElementById("mentor-skills-text");
    const resumeText = document.getElementById("mentor-resume-text");

    if (nameDisplay) nameDisplay.textContent = user.name || "Mentor";
    if (emailDisplay) emailDisplay.textContent = user.email || "";
    if (addrDisplay) addrDisplay.textContent = user.address || "No address provided";
    if (skillsText) {
      skillsText.textContent = user.skills && user.skills.trim()
        ? user.skills
        : "No skills added yet.";
    }
    if (resumeText) {
      if (user.resume && user.resume.trim()) {
        resumeText.innerHTML = `<a href="${user.resume}" target="_blank" rel="noopener">View Resume</a>`;
      } else {
        resumeText.textContent = "No resume link added.";
      }
    }

    form.name.value = user.name || "";
    form.email.value = user.email || "";
    form.address.value = user.address || "";
    form.skills.value = user.skills || "";
    form.bio.value = user.bio || "";
    form.resume.value = user.resume || "";

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      user.name = form.name.value.trim();
      user.address = form.address.value.trim();
      user.skills = form.skills.value.trim();
      user.bio = form.bio.value.trim();
      user.resume = form.resume.value.trim();

      const idx = mentors.findIndex(m => m.email === user.email);
      if (idx !== -1) {
        mentors[idx] = user;
        saveToLocal("mentors", mentors);
      }

      if (nameDisplay) nameDisplay.textContent = user.name || "Mentor";
      if (addrDisplay) addrDisplay.textContent = user.address || "No address provided";
      if (skillsText) {
        skillsText.textContent = user.skills
          ? user.skills
          : "No skills added yet.";
      }
      if (resumeText) {
        if (user.resume) {
          resumeText.innerHTML = `<a href="${user.resume}" target="_blank" rel="noopener">View Resume</a>`;
        } else {
          resumeText.textContent = "No resume link added.";
        }
      }

      alert("Profile updated!");
    });
  },

  // =======================
  // POST INTERNSHIP (backend)
  // =======================
  "post-internship": function () {
    if (!loggedInUser || loggedInUser.role !== "employer") return;

    const form = document.getElementById("post-internship-form");
    const successBox = document.getElementById("post-success");
    if (!form) return;

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const title = form.title.value.trim();
      const company = form.company.value.trim();
      const location = form.location.value.trim();
      const description = form.description.value.trim();

      const employer_id = loggedInUser?.id;

      console.log("Sending:", {
        employer_id,
        title,
        company,
        location,
        description
      });

      if (!title || !company || !location || !description) {
        alert("Please fill in all fields.");
        return;
      }

      try {
        const res = await fetch(`${API_BASE}/api/internships`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            employer_id,
            title,
            company,
            location,
            description
          })
        });

        const data = await res.json();

        if (data.status !== "ok") {
          console.error("Post internship error:", data);
          alert(data.message || "Failed to post internship.");
          return;
        }

        successBox.style.display = "block";
        setTimeout(() => (successBox.style.display = "none"), 2000);
        form.reset();

      } catch (err) {
        console.error("Network error posting internship:", err);
        alert("Network error. Please try again.");
      }
    });
  },

  // =======================
  // ADMIN DASHBOARD (still largely local)
  // =======================
  "admin-dashboard": function () {
    if (!loggedInUser || loggedInUser.role !== "admin") return;
    const students = loadFromLocal("students");
    const employers = loadFromLocal("employers");
    const mentors = loadFromLocal("mentors");
    const internships = loadFromLocal("internships");
    const applications = loadFromLocal("applications");

    const totalUsers = students.length + employers.length + mentors.length;
    const pendingApps = applications.filter(a => a.status === "Pending").length;

    const kpiCards = document.querySelectorAll(".kpi-card");
    if (kpiCards[0]) kpiCards[0].querySelector(".kpi-value").textContent = String(totalUsers);
    if (kpiCards[1]) kpiCards[1].querySelector(".kpi-value").textContent = String(internships.length);
    if (kpiCards[2]) kpiCards[2].querySelector(".kpi-value").textContent = String(pendingApps);
    if (kpiCards[3]) kpiCards[3].querySelector(".kpi-value").textContent = "100%";

    const tbody = document.getElementById("user-table-body") ||
      document.querySelector("table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";

    students.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.email}</td>
        <td>Student</td>
        <td><span class="badge">Active</span></td>
        <td><a href="#" class="linkbtn">View</a></td>
      `;
      tbody.appendChild(tr);
    });

    employers.forEach(e => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${e.email}</td>
        <td>Employer</td>
        <td><span class="badge">Active</span></td>
        <td><a href="#" class="linkbtn">View</a></td>
      `;
      tbody.appendChild(tr);
    });

    mentors.forEach(m => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${m.email}</td>
        <td>Mentor</td>
        <td><span class="badge">Active</span></td>
        <td><a href="#" class="linkbtn">View</a></td>
      `;
      tbody.appendChild(tr);
    });
  },

  // =======================
  // MENTOR DASHBOARD (still local)
  // =======================
  "mentor-dashboard": function () {
    if (!loggedInUser || loggedInUser.role !== "mentor") return;

    const internships = loadFromLocal("internships");
    const applications = loadFromLocal("applications");

    const myStudents = [];

    internships.forEach(job => {
      if (job.mentorEmail === loggedInUser.email) {
        applications.forEach(app => {
          if (app.internshipId === job.id && app.status === "Accepted") {
            myStudents.push({
              student: app.studentEmail,
              internship: job.title
            });
          }
        });
      }
    });

    const tbody = document.querySelector("table tbody");
    if (!tbody) return;

    tbody.innerHTML = "";

    if (myStudents.length === 0) {
      tbody.innerHTML = `<tr><td colspan="2" class="empty">No students assigned yet.</td></tr>`;
      return;
    }

    myStudents.forEach(s => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${s.student}</td>
        <td>${s.internship}</td>
      `;
      tbody.appendChild(tr);
    });
  },

  // =======================
  // APPLICATION REVIEW (employer/admin, DB)
  // =======================
  "application-review": function () {
    if (!loggedInUser) return;

    const tbody = document.querySelector("#applications-table-body");
    if (!tbody) return;

    tbody.innerHTML = "";

    let url = `${API_BASE}/api/applications/all`;

    if (loggedInUser.role === "employer") {
      url = `${API_BASE}/api/applications/employer/${loggedInUser.id}`;
    }

    (async function loadApps() {
      try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.status !== "ok") {
          tbody.innerHTML = `<tr><td colspan="4">Error loading applications.</td></tr>`;
          return;
        }

        const apps = data.applications;

        if (!apps || apps.length === 0) {
          tbody.innerHTML = `<tr><td colspan="4">No applications available.</td></tr>`;
          return;
        }

        apps.forEach(app => {
          const tr = document.createElement("tr");
          tr.innerHTML = `
          <td>${app.studentEmail}</td>
          <td>${app.internship_title}</td>
          <td>${app.status}</td>
          <td>
            <button class="btn accept">Accept</button>
            <button class="btn reject">Reject</button>
          </td>
        `;
          tbody.appendChild(tr);

          tr.querySelector(".accept").addEventListener("click", () => {
            updateStatus(app.id, "accepted", tr);
          });

          tr.querySelector(".reject").addEventListener("click", () => {
            updateStatus(app.id, "rejected", tr);
          });
        });

      } catch (err) {
        console.error("Review load error:", err);
        tbody.innerHTML = `<tr><td colspan="4">Server error.</td></tr>`;
      }
    })();

    async function updateStatus(id, status, row) {
      try {
        const res = await fetch(`${API_BASE}/api/applications/${id}/status`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({ status })
        });

        const data = await res.json();

        if (data.status === "ok") {
          row.children[2].textContent = status;
        } else {
          alert("Failed to update status");
        }

      } catch (err) {
        console.error("Status update error:", err);
        alert("Server error updating status.");
      }
    }
  },

  // =======================
  // EMPLOYER PROFILE (still local for now)
  // =======================
  "employer-profile": function () {
    const logged = JSON.parse(localStorage.getItem("loggedInUser") || "null");
    if (!logged || logged.role !== "employer") return;

    let employers = loadFromLocal("employers") || [];
    let employer = employers.find(e => e.email === logged.email);

    if (!employer) {
      employer = {
        email: logged.email,
        companyName: logged.name || "",
        industry: "",
        website: "",
        phone: "",
        address: "",
        description: "",
        logo: ""
      };
      employers.push(employer);
      saveToLocal("employers", employers);
    }

    const form = document.getElementById("employer-profile-form");
    const saveMsg = document.getElementById("save-msg");

    const nameInput = document.getElementById("company-name");
    const industryInput = document.getElementById("company-industry");
    const websiteInput = document.getElementById("company-website");
    const phoneInput = document.getElementById("company-phone");
    const addressInput = document.getElementById("company-address");
    const descInput = document.getElementById("company-description");

    const logoInput = document.getElementById("company-logo-input");
    const logoPreview = document.getElementById("company-logo-preview");

    if (!form || !nameInput || !logoPreview) return;

    nameInput.value = employer.companyName || "";
    industryInput.value = employer.industry || "";
    websiteInput.value = employer.website || "";
    phoneInput.value = employer.phone || "";
    addressInput.value = employer.address || "";
    descInput.value = employer.description || "";

    logoPreview.src = employer.logo || "https://via.placeholder.com/150x150.png?text=Logo";

    if (logoInput) {
      logoInput.addEventListener("change", () => {
        const file = logoInput.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
          logoPreview.src = e.target.result;
          employer.logo = e.target.result;
          saveToLocal("employers", employers);
        };

        reader.readAsDataURL(file);
      });
    }

    const removeLogoBtn = document.getElementById("remove-logo");
    if (removeLogoBtn) {
      removeLogoBtn.addEventListener("click", () => {
        employer.logo = "";
        saveToLocal("employers", employers);
        logoPreview.src = "https://via.placeholder.com/150x150.png?text=Logo";
      });
    }

    form.addEventListener("submit", (e) => {
      e.preventDefault();

      employer.companyName = nameInput.value.trim();
      employer.industry = industryInput.value.trim();
      employer.website = websiteInput.value.trim();
      employer.phone = phoneInput.value.trim();
      employer.address = addressInput.value.trim();
      employer.description = descInput.value.trim();

      saveToLocal("employers", employers);

      if (saveMsg) {
        saveMsg.style.display = "block";
        setTimeout(() => saveMsg.style.display = "none", 1500);
      }
    });
  },

  // =======================
  // TASK MANAGEMENT (still local)
  // =======================
  "task-management": function () {
    const tasks = loadFromLocal("tasks");
    const tbody = document.querySelector("table tbody");
    if (!tbody) return;
    tbody.innerHTML = "";
    tasks.forEach(t => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${t.title}</td>
        <td>${t.assignee}</td>
        <td>${t.status || "Open"}</td>
      `;
      tbody.appendChild(tr);
    });
  }
};

// -------------------------
// 8. Initialize per page
// -------------------------
document.addEventListener("DOMContentLoaded", () => {
  protectPage();
  initSidebarToggle();
  const page = document.body.dataset.page || "index";
  if (pageLoaders[page]) {
    pageLoaders[page]();
  }
});
