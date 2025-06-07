const Gym = require('../models/Gym');

exports.attendanceChanging = async (req, res) => {
    try {
        const { email, attendance } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await Gym.findOneAndUpdate(
            { "users.email": email },
            { $set: { "users.$.attendance": attendance } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ error: "User not found" });
        }

        res.json({ 
            success: true, 
            message: "Attendance updated successfully",
            updatedUser: result.users.find(user => user.email === email)
        });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ error: error.message });
    }
};