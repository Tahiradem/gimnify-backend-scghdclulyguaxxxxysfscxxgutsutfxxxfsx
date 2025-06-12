const Gym = require('../../models/Gym');

// Helper function to get current month (e.g., "jan", "feb")
const getCurrentMonth = () => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months[new Date().getMonth()];
};

exports.updateAttendance = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ 
                success: false,
                message: 'Email is required' 
            });
        }

        const currentMonth = getCurrentMonth();
        const currentTime = new Date().toISOString();

        // Find the gym and user
        const gym = await Gym.findOne({ 'users.email': email });
        if (!gym) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Find the specific user
        const user = gym.users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                message: 'User not found' 
            });
        }

        // Initialize monthlyAttendance if it doesn't exist
        if (!user.monthlyAttendance) {
            user.monthlyAttendance = [];
        }

        // Check if the month already exists
        const monthEntry = user.monthlyAttendance.find(entry => entry.month === currentMonth);

        if (monthEntry) {
            // Increment if month exists
            monthEntry.daysAttended += 1;
        } else {
            // Add new entry if month doesn't exist
            user.monthlyAttendance.push({ 
                month: currentMonth, 
                daysAttended: 1 
            });
        }
        
        user.attendance = true;

        // Save changes
        await gym.save();

        res.json({ 
            success: true,
            message: 'Attendance updated successfully',
            gym: gym.name
        });

    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ 
            success: false,
            message: 'Server error',
            error: error.message 
        });
    }
};