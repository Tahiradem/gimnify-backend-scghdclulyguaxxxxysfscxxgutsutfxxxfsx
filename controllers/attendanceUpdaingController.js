const Gym = require('../models/Gym');

// Helper function to get current month (e.g., "jan", "feb")
const getCurrentMonth = () => {
    const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
    return months[new Date().getMonth()];
};

exports.attendanceChanging = async (req, res) => {
    try {
        const { email, attendance } = req.body;
        
        if (!email) {
            return res.status(400).json({ 
                success: false,
                error: "Email is required" 
            });
        }

        // Find the gym and user
        const gym = await Gym.findOne({ 'users.email': email });
        if (!gym) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        // Find the specific user
        const user = gym.users.find(u => u.email === email);
        if (!user) {
            return res.status(404).json({ 
                success: false,
                error: "User not found" 
            });
        }

        // Only increment daysAttended when marking as present (attendance=true)
        if (attendance) {
            const currentMonth = getCurrentMonth();

            // Initialize monthlyAttendance if it doesn't exist
            if (!user.monthlyAttendance) {
                user.monthlyAttendance = [];
            }

            // Check if the month already exists
            const monthEntry = user.monthlyAttendance.find(entry => entry.month === currentMonth);

            if (monthEntry) {
                // Increment if month exists
                monthEntry.daysAttended = (monthEntry.daysAttended || 0) + 1;
            } else {
                // Add new entry if month doesn't exist
                user.monthlyAttendance.push({ 
                    month: currentMonth, 
                    daysAttended: 1 
                });
            }
        }

        // Update the attendance status
        user.attendance = attendance;

        // Save changes
        await gym.save();

        res.json({ 
            success: true, 
            message: "Attendance updated successfully",
            updatedUser: gym.users.find(user => user.email === email)
        });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};