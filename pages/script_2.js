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
        const tableBody = document.querySelector("#tableBody");
        tableBody.innerHTML = '';
        showLoading(); // Show loader before fetch
        const response = await fetch("http://localhost:5000/users");
        if (!response.ok) throw new Error("Network response was not ok");
        const gymHouses = await response.json();
        function allSystem(){
        hideLoading();

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
                
                if ((hours === 6 && minutes === 55) && period === "AM") {
                    checkbox.checked = false; 
                    localStorage.setItem(`checkbox-${ind}`, false); 
                } 
                if(user.attendance === true){
                    checkbox.checked = true;
                }
                else {
                    const savedState = localStorage.getItem(`checkbox-${ind}`);
                    checkbox.checked = savedState === "true";
                }

                checkbox.addEventListener("change", async () => {
    localStorage.setItem(`checkbox-${ind}`, checkbox.checked);
    countCheckedUnchecked(); // Update chart when checkbox changes
    
    try {
        const response = await fetch('http://localhost:5000/api/updateAttendance', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: user.email,
                attendance: checkbox.checked 
            })
        });
        
        if (!response.ok) {
            throw new Error('Failed to update attendance');
        }
        
        const data = await response.json();
        console.log('Attendance updated:', data);
    } catch (error) {
        console.error('Error updating attendance:', error);
        // Revert the checkbox if update fails
        checkbox.checked = !checkbox.checked;
        localStorage.setItem(`checkbox-${ind}`, checkbox.checked);
    }
});
                function getDaysUntilPayment(paymentDateStr) {
                    if (!paymentDateStr || paymentDateStr === "-") return 0;
                    
                    // Handle different date formats
                    let paymentDate;
                    if (paymentDateStr.includes("/")) {
                        // Format like "06/05/2025"
                        const [day, month, year] = paymentDateStr.split("/").map(Number);
                        paymentDate = new Date(year, month - 1, day);
                    } else if (paymentDateStr.includes(", ")) {
                        // Format like "May 6" or "06, 06, 2025"
                        const parts = paymentDateStr.split(", ");
                        if (parts.length === 2) {
                            // Month name format
                            const monthName = parts[0];
                            const day = parseInt(parts[1]);
                            const monthIndex = new Date(Date.parse(monthName + " 1, 2023")).getMonth();
                            paymentDate = new Date(new Date().getFullYear(), monthIndex, day);
                        } else if (parts.length === 3) {
                            // "day, month, year" format
                            const [day, month, year] = parts.map(Number);
                            paymentDate = new Date(year, month - 1, day);
                        }
                    }
                    
                    if (!paymentDate) return 0;
                    
                    const today = new Date();
                    today.setHours(0, 0, 0, 0);
                    
                    // If payment date has already passed this year, set it for next year
                    if (paymentDate < today) {
                        paymentDate.setFullYear(paymentDate.getFullYear() + 1);
                    }
                    
                    const diffTime = paymentDate - today;
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays;
                }
                // Get membership details with proper null checks
const membership = (user.membershipDetail && Array.isArray(user.membershipDetail) && user.membershipDetail.length > 0) 
? user.membershipDetail[0] 
: {};
const planName = membership?.planName || "-";
const packageLength = membership?.packageLength || "-";

// Calculate payment day based on package length
function calculatePaymentDate(registeredDateStr, packageLength) {
if (!registeredDateStr || !packageLength || packageLength === "-") return "-";

try {
    // Parse package length (e.g., "1 month", "3 months", "1 year")
    const packageMatch = packageLength.toString().match(/^(\d+)\s*(month|year)s?$/i);
    if (!packageMatch) return "-";
    
    const lengthValue = parseInt(packageMatch[1]);
    const unit = packageMatch[2].toLowerCase();
    
    // Parse registered date (handling multiple formats)
    let registeredDate;
    
    // Format 1: "06, 05, 2025" (day, month, year)
    if (registeredDateStr.includes(",")) {
        const parts = registeredDateStr.split(", ").map(Number);
        if (parts.length === 3) {
            registeredDate = new Date(parts[2], parts[1] - 1, parts[0]);
        }
    } 
    // Format 2: "2025-05-06" (ISO format)
    else if (registeredDateStr.includes("-")) {
        registeredDate = new Date(registeredDateStr);
    }
    // Format 3: "May 6, 2025" (month name)
    else if (typeof registeredDateStr === 'string' && registeredDateStr.match(/[a-zA-Z]/)) {
        registeredDate = new Date(registeredDateStr);
    }
    
    if (!registeredDate || isNaN(registeredDate.getTime())) return "-";
    
    // Calculate payment date
    const paymentDate = new Date(registeredDate);
    if (unit === "month") {
        paymentDate.setMonth(paymentDate.getMonth() + lengthValue);
    } else if (unit === "year") {
        paymentDate.setFullYear(paymentDate.getFullYear() + lengthValue);
    }
    
    // Format as DD/MM/YYYY
    return `${paymentDate.getDate().toString().padStart(2, '0')}/${(paymentDate.getMonth() + 1).toString().padStart(2, '0')}/${paymentDate.getFullYear()}`;
} catch (e) {
    console.error("Error calculating payment date:", e);
    return "-";
}
}
    const paymentDay = calculatePaymentDate(user.registeredDate, packageLength);
    const daysLeft = getDaysUntilPayment(paymentDay);                
