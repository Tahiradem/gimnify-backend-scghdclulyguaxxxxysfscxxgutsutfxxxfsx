const express = require('express');
const router = express.Router();
const Gym = require('../models/Gym'); // Assuming you have a Gym model

// Get weekly revenue data
router.get('/weekly-revenue', async (req, res) => {
    try {
        const gymData = await Gym.findOne({});
        if (!gymData) {
            return res.status(404).json({ message: 'Gym data not found' });
        }
        
        res.json(gymData.weeklyRevenue);
    } catch (error) {
        console.error('Error fetching weekly revenue:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;