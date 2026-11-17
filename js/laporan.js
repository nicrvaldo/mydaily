const reportMonthSelect = document.getElementById("report-month");
const reportYearSelect = document.getElementById("report-year");
const reportHeading = document.getElementById("report-heading");
const reportIncome = document.getElementById("report-income");
const reportExpense = document.getElementById("report-expense");
const reportBalance = document.getElementById("report-balance");
const reportDonut = document.getElementById("report-donut");
const reportLegend = document.getElementById("report-legend");
const reportHistoryTitle = document.getElementById("report-history-title");
const reportTrxList = document.getElementById("report-trx-list");
const reportCsvButton = document.getElementById("report-csv");
const reportChartTitle = document.getElementById("report-chart-title");
const reportChartNote = document.getElementById("report-chart-note");
const reportBarChart = document.getElementById("report-bar-chart");
const reportTableTitle = document.getElementById("report-table-title");
const reportTableBody = document.getElementById("report-table-body");
const CSV_DELIMITER = ";";
const CATEGORY_COLORS = [
  "#6c5ce7", 
  "#0984e3", 
  "#00b894", 
  "#fdcb6e", 
  "#e84393", 
  "#b2bec3"  
];

const reportNow = new Date();
let reportYear = reportNow.getFullYear();
let reportMonth = reportNow.getMonth();

function fillMonthOptions() {
  let html = "";

  MONTH_NAMES.forEach(function (name, index) {
    html += `<option value="${index}">${name}</option>`;
  });

  reportMonthSelect.innerHTML = html;
}

function fillYearOptions() {
  const transactions = loadData(STORAGE_KEYS.transactions);

  const years = [reportNow.getFullYear(), reportYear];
  transactions.forEach(function (trx) {
    years.push(Number(trx.date.slice(0, 4)));
  });

  const uniqueYears = years
    .filter(function (year, index) {
      return years.indexOf(year) === index;
    })
    .sort(function (a, b) {
      return b - a;
    });

  let html = "";
  uniqueYears.forEach(function (year) {
    html += `<option value="${year}">${year}</option>`;
  });

  reportYearSelect.innerHTML = html;
}

function getReportMonthPrefix() {
  return reportYear + "-" + String(reportMonth + 1).padStart(2, "0");
}

function getCategoryColor(categoryName) {
  const index = CATEGORIES.expense.indexOf(categoryName);

  if (index === -1) {
    return "#b2bec3"; 
  }
  return CATEGORY_COLORS[index % CATEGORY_COLORS.length];
}


function formatPercent(value) {
  return value.toFixed(1).replace(".", ",") + "%";
}

function renderCategoryChart(categoryTotals, totalExpense) {
  if (totalExpense === 0) {
    reportDonut.style.background = "";
    reportLegend.innerHTML =
      '<li class="empty-state">Belum ada pengeluaran di bulan ini.</li>';
    return;
  }

  const items = Object.keys(categoryTotals).map(function (name) {
    return {
      name: name,
      amount: categoryTotals[name],
      percent: (categoryTotals[name] / totalExpense) * 100
    };
  });

  items.sort(function (a, b) {
    return b.amount - a.amount;
  });

  let legendHTML = "";
  const stops = [];
  let start = 0;

  items.forEach(function (item, index) {
    const color = getCategoryColor(item.name);

    let end = start + item.percent;
    if (index === items.length - 1) {
      end = 100; 
    }
    stops.push(color + " " + start + "% " + end + "%");
    start = end;

    legendHTML += `
      <li class="legend-item">
        <span class="legend-color" style="background-color: ${color}"></span>
        <span class="legend-name">${escapeHTML(item.name)}</span>
        <span class="legend-amount">${formatRupiah(item.amount)}</span>
        <span class="legend-percent">${formatPercent(item.percent)}</span>
      </li>
    `;
  });

  reportDonut.style.background = "conic-gradient(" + stops.join(", ") + ")";
  reportLegend.innerHTML = legendHTML;
}

