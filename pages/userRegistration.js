const email = localStorage.getItem('email') || 'DefaultGymHouse';
let gymMembershipPlans = {};
function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
}

// Hide loading animation
function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('active');
}
// Function to format date as "DD, MM, YYYY"
const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}, ${month}, ${year}`;
};

// Function to fetch gym membership plans
async function fetchMembershipPlans() {
    try {
        const response = await fetch(`/gym-plans?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        if (data.success) {
            gymMembershipPlans = data.plans;
            populateMembershipPlans();
        } else {
            console.error('Failed to fetch membership plans:', data.message);
        }
    } catch (error) {
        console.error('Error fetching membership plans:', error);
    }
}

// Function to populate membership plans dropdown
function populateMembershipPlans() {
    const planSelect = document.getElementById('membershipPlan');
    planSelect.innerHTML = '<option value="">Select a plan</option>';
    
    for (const plan in gymMembershipPlans) {
        if (gymMembershipPlans.hasOwnProperty(plan)) {
            const option = document.createElement('option');
            option.value = plan;
            option.textContent = plan;
            planSelect.appendChild(option);
        }
    }
}

// Function to populate package lengths based on selected plan
function populatePackageLengths(selectedPlan) {
    const lengthSelect = document.getElementById('packageLength');
    lengthSelect.innerHTML = '<option value="">Select package length</option>';
    lengthSelect.disabled = !selectedPlan;
    
    if (selectedPlan) {
        const plan = gymMembershipPlans[selectedPlan];
        for (const length in plan) {
            if (length !== 'services' && plan.hasOwnProperty(length)) {
                const option = document.createElement('option');
                option.value = `${length} month`;
                option.textContent = `${length} month`;
                option.dataset.price = plan[length];
                lengthSelect.appendChild(option);
            }
        }
    }
}

// Event listeners for membership selection
document.getElementById('membershipPlan').addEventListener('change', function() {
    const selectedPlan = this.value;
    populatePackageLengths(selectedPlan);
    document.getElementById('priceValue').textContent = '0';
});

document.getElementById('packageLength').addEventListener('change', function() {
    if (this.selectedOptions[0] && this.selectedOptions[0].dataset.price) {
        document.getElementById('priceValue').textContent = this.selectedOptions[0].dataset.price;
    }
});

// Add supplement field dynamically
document.getElementById('addSupplement').addEventListener('click', function() {
    const container = document.getElementById('supplementsContainer');
    const newEntry = document.createElement('div');
    newEntry.className = 'supplement-entry';
    newEntry.innerHTML = `
        <input type="text" name="supplementName[]" placeholder="Supplement name">
        <select name="supplementType[]">
            <option value="protein">Protein</option>
            <option value="general">Multivitamin</option>
            <option value="amino">Amino Acids</option>
            <option value="creatine">Creatine</option>
        </select>
        <select name="supplementTiming[]">
            <option value="morning">Morning</option>
            <option value="pre-workout">Pre-workout</option>
            <option value="post-workout">Post-workout</option>
            <option value="evening">Evening</option>
        </select>
    `;
    container.appendChild(newEntry);
});

