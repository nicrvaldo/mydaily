const navLinks = document.querySelectorAll(".nav-link");
const pages = document.querySelectorAll(".page");

function showPage(pageName) {
  pages.forEach(function (page) {
    page.classList.remove("active");
  });
  navLinks.forEach(function (link) {
    link.classList.remove("active");
  });

  document.getElementById("page-" + pageName).classList.add("active");
  document
    .querySelector('.nav-link[data-page="' + pageName + '"]')
    .classList.add("active");

  if (pageName === "dashboard") {
    renderDashboard();
    renderDataInfo(); // BARU 9
  }

  if (pageName === "jadwal") {
    renderTasks();
  }

  if (pageName === "keuangan") {
    renderTransactions();
  }

  if (pageName === "laporan") {
    renderReport();
  }
}

navLinks.forEach(function (link) {
  link.addEventListener("click", function () {
    showPage(link.dataset.page);
  });
});

const quickLinks = document.querySelectorAll("[data-goto]");
quickLinks.forEach(function (button) {
  button.addEventListener("click", function () {
    showPage(button.dataset.goto);
  });
});

renderDashboard();
renderTasks();
renderTransactions();
renderReport();
renderDataInfo();