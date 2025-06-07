const { v4: uuidv4 } = require('uuid');
const logger = require('../config/logger');
const Gym = require('../models/Gym');
const { loadJSONData } = require('../services/dataLoader');
const fetchUserData = require('../services/userDataFetcher');
const AdvancedNutritionCalculator = require('../services/nutritionCalculator');

const updateDailyNotifications = async () => {
    const jobId = uuidv4();
    logger.info(`Starting daily notification update (Job ID: ${jobId})`);
    
    try {
        // Replace JSON loading with database fetch
        const usersData = await fetchUserData();
        const foodData = loadJSONData('foods.json');
        const conditionsData = loadJSONData('conditions.json');

        if (!usersData || !foodData || !conditionsData) {
            throw new Error('Failed to load required data');
        }

        // Find ALL gyms (with retries)
        let gyms;
        const maxRetries = 3;
        let retries = 0;
        
        while (retries < maxRetries) {
            try {
                gyms = await Gym.find().lean(); // Get all gyms
                if (gyms && gyms.length > 0) break;
                retries++;
                await new Promise(resolve => setTimeout(resolve, 2000));
            } catch (dbError) {
                retries++;
                if (retries >= maxRetries) throw dbError;
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        if (!gyms || gyms.length === 0) {
            throw new Error('No gyms found in the database after retries');
        }

        // Process each gym
        for (const gym of gyms) {
            logger.info(`Processing gym with email: ${gym.email || 'No email'} (ID: ${gym._id})`);

            // Process each user in the gym (matching by email)
            for (const user of gym.users) {
                if (!user.email) {
                    logger.warn('Skipping user with empty email');
                    continue;
                }

                try {
                    // Find matching user profile by email
                    const userProfile = usersData.find(u => u.email === user.email);
                    if (!userProfile) {
                        logger.warn(`No profile found for user with email: ${user.email}`);
                        continue;
                    }

                    logger.info(`Processing user: ${user.email} (Gym ID: ${gym._id})`);

                    // Generate nutrition recommendation
                    const calculator = new AdvancedNutritionCalculator(
                        userProfile, 
                        foodData, 
                        conditionsData
                    );
                    
                    const result = calculator.generateRecommendation();
                    if (result.error) {
                        logger.error(`Error generating recommendation: ${result.error}`);
                        continue;
                    }

                    // Update TodayNotification for the user (matched by email)
                    const updateResult = await Gym.updateOne(
                        { 
                            _id: gym._id,
                            'users.email': user.email // Match user by email
                        },
                        {
                            $set: {
                                'users.$.TodayNotification': result.notification,
                                'users.$.lastUpdated': new Date()
                            },
                            $push: {
                                'users.$.nutritionHistory': {
                                    $each: [{
                                        date: new Date(),
                                        macros: result.macros,
                                        foodsConsumed: result.mealPlan.flatMap(meal => 
                                            meal.foods.map(food => ({
                                                name: food.name,
                                                portion: food.portion
                                            }))
                                        )
                                    }],
                                    $slice: -30
                                }
                            }
                        }
                    );

                    if (updateResult.matchedCount === 0) {
                        logger.error(`Failed to match user with email: ${user.email}`);
                    } else if (updateResult.modifiedCount === 0) {
                        logger.warn(`No changes made for ${user.email} (data may be identical)`);
                    } else {
                        logger.info(`Successfully updated ${user.email}`);
                    }
                } catch (error) {
                    logger.error(`Error processing ${user.email}:`, error);
                }
            }
        }

        logger.info(`Daily notification update completed (Job ID: ${jobId})`);
    } catch (error) {
        logger.error(`Job failed (ID: ${jobId}):`, error);
    }
};

module.exports = updateDailyNotifications;