// const weightData = 70;
// const heightData = 180;
// const ageData = 17;
// const genderData = 'male';
// const activityLevelData = 1.375;
// const sportData = 'gym';
// const goalData = 'muscle_gain';
const username = 'Thunder Gym'

async function nutration() {
  try {
      const response = await fetch("http://localhost:5000/users");
      if (!response.ok) throw new Error("Network response was not ok");
      const users = await response.json();
      const gymHouse = users.find(gym => gym.name === username);
      if (gymHouse){
          gymusers = gymHouse.users
          gymusers.forEach((user,index) => {
            const weightData = user.weight;
            const heightData = user.height;
            const ageData = user.age;
            const genderData = user.sex;
            const activityLevelData = user.activityLevel;
            const sportData = user.exerciseType;
            const goalData = user.fitnessGoal;
            async function notify(txt) {
              const userName = user.userName;
              const notification = txt;
              console.log(notification)
            
              const response = await fetch('http://localhost:5000/update-notification', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({ userName, notification }),
              });
            
              const result = await response.json();
              if (response.ok) {
                // alert(result.message);
              } else {
                // alert(`Error: ${result.error}`);
              }
              
            }
            
            // 1. Calculate BMR
            let bmr;
            if (genderData === 'male') {
              bmr = 10 * weightData + 6.25 * heightData - 5 * ageData + 5;
            } else {
              bmr = 10 * weightData + 6.25 * heightData - 5 * ageData - 161;
            }
            
            // 2. Adjust for Activity Level
            const tdee = bmr * activityLevelData;
            
            // 3. Adjust for Fitness Goals
            let calories;
            if (goalData === 'maintenance') {
              calories = tdee;
            } else if (goalData === 'muscle_gain') {
              calories = tdee + 500;
            } else if (goalData === 'fat_loss') {
              calories = tdee - 500;
            }
            
            // 4. Macronutrient Distribution by Sport
            let proteinGrams, carbGrams, fatGrams;
            switch (sportData) {
              case 'gym':
                proteinGrams = weightData * 2;
                carbGrams = weightData * 4;
                break;
              case 'yoga':
                proteinGrams = weightData * 1.2;
                carbGrams = weightData * 3;
                break;
              case 'cardio':
                proteinGrams = weightData * 1.6;
                carbGrams = weightData * 6;
                break;
              case 'hiit':
                proteinGrams = weightData * 2;
                carbGrams = weightData * 5;
                break;
              case 'mixed':
                proteinGrams = weightData * 1.8;
                carbGrams = Data * 5;
                break;
            }
            fatGrams = (calories - (proteinGrams * 4 + carbGrams * 4)) / 9;
            
            // 5. Hydration Recommendation
            const hydrationLiters = (weightData * 0.033).toFixed(2);
            
            // 6. Micronutrient Recommendations
            const micronutrients = {
              VitaminC: '90mg',
              Calcium: '1000mg',
              Iron: genderData === 'male' ? '8mg' : '18mg',
              Magnesium: genderData === 'male' ? '400mg' : '310mg',
              Potassium: '4700mg',
              Sodium: '2000mg', // Midpoint
              Zinc: genderData === 'male' ? '11mg' : '8mg',
              VitaminD: '15mcg',
            };
            
            // 7. Display Results
            const resultsDiv = `
              Total Calories: ${calories} kcal
              Protein: ${proteinGrams} g
              Carbohydrates: ${carbGrams} g
              Fat: ${fatGrams.toFixed(2)} g
              Hydration: ${hydrationLiters} liters/day
              Micronutrient Recommendations:
              Vitamin C: ${micronutrients.VitaminC}
              Calcium: ${micronutrients.Calcium}
              Iron: ${micronutrients.Iron}
              Magnesium: ${micronutrients.Magnesium}
              Potassium: ${micronutrients.Potassium}
              Sodium: ${micronutrients.Sodium}
              Zinc: ${micronutrients.Zinc}
              Vitamin D: ${micronutrients.VitaminD}
            `;
            notify(resultsDiv)
            
            
            // Extracting nutrition needs from resultsDiv
            function extractNutritionNeeds(resultsDiv) {
              const nutritionNeeds = {};
              const lines = resultsDiv.split('\n').map(line => line.trim()).filter(line => line);
            
              lines.forEach(line => {
                const match = line.match(/(\w+):\s*([\d.]+)\s*(g|kcal|mg|mcg|liters)?/i);
                if (match) {
                  const [_, key, value] = match;
                  nutritionNeeds[key.toLowerCase()] = parseFloat(value);
                }
              });
            
              return nutritionNeeds;
            }
            
            // Food Menus
            const foods = [
              { name: "Chicken Breast", calories: 165, protein: 31, carbohydrates: 0, fat: 3.6, vitaminC: 0, calcium: 13, iron: 1, magnesium: 32, potassium: 256, sodium: 74, zinc: 1, vitaminD: 0 },
              { name: "Salmon", calories: 208, protein: 20, carbohydrates: 0, fat: 13, vitaminC: 0, calcium: 9, iron: 0.5, magnesium: 29, potassium: 363, sodium: 59, zinc: 0.4, vitaminD: 10 },
              { name: "Spinach", calories: 23, protein: 2.9, carbohydrates: 3.6, fat: 0.4, vitaminC: 28, calcium: 99, iron: 2.7, magnesium: 79, potassium: 558, sodium: 79, zinc: 0.5, vitaminD: 0 },
              { name: "Almonds", calories: 164, protein: 6, carbohydrates: 6.1, fat: 14, vitaminC: 0, calcium: 76, iron: 1, magnesium: 76, potassium: 211, sodium: 1, zinc: 0.9, vitaminD: 0 },
              { name: "Avocado", calories: 160, protein: 2, carbohydrates: 8.5, fat: 14.7, vitaminC: 10, calcium: 12, iron: 0.6, magnesium: 29, potassium: 485, sodium: 7, zinc: 0.6, vitaminD: 0 },
              { name: "Sweet Potato", calories: 86, protein: 1.6, carbohydrates: 20.1, fat: 0.1, vitaminC: 2.4, calcium: 30, iron: 0.6, magnesium: 25, potassium: 337, sodium: 55, zinc: 0.2, vitaminD: 0 },
              { name: "Banana", calories: 89, protein: 1.1, carbohydrates: 22.8, fat: 0.3, vitaminC: 8.7, calcium: 5, iron: 0.3, magnesium: 27, potassium: 358, sodium: 1, zinc: 0.2, vitaminD: 0 },
              { name: "Greek Yogurt", calories: 59, protein: 10, carbohydrates: 3.6, fat: 0.4, vitaminC: 0, calcium: 110, iron: 0.1, magnesium: 11, potassium: 141, sodium: 36, zinc: 0.6, vitaminD: 0 },
            ];
            
            // Suggest Foods Function
            function suggestFoods(foodMenu, nutritionNeeds) {
              const suggestions = {};
            
              for (const nutrient in nutritionNeeds) {
                const requiredAmount = nutritionNeeds[nutrient];
                const selectedFoods = [];
                let totalNutrient = 0;
            
                const shuffledFoods = foodMenu.sort(() => Math.random() - 0.5);
            
                for (const food of shuffledFoods) {
                  if (totalNutrient >= requiredAmount) break;
            
                  if (food[nutrient.toLowerCase()]) {
                    selectedFoods.push(food);
                    totalNutrient += food[nutrient.toLowerCase()];
                  }
                }
            
                suggestions[nutrient] = {
                  required: requiredAmount,
                  selectedFoods: selectedFoods.map(food => ({
                    name: food.name,
                    amount: food[nutrient.toLowerCase()],
                  })),
                };
              }
            
              return suggestions;
            }
            
            // Log Suggestions
            function logSuggestions(suggestions) {
              // console.log("Foods and their nutritional suggestions for today:");
            
              for (const nutrient in suggestions) {
                const { required, selectedFoods } = suggestions[nutrient];
                // console.log(`\nYou need ${required} of ${nutrient[0].toUpperCase() + nutrient.slice(1)} so you have to eat:`);
            
                selectedFoods.forEach(food => {
                  // console.log(`  - ${food.name} (contains ${food.amount.toFixed(2)} ${nutrient})`);
                });
              }
            }
            
            // Example Usage
            const nutritionNeeds = extractNutritionNeeds(resultsDiv);
            const suggestions = suggestFoods(foods, nutritionNeeds);
            logSuggestions(suggestions);
            
                      


          });
        }

      
  } catch (error) {
      console.error("Error fetching users:", error);
      return null;
  }
}

