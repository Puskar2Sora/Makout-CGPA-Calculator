const gradePoints = { O:10, E:9, A:8, B:7, C:6, D:5, F:2, I:2 };

let currentSemester = 1;
let semesterData = {};

initSemesters(8);

function initSemesters(count) {
  const tabs = document.getElementById("semesterTabs");
  tabs.innerHTML = "";
  for (let i = 1; i <= count; i++) {
    const tab = document.createElement("div");
    tab.className = "sem-tab" + (i === 1 ? " active" : "");
    tab.innerText = "Sem " + i;
    tab.onclick = () => switchSemester(i);
    tabs.appendChild(tab);
  }
  addSubject();
}

function switchSemester(sem) {
  saveTable();
  currentSemester = sem;

  document.querySelectorAll(".sem-tab")
    .forEach((t, i) => t.classList.toggle("active", i + 1 === sem));

  document.getElementById("subjects").innerHTML =
    semesterData[sem] || "";

  if (!semesterData[sem]) addSubject();
}

function addSubject() {
  const row = document.createElement("tr");
  row.innerHTML = `
    <td><input class="input" placeholder="Subject / Lab Name"></td>
    <td><input type="number" step="0.5" class="input" placeholder="Credits"></td>
    <td>
      <select class="input">
        ${Object.keys(gradePoints).map(g => `<option>${g}</option>`).join("")}
      </select>
    </td>
    <td>
      <button onclick="this.closest('tr').remove()" class="text-red-600 font-bold">✕</button>
    </td>
  `;
  document.getElementById("subjects").appendChild(row);
}

function saveTable() {
  semesterData[currentSemester] =
    document.getElementById("subjects").innerHTML;
}

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
    alert("Please enter subjects and credits");
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

function generatePDF() {
  const { jsPDF } = window.jspdf;
  html2canvas(document.getElementById("app")).then(canvas => {
    const pdf = new jsPDF();
    pdf.addImage(canvas.toDataURL(), "PNG", 10, 10, 190, 0);
    pdf.save("MAKAUT_Grade_Card.pdf");
  });
}
