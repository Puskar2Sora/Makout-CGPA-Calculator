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
  const table = document.getElementById("subjects");
  table.innerHTML = "";

  // 1️⃣ If user already edited this semester → use stored data
  if (semesterData[sem]?.subjects?.length) {
    semesterData[sem].subjects.forEach(addSubjectFromData);
    return;
  }

  // 2️⃣ Else use cached API data
  if (apiSemesterCache[sem]) {
    apiSemesterCache[sem].forEach(s => {
      addSubjectFromData({
        name: s.name,
        credit: s.credit,
        grade: "O"
      });
    });
    autoSaveCurrentSemester();
 // save immediately
    return;
  }

  // 3️⃣ Fallback
  addSubject();
}

/* =========================
   SUBJECT UI
========================= */
function addSubject() {
  const tr = createSubjectRow({ name:"", credit:"", grade:"O" });
  document.getElementById("subjects").appendChild(tr);
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

  document.querySelectorAll("#subjects tr").forEach(row => {
    const name = row.children[0].children[0].value.trim();
    const credit = parseFloat(row.children[1].children[0].value);
    const grade = row.children[2].children[0].value;

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
  const stream = document.getElementById("streamSelect").value;
  if (!stream) return;

  // Reset previous data
  apiSemesterCache = {};
  semesterData = {};
  sessionStorage.removeItem("semesterData");

  // Optional: clear UI
  document.getElementById("subjects").innerHTML = "";

  for (let sem = 1; sem <= 8; sem++) {
    try {
      const res = await fetch(`${API_BASE_URL}/api/subjects?stream=${stream}&semester=${sem}`);
      const data = await res.json();

      if (data.subjects) {
        apiSemesterCache[sem] = data.subjects;
      }
    } catch (err) {
      console.warn(`No data for semester ${sem}`);
    }
  }

  // Load Semester 1 by default
  currentSemester = 1;
  loadSemester(1);
}
