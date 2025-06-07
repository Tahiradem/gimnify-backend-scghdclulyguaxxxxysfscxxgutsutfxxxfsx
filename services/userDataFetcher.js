// services/userDataFetcher.js
const Gym = require('../models/Gym');
const logger = require('../config/logger');

/**
 * Fetches user data from the database and transforms it into the same structure
 * as the original users.json file for compatibility with existing services.
 * 
 * @returns {Promise<Array>} Array of user objects in the expected format
 */
const fetchUserData = async () => {
    try {
        // Find all gyms with their users
        const gyms = await Gym.find().lean();
        
        if (!gyms || gyms.length === 0) {
            logger.warn('No gyms found in the database');
            return [];
        }

        // Transform the data into the expected format
        const users = [];
        
        for (const gym of gyms) {
            if (!gym.users || gym.users.length === 0) continue;
            
            for (const user of gym.users) {
                // Skip users without email (as they can't be matched)
                if (!user.email) continue;
                
                const transformedUser = {
                    name: user.userName || '',
                    weight: user.weight || 0,
                    email: user.email,
                    height: user.height || 0,
                    age: user.age || 0,
                    sex: user.sex || '',
                    bodyFat: user.bodyFat || 0,
                    activityLevel: user.activityLevel || 'moderately_active',
                    fitnessGoal: user.fitnessGoal || 'maintenance',
                    metabolicHealth: user.metabolicHealth || '',
                    livesInHotClimate: user.livesInHotClimate || false,
                    medicalConditions: user.medicalConditions || [],
                    dietaryPreferences: {
                        vegetarian: user.dietaryPreferences?.vegetarian || false,
                        vegan: user.dietaryPreferences?.vegan || false,
                        glutenFree: user.dietaryPreferences?.glutenFree || false,
                        dairyFree: user.dietaryPreferences?.dairyFree || false,
                        halal: user.dietaryPreferences?.halal || false,
                        kosher: user.dietaryPreferences?.kosher || false,
                        allergies: user.dietaryPreferences?.allergies || [],
                        dislikes: user.dietaryPreferences?.dislikes || [],
                        preferredCuisines: user.dietaryPreferences?.preferredCuisines || [],
                        budget: user.dietaryPreferences?.budget || 'medium'
                    },
                    mealFrequency: user.mealFrequency || 3,
                    wakeTime: user.wakeTime || '07:00',
                    sleepTime: user.sleepTime || '23:00',
                    cookingTime: user.cookingTime || 'medium',
                    supplements: user.supplements || []
                };

                users.push(transformedUser);
            }
        }

        logger.info(`Successfully fetched ${users.length} users from database`);
        return users;
    } catch (error) {
        logger.error('Error fetching user data:', error);
        throw error; // Re-throw to let calling code handle it
    }
};

module.exports = fetchUserData;