function renderReportHistory(monthTransactions) {
  if (monthTransactions.length === 0) {
    reportTrxList.innerHTML =
      '<p class="empty-state">Tidak ada transaksi di bulan ini.</p>';
    return;
  }

  const sorted = monthTransactions.slice().sort(function (a, b) {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id - a.id;
  });

  let html = "";

  sorted.forEach(function (trx) {
    const sign = trx.type === "income" ? "+ " : "- ";

    html += `
      <div class="trx-item trx-${trx.type}">
        <div class="trx-info">
          <span class="trx-title">${escapeHTML(trx.title)}</span>
          <span class="trx-meta">${trx.category} · ${formatDateID(trx.date)}</span>
        </div>
        <span class="trx-amount">${sign}${formatRupiah(trx.amount)}</span>
      </div>
    `;
  });

  reportTrxList.innerHTML = html;
}

function renderReport() {
  fillYearOptions();
  reportMonthSelect.value = String(reportMonth);
  reportYearSelect.value = String(reportYear);

  const monthPrefix = getReportMonthPrefix();
  const allTransactions = loadData(STORAGE_KEYS.transactions);

  const monthTransactions = allTransactions.filter(function (trx) {
    return trx.date.startsWith(monthPrefix);
  });

  let income = 0;
  let expense = 0;
  const categoryTotals = {};

  monthTransactions.forEach(function (trx) {
    if (trx.type === "income") {
      income += trx.amount;
    } else if (trx.type === "expense") {
      expense += trx.amount;

      if (categoryTotals[trx.category] === undefined) {
        categoryTotals[trx.category] = 0;
      }
      categoryTotals[trx.category] += trx.amount;
    }
  });

  const balance = income - expense;

  const periodText = MONTH_NAMES[reportMonth] + " " + reportYear;

  reportHeading.textContent = "Ringkasan " + periodText;
  reportHistoryTitle.textContent = "Riwayat Transaksi " + periodText;

  reportIncome.textContent = formatRupiah(income);
  reportExpense.textContent = formatRupiah(expense);
  reportBalance.textContent = formatRupiah(balance);

  reportBalance.classList.remove("text-success", "text-danger");
  reportBalance.classList.add(balance >= 0 ? "text-success" : "text-danger");

    renderCategoryChart(categoryTotals, expense);
  renderReportHistory(monthTransactions);

  renderYearOverview();
}

reportMonthSelect.addEventListener("change", function () {
  reportMonth = Number(reportMonthSelect.value);
  renderReport();
});

reportYearSelect.addEventListener("change", function () {
  reportYear = Number(reportYearSelect.value);
  renderReport();
});

fillMonthOptions();

function getYearlyTotals(year) {
  const totals = [];
  for (let i = 0; i < 12; i++) {
    totals.push({ income: 0, expense: 0 });
  }

  const transactions = loadData(STORAGE_KEYS.transactions);

  transactions.forEach(function (trx) {
    if (Number(trx.date.slice(0, 4)) !== year) {
      return;
    }

    const monthIndex = Number(trx.date.slice(5, 7)) - 1;

    if (trx.type === "income") {
      totals[monthIndex].income += trx.amount;
    } else if (trx.type === "expense") {
      totals[monthIndex].expense += trx.amount;
    }
  });

  return totals;
}

function getBarHeight(value, maxValue) {
  if (maxValue === 0 || value === 0) {
    return 0;
  }
  const percent = (value / maxValue) * 100;
  return Math.max(percent, 2); }

