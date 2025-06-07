const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym');

// Route to handle QR code scanning and attendance update
router.post('/scaned', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Email is required' });
        }

        // Find the user by email across all gyms
        const gym = await Gym.findOne({ "users.email": email });

        if (!gym) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Find the specific user in the gym's users array
        const userIndex = gym.users.findIndex(user => user.email === email);
        if (userIndex === -1) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Update attendance to true
        gym.users[userIndex].attendance = true;
        gym.users[userIndex].enteringTime = new Date().toISOString();

        // Save the updated gym document
        await gym.save();

        res.json({ 
            success: true, 
            message: 'Attendance updated successfully',
            user: {
                email: gym.users[userIndex].email,
                userName: gym.users[userIndex].userName
            }
        });

    } catch (error) {
        console.error('Error updating attendance:', error);
        res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

module.exports = router;