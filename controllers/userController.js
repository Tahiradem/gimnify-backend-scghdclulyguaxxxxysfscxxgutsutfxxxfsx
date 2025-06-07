const Gym = require('../models/Gym');

exports.getUsers = async (req, res) => {
    try {
        const gymHouses = await Gym.find();
        res.json(gymHouses);
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ message: 'Failed to fetch users' });
    }
};

exports.addUser = async (req, res) => {
    try {
        const { email, user } = req.body;
        
        if (!email || !user) {
            return res.status(400).json({ success: false, message: 'Email and user data are required' });
        }

        let gymHouse = await Gym.findOne({ email });
        
        if (!gymHouse) {
            return res.status(404).json({ 
                success: false, 
                message: 'Gym not found with the provided email' 
            });
        }

        // Check if user email already exists
        const userExists = gymHouse.users.some(u => u.email === user.email);
        if (userExists) {
            return res.status(400).json({ 
                success: false, 
                message: 'User with this email already exists' 
            });
        }
        gymHouse.users.push(user);
        await gymHouse.save();
        
        res.status(201).json({ 
            success: true, 
            message: 'User added successfully' 
        });
    } catch (error) {
        console.error('Error adding user:', error);
        
        if (error.name === 'ValidationError') {
            return res.status(400).json({ 
                success: false, 
                message: 'Validation error',
                errors: error.errors 
            });
        }
        
        if (error.code === 11000) {
            return res.status(400).json({ 
                success: false, 
                message: 'Duplicate email detected' 
            });
        }
        
        res.status(500).json({ 
            success: false, 
            message: 'Error adding user',
            error: error.message 
        });
    }
};

exports.updateUser = async (req, res) => {
    const userId = req.params.userName;
    const email = req.params.email;
    const updatedData = req.body;
    
    try {
        const gymHouse = await Gym.findOne({ email: email });
        if (!gymHouse) {
            return res.status(404).json({ message: "Gym House not found" });
        }
        const user = gymHouse.users.find((u) => u.email == userId);
        if (!user) {
            return res.status(404).json({ message: "User not founded" });
        }
        Object.keys(updatedData).forEach((key) => {
            user[key] = updatedData[key];
        });
        await gymHouse.save();
        res.json({ message: "User updated successfully" });
    } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
    }
};

exports.updatePassword = async (req, res) => {
    try {
        const { email, newPassword } = req.body;
        const gymHouse = await Gym.findOne({ "email": email });
        if (!gymHouse) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        gymHouse.password = newPassword;
        await gymHouse.save();
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Error updating password' });
    }
};

exports.updateNotification = async (req, res) => {
    const { userName, notification } = req.body;
    if (!userName || !notification) {
        return res.status(400).json({ error: 'Username and notification are required.' });
    }
    try {
        const gym = await Gym.findOne({ "users.userName": userName });
        if (!gym) {
            return res.status(404).json({ error: 'User not found.' });
        }
        const userIndex = gym.users.findIndex((user) => user.userName === userName);
        if (userIndex === -1) {
            return res.status(404).json({ error: 'User not found in gym.' });
        }
        gym.users[userIndex].TodayNotification = notification;
        await gym.save();
        res.json({ message: 'Notification updated successfully!' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error.' });
    }
};
// In your userController.js
// Update the getUserDetails function to use userEmail
exports.getUserDetails = async (req, res) => {
    try {
        const { userEmail, gymEmail } = req.query;
        
        const gym = await Gym.findOne({ email: gymEmail });
        if (!gym) {
            return res.status(404).json({ success: false, message: 'Gym not found' });
        }

        const user = gym.users.find(u => u.email === userEmail);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not founded' });
        }

        // Return the user data...
        res.json({ 
            success: true,
            user: user
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        res.status(500).json({ success: false, message: 'Error fetching user details' });
    }
};