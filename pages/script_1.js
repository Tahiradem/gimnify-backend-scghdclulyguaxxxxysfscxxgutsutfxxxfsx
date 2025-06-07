// DOM Elements
const tableBody = document.getElementById("tableBody");
const searchBar = document.getElementById("searchBar");

// Chart instances storage
const chartInstances = {
  incomeChart: null,
  financialChart: null,
  registrationChart: null
};

// Search functionality with debouncing
let searchTimeout;
searchBar.addEventListener("input", function() {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    filterTable();
  }, 300);
});

function filterTable() {
  const searchValue = searchBar.value.toLowerCase().trim();
  const rows = tableBody.querySelectorAll("tr");

  if (searchValue === "") {
    // Show all rows if search is empty
    rows.forEach(row => {
      row.style.display = "";
    });
    return;
  }

  // Search in Name (3), Email (4), and Phone (5) columns
  rows.forEach(row => {
    const cells = row.querySelectorAll("td");
    let shouldShow = false;

    // Check columns 2-4 (0-based index)
    for (let i = 2; i <= 4; i++) {
      if (cells[i] && cells[i].textContent.toLowerCase().includes(searchValue)) {
        shouldShow = true;
        break;
      }
    }

    row.style.display = shouldShow ? "" : "none";
  });

  // Save search term
  localStorage.setItem("searchTerm", searchValue);
}

// Load saved search term
function loadSearchTerm() {
  const savedSearch = localStorage.getItem("searchTerm");
  if (savedSearch) {
    // searchBar.value = savedSearch;
    filterTable();
  }
}