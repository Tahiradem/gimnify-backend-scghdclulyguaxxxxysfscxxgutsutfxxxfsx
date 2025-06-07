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
    searchBar.value = savedSearch;
    filterTable();
  }
}

// Gym data variables
const username = localStorage.getItem('username');
const password = localStorage.getItem('password');
const email = localStorage.getItem('email');

let weeklyIncome = []; 
let dailyIncome = 0; 
let totalUsers = 0; 
let dailyOutcome = 0; 
let revenue = 0;  
let weeklyRevenue = []; 
let registeredDate = null; 
let checkedCount = 0;

document.getElementById("adminName").innerHTML = username;

const fetchData = async () => {
    try {
        const response = await fetch("http://localhost:5000/users");
        if (!response.ok) throw new Error("Network response was not ok");
        const gymHouses = await response.json();

        function allSystem(){
            dailyIncome = gymHouseA.dailyIncome.reduce((total, num) => total + num, 0);
            dailyOutcome = gymHouseA.dailyOutcome.reduce((total, num) => total + num, 0);

            revenue = dailyIncome - dailyOutcome;
            weeklyRevenue = gymHouseA.weeklyRevenue;
            weeklyIncome = gymHouseA.weeklyIncome;
            monthlyIncome = gymHouseA.monthlyIncome;

            let registeredDateStr = gymHouseA.registeredDate;
            let [day, month, year] = registeredDateStr.split(", ").map(Number);
            let registeredDate = new Date(year, month - 1, day); 

            let currentDate = new Date();
            currentDate.setHours(0, 0, 0, 0);

            let nextPaymentDate = new Date(registeredDate);
            nextPaymentDate.setMonth(nextPaymentDate.getMonth() + 1);

            if (nextPaymentDate.getDate() !== registeredDate.getDate()) {
                nextPaymentDate = new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0);
            }

            let timeDiff = nextPaymentDate - currentDate;
            let daysLeft = Math.abs(Math.ceil(timeDiff / (1000 * 3600 * 24)));

            document.getElementById('dayleft_for_payment').innerHTML = `${daysLeft} days left`;
            
            renderFinancialChart();

            const users_unreversed = gymHouseA.users;
            const users = [...users_unreversed].reverse();
            
            totalUsers = users.length;

            users.forEach((user, ind) => {
                const checkbox = document.createElement("input");
                checkbox.type = "checkbox";
                checkbox.classList.add("user-checkbox");

                const editing_icon = document.createElement("div");
                editing_icon.innerHTML = `<p class="editing_icon_cont" style=""><i class="fa fa-pen edit-icon" style="color:#555; width:100%; height:100%;cursor: pointer;"></i></p>`;
                editing_icon.style.fontSize = '13px';

                const now = new Date();
                let hours = now.getHours();
                let minutes = now.getMinutes();
                let period = "AM";

                if (hours >= 12) {
                    period = "PM";
                    if (hours > 12) hours -= 12;
                } else if (hours === 0) {
                    hours = 12; 
                }
 
                const today = new Date();
                const dayNumber = (today.getDay() + 6) % 7;
                
                if ((hours === 3 && minutes === 57) && period === "PM") {
                    checkbox.checked = false; 
                    localStorage.setItem(`checkbox-${ind}`, false); 
                } else {
                    const savedState = localStorage.getItem(`checkbox-${ind}`);
                    checkbox.checked = savedState === "true";
                }

                checkbox.addEventListener("change", () => {
                    localStorage.setItem(`checkbox-${ind}`, checkbox.checked);
                    countCheckedUnchecked(); // Update chart when checkbox changes
                });

                const row = {
                    A_D: checkbox,
                    ID: ind + 1,
                    name: user.userName,
                    email: user.email,
                    phone: user.phone,
                    time: user.enteringTime,
                    exercise_type: user.exerciseType,
                    upcoming: user.exercises[dayNumber],
                    gym_time_per_day: user.exerciseTimePerDay,
                    pay_status: user.paymentStatus,
                    age: user.age,
                    gender: user.sex,
                    height: user.height,
                    weight: user.weight,
                    blood_type: user.bloodType,
                    registered: user.registeredDate,
                    health_status: user.healthStatus,
                    payment_day: user.paymentDate,
                    time_on_gym: user.fitnessGoal,
                    edit: editing_icon
                };

                const tr = document.createElement("tr");

                Object.values(row).forEach(cellData => {
                    const td = document.createElement("td");
                    tr.classList.add("table-cell");

                    if (cellData instanceof HTMLElement) {
                        td.appendChild(cellData);
                    } else {
                        td.innerText = cellData;
                    }
                    tr.appendChild(td);
                });
                tableBody.appendChild(tr);
            });
            adjustColumnWidths();
            setupEditListeners(); // Initialize edit listeners after table is populated
        }
        
        const gymHouseA = gymHouses.find(gym => gym.email === email && gym.password === password);
        
        if (gymHouseA) {
            allSystem();
        } else {
            window.location.href = './login.html';
            console.warn("Gym House A not found in the data.");
        }
    } catch (error) {
        console.error("Error fetching data:", error);
        alert("Failed to load user data.");
    }
};

