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
    const ctx = document.getElementById('incomeChart');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (chartInstances.incomeChart) {
        chartInstances.incomeChart.destroy();
        chartInstances.incomeChart = null;
    }
    
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
    const ctx = document.getElementById('financialChart');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (chartInstances.financialChart) {
        chartInstances.financialChart.destroy();
        chartInstances.financialChart = null;
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
}

async function fetchAndRenderWeeklyRevenue(currentWeek = 0) {
    try {
        const response = await fetch("/users");
        if (!response.ok) throw new Error("Network response was not ok");
        const gymHouses = await response.json();
        
        const email = localStorage.getItem('email');
        const password = localStorage.getItem('password');
        const gymHouseA = gymHouses.find(gym => gym.email === email && gym.password === password);
        
        if (!gymHouseA) {
            console.warn("Gym data not found");
            renderRegistrationChart([], currentWeek);
            return;
        }
        
        const weeklyRevenueData = gymHouseA.weeklyRevenue || [];
        renderRegistrationChart(weeklyRevenueData, currentWeek);
    } catch (error) {
        console.error('Error fetching weekly revenue:', error);
        renderRegistrationChart([], currentWeek);
    }
}

function renderRegistrationChart(weeklyRevenueData, currentWeek = 0) {
    const ctx = document.getElementById('registrationChart');
    if (!ctx) return;
    
    // Destroy previous chart if it exists
    if (chartInstances.registrationChart) {
        chartInstances.registrationChart.destroy();
        chartInstances.registrationChart = null;
    }

    const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    let currentWeekData = {};
    if (Array.isArray(weeklyRevenueData) && weeklyRevenueData[currentWeek]) {
        currentWeekData = weeklyRevenueData[currentWeek];
    }

    const chartData = weekDays.map(day => {
        const dayKey = day.substring(0, 3);
        return currentWeekData[dayKey] || 0;
    });

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
                    suggestedMax: Math.max(...chartData) > 0 ? Math.max(...chartData) * 1.2 : 10,
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
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y} Birr`;
                        }
                    }
                }
            }
        }
    });
}

function getCurrentWeekOfMonth() {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const currentDate = date.getDate();
    return Math.ceil((firstDay + currentDate) / 7) - 1; // Returns 0-3 for weeks 1-4
}

function setupWeekSelector() {
    const weekSelector = document.createElement('div');
    weekSelector.className = 'week-selector';
    weekSelector.innerHTML = `
        <button id="prev-week"><</button>
        <span id="current-week">Week 1</span>
        <button id="next-week">></button>
    `;
    
    document.querySelector('.graphical_chart').prepend(weekSelector);
    
    // Start with current week by default
    let currentWeek = getCurrentWeekOfMonth();
    const maxWeeks = 4; // Assuming 4 weeks in monthly data
    
    // Update the chart immediately with current week data
    updateChart();
    
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


function getPerformanceRating() {
    if (revenue > dailyIncome * 0.5) return "Excellent";
    if (revenue > 0) return "Good";
    if (revenue === 0) return "Neutral";
    return "Bad";
}

// Initialize charts when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    setupWeekSelector();
    // fetchAndRenderWeeklyRevenue(0);
});