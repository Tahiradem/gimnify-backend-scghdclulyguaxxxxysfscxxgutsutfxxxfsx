// Optimized chart functions
function countCheckedUnchecked() {
    const checkboxes = document.querySelectorAll('.user-checkbox');
    const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;
    const totalActiveUsers = totalUsers > 0 ? totalUsers : 0;
    
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
    if (chartInstances.incomeChart) {
        chartInstances.incomeChart.destroy();
    }
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

// Updated chart functions to properly handle canvas reuse
function renderAttendanceChart(checkedCount, totalActiveUsers) {
    const ctx = document.getElementById('incomeChart').getContext('2d');
    const unattendedCount = Math.max(0, totalActiveUsers - checkedCount);
    
    // Destroy previous chart if it exists
    if (chartInstances.incomeChart) {
        chartInstances.incomeChart.destroy();
    }
    
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
    
    // Destroy previous chart if it exists
    if (chartInstances.financialChart) {
        chartInstances.financialChart.destroy();
    }

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
    
    // Call registration chart after financial chart is rendered
    setTimeout(() => {
        renderRegistrationChart();
    }, 0);
}


// Chart instances storage (declare only once at the top)

// Modified fetch function to use your existing endpoint
async function fetchAndRenderWeeklyRevenue(currentWeek = 0) {
    try {
        const response = await fetch("/users");
        if (!response.ok) throw new Error("Network response was not ok");
        const gymHouses = await response.json();
        
        const gymHouseA = gymHouses.find(gym => gym.email === email && gym.password === password);
        if (!gymHouseA) {
            console.warn("Gym data not found");
            return;
        }
        
        renderRegistrationChart(gymHouseA.weeklyRevenue, currentWeek);
    } catch (error) {
        console.error('Error fetching weekly revenue:', error);
        // Render empty chart if there's an error
        renderRegistrationChart([], currentWeek);
    }
}

// Modified render function to use correct currency
function renderRegistrationChart(weeklyRevenueData, currentWeek = 0) {
    const ctx = document.getElementById('registrationChart').getContext('2d');
    
    // Destroy previous chart if it exists
    if (chartInstances.registrationChart) {
        chartInstances.registrationChart.destroy();
    }

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    // Extract data for the current week in Mon-Sun order
    const currentWeekData = weeklyRevenueData?.[currentWeek] || {
        Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0, Sun: 0
    };

    const chartData = [
        currentWeekData.Mon || 0,
        currentWeekData.Tue || 0,
        currentWeekData.Wed || 0,
        currentWeekData.Thu || 0,
        currentWeekData.Fri || 0,
        currentWeekData.Sat || 0,
        currentWeekData.Sun || 0
    ];

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

// Improved week selector with check for existing element
function setupWeekSelector() {
    // Check if selector already exists
    if (document.getElementById('week-selector-container')) {
        return;
    }
    
    const weekSelector = document.createElement('div');
    weekSelector.className = 'week-selector';
    weekSelector.id = 'week-selector-container';
    weekSelector.innerHTML = `
        <button id="prev-week">Previous Wee</button>
        <span id="current-week">Week 1</span>
        <button id="next-week">Next Week</button>
    `;
    
    const chartContainer = document.querySelector('.graphical_chart');
    if (chartContainer) {
        chartContainer.prepend(weekSelector);
    }
    
    let currentWeek = 0;
    const maxWeeks = 4;
    
    document.getElementById('prev-week')?.addEventListener('click', () => {
        if (currentWeek > 0) {
            currentWeek--;
            updateChart();
        }
    });
    
    document.getElementById('next-week')?.addEventListener('click', () => {
        if (currentWeek < maxWeeks - 1) {
            currentWeek++;
            updateChart();
        }
    });
    
    function updateChart() {
        const weekDisplay = document.getElementById('current-week');
        if (weekDisplay) {
            weekDisplay.textContent = `Week ${currentWeek + 1}`;
        }
        fetchAndRenderWeeklyRevenue(currentWeek);
    }
}

// Add week selector functionality
function setupWeekSelector() {
    const weekSelector = document.createElement('div');
    weekSelector.className = 'week-selector';
    weekSelector.innerHTML = `
        <button id="prev-week"><</button>
        <span id="current-week">Week 1</span>
        <button id="next-week">></button>
    `;
    
    document.querySelector('.graphical_chart').prepend(weekSelector);
    
    let currentWeek = 0;
    const maxWeeks = 4; // Assuming 4 weeks in monthly data
    
    document.getElementById('prev-week').addEventListener('click', () => {
        if (currentWeek > 0) {
            currentWeek--;
            updateChart();
        }
    });
    
    document.getElementById('next-week').addEventListener('click', () => {
        if (currentWeek < maxWeeks - 1) {
            currentWeek++;
            updateChart();
        }
    });
    
    function updateChart() {
        document.getElementById('current-week').textContent = `Week ${currentWeek + 1}`;
        fetchAndRenderWeeklyRevenue(currentWeek);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupWeekSelector();
    fetchAndRenderWeeklyRevenue();
});

function getPerformanceRating() {
    if (revenue > dailyIncome * 0.5) return "Excellent";
    if (revenue > 0) return "Good";
    if (revenue === 0) return "Neutral";
    return "Bad";
}