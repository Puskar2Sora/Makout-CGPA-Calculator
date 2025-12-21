const gradePoints = { O:10, E:9, A:8, B:7, C:6, D:5, F:2, I:2 };

let currentSemester = 1;
let semesterData = {};

initSemesters(8);

/* ---------- SEMESTERS ---------- */
function initSemesters(count) {
  const tabs = document.getElementById("semesterTabs");
  tabs.innerHTML = "";

  for (let i = 1; i <= count; i++) {
    const tab = document.createElement("div");
    tab.className = "sem-tab" + (i === 1 ? " active" : "");
    tab.innerText = "Semester " + i;
    tab.onclick = () => switchSemester(i);
    tabs.appendChild(tab);
  }

  addSubject();
}

function switchSemester(sem) {
  saveTable();
  currentSemester = sem;

  document.querySelectorAll(".sem-tab")
    .forEach((t,i)=>t.classList.toggle("active", i+1===sem));

  const table = document.getElementById("subjects");
  const mobile = document.getElementById("mobileSubjects");

  table.classList.add("fade-enter");
  mobile.classList.add("fade-enter");

  setTimeout(() => {
    table.innerHTML = semesterData[sem] || "";
    mobile.innerHTML = "";

    if (!semesterData[sem]) addSubject();

    table.classList.remove("fade-enter");
    table.classList.add("fade-active");
    mobile.classList.remove("fade-enter");
    mobile.classList.add("fade-active");

    setTimeout(() => {
      table.classList.remove("fade-active");
      mobile.classList.remove("fade-active");
    }, 250);
  }, 150);
}