nutration();

const express = require('express');
const axios = require('axios'); // For fetching food data
const app = express();
const port = 3000;

// Example user data
const user = {
    weight: 93, // in kg
    height: 167, // in cm
    age: 20,
    sex: 'male',
    activityLevel: '1.2', // Sedentary
    fitnessGoal: 'maintenance', // Options: weight loss, muscle gain, maintenance
};

// Calculate nutrition needs
const calculateNutrition = (user) => {
    const { weight, height, age, sex, activityLevel, fitnessGoal } = user;

    // BMR calculation
    let bmr;
    if (sex === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    // TDEE calculation
    const tdee = bmr * parseFloat(activityLevel);

    // Macronutrient calculations
    let protein, carbs, fat;
    switch (fitnessGoal) {
        case 'weight loss':
            protein = weight * 2.2; // High protein for weight loss
            carbs = (tdee * 0.4) / 4; // 40% of calories from carbs
            fat = (tdee * 0.3) / 9; // 30% of calories from fat
            break;
        case 'muscle gain':
            protein = weight * 2.5; // High protein for muscle gain
            carbs = (tdee * 0.5) / 4; // 50% of calories from carbs
            fat = (tdee * 0.2) / 9; // 20% of calories from fat
            break;
        default: // Maintenance
            protein = weight * 1.8;
            carbs = (tdee * 0.45) / 4;
            fat = (tdee * 0.25) / 9;
    }

    return { protein, carbs, fat };
};

// Fetch food data from a database or API
const fetchFoodData = async () => {
    const foods = [
        { name: 'chicken breast', protein: 31, carbs: 0, fat: 3.6 }, // per 100g
        { name: 'salmon', protein: 25, carbs: 0, fat: 13 },
        { name: 'tofu', protein: 8, carbs: 2, fat: 4 },
        { name: 'lentils', protein: 9, carbs: 20, fat: 0.4 },
        { name: 'eggs', protein: 13, carbs: 1.1, fat: 11 },
        { name: 'quinoa', protein: 4, carbs: 21, fat: 1.9 },
        { name: 'banana', protein: 1.3, carbs: 23, fat: 0.4 },
        { name: 'milk', protein: 3.4, carbs: 5, fat: 3.6 },
    ];
    return foods;
};

// Generate food suggestions
const generateFoodSuggestions = async (nutrition) => {
    const foods = await fetchFoodData();
    const { protein, carbs, fat } = nutrition;

    let remainingProtein = protein;
    let remainingCarbs = carbs;
    let remainingFat = fat;

    const selectedFoods = [];

    while (remainingProtein > 0 ⠞⠞⠵⠺⠺⠟⠞⠺⠞⠺⠵⠟⠺⠵⠺⠟⠵⠞⠺⠵ remainingFat > 0) {
        const randomFood = foods[Math.floor(Math.random() * foods.length)];
        const portionSize = 100; // Default portion size in grams

        selectedFoods.push({
            name: randomFood.name,
            portion: portionSize,
            protein: randomFood.protein,
            carbs: randomFood.carbs,
            fat: randomFood.fat,
        });

        remainingProtein -= randomFood.protein;
        remainingCarbs -= randomFood.carbs;
        remainingFat -= randomFood.fat;
    }

    return selectedFoods;
};

// Calculate water intake
const calculateWaterIntake = (weight) => {
    return (weight * 0.033).toFixed(1); // Recommended water intake in liters
};

// Generate the output message
app.get('/suggestions', async (req, res) => {
    const nutrition = calculateNutrition(user);
    const foods = await generateFoodSuggestions(nutrition);
    const waterIntake = calculateWaterIntake(user.weight);

    const foodList = foods.map((food) => - ${food.name}: ${food.portion}g).join('\n');
    const message = `Dear user, today you have to take these foods for your health and effective changes on your body:\n${foodList}\nAlso, drink at least ${waterIntake} liters of water today.`;

    res.send(message);
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});