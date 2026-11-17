const trxForm = document.getElementById("trx-form");
const typeRadios = document.querySelectorAll('input[name="trx-type"]');
const inputTrxTitle = document.getElementById("trx-title");
const inputTrxAmount = document.getElementById("trx-amount");
const inputTrxCategory = document.getElementById("trx-category");
const inputTrxDate = document.getElementById("trx-date");
const trxList = document.getElementById("trx-list");
const trxFormTitle = document.getElementById("trx-form-title");
const btnTrxSubmit = document.getElementById("trx-submit");
const btnTrxCancel = document.getElementById("trx-cancel");
const trxFilterMonthInput = document.getElementById("trx-filter-month");
const trxFilterDateInput = document.getElementById("trx-filter-date");
const trxFilterTypeSelect = document.getElementById("trx-filter-type");
const trxFilterCategorySelect = document.getElementById("trx-filter-category");
const btnTrxFilterReset = document.getElementById("trx-filter-reset");
const trxSummary = document.getElementById("trx-summary");

let editingTrxId = null; 
let trxFilterMonth = "";
let trxFilterDate = "";
let trxFilterType = "all";
let trxFilterCategory = "all";

function getSelectedType() {
  return document.querySelector('input[name="trx-type"]:checked').value;
}

function updateCategoryOptions() {
  const type = getSelectedType();
  let html = "";

  CATEGORIES[type].forEach(function (category) {
    html += `<option value="${category}">${category}</option>`;
  });

  inputTrxCategory.innerHTML = html;
}

function setSelectedType(type) {
  document.querySelector('input[name="trx-type"][value="' + type + '"]').checked = true;
  updateCategoryOptions();
}

function fillCategoryFilter() {
  const all = CATEGORIES.income.concat(CATEGORIES.expense);
  let html = '<option value="all">Semua</option>';

  all.forEach(function (category, index) {
    if (all.indexOf(category) === index) {
      html += `<option value="${category}">${category}</option>`;
    }
  });

  trxFilterCategorySelect.innerHTML = html;
}

function resetTrxForm() {
  inputTrxTitle.value = "";
  inputTrxAmount.value = "";
  inputTrxDate.value = getTodayString();

  editingTrxId = null;
  trxFormTitle.textContent = "Tambah Transaksi";
  btnTrxSubmit.textContent = "Simpan Transaksi";
  btnTrxCancel.hidden = true;
}

function renderTransactions() {
  renderMoneyLeft();

  const allTransactions = loadData(STORAGE_KEYS.transactions);

  const transactions = allTransactions.filter(function (trx) {
    if (trxFilterMonth !== "" && !trx.date.startsWith(trxFilterMonth)) {
      return false;
    }
    if (trxFilterDate !== "" && trx.date !== trxFilterDate) {
      return false;
    }
    if (trxFilterType !== "all" && trx.type !== trxFilterType) {
      return false;
    }
    if (trxFilterCategory !== "all" && trx.category !== trxFilterCategory) {
      return false;
    }
    return true;
  });

  let income = 0;
  let expense = 0;
  transactions.forEach(function (trx) {
    if (trx.type === "income") {
      income += trx.amount;
    } else if (trx.type === "expense") {
      expense += trx.amount;
    }
  });

  trxSummary.textContent =
    transactions.length + " transaksi · Pemasukan " + formatRupiah(income) +
    " · Pengeluaran " + formatRupiah(expense);

  if (transactions.length === 0) {
    if (allTransactions.length === 0) {
      trxList.innerHTML =
        '<p class="empty-state">Belum ada transaksi. Catat transaksi pertamamu di atas!</p>';
    } else {
      trxList.innerHTML =
        '<p class="empty-state">Tidak ada transaksi yang cocok dengan filter.</p>';
    }
    return;
  }

  transactions.sort(function (a, b) {
    if (a.date !== b.date) {
      return b.date.localeCompare(a.date);
    }
    return b.id - a.id;
  });

  let html = "";

  transactions.forEach(function (trx) {
    const sign = trx.type === "income" ? "+ " : "- ";

    html += `
      <div class="trx-item trx-${trx.type}">
        <div class="trx-info">
          <span class="trx-title">${escapeHTML(trx.title)}</span>
                    <span class="trx-meta">${escapeHTML(trx.category)} · ${formatDateID(trx.date)}</span>
        </div>
        <div class="trx-right">
          <span class="trx-amount">${sign}${formatRupiah(trx.amount)}</span>
          <div class="trx-actions">
            <button class="btn-icon" data-action="edit" data-id="${trx.id}" title="Edit">✏️</button>
            <button class="btn-icon" data-action="delete" data-id="${trx.id}" title="Hapus">🗑️</button>
          </div>
        </div>
      </div>
    `;
  });

  trxList.innerHTML = html;
}

