// Improved edit functionality
function setupEditListeners() {
    // Edit icon click handler
    document.querySelectorAll('.edit-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            if (row) {
                const userEmail = row.querySelector('td:nth-child(4)').textContent; // Email column
                const gymEmail = localStorage.getItem('email'); // Gym admin's email
                
                if (userEmail && gymEmail) {
                    populateEditForm(userEmail, gymEmail);
                }
            }
        });
    });

    // Save button handler
    document.querySelector('.save_button').addEventListener('click', async () => {
        const userEmail = document.querySelector('.editing_box').dataset.userEmail;
        const gymEmail = localStorage.getItem('email');
        
        if (!userEmail || !gymEmail) {
            alert('Error: Missing required data');
            return;
        }

        // Create updatedData object with only changed fields
        const updatedData = {};
        const editForm = document.querySelector('.editing_box');

        // Helper function to check if a field was changed
        const checkFieldChange = (fieldName, elementSelector, processor = null) => {
            const element = editForm.querySelector(elementSelector);
            if (element && element.value !== element.dataset.original) {
                updatedData[fieldName] = processor 
                    ? processor(element.value) 
                    : element.value;
            }
        };

        // Check each field for changes
        checkFieldChange('userName', '.edit_username');
        checkFieldChange('phone', '.edit_phone');
        checkFieldChange('age', '.edit_age', val => parseInt(val));
        checkFieldChange('height', '.edit_height', val => parseFloat(val));
        checkFieldChange('weight', '.edit_weight', val => parseFloat(val));
        checkFieldChange('paymentDate', '.edit_paymentDate');
        checkFieldChange('exerciseTimePerDay', '.edit_exerciseTimePerDay');
        checkFieldChange('healthStatus', '.edit_healthStatus');
        checkFieldChange('exerciseType', '.edit_exerciseType');
        checkFieldChange('enteringTime', '.edit_enteringTime');
        checkFieldChange('activityLevel', '.edit_activityLevel');
        checkFieldChange('fitnessGoal', '.edit_fitnessGoal');
        checkFieldChange('bodyFat', '.edit_bodyFat', val => parseFloat(val));
        checkFieldChange('metabolicHealth', '.edit_metabolicHealth');
        checkFieldChange('medicalConditions', '.edit_medicalConditions', val => 
            val.split(',').map(item => item.trim()));
        checkFieldChange('mealFrequency', '.edit_mealFrequency');
        checkFieldChange('supplements', '.edit_supplements', val => 
            val.split(',').map(item => ({ name: item.trim() })));

        if (Object.keys(updatedData).length === 0) {
            alert('No changes were made');
            return;
        }

        try {
            showLoading();
            const response = await fetch(`/update_user/${userEmail}/${gymEmail}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(updatedData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || 'Failed to update user');
            }

            alert('User updated successfully');
            document.querySelector('.editing_box').style.display = 'none';
            
            // Refresh the table data
            await fetchData();
        } catch (error) {
            console.error('Error updating user:', error);
            alert(`Error updating user: ${error.message}`);
        } finally {
            hideLoading();
        }
    });

    // Delete button handler
    document.querySelector('.user_edit_delete').addEventListener('click', async () => {
        const userEmail = document.querySelector('.editing_box').dataset.userEmail;
        const gymEmail = localStorage.getItem('email');
        
        if (!userEmail || !gymEmail) {
            alert('Error: Missing required data');
            return;
        }

        if (confirm('Are you sure you want to delete this user?')) {
            try {
                const response = await fetch('/api/delete-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        gymEmail: gymEmail,
                        userEmail: userEmail
                    })
                });

                if (response.ok) {
                    alert('User deleted successfully');
                    document.querySelector('.editing_box').style.display = 'none';
                    // Refresh the table
                    tableBody.innerHTML = '';
                    fetchData();
                } else {
                    const errorData = await response.json();
                    alert(`Error deleting user: ${errorData.message}`);
                }
            } catch (error) {
                console.error('Error deleting user:', error);
                alert('Failed to delete user');
            }
        }
    });
}

async function populateEditForm(userEmail, gymEmail) {
    try {
        showLoading();
        
         const baseUrl = window.location.origin; // "https://gymnify.up.railway.app"
        const url = new URL(`${baseUrl}/user-details`);
        
        url.searchParams.append('userEmail', userEmail);
        url.searchParams.append('gymEmail', gymEmail);
        
        const response = await fetch(url.toString());
        
        if (!response.ok) {
            throw new Error(`Failed to fetch user details: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.message || 'User not found');
        }
        
        const user = data.user;
        const editForm = document.querySelector('.editing_box');
        
        // Basic Info
        editForm.querySelector('.txt_edit_name').textContent = `Editing: ${user.userName || user.email}`;
        editForm.querySelector('.edit_username').value = user.userName || '';
        editForm.querySelector('.edit_phone').value = user.phone || '';
        
        // Physical Attributes
        editForm.querySelector('.edit_age').value = user.age !== undefined ? user.age : '';
        editForm.querySelector('.edit_height').value = user.height !== undefined ? user.height : '';
        editForm.querySelector('.edit_weight').value = user.weight !== undefined ? user.weight : '';
        
        // Gym Info
        editForm.querySelector('.edit_paymentDate').value = user.paymentDate || '';
        editForm.querySelector('.edit_exerciseTimePerDay').value = user.exerciseTimePerDay || '';
        editForm.querySelector('.edit_notificationTime').value = user.notificationTime || '';
        editForm.querySelector('.edit_healthStatus').value = user.healthStatus || '';
        editForm.querySelector('.edit_exerciseType').value = user.exerciseType || '';
        editForm.querySelector('.edit_enteringTime').value = user.enteringTime || '';
        
        // Additional fields
        editForm.querySelector('.edit_activityLevel').value = user.activityLevel || 'Sedentary';
        editForm.querySelector('.edit_fitnessGoal').value = user.fitnessGoal || 'General Fitness';
        editForm.querySelector('.edit_bodyFat').value = user.bodyFat !== undefined ? user.bodyFat : '';
        editForm.querySelector('.edit_metabolicHealth').value = user.metabolicHealth || 'Normal';
        
        // Handle array fields
        editForm.querySelector('.edit_medicalConditions').value = 
            Array.isArray(user.medicalConditions) ? user.medicalConditions.join(', ') : user.medicalConditions || '';
        
        editForm.querySelector('.edit_mealFrequency').value = user.mealFrequency || '3 meals';
        
        editForm.querySelector('.edit_supplements').value = 
            Array.isArray(user.supplements) ? user.supplements.map(s => s.name).join(', ') : user.supplements || '';
        
        // Store original values in data attributes
        const fields = [
            'username', 'phone', 'age', 'height', 'weight', 
            'paymentDate', 'exerciseTimePerDay', 'notificationTime',
            'healthStatus', 'exerciseType', 'enteringTime', 'activityLevel',
            'fitnessGoal', 'bodyFat', 'metabolicHealth',
            'medicalConditions', 'mealFrequency', 'supplements'
        ];
        
        fields.forEach(field => {
            const element = editForm.querySelector(`.edit_${field}`);
            if (element) {
                element.dataset.original = element.value;
            }
        });
        
        // Store references
        editForm.dataset.userEmail = user.email;
        
        // Show edit form
        editForm.style.display = 'block';
        
    } catch (error) {
        console.error('Error loading user details:', error);
        alert(`Error loading user details: ${error.message}`);
    } finally {
        hideLoading();
    }
}