// Edit functionality
function setupEditListeners() {
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                const cells = row.querySelectorAll('td');
                const userData = {
                    name: cells[2].textContent,
                    email: cells[3].textContent,
                    phone: cells[4].textContent,
                    time: cells[5].textContent,
                    exerciseType: cells[6].textContent,
                    gymTimePerDay: cells[8].textContent,
                    age: cells[10].textContent,
                    height: cells[12].textContent,
                    weight: cells[13].textContent,
                    paymentDate: cells[17].textContent,
                    healthStatus: cells[16].textContent,
                    enteringTime: cells[5].textContent
                };

                // Populate edit form
                document.querySelector('.txt_edit_name').textContent = `- ${userData.name} -`;
                document.querySelector('.edit_email').value = userData.email;
                document.querySelector('.edit_phone').value = userData.phone;
                document.querySelector('.edit_age').value = userData.age;
                document.querySelector('.edit_height').value = userData.height;
                document.querySelector('.edit_weight').value = userData.weight;
                document.querySelector('.edit_paymentDate').value = userData.paymentDate;
                document.querySelector('.edit_exerciseTimePerDay').value = userData.gymTimePerDay;
                document.querySelector('.edit_healthStatus').value = userData.healthStatus;
                document.querySelector('.edit_exerciseType').value = userData.exerciseType;
                document.querySelector('.edit_enteringTime').value = userData.enteringTime;

                // Store row reference
                document.querySelector('.editing_box').dataset.row = row.rowIndex;
                
                // Show edit form
                document.querySelector('.editing_box').style.display = 'block';
            }
        });
    });

    // Save button handler
    document.querySelector('.save_button').addEventListener('click', () => {
        const rowIndex = document.querySelector('.editing_box').dataset.row;
        const row = tableBody.rows[rowIndex];
        
        if (row) {
            const cells = row.querySelectorAll('td');
            cells[3].textContent = document.querySelector('.edit_email').value;
            cells[4].textContent = document.querySelector('.edit_phone').value;
            cells[10].textContent = document.querySelector('.edit_age').value;
            cells[12].textContent = document.querySelector('.edit_height').value;
            cells[13].textContent = document.querySelector('.edit_weight').value;
            cells[17].textContent = document.querySelector('.edit_paymentDate').value;
            cells[8].textContent = document.querySelector('.edit_exerciseTimePerDay').value;
            cells[16].textContent = document.querySelector('.edit_healthStatus').value;
            cells[6].textContent = document.querySelector('.edit_exerciseType').value;
            cells[5].textContent = document.querySelector('.edit_enteringTime').value;
            
            // Hide edit form
            document.querySelector('.editing_box').style.display = 'none';
        }
    });
}

// Optimized chart functions
function countCheckedUnchecked() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalActiveUsers = totalUsers > 0 ? totalUsers - 1 : 0;
    
    document.querySelector('.active_users_in_number').textContent = 
        `${totalActiveUsers}/${checkedCount}`;
    
    updateAttendanceChart(checkedCount, totalActiveUsers);
}

function updateAttendanceChart(checkedCount, totalActiveUsers) {
    const unattendedCount = Math.max(0, totalActiveUsers - checkedCount);
    
    if (chartInstances.incomeChart) {
        chartInstances.incomeChart.data.datasets[0].data = [unattendedCount, checkedCount];
        chartInstances.incomeChart.update();
    } else {
        renderAttendanceChart(checkedCount, totalActiveUsers);
    }
}