function createAttendanceDropdown(attendanceData) {
    // Create the main container
    const container = document.createElement('div');
    container.className = 'attendance-dropdown';
    
    // Create the button that will show the current month
    const button = document.createElement('button');
    button.className = 'attendance-dropbtn';
    button.textContent = 'View Attendance';

    
    // Create the dropdown content
    const dropdownContent = document.createElement('div');
    dropdownContent.className = 'attendance-dropdown-content';

    
    // If no attendance data, show empty state
    if (!attendanceData || attendanceData.length === 0) {
        const emptyItem = document.createElement('a');
        emptyItem.href = '#';
        emptyItem.textContent = 'No attendance data';
    
        dropdownContent.appendChild(emptyItem);
        
        button.textContent = 'No data';
    } else {
        // Sort attendance data by month (jan, feb, mar...)
        const monthOrder = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        attendanceData.sort((a, b) => monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month));
        
        // Add months that exist in the data
        attendanceData.forEach(attendance => {
            const monthItem = document.createElement('a');
            monthItem.href = '#';
            
            // Convert month abbreviation to full name
            const monthNames = {
                jan: 'January', feb: 'February', mar: 'March', apr: 'April',
                may: 'May', jun: 'June', jul: 'July', aug: 'August',
                sep: 'September', oct: 'October', nov: 'November', dec: 'December'
            };
            
            const monthName = monthNames[attendance.month] || attendance.month;
            const daysAttended = attendance.daysAttended || 0;
            
            monthItem.innerHTML = `
                <span style="display: flex; gap:10px; width: 100%;">
                    <span class='attendancemonth_txt'>${monthName}</span>
                </span>
            `;
            
            monthItem.addEventListener('click', (e) => {
                e.preventDefault();
                button.innerHTML = `
                    <span style="display: flex; gap:10px; width: 100%;">>
                        <span class='attendancemonth_txt'>${monthName}</span>
                        <span class='attendanceday_txt'>${daysAttended} days</span>
                    </span>
                `;
                dropdownContent.style.display = 'none';
            });
            
            dropdownContent.appendChild(monthItem);
        });
        
        // Set initial button text to first month
        if (attendanceData.length > 0) {
            const firstMonth = attendanceData[0].month;
            const firstDays = attendanceData[0].daysAttended || 0;
            button.innerHTML = `
                <span style="display: flex; gap:10px; width: 100%;">
                    <span class='attendancemonth_txt'>${firstMonth}</span>
                    <span class='attendanceday_txt'>${firstDays} day</span>
                    <span class='attendance_dropdown_icon'>></span>
                </span>
            `;
        }
    }
    
    // Toggle dropdown on button click
    button.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownContent.style.display = dropdownContent.style.display === 'block' ? 'none' : 'block';
    });
    
    // Close dropdown when clicking elsewhere
    document.addEventListener('click', (e) => {
        if (!container.contains(e.target)) {
            dropdownContent.style.display = 'none';
        }
    });
    
    container.appendChild(button);
    container.appendChild(dropdownContent);
    
    return container;
}

                // Inside your users.forEach loop, modify the row object:
const row = {
    A_D: checkbox,
    ID: ind + 1,
    name: user.userName,
    email: user.email,
    phone: user.phone,
    monthly_attendance: createAttendanceDropdown(user.monthlyAttendance), // Add this
    time: `${user.enteringTime}`,
    plan: planName,
    payment_day: `${paymentDay} (${daysLeft} days left)`,
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


const refreshInterval = 300000; // 5 minutes in milliseconds
window.fetchInterval = setInterval(fetchData, refreshInterval);