function renderYearOverview() {
  const totals = getYearlyTotals(reportYear);

  let maxValue = 0;
  totals.forEach(function (item) {
    if (item.income > maxValue) {
      maxValue = item.income;
    }
    if (item.expense > maxValue) {
      maxValue = item.expense;
    }
  });

  reportChartTitle.textContent = "Perbandingan per Bulan " + reportYear;
  reportTableTitle.textContent = "Rekap Tahun " + reportYear;

  if (maxValue === 0) {
    reportChartNote.textContent = "Belum ada transaksi di tahun ini.";
  } else {
    reportChartNote.textContent =
      "Tinggi batang dibandingkan dengan nilai tertinggi: " + formatRupiah(maxValue) +
      ". Klik sebuah bulan untuk melihat laporannya.";
  }

  let chartHTML = "";

  totals.forEach(function (item, index) {
    const incomeHeight = getBarHeight(item.income, maxValue);
    const expenseHeight = getBarHeight(item.expense, maxValue);
    const selectedClass = index === reportMonth ? " selected" : "";

    const tooltip =
      MONTH_NAMES[index] + " " + reportYear +
      " | Pemasukan " + formatRupiah(item.income) +
      " | Pengeluaran " + formatRupiah(item.expense);

    chartHTML += `
      <button type="button" class="bar-group${selectedClass}" data-month="${index}" title="${tooltip}">
        <span class="bar-pair">
          <span class="bar bar-income" style="height: ${incomeHeight}%"></span>
          <span class="bar bar-expense" style="height: ${expenseHeight}%"></span>
        </span>
        <span class="bar-label">${MONTH_NAMES[index].slice(0, 3)}</span>
      </button>
    `;
  });

  reportBarChart.innerHTML = chartHTML;

  let totalIncome = 0;
  let totalExpense = 0;
  let rowsHTML = "";

  totals.forEach(function (item, index) {
    const difference = item.income - item.expense;
    totalIncome += item.income;
    totalExpense += item.expense;

    const rowClass = index === reportMonth ? "row-selected" : "";
    const differenceClass = difference >= 0 ? "text-success" : "text-danger";

    rowsHTML += `
      <tr class="${rowClass}">
        <td>${MONTH_NAMES[index]}</td>
        <td class="num text-success">${formatRupiah(item.income)}</td>
        <td class="num text-danger">${formatRupiah(item.expense)}</td>
        <td class="num ${differenceClass}">${formatRupiah(difference)}</td>
      </tr>
    `;
  });

  const yearDifference = totalIncome - totalExpense;
  const yearDifferenceClass = yearDifference >= 0 ? "text-success" : "text-danger";

  rowsHTML += `
    <tr class="row-total">
      <td>Total ${reportYear}</td>
      <td class="num text-success">${formatRupiah(totalIncome)}</td>
      <td class="num text-danger">${formatRupiah(totalExpense)}</td>
      <td class="num ${yearDifferenceClass}">${formatRupiah(yearDifference)}</td>
    </tr>
  `;

  reportTableBody.innerHTML = rowsHTML;
}

reportBarChart.addEventListener("click", function (event) {
  const group = event.target.closest("[data-month]");
  if (!group) {
    return;
  }

  reportMonth = Number(group.dataset.month);
  renderReport();
});

function csvEscape(value) {
  let text = String(value);

  if (typeof value === "string" && /^[=+\-@]/.test(text)) {
    text = "'" + text;
  }

  if (
    text.includes(CSV_DELIMITER) ||
    text.includes('"') ||
    text.includes("\n")
  ) {
    return '"' + text.replace(/"/g, '""') + '"';
  }
  return text;
}

function buildMonthlyCsv() {
  const monthPrefix = getReportMonthPrefix();

  const transactions = loadData(STORAGE_KEYS.transactions)
    .filter(function (trx) {
      return trx.date.startsWith(monthPrefix);
    })
    .sort(function (a, b) {
      if (a.date !== b.date) {
        return a.date.localeCompare(b.date);
      }
      return a.id - b.id;
    });

  if (transactions.length === 0) {
    return null;
  }

  let income = 0;
  let expense = 0;

  const rows = [];
  rows.push(["Laporan Keuangan MyDaily - " + MONTH_NAMES[reportMonth] + " " + reportYear]);
  rows.push([]); 
  rows.push(["Tanggal", "Jenis", "Kategori", "Keterangan", "Nominal"]);

  transactions.forEach(function (trx) {
    let typeLabel = "Pengeluaran";
    if (trx.type === "income") {
      typeLabel = "Pemasukan";
      income += trx.amount;
    } else {
      expense += trx.amount;
    }

    rows.push([trx.date, typeLabel, trx.category, trx.title, trx.amount]);
  });

  rows.push([]);
  rows.push(["", "", "", "Total Pemasukan", income]);
  rows.push(["", "", "", "Total Pengeluaran", expense]);
  rows.push(["", "", "", "Selisih", income - expense]);

  return rows
    .map(function (row) {
      return row.map(csvEscape).join(CSV_DELIMITER);
    })
    .join("\r\n");
}

reportCsvButton.addEventListener("click", function () {
  const csv = buildMonthlyCsv();

  if (csv === null) {
    alert("Tidak ada transaksi di bulan ini untuk diunduh.");
    return;
  }

  const filename = "laporan-mydaily-" + getReportMonthPrefix() + ".csv";
  downloadFile(filename, "\uFEFF" + csv, "text/csv;charset=utf-8;");
});