document.getElementById('addUserForm').addEventListener('submit', async function (event) {
    event.preventDefault();
    showLoading(); // Show loader before fetch

    const formData = new FormData(event.target);
    const currentDate = new Date();
    const registeredDate = formatDate(currentDate);

    // Format notificationTime
    const rawNotificationTime = formData.get('notificationTime');
    const [hours, minutes] = rawNotificationTime.split(':');
    const notificationTimeDate = new Date();
    notificationTimeDate.setHours(parseInt(hours));
    notificationTimeDate.setMinutes(parseInt(minutes));
    const formattedNotificationTime = notificationTimeDate.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    });

    // Process supplements
    const supplementNames = formData.getAll('supplementName[]');
    const supplementTypes = formData.getAll('supplementType[]');
    const supplementTimings = formData.getAll('supplementTiming[]');
    const supplements = [];
    
    for (let i = 0; i < supplementNames.length; i++) {
        if (supplementNames[i]) {
            supplements.push({
                name: supplementNames[i],
                type: supplementTypes[i],
                timing: supplementTimings[i]
            });
        }
    }

    // Process medical conditions
    const medicalConditions = formData.get('medicalConditions') 
        ? formData.get('medicalConditions').split(',').map(item => item.trim()) 
        : [];
        
    const data = {
        email: email,
        user: {
            ID: parseInt(formData.get('ID')),
            name: formData.get('name'),
            userName: formData.get('userName'),
            email: formData.get('email'),
            password: formData.get('password'),
            phone: formData.get('phone'),
            upComingExercise: "",
            age: parseInt(formData.get('age')),
            sex: formData.get('sex'),
            attendance:false,
            height: parseInt(formData.get('height')),
            weight: parseInt(formData.get('weight')),
            bodyFat: parseFloat(formData.get('bodyFat')),
            registeredDate: registeredDate,
            paymentStatus: formData.get('paymentStatus') === 'on',
            exerciseTimePerDay: formData.get('exerciseTimePerDay'),
            notificationTime: formattedNotificationTime,
            healthStatus: formData.get('healthStatus'),
            exerciseType: formData.get('exerciseType'),
            exercises: [
                formData.get('mon'),
                formData.get('tue'),
                formData.get('wed'),
                formData.get('thu'),
                formData.get('fri'),
                formData.get('sat'),
                formData.get('sun')
            ],
            enteringTime: formData.get('enteringTime'),
            activityLevel: formData.get('activityLevel'),
            fitnessGoal: formData.get('fitnessGoal'),
            bloodType: formData.get('bloodType'),
            TodayNotification: "",
            totalTimeSpendOnGym: 0,
            metabolicHealth: formData.get('metabolicHealth'),
            livesInHotClimate: formData.get('livesInHotClimate') === 'on',
            medicalConditions: medicalConditions,
            dietaryPreferences: {
                vegetarian: formData.get('vegetarian') === 'on',
                vegan: formData.get('vegan') === 'on',
                glutenFree: formData.get('glutenFree') === 'on',
                dairyFree: formData.get('dairyFree') === 'on',
                halal: formData.get('halal') === 'on',
                kosher: formData.get('kosher') === 'on',
                allergies: formData.get('allergies') ? formData.get('allergies').split(',').map(item => item.trim()) : [],
                dislikes: formData.get('dislikes') ? formData.get('dislikes').split(',').map(item => item.trim()) : [],
                preferredCuisines: formData.get('preferredCuisines') ? formData.get('preferredCuisines').split(',').map(item => item.trim()) : [],
                budget: formData.get('budget')
            },
            mealFrequency: parseInt(formData.get('mealFrequency')),
            wakeTime: formData.get('wakeTime'),
            sleepTime: formData.get('sleepTime'),
            cookingTime: formData.get('cookingTime'),
            supplements: supplements
        }
    };

    // Handle membership details and payment date
    const membershipPlan = formData.get('membershipPlan');
    const packageLength = formData.get('packageLength');
    const price = document.getElementById('priceValue').textContent;

    if (membershipPlan && packageLength && price !== '0') {
        // Calculate payment date based on package length
        const calculatePaymentDate = (registeredDate, packageLength) => {
            const date = new Date(registeredDate);
            const match = packageLength.match(/^(\d+)\s*(month|year)s?$/i);
            
            if (!match) return date;
            
            const value = parseInt(match[1]);
            const unit = match[2].toLowerCase();
            
            if (unit === 'month') {
                date.setMonth(date.getMonth() + value);
            } else if (unit === 'year') {
                date.setFullYear(date.getFullYear() + value);
            }
            
            return date;
        };

        const paymentDate = calculatePaymentDate(currentDate, packageLength);
        const formattedPaymentDate = formatDate(paymentDate);

        data.user.membershipDetail = [{
            planName: membershipPlan,
            packageLength: packageLength,
            price: price,
            startDate: registeredDate,  // "DD, MM, YYYY"
            endDate: formattedPaymentDate  // "DD, MM, YYYY"
        }];
        
        data.user.paymentDate = formattedPaymentDate;
    } else {
        // Default to 1 month if no plan selected
        const defaultPaymentDate = new Date(currentDate);
        defaultPaymentDate.setMonth(defaultPaymentDate.getMonth() + 1);
        data.user.paymentDate = formatDate(defaultPaymentDate);
    }
    
    try {
        const response = await fetch('/add-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();

        if (result.success) {
            hideLoading();
            alert('User added successfully');
            window.open("./Dashboard.html", "_self");
        } else {
            alert(`Error: ${result.message}`);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('An error occurred while adding the user');
    }
});

// Initialize on page load
fetchMembershipPlans();