function startEditTrx(id) {
  const transactions = loadData(STORAGE_KEYS.transactions);
  const trx = transactions.find(function (t) {
    return t.id === id;
  });

  if (!trx) {
    return;
  }

  setSelectedType(trx.type);
  inputTrxTitle.value = trx.title;
  inputTrxAmount.value = trx.amount;
  inputTrxCategory.value = trx.category;
  inputTrxDate.value = trx.date;

  editingTrxId = id;
  trxFormTitle.textContent = "Edit Transaksi";
  btnTrxSubmit.textContent = "Simpan Perubahan";
  btnTrxCancel.hidden = false;

  trxForm.scrollIntoView({ behavior: "smooth", block: "start" });
  inputTrxTitle.focus();
}

function deleteTrx(id) {
  if (!confirm("Hapus transaksi ini?")) {
    return;
  }

  const transactions = loadData(STORAGE_KEYS.transactions).filter(function (t) {
    return t.id !== id;
  });
  saveData(STORAGE_KEYS.transactions, transactions);

  if (editingTrxId === id) {
    resetTrxForm();
  }
  renderTransactions();
}

typeRadios.forEach(function (radio) {
  radio.addEventListener("change", updateCategoryOptions);
});

trxForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const title = inputTrxTitle.value.trim();
  const amount = Number(inputTrxAmount.value);

  if (title === "") {
    alert("Keterangan tidak boleh kosong.");
    return;
  }
  if (!(amount > 0)) {
    alert("Nominal harus lebih dari 0.");
    return;
  }

  const transactions = loadData(STORAGE_KEYS.transactions);

  const trxData = {
    type: getSelectedType(),
    title: title,
    amount: amount,
    category: inputTrxCategory.value,
    date: inputTrxDate.value
  };

  if (editingTrxId === null) {
    trxData.id = Date.now();
    transactions.push(trxData);
  } else {
    const trx = transactions.find(function (t) {
      return t.id === editingTrxId;
    });
    if (trx) {
      Object.assign(trx, trxData);
    }
  }

  saveData(STORAGE_KEYS.transactions, transactions);
  resetTrxForm();
  renderTransactions();
});

btnTrxCancel.addEventListener("click", resetTrxForm);

trxList.addEventListener("click", function (event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const id = Number(target.dataset.id);

  if (target.dataset.action === "edit") {
    startEditTrx(id);
  } else if (target.dataset.action === "delete") {
    deleteTrx(id);
  }
});

trxFilterMonthInput.addEventListener("change", function () {
  trxFilterMonth = trxFilterMonthInput.value;
  renderTransactions();
});

trxFilterDateInput.addEventListener("change", function () {
  trxFilterDate = trxFilterDateInput.value;
  renderTransactions();
});

trxFilterTypeSelect.addEventListener("change", function () {
  trxFilterType = trxFilterTypeSelect.value;
  renderTransactions();
});

trxFilterCategorySelect.addEventListener("change", function () {
  trxFilterCategory = trxFilterCategorySelect.value;
  renderTransactions();
});

btnTrxFilterReset.addEventListener("click", function () {
  trxFilterMonth = "";
  trxFilterDate = "";
  trxFilterType = "all";
  trxFilterCategory = "all";

  trxFilterMonthInput.value = "";
  trxFilterDateInput.value = "";
  trxFilterTypeSelect.value = "all";
  trxFilterCategorySelect.value = "all";

  renderTransactions();
});

fillCategoryFilter();
updateCategoryOptions();
resetTrxForm();

const moneyLeft = document.getElementById("money-left");
const moneyIncomeAll = document.getElementById("money-income-all");
const moneyExpenseAll = document.getElementById("money-expense-all");

function renderMoneyLeft() {
  const transactions = loadData(STORAGE_KEYS.transactions);

  let totalIncome = 0;
  let totalExpense = 0;

  transactions.forEach(function (trx) {
    if (trx.type === "income") {
      totalIncome += trx.amount;
    } else if (trx.type === "expense") {
      totalExpense += trx.amount;
    }
  });

  const left = totalIncome - totalExpense;

  moneyIncomeAll.textContent = formatRupiah(totalIncome);
  moneyExpenseAll.textContent = formatRupiah(totalExpense);
  moneyLeft.textContent = formatRupiah(left);

  moneyLeft.classList.remove("text-success", "text-danger");
  moneyLeft.classList.add(left >= 0 ? "text-success" : "text-danger");
}