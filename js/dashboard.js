function getGreeting(hour) {
  if (hour >= 4 && hour < 11) {
    return "Selamat pagi";
  } else if (hour >= 11 && hour < 15) {
    return "Selamat siang";
  } else if (hour >= 15 && hour < 18) {
    return "Selamat sore";
  } else {
    return "Selamat malam";
  }
}

function updateClock() {
  const now = new Date();

  document.getElementById("greeting").textContent =
    getGreeting(now.getHours()) + "!";

  document.getElementById("today-date").textContent =
    now.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

  document.getElementById("clock").textContent =
    now.toLocaleTimeString("id-ID");
}

function renderTaskSummary() {
  const tasks = loadData(STORAGE_KEYS.tasks);
  const today = getTodayString();

  const todayTasks = tasks.filter(function (task) {
    return task.date === today;
  });

  const doneCount = todayTasks.filter(function (task) {
    return task.done === true;
  }).length;

  const pendingCount = todayTasks.length - doneCount;

  document.getElementById("task-total").textContent = todayTasks.length;
  document.getElementById("task-done").textContent = doneCount;
  document.getElementById("task-pending").textContent = pendingCount;
}

function renderFinanceSummary() {
  const transactions = loadData(STORAGE_KEYS.transactions);
  const thisMonth = getTodayString().slice(0, 7);

  let income = 0;
  let expense = 0;

  transactions.forEach(function (trx) {
    if (!trx.date.startsWith(thisMonth)) {
      return;
    }
    if (trx.type === "income") {
      income += trx.amount;
    } else if (trx.type === "expense") {
      expense += trx.amount;
    }
  });

  const balance = income - expense;

  document.getElementById("income-total").textContent = formatRupiah(income);
  document.getElementById("expense-total").textContent = formatRupiah(expense);

  const balanceElement = document.getElementById("balance-total");
  balanceElement.textContent = formatRupiah(balance);

  balanceElement.classList.remove("text-success", "text-danger");
  balanceElement.classList.add(balance >= 0 ? "text-success" : "text-danger");
}

function renderDashboard() {
  renderTaskSummary();
  renderFinanceSummary();
}

updateClock();
setInterval(updateClock, 1000);