

const apiLoader = document.getElementById("apiLoader");

function showLoader() {
  apiLoader.classList.remove("hidden");
}

function hideLoader() {
  apiLoader.classList.add("hidden");
}


// 🔥 wake server ASAP
fetch("https://makout-api.onrender.com")
  .catch(() => {});

let apiSemesterCache = {}; 
const API_BASE_URL = "https://makout-api.onrender.com";

/* =========================
   MAKAUT GRADE POINT MAP
========================= */
const gradePoints = { O:10, E:9, A:8, B:7, C:6, D:5, F:2, I:2 };

let currentSemester = 1;

// Load session data
let semesterData = JSON.parse(sessionStorage.getItem("semesterData")) || {};

/* =========================
   INIT SEMESTERS
========================= */
initSemesters(8);

function initSemesters(count) {
  const tabs = document.getElementById("semesterTabs");
  tabs.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const tab = document.createElement("div");
    tab.className = "sem-tab" + (i === currentSemester ? " active" : "");
    tab.innerText = "Semester " + i;
    tab.onclick = () => switchSemester(i);
    tabs.appendChild(tab);
  }

}

/* =========================
   SEMESTER SWITCH
========================= */
function switchSemester(sem) {
  autoSaveCurrentSemester(); // 🔥 autosave before switching
  currentSemester = sem;

  document.querySelectorAll(".sem-tab")
    .forEach((t,i)=>t.classList.toggle("active", i+1===sem));

  loadSemester(sem);
}

/* =========================
   LOAD SEMESTER
========================= */
function loadSemester(sem) {
  document.getElementById("subjects").innerHTML = "";
  document.getElementById("mobileSubjects").innerHTML = "";

  // 1️⃣ USER DATA HAS PRIORITY
  if (semesterData[sem]?.subjects?.length) {
    semesterData[sem].subjects.forEach(s => {
      addSubjectFromData(s);
      addMobileSubject(s);
    });
    return; // 🔥 STOP HERE
  }

  // 2️⃣ ONLY USE API DATA IF NO USER DATA EXISTS
  if (apiSemesterCache[sem]) {
    apiSemesterCache[sem].forEach(s => {
      const subject = { name: s.name, credit: s.credit, grade: "O" };
      addSubjectFromData(subject);
      addMobileSubject(subject);
    });

    // Save API data ONCE so it becomes user data
    autoSaveCurrentSemester();
    return;
  }

  // 3️⃣ EMPTY SEMESTER
  addSubject();
}


/* =========================
   SUBJECT UI
========================= */
function addSubject() {
  const isMobile = window.innerWidth < 640;

  if (isMobile) {
    addMobileSubject({ name: "", credit: "", grade: "O" });
  } else {
    const tr = createSubjectRow({ name:"", credit:"", grade:"O" });
    document.getElementById("subjects").appendChild(tr);
  }

  autoSaveCurrentSemester();
}

function addSubjectFromData(s) {
  const tr = createSubjectRow(s);
  document.getElementById("subjects").appendChild(tr);
}


function createSubjectRow(data) {
  const tr = document.createElement("tr");

  tr.innerHTML = `
    <td><input class="input" value="${data.name || ""}"></td>
    <td><input type="number" step="0.5" class="input" value="${data.credit || ""}"></td>
    <td>
      <select class="input">
        ${Object.keys(gradePoints)
          .map(g => `<option ${g === data.grade ? "selected" : ""}>${g}</option>`)
          .join("")}
      </select>
    </td>
    <td>
      <button class="text-red-600 font-bold">✕</button>
    </td>
  `;

  // 🔥 AUTO SAVE ON EVERY INPUT
  tr.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", autoSaveCurrentSemester);
    el.addEventListener("change", autoSaveCurrentSemester);
  });

  tr.querySelector("button").onclick = () => {
    tr.remove();
    autoSaveCurrentSemester();
  };

  return tr;
}

/* =========================
   AUTO SAVE (CORE FIX)
========================= */
function autoSaveCurrentSemester() {
  const subjects = [];
  let totalCredits = 0;
  let totalPoints = 0;

  const isMobile = window.innerWidth < 640;
  const rows = isMobile
    ? document.querySelectorAll("#mobileSubjects .card")
    : document.querySelectorAll("#subjects tr");

  rows.forEach(row => {
    const inputs = row.querySelectorAll("input, select");
    const name = inputs[0].value.trim();
    const credit = parseFloat(inputs[1].value);
    const grade = inputs[2].value;

    if (!isNaN(credit) && credit > 0) {
      totalCredits += credit;
      totalPoints += credit * gradePoints[grade];
      subjects.push({ name, credit, grade });
    }
  });

  semesterData[currentSemester] = {
    subjects,
    totalCredits,
    totalPoints,
    sgpa: totalCredits ? +(totalPoints / totalCredits).toFixed(2) : 0
  };

  sessionStorage.setItem("semesterData", JSON.stringify(semesterData));
}

