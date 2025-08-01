const Gym = require('../models/Gym');


const attendanceRefreshing = async () => {
    try {

        // Find the gym and user
        const gyms = await Gym.find({});


        for(const gym of gyms){
            gym.users.forEach(user => {
                user.attendance = false
            })
            await gym.save();
        }

    } catch (error) {
        console.error("Error updating attendance:", error);
        res.status(500).json({ 
            success: false,
            error: error.message 
        });
    }
};

module.exports = attendanceRefreshing