function renderAttendanceChart(checkedCount, totalActiveUsers) {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    const unattendedCount = Math.max(0, totalActiveUsers - checkedCount);
    
    chartInstances.incomeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ["Unattend Users", "Attend Users"],
            datasets: [{
                data: [unattendedCount, checkedCount],
                backgroundColor: ['#f5f5f500', '#c1b5fb'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            cutout: '80%',
            animation: {
                duration: 0
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.label}: ${context.raw}`;
                        }
                    }
                }
            }
        }
    });
}

function renderFinancialChart() {
    const ctx = document.getElementById('financialChart').getContext('2d');
    
    chartInstances.financialChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Income', 'Outcome', 'Revenue'],
            datasets: [{
                label: 'Amount (Birr)',
                data: [dailyIncome, dailyOutcome, revenue],
                backgroundColor: ['#80ed99', 'rgb(193, 181, 251, 1)', '#fff'],
                borderWidth: 1,
                borderRadius: 2,
                maxBarThickness: 70
            }]
        },
        options: {
            responsive: true,
            plugins: {
                title: {
                    display: true,
                    text: `Your Daily Report (${getPerformanceRating()})`,
                    font: { size: 16, family: 'Poppins, sans-serif' },
                    color: '#fff',
                    padding: { bottom: 30 }
                },
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: context => `${context.label}: ${context.raw} Birr`
                    }
                }
            },
            scales: {
                x: {
                    barPercentage: 0.2,
                    categoryPercentage: 0.3,
                    maxBarThickness: 30,
                    ticks: {
                        font: { family: 'Poppins, sans-serif', size: 14 },
                        color: '#fff'
                    },
                    grid: { display: false }
                },
                y: {
                    beginAtZero: true,
                    ticks: {
                        font: { family: 'Poppins, sans-serif', size: 14 },
                        color: '#fff'
                    },
                    grid: {
                        color: '#fff',
                        lineWidth: 0.5
                    }
                }
            }
        }
    });
    
    renderRegistrationChart();
}

function renderRegistrationChart() {
    const ctx = document.getElementById('registrationChart').getContext('2d');
    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const chartData = weeklyRevenue.length === 7 ? weeklyRevenue : [1000, 2000, 1500, 1800, 2200, 1700, 1300];
    
    chartInstances.registrationChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: weekDays,
            datasets: [{
                label: 'Weekly Financial Report',
                data: chartData,
                borderColor: 'rgb(193, 181, 251, 1)',
                backgroundColor: 'rgb(193, 181, 251, 0.6)', 
                tension: 0.4,
                pointStyle: 'rect',
                pointRadius: 5,
                pointBackgroundColor: '#6d5fb4',
                pointBorderColor: '#fff',
                fill: true, 
                backgroundColor: 'rgb(193, 181, 251, 0.1)', 
                pointHoverBackgroundColor: '#6d5fb4',
                pointHoverBorderColor: '#6d5fb4',
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#fff' 
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(200, 200, 200, 0.3)',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#fff' 
                    }
                }
            },
            plugins: {
                legend: {
                    labels: {
                        color: '#fff' 
                    }
                },
                tooltip: {
                    titleColor: '#fff',
                    bodyColor: '#fff',  
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    borderColor: '#6d5fb4',
                    borderWidth: 1,
                    padding: 10,
                    displayColors: false
                }
            }
        }
    });
}

function getPerformanceRating() {
    if (revenue > dailyIncome * 0.5) return "Excellent";
    if (revenue > 0) return "Good";
    if (revenue === 0) return "Neutral";
    return "Bad";
}

function adjustColumnWidths() {
    const table = document.getElementById("dynamicTable");
    const headers = table.querySelectorAll("th");
    const columns = Array.from(headers).map(() => 0);
    const rows = tableBody.querySelectorAll("tr");

    rows.forEach(row => {
        const cells = row.querySelectorAll("td");
        cells.forEach((cell, index) => {
            columns[index] = Math.max(columns[index], cell.scrollWidth);
        });
    });

    columns.forEach((width, index) => {
        headers[index].style.width = `${width + 20}px`;
    });
}

function dashboard_display_btn() {
    if (localStorage.getItem('boolForDashboard') === 'true') {
        document.querySelector(".no_chart_display").style.display = 'none';
        document.querySelector(".dashboardDataAnalys").style.opacity = '1000%';
        localStorage.setItem('boolForDashboard', false);
        document.querySelector("#hide_btn").className = 'fa fa-eye-slash';
    } else {
        document.querySelector(".no_chart_display").style.display = 'flex';
        document.querySelector(".dashboardDataAnalys").style.opacity = '0%';
        localStorage.setItem('boolForDashboard', true);
        document.querySelector("#hide_btn").className = 'fa fa-eye';
    }
}

function Distroy_editing_box() {
    document.querySelector(".editing_box").style.display = 'none';
}

// Clean up charts before unloading
window.addEventListener('beforeunload', () => {
    Object.values(chartInstances).forEach(chart => {
        if (chart) chart.destroy();
    });
});

// Initialize when page loads
window.onload = () => {
    fetchData();
    loadSearchTerm();
    
    // Set up periodic updates
    setInterval(countCheckedUnchecked, 3000);
    setInterval(() => fetchData(), 300000);
};