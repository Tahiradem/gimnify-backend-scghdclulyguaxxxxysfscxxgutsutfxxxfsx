class NutritionPlanner {
  constructor() {
    this.foodsData = null;
    this.userNeeds = {
      protein: 100,
      calcium: 100,
      carbs: 200,
      fats: 50,
      iron: 15,
      thiamine: 1.2
    };
    this.userBudget = 'lowBudget';
    this.userGoal = 'muscle gain';
    this.daysToPlan = 7;
    this.usedFoods = new Set();
    this.maxFoodsPerMeal = 5;
  }

  async initialize() {
    await this.fetchFoodData();
    return this.generateMealPlan(); // Return the meal plan
  }

  async fetchFoodData() {
    try {
      const response = await fetch('./Foods.json');
      if (!response.ok) throw new Error('Network response was not ok');
      this.foodsData = await response.json();
    } catch (error) {
      console.error('Error fetching data:', error);
      throw error;
    }
  }

  generateMealPlan() {
    if (!this.foodsData) {
      console.error('Food data not loaded');
      return [];
    }

    const mealPlan = [];
    const nutrientsToMeet = { ...this.userNeeds };

    for (let day = 1; day <= this.daysToPlan; day++) {
      const dayPlan = {
        day: day,
        meals: []
      };

      const meals = {
        breakfast: this.planMeal('breakFast', nutrientsToMeet),
        lunch: this.planMeal('lunch', nutrientsToMeet),
        dinner: this.planMeal('dinner', nutrientsToMeet)
      };

      for (const [mealType, foods] of Object.entries(meals)) {
        dayPlan.meals.push({
          type: mealType,
          foods: foods.map(food => ({
            name: food.foodName,
            portion: food.portion,
            nutrients: food.nutrients,
            scalingType: food.scalingType
          }))
        });
      }

      this.updateRemainingNutrients(meals, nutrientsToMeet);
      mealPlan.push(dayPlan);
    }

    return [mealPlan]
  }

  // [Rest of your existing methods remain exactly the same...]
  planMeal(mealPeriod, remainingNutrients) {
    const availableFoods = this.getAvailableFoods(mealPeriod);
    const prioritizedFoods = this.prioritizeFoods(availableFoods, remainingNutrients);
    const selectedFoods = this.selectFoodsToMeetNutrients(prioritizedFoods, remainingNutrients);
    return selectedFoods.slice(0, this.maxFoodsPerMeal);
  }

  getAvailableFoods(mealPeriod) {
    const availableFoods = [];
    const days = Object.keys(this.foodsData);

    days.forEach(day => {
      const meals = this.foodsData[day];
      if (meals[mealPeriod] && meals[mealPeriod][this.userBudget]) {
        meals[mealPeriod][this.userBudget].forEach(food => {
          if (food.period.includes(mealPeriod) && 
              food.forGoalOf.includes(this.userGoal) &&
              !this.usedFoods.has(food.foodName)) {
            availableFoods.push(food);
          }
        });
      }
    });

    return availableFoods;
  }

  prioritizeFoods(foods, remainingNutrients) {
    return foods.map(food => {
      let score = 0;
      let nutrientCount = 0;

      for (const [nutrient, amount] of Object.entries(food.macrosPerScalingType || {})) {
        if (remainingNutrients[nutrient]) {
          const percentage = Math.min(amount / remainingNutrients[nutrient], 1);
          score += percentage * 0.7;
          nutrientCount++;
        }
      }

      for (const [nutrient, amount] of Object.entries(food.micronutrientsPerScalingType || {})) {
        if (remainingNutrients[nutrient]) {
          const percentage = Math.min(amount / remainingNutrients[nutrient], 1);
          score += percentage * 0.3;
          nutrientCount++;
        }
      }

      if (nutrientCount > 0) {
        score /= nutrientCount;
      }

      const popularity = parseFloat(food.popularity) / 100 || 0;
      const availability = parseFloat(food.availability) / 100 || 0;
      score += (popularity * 0.2) + (availability * 0.1);

      return { ...food, score };
    })
    .sort((a, b) => b.score - a.score);
  }

  selectFoodsToMeetNutrients(prioritizedFoods, remainingNutrients) {
    const selectedFoods = [];
    const tempRemaining = { ...remainingNutrients };

    for (const food of prioritizedFoods) {
      if (this.usedFoods.has(food.foodName)) continue;

      const foodPortion = this.calculateOptimalPortion(food, tempRemaining);
      if (foodPortion > 0) {
        selectedFoods.push({
          foodName: food.foodName,
          portion: foodPortion,
          scalingType: food.scalingType,
          nutrients: this.calculateFoodNutrients(food, foodPortion)
        });

        this.usedFoods.add(food.foodName);
        this.updateTempRemaining(tempRemaining, food, foodPortion);
      }

      if (selectedFoods.length >= this.maxFoodsPerMeal * 2) break;
    }

    return selectedFoods;
  }

  calculateOptimalPortion(food, remainingNutrients) {
    let maxPortion = food.minMaxPortion ? food.minMaxPortion[1] : 1;
    let optimalPortion = food.minMaxPortion ? food.minMaxPortion[0] : 1;

    let mostCriticalNutrient = null;
    let maxDeficit = 0;

    for (const [nutrient, amount] of Object.entries(remainingNutrients)) {
      const foodAmount = (food.macrosPerScalingType?.[nutrient] || food.micronutrientsPerScalingType?.[nutrient] || 0);
      if (foodAmount > 0 && amount > 0 && amount > maxDeficit) {
        mostCriticalNutrient = nutrient;
        maxDeficit = amount;
      }
    }

    if (mostCriticalNutrient) {
      const foodAmountPerUnit = food.macrosPerScalingType?.[mostCriticalNutrient] || 
                               food.micronutrientsPerScalingType?.[mostCriticalNutrient] || 0;
      
      if (foodAmountPerUnit > 0) {
        optimalPortion = Math.min(
          Math.ceil(remainingNutrients[mostCriticalNutrient] / foodAmountPerUnit),
          maxPortion
        );
      }
    }

    return Math.max(optimalPortion, food.minMaxPortion ? food.minMaxPortion[0] : 1);
  }

  calculateFoodNutrients(food, portion) {
    const nutrients = {};

    for (const [nutrient, amount] of Object.entries(food.macrosPerScalingType || {})) {
      nutrients[nutrient] = amount * portion;
    }

    for (const [nutrient, amount] of Object.entries(food.micronutrientsPerScalingType || {})) {
      nutrients[nutrient] = amount * portion;
    }

    return nutrients;
  }

  updateTempRemaining(tempRemaining, food, portion) {
    for (const [nutrient, amount] of Object.entries(food.macrosPerScalingType || {})) {
      if (tempRemaining[nutrient]) {
        tempRemaining[nutrient] -= amount * portion;
        if (tempRemaining[nutrient] < 0) tempRemaining[nutrient] = 0;
      }
    }

    for (const [nutrient, amount] of Object.entries(food.micronutrientsPerScalingType || {})) {
      if (tempRemaining[nutrient]) {
        tempRemaining[nutrient] -= amount * portion;
        if (tempRemaining[nutrient] < 0) tempRemaining[nutrient] = 0;
      }
    }
  }

  updateRemainingNutrients(meals, remainingNutrients) {
    for (const [mealTime, foods] of Object.entries(meals)) {
      for (const food of foods) {
        for (const [nutrient, amount] of Object.entries(food.nutrients)) {
          if (remainingNutrients[nutrient]) {
            remainingNutrients[nutrient] -= amount;
            if (remainingNutrients[nutrient] < 0) remainingNutrients[nutrient] = 0;
          }
        }
      }
    }
  }
}

// Usage example:
const planner = new NutritionPlanner();
planner.initialize().then(result => {
  console.log(result);
  // You can now use 'result' which is in the array object format
});

// Add this instead:
if (typeof module !== 'undefined' && module.exports) {
  // Node.js environment
  module.exports = NutritionPlanner;
} else {
  // Browser environment - attach to window
  window.NutritionPlanner = NutritionPlanner;
}