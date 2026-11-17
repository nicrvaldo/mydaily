const PRIORITY_LABELS = { tinggi: "Tinggi", sedang: "Sedang", rendah: "Rendah" };
const STATUS_LABELS = { done: "Selesai", pending: "Belum selesai", overdue: "Terlambat" };
const taskForm = document.getElementById("task-form");
const formTitle = document.getElementById("form-title");
const inputTitle = document.getElementById("task-title-input");
const inputDescription = document.getElementById("task-description");
const inputDate = document.getElementById("task-date");
const inputTime = document.getElementById("task-time");
const inputPriority = document.getElementById("task-priority");
const btnSubmit = document.getElementById("btn-submit");
const btnCancel = document.getElementById("btn-cancel");
const taskList = document.getElementById("task-list");

let editingId = null;

const listTitle = document.getElementById("list-title");
const filterDateInput = document.getElementById("filter-date");
const filterStatusSelect = document.getElementById("filter-status");
const filterPrioritySelect = document.getElementById("filter-priority");
const btnFilterReset = document.getElementById("filter-reset");

let filterDate = "";
let filterStatus = "all";
let filterPriority = "all";

function getTaskStatus(task) {
  if (task.done) {
    return "done";
  }

  const today = getTodayString();

  if (task.date < today) {
    return "overdue";
  }
  if (task.date === today && task.time < getCurrentTimeString()) {
    return "overdue";
  }
  return "pending";
}

function resetForm() {
  taskForm.reset();
  inputDate.value = getTodayString();
  editingId = null;
  formTitle.textContent = "Tambah Tugas Baru";
  btnSubmit.textContent = "Tambah Tugas";
  btnCancel.hidden = true;
}

function renderTasks() {
  renderCalendar();

  const allTasks = loadData(STORAGE_KEYS.tasks);

  const tasks = allTasks.filter(function (task) {
    if (filterDate !== "" && task.date !== filterDate) {
      return false;
    }
    if (filterStatus !== "all" && getTaskStatus(task) !== filterStatus) {
      return false;
    }
    if (filterPriority !== "all" && task.priority !== filterPriority) {
      return false;
    }
    return true;
  });

  let title = "Semua Tugas";
  if (filterDate !== "") {
    title = "Tugas pada " + formatDateID(filterDate);
  }
  listTitle.textContent = title + " (" + tasks.length + ")";

  tasks.sort(function (a, b) {
    return (a.date + " " + a.time).localeCompare(b.date + " " + b.time);
  });

  if (tasks.length === 0) {
    if (allTasks.length === 0) {
      taskList.innerHTML =
        '<p class="empty-state">Belum ada tugas. Tambahkan tugas pertamamu di atas!</p>';
    } else {
      taskList.innerHTML =
        '<p class="empty-state">Tidak ada tugas yang cocok dengan filter.</p>';
    }
    return;
  }

  let html = "";

  tasks.forEach(function (task) {
    const status = getTaskStatus(task);

    let descriptionHTML = "";
    if (task.description) {
      descriptionHTML = `<p class="task-desc">${escapeHTML(task.description)}</p>`;
    }

    html += `
      <div class="task-item task-${status}">
        <input type="checkbox" class="task-check" data-action="toggle"
               data-id="${task.id}" ${task.done ? "checked" : ""}>
        <div class="task-body">
          <div class="task-title-row">
            <span class="task-title">${escapeHTML(task.title)}</span>
            <span class="badge badge-${task.priority}">${PRIORITY_LABELS[task.priority]}</span>
            <span class="badge badge-status-${status}">${STATUS_LABELS[status]}</span>
          </div>
          ${descriptionHTML}
          <p class="task-meta">📅 ${formatDateID(task.date)} · ⏰ ${task.time}</p>
        </div>
        <div class="task-actions">
          <button class="btn-icon" data-action="edit" data-id="${task.id}" title="Edit">✏️</button>
          <button class="btn-icon" data-action="delete" data-id="${task.id}" title="Hapus">🗑️</button>
        </div>
      </div>
    `;
  });

  taskList.innerHTML = html;
}

function toggleTask(id) {
  const tasks = loadData(STORAGE_KEYS.tasks);
  const task = tasks.find(function (t) {
    return t.id === id;
  });

  if (task) {
    task.done = !task.done;
    saveData(STORAGE_KEYS.tasks, tasks);
    renderTasks();
  }
}

function startEditTask(id) {
  const tasks = loadData(STORAGE_KEYS.tasks);
  const task = tasks.find(function (t) {
    return t.id === id;
  });

  if (!task) {
    return;
  }

  inputTitle.value = task.title;
  inputDescription.value = task.description;
  inputDate.value = task.date;
  inputTime.value = task.time;
  inputPriority.value = task.priority;

  editingId = id;
  formTitle.textContent = "Edit Tugas";
  btnSubmit.textContent = "Simpan Perubahan";
  btnCancel.hidden = false;

  taskForm.scrollIntoView({ behavior: "smooth", block: "start" });
  inputTitle.focus();
}

function deleteTask(id) {
  if (!confirm("Hapus tugas ini?")) {
    return;
  }

  const tasks = loadData(STORAGE_KEYS.tasks).filter(function (t) {
    return t.id !== id;
  });
  saveData(STORAGE_KEYS.tasks, tasks);

  if (editingId === id) {
    resetForm();
  }
  renderTasks();
}

taskForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const taskData = {
    title: inputTitle.value.trim(),
    description: inputDescription.value.trim(),
    date: inputDate.value,
    time: inputTime.value,
    priority: inputPriority.value
  };

  if (taskData.title === "") {
    alert("Nama kegiatan tidak boleh kosong.");
    return;
  }

  const tasks = loadData(STORAGE_KEYS.tasks);

  if (editingId === null) {
    taskData.id = Date.now();
    taskData.done = false;
    tasks.push(taskData);
  } else {
    const task = tasks.find(function (t) {
      return t.id === editingId;
    });
    if (task) {
      Object.assign(task, taskData);
    }
  }

  saveData(STORAGE_KEYS.tasks, tasks);
  resetForm();
  renderTasks();
});

btnCancel.addEventListener("click", resetForm);

taskList.addEventListener("click", function (event) {
  const target = event.target.closest("[data-action]");
  if (!target) {
    return;
  }

  const id = Number(target.dataset.id);
  const action = target.dataset.action;

  if (action === "toggle") {
    toggleTask(id);
  } else if (action === "edit") {
    startEditTask(id);
  } else if (action === "delete") {
    deleteTask(id);
  }
});

function setFilterDate(dateString) {
  filterDate = dateString;
  filterDateInput.value = dateString;

  if (dateString !== "") {
    showCalendarMonthOf(dateString);
  }

  renderTasks();
}

filterDateInput.addEventListener("change", function () {
  setFilterDate(filterDateInput.value);
});

filterStatusSelect.addEventListener("change", function () {
  filterStatus = filterStatusSelect.value;
  renderTasks();
});

filterPrioritySelect.addEventListener("change", function () {
  filterPriority = filterPrioritySelect.value;
  renderTasks();
});

btnFilterReset.addEventListener("click", function () {
  filterStatus = "all";
  filterPriority = "all";
  filterStatusSelect.value = "all";
  filterPrioritySelect.value = "all";
  setFilterDate("");
});

resetForm();