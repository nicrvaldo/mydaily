const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember"
];

const calTitle = document.getElementById("cal-title");
const calGrid = document.getElementById("cal-grid");
const calPrev = document.getElementById("cal-prev");
const calNext = document.getElementById("cal-next");
const calToday = document.getElementById("cal-today");

const initialDate = new Date();
let calYear = initialDate.getFullYear();
let calMonth = initialDate.getMonth();

function renderCalendar() {
  calTitle.textContent = MONTH_NAMES[calMonth] + " " + calYear;

  const tasks = loadData(STORAGE_KEYS.tasks);
  const today = getTodayString();

  const firstDayIndex = new Date(calYear, calMonth, 1).getDay();

  const offset = (firstDayIndex + 6) % 7;

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();

  let html = "";

  for (let i = 0; i < offset; i++) {
    html += '<div class="cal-cell cal-empty"></div>';
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateString =
      calYear +
      "-" +
      String(calMonth + 1).padStart(2, "0") +
      "-" +
      String(day).padStart(2, "0");

    const dayTasks = tasks.filter(function (task) {
      return task.date === dateString;
    });

    let dotsHTML = "";
    ["overdue", "pending", "done"].forEach(function (status) {
      const hasStatus = dayTasks.some(function (task) {
        return getTaskStatus(task) === status;
      });
      if (hasStatus) {
        dotsHTML += `<i class="dot dot-${status}"></i>`;
      }
    });

    let classes = "cal-cell cal-day";
    if (dateString === today) {
      classes += " cal-today";
    }
    if (dateString === filterDate) {
      classes += " cal-selected";
    }

    html += `
      <button type="button" class="${classes}" data-date="${dateString}">
        <span class="cal-number">${day}</span>
        <span class="cal-dots">${dotsHTML}</span>
      </button>
    `;
  }

  calGrid.innerHTML = html;
}

function showCalendarMonthOf(dateString) {
  const parts = dateString.split("-");
  calYear = Number(parts[0]);
  calMonth = Number(parts[1]) - 1;
}

calPrev.addEventListener("click", function () {
  calMonth--;
  if (calMonth < 0) {
    calMonth = 11;
    calYear--;
  }
  renderCalendar();
});

calNext.addEventListener("click", function () {
  calMonth++;
  if (calMonth > 11) {
    calMonth = 0;
    calYear++;
  }
  renderCalendar();
});

calToday.addEventListener("click", function () {
  const now = new Date();
  calYear = now.getFullYear();
  calMonth = now.getMonth();
  renderCalendar();
});

calGrid.addEventListener("click", function (event) {
  const cell = event.target.closest("[data-date]");
  if (!cell) {
    return;
  }

  const clickedDate = cell.dataset.date;

  if (filterDate === clickedDate) {
    setFilterDate("");
  } else {
    setFilterDate(clickedDate);
  }
});