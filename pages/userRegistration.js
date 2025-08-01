const email = localStorage.getItem('email') || 'DefaultGymHouse';
let gymMembershipPlans = {};

// Add QR code library (put this in your HTML head)
// <script src="https://cdn.jsdelivr.net/npm/qrcode-generator@1.4.4/qrcode.min.js"></script>

function showLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.add('active');
}

function hideLoading() {
    const loadingOverlay = document.getElementById('loadingOverlay');
    loadingOverlay.classList.remove('active');
}

const formatDate = (date) => {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}, ${month}, ${year}`;
};

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

// QR Code Generation Function
function generateQRCode(userData) {
    try {
        const qrData = JSON.stringify({
            userId: userData.ID,
            email: userData.email,
            username: userData.userName,
            phone: userData.phone
        });
        
        const qr = qrcode(0, 'L');
        qr.addData(qrData);
        qr.make();
        return qr.createDataURL(4);
    } catch (error) {
        console.error('QR generation failed silently:', error);
        return '';
    }
}

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
    showLoading();

    const formData = new FormData(event.target);
    const currentDate = new Date();
    
    const formatDateForServer = (date) => {
        return date.toISOString();
    };

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

    const processArrayInput = (input) => {
        return input ? input.split(',').map(item => item.trim()).filter(item => item) : [];
    };
    

    let name_of_user = formData.get('name')
    let capitalized_name_of_user = name_of_user.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
    
    const reg_date = formatDateForServer(currentDate)
    const date = new Date(reg_date);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-based
    const day = String(date.getDate()).padStart(2, '0');

    const formattedDate_of_regi = `${year}, ${month}, ${day}`;

    

    const data = {
        email: email,
        user: {
            ID: parseInt(formData.get('ID')) || 0,
            fullName: capitalized_name_of_user || '',
            userName: formData.get('userName') || '',
            email: formData.get('email') || '',
            password: formData.get('password') || '',
            phone: formData.get('phone') || '',
            upComingExercise: "",
            profilePhoto:"",
            age: parseInt(formData.get('age')) || 0,
            sex: formData.get('sex') || 'male',
            attendance: false,
            height: parseInt(formData.get('height')) || 0,
            weight: parseInt(formData.get('weight')) || 0,
            registeredDate: formattedDate_of_regi,
            paymentStatus: formData.get('paymentStatus') === 'on',
            phoneVerified:true,
            exerciseTimePerDay: formData.get('exerciseTimePerDay') || '30 Min',
            notificationTime: formData.get('notificationTime') || '12:00',
            healthStatus: formData.get('healthStatus') || 'good',
            exerciseType: formData.get('exerciseType') || 'Strength',
            bodyMeasurements: {
                waistSize: parseFloat(formData.get('waistSize')) || 0,
                neckSize: parseFloat(formData.get('neckSize')) || 0,
                hipSize: parseFloat(formData.get('hipSize')) || 0
            },
            exercises: [
                formData.get('mon') || '',
                formData.get('tue') || '',
                formData.get('wed') || '',
                formData.get('thu') || '',
                formData.get('fri') || '',
                formData.get('sat') || '',
                formData.get('sun') || ''
            ].filter(ex => ex),
            enteringTime: formData.get('enteringTime') || '08:00',
            activityLevel: formData.get('activityLevel') || 'moderately_active',
            fitnessGoal: formData.get('fitnessGoal') || 'maintenance',
            bloodType: formData.get('bloodType') || 'A+',
            TodayNotification: "",
            totalTimeSpendOnGym: 0,
            metabolicHealth: formData.get('metabolicHealth') || 'normal',
            livesInHotClimate: formData.get('livesInHotClimate') === 'on',
            medicalConditions: processArrayInput(formData.get('medicalConditions')),
            dietaryPreferences: {
                vegetarian: formData.get('vegetarian') === 'on',
                vegan: formData.get('vegan') === 'on',
                glutenFree: formData.get('glutenFree') === 'on',
                dairyFree: formData.get('dairyFree') === 'on',
                halal: formData.get('halal') === 'on',
                kosher: formData.get('kosher') === 'on',
                allergies: processArrayInput(formData.get('allergies')),
                dislikes: processArrayInput(formData.get('dislikes')),
                preferredCuisines: processArrayInput(formData.get('preferredCuisines')),
                budget: formData.get('budget') || 'medium'
            },
            qrCode: "", // This will be set below
            mealFrequency: parseInt(formData.get('mealFrequency')) || 3,
            wakeTime: formData.get('wakeTime') || '07:00',
            sleepTime: formData.get('sleepTime') || '23:00',
            cookingTime: formData.get('cookingTime') || 'medium',
            supplements: supplements,
            membershipDetail: [],
            paymentDate: formatDateForServer(new Date(currentDate.setMonth(currentDate.getMonth() + 1)))
        }
    };

    // Generate QR code and add to data
    data.user.qrCode = generateQRCode(data.user);

    const membershipPlan = formData.get('membershipPlan');
    const packageLength = formData.get('packageLength');
    const price = document.getElementById('priceValue').textContent;

    if (membershipPlan && packageLength && price !== '0') {
        data.user.membershipDetail.push({
            planName: membershipPlan,
            packageLength: packageLength,
            price: price,
            startDate: formatDateForServer(currentDate),
            endDate: formatDateForServer(new Date(currentDate.setMonth(currentDate.getMonth() + parseInt(packageLength))))
        });
    }

    try {
        const response = await fetch('/add_user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add user');
        }

        const result = await response.json();
        hideLoading();
        alert('User added successfully');
        window.open("./Dashboard.html", "_self");
    } catch (error) {
        hideLoading();
        console.error('Error:', error);
    }
});

fetchMembershipPlans();