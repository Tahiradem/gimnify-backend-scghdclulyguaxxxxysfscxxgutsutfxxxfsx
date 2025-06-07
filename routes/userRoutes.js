const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const Gym = require('../models/Gym');

// In your routes file (or controller)
router.get('/gym-plans', async (req, res) => {
    try {
        const { email } = req.query;
        if (!email) {
            console.log("------------------------------------------------------",email)

        }
        else{
            console.log("kkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkkk")
        }

        const gym = await Gym.findOne({ email });
        if (!gym) {
            return res.status(404).json({ success: false, message: 'Gym not found' });
        }

        res.json({ 
            success: true, 
            plans: gym.memberShip 
        });
    } catch (error) {
        console.error('Error fetching gym plans:', error);
        res.status(500).json({ success: false, message: 'Error fetching gym plans' });
    }
});

router.get('/users', userController.getUsers);
router.post('/add-user', userController.addUser);
router.put('/update_user/:userName/:email', userController.updateUser);
router.put('/update-password', userController.updatePassword);
router.post('/update-notification', userController.updateNotification);
router.get('/user-details', userController.getUserDetails);

module.exports = router;