/* ---------- SUBJECTS ---------- */
function addSubject() {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td><input class="input" placeholder="Subject / Lab name"></td>
    <td><input type="number" step="0.5" class="input" placeholder="Credits"></td>
    <td>
      <select class="input">
        ${Object.keys(gradePoints).map(g=>`<option>${g}</option>`).join("")}
      </select>
    </td>
    <td>
      <button onclick="removeRow(this)" class="text-red-600 font-bold">✕</button>
    </td>
  `;
  document.getElementById("subjects").appendChild(tr);

  const card = document.createElement("div");
  card.className = "card";
  card.innerHTML = `
    <input class="input mb-2" placeholder="Subject / Lab name">
    <input type="number" step="0.5" class="input mb-2" placeholder="Credits">
    <select class="input mb-2">
      ${Object.keys(gradePoints).map(g=>`<option>${g}</option>`).join("")}
    </select>
    <button onclick="this.parentElement.remove()" class="text-red-600 text-sm">Remove</button>
  `;
  document.getElementById("mobileSubjects").appendChild(card);
}

function removeRow(btn) {
  btn.closest("tr").remove();
}

function saveTable() {
  semesterData[currentSemester] =
    document.getElementById("subjects").innerHTML;
}

/* ---------- CALCULATION ---------- */
function saveSemester() {
  let credits = 0, points = 0;

  document.querySelectorAll("#subjects tr").forEach(row => {
    const c = parseFloat(row.children[1].children[0].value);
    const g = row.children[2].children[0].value;
    if (!isNaN(c)) {
      credits += c;
      points += c * gradePoints[g];
    }
  });

  if (credits === 0) {
    alert("Please enter subjects and credits.");
    return;
  }

  const sgpa = +(points / credits).toFixed(2);
  const percentage = +(sgpa * 9.5).toFixed(2);
  const cgpa = sgpa;

  document.getElementById("totalCredits").innerText = credits;
  document.getElementById("totalPoints").innerText = points.toFixed(1);
  document.getElementById("sgpa").innerText = sgpa;
  document.getElementById("percentage").innerText = percentage + " %";
  document.getElementById("cgpa").innerText = cgpa;

  document.getElementById("result").classList.remove("hidden");
}

/* ---------- PDF ---------- */
function generatePDF() {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF("p", "mm", "a4");

  // ===== HEADER =====
  doc.setFont("times", "bold");
  doc.setFontSize(14);
  doc.text("MAULANA ABUL KALAM AZAD UNIVERSITY OF TECHNOLOGY", 105, 18, { align: "center" });

  doc.setFontSize(11);
  doc.text("WEST BENGAL", 105, 25, { align: "center" });
  doc.text("GRADE CARD", 105, 32, { align: "center" });

  doc.line(20, 36, 190, 36);

  // ===== STUDENT DETAILS =====
  doc.setFont("times", "normal");
  doc.setFontSize(10);

  const studentName = document.getElementById("studentName").value || "-";
  const rollNo = document.getElementById("rollNo").value || "-";
  const regNo = document.getElementById("regNo").value || "-";
  const college = document.getElementById("college").value || "-";
  const branch = document.getElementById("branch").value || "-";

  let y = 44;
  doc.text(`Name of the Student : ${studentName}`, 20, y);
  doc.text(`Roll No : ${rollNo}`, 120, y);

  y += 7;
  doc.text(`Registration No : ${regNo}`, 20, y);
  doc.text(`Branch : ${branch}`, 120, y);

  y += 7;
  doc.text(`College / Institution : ${college}`, 20, y);

  y += 10;

  // ===== SUBJECT TABLE =====
  const tableBody = [];
  let totalCredits = 0;
  let totalPoints = 0;

  document.querySelectorAll("#subjects tr").forEach((row, i) => {
    const subject = row.children[0].children[0].value || "-";
    const credit = parseFloat(row.children[1].children[0].value) || 0;
    const grade = row.children[2].children[0].value;
    const gp = gradePoints[grade];
    const creditPoint = credit * gp;

    totalCredits += credit;
    totalPoints += creditPoint;

    tableBody.push([
      i + 1,
      subject,
      credit.toString(),
      grade,
      creditPoint.toFixed(1)
    ]);
  });

  doc.autoTable({
    startY: y,
    head: [["Sl No", "Subject", "Credits", "Grade", "Credit Points"]],
    body: tableBody,
    styles: { font: "times", fontSize: 10 },
    headStyles: { fillColor: [230, 230, 230], textColor: 0 },
    columnStyles: {
      0: { cellWidth: 15 },
      1: { cellWidth: 75 },
      2: { cellWidth: 20 },
      3: { cellWidth: 20 },
      4: { cellWidth: 30 }
    }
  });

  y = doc.lastAutoTable.finalY + 10;

  // ===== RESULT SUMMARY =====
  const sgpa = (totalPoints / totalCredits).toFixed(2);
  const percentage = (sgpa * 9.5).toFixed(2);

  doc.setFont("times", "bold");
  doc.text(`Total Credits : ${totalCredits}`, 20, y);
  doc.text(`Total Credit Points : ${totalPoints.toFixed(1)}`, 120, y);

  y += 8;
  doc.text(`SGPA : ${sgpa}`, 20, y);
  doc.text(`Percentage : ${percentage}%`, 120, y);

  y += 8;
  doc.text(`Result : PASS`, 20, y);

  // ===== FOOTER =====
  y += 20;
  doc.setFont("times", "normal");
  doc.text("Date : ____________________", 20, y);
  doc.text("Controller of Examinations", 120, y);

  doc.save("MAKAUT_Grade_Card.pdf");
}


/* ---------- THEME ---------- */
function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(
    "theme",
    document.documentElement.classList.contains("dark") ? "dark" : "light"
  );
}

(function(){
  if (localStorage.getItem("theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
})();

/* =========================
   DARK / LIGHT MODE LOGIC
========================= */

const toggle = document.getElementById("themeToggle");

// Load saved theme
(function () {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.documentElement.classList.add("dark");
    toggle.checked = true;
  }
})();

// Toggle handler
toggle.addEventListener("change", () => {
  if (toggle.checked) {
    document.documentElement.classList.add("dark");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.classList.remove("dark");
    localStorage.setItem("theme", "light");
  }
});
