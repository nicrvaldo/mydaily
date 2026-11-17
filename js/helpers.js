const STORAGE_KEYS = {
  tasks: "mydaily_tasks",
  transactions: "mydaily_transactions"
};

function loadData(key) {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) {
      return [];
    }

    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      return [];
    }

    if (key === STORAGE_KEYS.tasks) {
      return data.filter(isValidTask);
    }
    if (key === STORAGE_KEYS.transactions) {
      return data.filter(isValidTransaction);
    }
    return data;
  } catch (error) {
    return [];
  }
}

function getTodayString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return year + "-" + month + "-" + day;
}

function formatRupiah(number) {
  const sign = number < 0 ? "-" : "";
  return sign + "Rp " + Math.abs(number).toLocaleString("id-ID");
}

function saveData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    alert("Data tidak dapat disimpan. Penyimpanan browser mungkin penuh atau diblokir.");
    return false;
  }
}

function getCurrentTimeString() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  return hours + ":" + minutes;
}

function formatDateID(dateString) {
  const date = new Date(dateString + "T00:00:00");
  return date.toLocaleDateString("id-ID", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric"
  });
}

function escapeHTML(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

const CATEGORIES = {
  income: ["Uang Saku", "Gaji", "Hadiah", "Lainnya"],
  expense: [
    "Makanan",
    "Transportasi",
    "Pendidikan",
    "Hiburan",
    "Kebutuhan Pribadi",
    "Lainnya"
  ]
};  

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^\d{2}:\d{2}$/;

function isValidTask(task) {
  return (
    task !== null &&
    typeof task === "object" &&
    typeof task.id === "number" &&
    typeof task.title === "string" &&
    typeof task.description === "string" &&
    DATE_PATTERN.test(task.date) &&
    TIME_PATTERN.test(task.time) &&
    ["rendah", "sedang", "tinggi"].includes(task.priority) &&
    typeof task.done === "boolean"
  );
}

function isValidTransaction(trx) {
  return (
    trx !== null &&
    typeof trx === "object" &&
    typeof trx.id === "number" &&
    (trx.type === "income" || trx.type === "expense") &&
    typeof trx.title === "string" &&
    Number.isFinite(trx.amount) &&
    trx.amount > 0 &&
    typeof trx.category === "string" &&
    DATE_PATTERN.test(trx.date)
  );
}

function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}