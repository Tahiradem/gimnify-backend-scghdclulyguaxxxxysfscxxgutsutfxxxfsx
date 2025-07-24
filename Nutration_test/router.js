const express = require('express');
const router = express.Router();
const NutritionPlanner = require('./NutritionPlanner');
const GymModel = require('./yourSchemaFile');

// Generate and save nutrition plan
router.post('/generate-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 1. Find user
    const gym = await GymModel.findOne({ 'users._id': userId });
    if (!gym) return res.status(404).json({ message: 'User not found' });
    
    const user = gym.users.id(userId);
    
    // 2. Create and configure planner with user data
    const planner = new NutritionPlanner();
    
    // Set user-specific parameters
    planner.userNeeds.protein = user.proteinAmountRequired || 100;
    planner.userBudget = user.dietaryPreferences?.budget || 'lowBudget';
    planner.userGoal = user.fitnessGoal || 'muscle gain';
    
    // 3. Generate plan (all calculations happen inside the NutritionPlanner)
    const mealPlan = await planner.initialize();
    
    // 4. Store in database
    user.TodayNotification = JSON.stringify({
      plan: mealPlan,
      generatedAt: new Date()
    });
    
    await gym.save();
    
    res.json({
      success: true,
      plan: mealPlan
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error generating nutrition plan'
    });
  }
});

// Get current plan
router.get('/current-plan/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const gym = await GymModel.findOne({ 'users._id': userId });
    if (!gym) return res.status(404).json({ message: 'User not found' });
    
    const user = gym.users.id(userId);
    const notification = JSON.parse(user.TodayNotification || '{}');
    
    res.json({
      success: true,
      plan: notification.plan || [],
      generatedAt: notification.generatedAt
    });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving nutrition plan'
    });
  }
});

module.exports = router;