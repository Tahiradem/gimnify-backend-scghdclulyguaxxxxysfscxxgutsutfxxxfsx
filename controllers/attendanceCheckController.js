// This code file get QR code and post attendance (true)


const Gym = require('../models/Gym');

exports.getqrcode = async (req, res) => {
    try {
        const gymHouses = await Gym.find();
        res.json(gymHouses);
        console.log(gymHouses.users)
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};
exports.postattendanceQrcode = async (req, res) => {
    try {
        const { email } = req.body;
        
        if (!email) {
            return res.status(400).json({ error: "Email is required" });
        }

        const result = await User.findOneAndUpdate(
            { email: email },
            { $set: { attendance: true } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ error: "User not found" });
        }
        
        res.json({ 
            success: true, 
            message: "Attendance updated",
            user: result 
        });
    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ error: error.message });
    }
};