/* =========================
   SAVE BUTTON (OPTIONAL)
========================= */
function saveSemester() {
  autoSaveCurrentSemester();
  calculateAndDisplay();
}

/* =========================
   CALCULATE + DISPLAY
========================= */
function calculateAndDisplay() {
  const semKeys = Object.keys(semesterData);
  const semCount = semKeys.length;
  const cur = semesterData[currentSemester];

  if (!cur || cur.totalCredits === 0) return;

  document.getElementById("totalCredits").innerText = cur.totalCredits;
  document.getElementById("totalPoints").innerText = cur.totalPoints.toFixed(1);
  document.getElementById("sgpa").innerText = cur.sgpa;

  if (semCount >= 2) {
    let totalC = 0, totalP = 0;
    semKeys.forEach(k => {
      totalC += semesterData[k].totalCredits;
      totalP += semesterData[k].totalPoints;
    });

    const cgpa = +(totalP / totalC).toFixed(2);
    const percentage = +(cgpa * 9.5).toFixed(2);

    document.getElementById("cgpa").innerText = cgpa;
    document.getElementById("percentage").innerText = percentage + " %";
  } else {
    document.getElementById("cgpa").innerText = "-";
    document.getElementById("percentage").innerText = "-";
  }

  document.getElementById("result").classList.remove("hidden");
}

async function loadStreamData() {
  showLoader();   // 👈 ADD THIS LINE

  const stream = document.getElementById("streamSelect").value;
  if (!stream) return;

  apiSemesterCache = {};
  semesterData = {};
  sessionStorage.removeItem("semesterData");

  document.getElementById("subjects").innerHTML = "";
  document.getElementById("mobileSubjects").innerHTML = "";

  // 🔥 1️⃣ Load SEMESTER 1 FIRST
  try {
    const res = await fetch(
      `${API_BASE_URL}/api/subjects?stream=${stream}&semester=1`
    );
    const data = await res.json();

    if (data.subjects) {
      apiSemesterCache[1] = data.subjects;
    }
  } catch {
    console.warn("Semester 1 failed");
  }

  // ✅ show sem 1 immediately
  switchSemester(1);
  hideLoader(); 

  // 🔄 2️⃣ Load remaining semesters in background
  for (let sem = 2; sem <= 8; sem++) {
    fetch(`${API_BASE_URL}/api/subjects?stream=${stream}&semester=${sem}`)
      .then(res => res.json())
      .then(data => { 
        if (data.subjects) {
          apiSemesterCache[sem] = data.subjects;
        }
      })
      .catch(() => {
        console.warn(`Semester ${sem} failed`);
      });
  }
}


function addMobileSubject(data) {
  const card = document.createElement("div");
  card.className = "card border";

  card.innerHTML = `
    <input class="input mb-2" placeholder="Subject / Lab"
      value="${data.name || ""}">
    <input type="number" step="0.5" class="input mb-2"
      placeholder="Credits" value="${data.credit || ""}">
    <select class="input mb-2">
      ${Object.keys(gradePoints)
        .map(g => `<option ${g===data.grade?"selected":""}>${g}</option>`)
        .join("")}
    </select>
    <button class="text-red-600 text-sm">Remove</button>
  `;

  card.querySelectorAll("input, select").forEach(el => {
    el.addEventListener("input", autoSaveCurrentSemester);
    el.addEventListener("change", autoSaveCurrentSemester);
  });

  card.querySelector("button").onclick = () => {
    card.remove();
    autoSaveCurrentSemester();
  };

  document.getElementById("mobileSubjects").appendChild(card);
}

/* =========================
   BB-8 DARK / LIGHT MODE
========================= */

const themeToggle = document.getElementById("themeToggle");
const root = document.documentElement;

// Load saved theme
const savedTheme = localStorage.getItem("theme");

if (savedTheme === "dark") {
  root.classList.add("dark");
  themeToggle.checked = true;
}

// Toggle theme
themeToggle.addEventListener("change", () => {
  if (themeToggle.checked) {
    root.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    root.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});
async function getSGPAAIAdvice() {
  const aiTextEl = document.getElementById("aiText");
  const aiSection = document.getElementById("aiResult");

  if (!aiTextEl || !aiSection) {
    alert("AI UI not ready");
    return;
  }

  const cur = semesterData[currentSemester];

  if (!cur || !cur.sgpa || !cur.subjects?.length) {
    alert("Please calculate SGPA first.");
    return;
  }

  try {
    showLoader();

    const res = await fetch(
      "https://makout-back.onrender.com/api/sgpa-ai",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sgpa: Number(cur.sgpa),
          semester: currentSemester,
          subjects: cur.subjects
        })
      }
    );

    const data = await res.json();
    hideLoader();

    aiTextEl.innerText =
      data.advice || "No AI advice generated.";
    aiSection.classList.remove("hidden");

  } catch (err) {
    hideLoader();
    console.error(err);
    alert("AI failed. Try again.");
  }
}
