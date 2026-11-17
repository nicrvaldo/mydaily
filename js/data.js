const dataInfo = document.getElementById("data-info");
const exportButton = document.getElementById("data-export");
const importButton = document.getElementById("data-import");
const importFileInput = document.getElementById("data-import-file");
const resetDataButton = document.getElementById("data-reset");

function renderDataInfo() {
  const taskCount = loadData(STORAGE_KEYS.tasks).length;
  const transactionCount = loadData(STORAGE_KEYS.transactions).length;

  dataInfo.textContent =
    "Tersimpan di browser ini: " + taskCount + " tugas dan " + transactionCount + " transaksi.";
}

function refreshAllPages() {
  resetForm();
  resetTrxForm();

  renderDashboard();
  renderDataInfo();
  renderTasks();
  renderTransactions();
  renderReport();
}

exportButton.addEventListener("click", function () {
  const backup = {
    app: "MyDaily",
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: loadData(STORAGE_KEYS.tasks),
    transactions: loadData(STORAGE_KEYS.transactions)
  };

  const filename = "mydaily-cadangan-" + getTodayString() + ".json";

  downloadFile(filename, JSON.stringify(backup, null, 2), "application/json;charset=utf-8;");
});

importButton.addEventListener("click", function () {
  importFileInput.click();
});

importFileInput.addEventListener("change", function () {
  const file = importFileInput.files[0];
  if (!file) {
    return;
  }

  const reader = new FileReader();

  reader.onload = function () {
    try {
      const backup = JSON.parse(reader.result);

      if (!backup || !Array.isArray(backup.tasks) || !Array.isArray(backup.transactions)) {
        throw new Error("Format file tidak sesuai");
      }

      const tasks = backup.tasks.filter(isValidTask);
      const transactions = backup.transactions.filter(isValidTransaction);
      const skipped =
        backup.tasks.length - tasks.length +
        (backup.transactions.length - transactions.length);

      const message =
        "Pulihkan " + tasks.length + " tugas dan " + transactions.length +
        " transaksi dari file ini?\n\nSemua data yang ada sekarang akan DIGANTI.";

      if (confirm(message)) {
        const tasksSaved = saveData(STORAGE_KEYS.tasks, tasks);
        const transactionsSaved = saveData(STORAGE_KEYS.transactions, transactions);

        refreshAllPages();

        if (tasksSaved && transactionsSaved) {
          let doneMessage = "Data berhasil dipulihkan.";
          if (skipped > 0) {
            doneMessage += " " + skipped + " data tidak valid dilewati.";
          }
          alert(doneMessage);
        }
      }
    } catch (error) {
      alert("File tidak valid. Pilih file cadangan MyDaily (.json).");
    }

    importFileInput.value = "";
  };

  reader.onerror = function () {
    alert("File tidak dapat dibaca.");
    importFileInput.value = "";
  };

  reader.readAsText(file);
});

resetDataButton.addEventListener("click", function () {
  const message =
    "Hapus SEMUA tugas dan transaksi?\n\nTindakan ini tidak dapat dibatalkan. " +
    "Disarankan mengunduh cadangan terlebih dahulu.";

  if (!confirm(message)) {
    return;
  }

  localStorage.removeItem(STORAGE_KEYS.tasks);
  localStorage.removeItem(STORAGE_KEYS.transactions);

  refreshAllPages();
});