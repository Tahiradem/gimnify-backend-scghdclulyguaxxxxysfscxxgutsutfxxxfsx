const Gym = require('../models/Gym');

exports.createGymHouse = async (req, res) => {
    try {
        const { gymHouseName, email, password, location, phone, price_plan } = req.body;
        if (!gymHouseName || !email || !password || !location || !phone) {
            return res.status(400).json({ error: 'All fields are required.' });
        }
        const existingGym = await Gym.findOne({ email: email });
        if (existingGym) {
            return res.status(400).json({ error: 'Gym house already exists.' });
        }
        
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = now.getFullYear();
        const registeredDate = `${day}, ${month}, ${year}`;

        const newGym = new Gym({
            name: gymHouseName,
            email,
            password,
            phoneNumber: phone,
            registeredDate,
            totalUsers: 0,
            currentUsers: 0,
            location,
            dailyIncome: [],
            dailyOutcome: [],
            dailyRevenue: 0,
            weeklyIncome:[
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
            ],
            weeklyExpense:[
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
            ],
            weeklyRevenue:[
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
                {"Mon":0,"Tue":0,"Wed":0,"Thu":0,"Fri":0,"Sat":0,"Sun":0},
            ],
            adminNotifications: [],
            notificationOperator: [],
            pricePlan: price_plan,
            paymentsList: [],
            accountNumbers: [],
            payDone: false,
            serviceTermination:false,
            memberShip:{
                "Basic":{"1":"","2":"","3":"","6":"","12":"",
                "services":[],
                },
                "Plus":{"1":"","2":"","3":"","6":"","12":"",
                "services":[],
                },
                "Pro":{"1":"","2":"","3":"","6":"","12":"",
                "services":[],
                },
            },
            users:[ ],
            userDetails: []
        });

        await newGym.save();
        res.status(201).json({ message: 'Gym house created successfully!', gymHouse: newGym });
    } catch (error) {
        console.error('Error creating gym house:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

exports.updateMembership = async (req, res) => {
    try {
        const { email, membershipData } = req.body;
        const gymHouse = await Gym.findOne({ "email": email });
        if (!gymHouse) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        gymHouse.memberShip = membershipData;
        await gymHouse.save();
        res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Error updating password' });
    }
};