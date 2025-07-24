const NutritionPlanner = require('./algorithm.js');

async function runPlanner() {
  const planner = new NutritionPlanner();
//   const mealPlan = await planner.initialize();
  console.log(planner);
}

runPlanner();