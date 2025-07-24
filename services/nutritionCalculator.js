const logger = require('../config/logger');
const foodDataByDay = require('../foods.json');

class AdvancedNutritionCalculator {
    constructor(userData, conditionsData) {
        this.user = userData;
        this.conditions = Array.isArray(conditionsData) ? conditionsData : [];
        this.userHistory = userData.nutritionHistory || [];
        this.currentDate = new Date();
        this.currentDay = this.calculateCurrentDayCycle();
        this.foods = this.processFoodData(this.getDailyFoodVariation());
    }

    calculateCurrentDayCycle() {
        // 11-day cycle starting from user's registration date
        const regDate = new Date(this.user.registrationDate || this.currentDate);
        const diffDays = Math.floor((this.currentDate - regDate) / (1000 * 60 * 60 * 24));
        return (diffDays % 11) + 1; // Returns day1 through day11
    }

    getDailyFoodVariation() {
        const dayKey = `day${this.currentDay}`;
        const allDailyFoods = foodDataByDay[dayKey] || [];
        
        // Filter based on user preferences before processing
        return this.filterFoodsByPreferences(allDailyFoods);
    }

    filterFoodsByPreferences(foods) {
        return foods.filter(food => {
            const prefs = this.user.dietaryPreferences || {};
            
            // Dietary restrictions
            if (prefs.vegetarian && ['meat', 'poultry', 'fish'].includes(food.category)) return false;
            if (prefs.vegan && food.category === 'dairy') return false;
            if (prefs.glutenFree && food.containsGluten) return false;
            if (prefs.dairyFree && food.containsDairy) return false;
            
            // Religious restrictions
            if (prefs.halal && food.category === 'meat' && !food.halal) return false;
            if (prefs.fastingFood && food.category === 'meat' && !food.fastingFood) return false;
            
            // Allergies and dislikes
            if (prefs.allergies?.some(a => food.allergens?.includes(a))) return false;
            if (prefs.dislikes?.some(d => 
                food.name.toLowerCase().includes(d.toLowerCase()) || 
                food.category.toLowerCase().includes(d.toLowerCase()))) return false;
            
            return true;
        });
    }

    processFoodData(foodData) {
        return foodData.map(food => {
            // Calculate nutrient density score
            const proteinScore = food.macros.protein * 4;
            const carbScore = food.macros.carbs * 4;
            const fatScore = food.macros.fats * 9;
            const micronutrientScore = food.micronutrients ? 
                Object.values(food.micronutrients).reduce((a, b) => a + b, 0) : 0;
            
            // Enhanced portion calculations
            const standardPortion = food.standardPortion || 100;
            const minPortion = food.minPortion || standardPortion * 0.5;
            const maxPortion = food.maxPortion || standardPortion * 2;
            
            return {
                ...food,
                nutrientDensity: (proteinScore + carbScore + fatScore + micronutrientScore) / food.calories * 100,
                proteinToCalorieRatio: food.macros.protein / food.calories,
                standardPortion,
                minPortion,
                maxPortion,
                portionIncrement: food.portionIncrement || 
                    (standardPortion <= 50 ? 5 : 
                     standardPortion <= 100 ? 10 : 25)
            };
        });
    }

    calculateBMR() {
        // Enhanced Mifflin-St Jeor with body fat consideration
        let bmr;
        if (this.user.sex === 'male') {
            bmr = 10 * this.user.weight + 6.25 * this.user.height - 5 * this.user.age + 5;
        } else {
            bmr = 10 * this.user.weight + 6.25 * this.user.height - 5 * this.user.age - 161;
        }

        // Adjust for body composition
        if (this.user.bodyFat) {
            const leanMass = this.user.weight * (1 - this.user.bodyFat / 100);
            bmr = 21.6 * leanMass + 370;
        }

        return bmr;
    }

    calculateTDEE() {
        const bmr = this.calculateBMR();
        const activityFactors = {
            sedentary: 1.2,
            light: 1.375,
            moderately_active: 1.55,
            active: 1.725,
            very_active: 1.9
        };

        let tdee = bmr * (activityFactors[this.user.activityLevel] || 1.55);

        // Adjust for metabolic adaptations
        if (this.userHistory.length > 7) {
            const avgCalories = this.userHistory
                .slice(-7)
                .reduce((sum, entry) => sum + entry.macros.calories, 0) / 7;
            
            if (avgCalories < tdee * 0.8) {
                // Metabolic adaptation factor for prolonged deficit
                tdee *= 0.95;
            } else if (avgCalories > tdee * 1.2) {
                // Adaptation for surplus
                tdee *= 1.05;
            }
        }

        return Math.round(tdee);
    }

    calculateMacros() {
        const tdee = this.calculateTDEE();
        let protein, carbs, fats;

        // Enhanced macro calculations with more precise ratios
        switch (this.user.fitnessGoal) {
            case 'muscle_gain':
                protein = Math.max(1.6 * this.user.weight, 2.2 * this.user.weight * (1 - (this.user.bodyFat || 20) / 100));
                fats = Math.max(0.8 * this.user.weight, 0.25 * tdee / 9);
                carbs = (tdee - (protein * 4 + fats * 9)) / 4;
                break;
            case 'fat_loss':
                protein = Math.max(2.2 * this.user.weight, 2.6 * this.user.weight * (1 - (this.user.bodyFat || 20) / 100));
                fats = Math.max(0.6 * this.user.weight, 0.3 * tdee / 9);
                carbs = (tdee * 0.85 - (protein * 4 + fats * 9)) / 4;
                break;
            case 'endurance':
                protein = 1.4 * this.user.weight;
                carbs = 0.5 * tdee / 4;
                fats = (tdee - (protein * 4 + carbs * 4)) / 9;
                break;
            case 'maintenance':
            default:
                protein = 1.8 * this.user.weight;
                fats = 0.3 * tdee / 9;
                carbs = (tdee - (protein * 4 + fats * 9)) / 4;
        }

        // Genetic variation factor (simplified)
        if (this.user.metabolicHealth === 'fast_metabolism') {
            carbs *= 1.1;
            fats *= 1.1;
        } else if (this.user.metabolicHealth === 'slow_metabolism') {
            carbs *= 0.9;
            fats *= 0.9;
        }

        // Round to nearest 5g for practicality
        return {
            protein: Math.round(protein / 5) * 5,
            carbs: Math.round(carbs / 5) * 5,
            fats: Math.round(fats / 5) * 5,
            calories: Math.round(tdee)
        };
    }

    calculateHydration() {
        // Enhanced hydration calculation with more factors
        let baseHydration = this.user.weight * 0.033; // liters
        
        // Activity level adjustments
        const activityFactors = {
            sedentary: 1.0,
            light: 1.1,
            moderately_active: 1.3,
            active: 1.5,
            very_active: 1.7
        };
        baseHydration *= activityFactors[this.user.activityLevel] || 1.3;
        
        // Climate adjustment
        if (this.user.livesInHotClimate) baseHydration *= 1.3;
        if (this.user.livesInColdClimate) baseHydration *= 0.9;
        
        // Supplement adjustment (creatine etc.)
        if (this.user.supplements?.some(s => s.type === 'creatine')) {
            baseHydration *= 1.2;
        }
        
        return Math.round(baseHydration * 1000); // in ml
    }

    calculateRest() {
        // Enhanced sleep calculation with recovery focus
        let sleepHours = 7.5;
        
        // Base adjustments
        if (this.user.age < 25) sleepHours += 0.5;
        if (this.user.age > 50) sleepHours -= 0.5;
        
        // Activity adjustments
        const activitySleepAdd = {
            sedentary: 0,
            light: 0.25,
            moderately_active: 0.5,
            active: 0.75,
            very_active: 1.0
        };
        sleepHours += activitySleepAdd[this.user.activityLevel] || 0.5;
        
        // Goal adjustments
        if (this.user.fitnessGoal === 'muscle_gain') sleepHours += 0.5;
        if (this.user.fitnessGoal === 'fat_loss') sleepHours += 0.25;
        
        // Recovery needs
        if (this.userHistory.length > 3) {
            const recentActivity = this.userHistory.slice(-3).some(entry => 
                entry.macros.calories < this.calculateTDEE() * 0.9);
            if (recentActivity) sleepHours += 0.5;
        }
        
        // Ensure within reasonable bounds
        sleepHours = Math.max(6, Math.min(9.5, sleepHours));
        
        return {
            sleepHours: sleepHours.toFixed(1),
            recommendedBedtime: this.calculateBedtime(sleepHours),
            recoveryTips: this.generateRecoveryTips()
        };
    }
    
    calculateBedtime(sleepHours) {
      const [wakeHour, wakeMinute] = this.user.wakeTime.split(':').map(Number);
      let bedHour = wakeHour - Math.floor(sleepHours);
      let bedMinute = wakeMinute - ((sleepHours % 1) * 60);
      
      if (bedMinute < 0) {
        bedMinute += 60;
        bedHour -= 1;
      }
      
      if (bedHour < 0) bedHour += 24;
      
      return `${bedHour}:${bedMinute.toString().padStart(2, '0')}`;
    }
    
    generateRecoveryTips() {
        const tips = [];
        
        if (this.user.fitnessGoal === 'muscle_gain') {
            tips.push("Consider post-workout protein within 30 minutes of training");
        }
        
        if (this.user.activityLevel === 'very_active') {
            tips.push("Active recovery days with light movement can enhance recovery");
        }
        
        if (this.user.bodyFat > 25) {
            tips.push("Quality sleep is especially important for metabolic health");
        }
        
        return tips.length > 0 ? tips : ["Maintain consistent sleep schedule for optimal recovery"];
    }

    findOptimalFoods(macros) {
        // Score foods based on multiple factors with enhanced micronutrient consideration
        const micronutrientGaps = this.identifyMicronutrientGaps();
        
        return this.foods.map(food => {
            let score = 0;
            
            // Macronutrient match (40% of score)
            score += (food.macros.protein / macros.protein) * 40;
            score += (food.macros.carbs / macros.carbs) * 30;
            score += (food.macros.fats / macros.fats) * 30;
            
            // Nutrient density (20% of score)
            score += food.nutrientDensity * 0.2;
            
            // Micronutrient coverage (20% of score)
            if (micronutrientGaps.length > 0 && food.micronutrients) {
                const micronutrientCoverage = micronutrientGaps
                    .filter(gap => food.micronutrients[gap])
                    .reduce((sum, gap) => sum + food.micronutrients[gap], 0);
                score += micronutrientCoverage * 0.2;
            }
            
            // Protein quality (10% of score)
            if (food.proteinType === 'complete') score += 10;
            
            // Glycemic impact (5% of score)
            if (food.glycemicIndex < 55) score += 5;
            
            // Cultural preference (5% of score)
            if (this.user.dietaryPreferences?.preferredCuisines?.some(cuisine => 
                food.cuisine?.toLowerCase().includes(cuisine.toLowerCase()))) {
                score += 5;
            }
            
            return {
                ...food,
                matchScore: score,
                micronutrientBenefits: micronutrientGaps.filter(gap => food.micronutrients?.[gap])
            };
        }).sort((a, b) => b.matchScore - a.matchScore);
    }

    generateMealPlan(foods, macros, mealFrequency) {
        const meals = Array.from({ length: mealFrequency }, () => ({
            foods: [],
            macros: { protein: 0, carbs: 0, fats: 0, calories: 0 },
            micronutrients: {},
            timing: ''
        }));
        
        // Set meal times
        const wakeHour = parseInt(this.user.wakeTime.split(':')[0]);
        const sleepHour = parseInt(this.user.sleepTime.split(':')[0]);
        const eatingWindow = sleepHour > wakeHour ? sleepHour - wakeHour : (24 - wakeHour) + sleepHour;
        const mealInterval = eatingWindow / mealFrequency;
        
        meals.forEach((meal, i) => {
            const mealHour = (wakeHour + i * mealInterval) % 24;
            meal.timing = `${Math.floor(mealHour)}:${i === 0 ? '00' : '30'}`;
            meal.type = i === 0 ? 'breakfast' : 
                       i === mealFrequency - 1 ? 'dinner' : 
                       mealHour >= 11 && mealHour <= 14 ? 'lunch' : 'snack';
        });
        
        // Enhanced macro distribution with micronutrient tracking
        this.distributeMacrosWithMicronutrients(meals, foods, macros, mealFrequency);
        
        // Add micronutrient boosters if needed
        this.addTargetedMicronutrientFoods(meals, foods);
        
        return meals;
    }

    distributeMacrosWithMicronutrients(meals, foods, macros, mealFrequency) {
        const targetPerMeal = {
            protein: macros.protein / mealFrequency,
            carbs: macros.carbs / mealFrequency,
            fats: macros.fats / mealFrequency
        };
        
        // Distribute protein first
        this.distributeMacro(meals, foods, 'protein', targetPerMeal.protein);
        
        // Then distribute carbs with timing consideration
        meals.forEach(meal => {
            const carbNeed = targetPerMeal.carbs * (meal.type === 'postWorkout' ? 1.5 : 1);
            this.distributeMacro([meal], foods, 'carbs', carbNeed);
        });
        
        // Finally distribute fats
        this.distributeMacro(meals, foods, 'fats', targetPerMeal.fats);
    }

    distributeMacro(meals, foods, macroType, targetPerMeal) {
        const macroFoods = foods.filter(f => f.macros[macroType] > 0)
                               .sort((a, b) => b.matchScore - a.matchScore);
        
        meals.forEach(meal => {
            let remainingNeed = targetPerMeal - meal.macros[macroType];
            if (remainingNeed <= 0) return;
            
            for (const food of macroFoods) {
                if (meal.foods.some(f => f.name === food.name)) continue;
                
                const maxPortion = food.maxPortion;
                const portion = Math.min(
                    maxPortion,
                    Math.max(
                        food.minPortion,
                        Math.round((remainingNeed / food.macros[macroType] * 100) / food.portionIncrement
                    ) * food.portionIncrement
                ));
                
                if (portion < food.minPortion) continue;
                
                const macroContribution = food.macros[macroType] * portion / 100;
                if (macroContribution <= 0) continue;
                
                // Add food to meal
                meal.foods.push(this.createFoodEntry(food, portion));
                
                // Update meal macros
                meal.macros.protein += food.macros.protein * portion / 100;
                meal.macros.carbs += food.macros.carbs * portion / 100;
                meal.macros.fats += food.macros.fats * portion / 100;
                meal.macros.calories += food.calories * portion / 100;
                
                // Update micronutrients
                if (food.micronutrients) {
                    for (const [nutrient, amount] of Object.entries(food.micronutrients)) {
                        meal.micronutrients[nutrient] = (meal.micronutrients[nutrient] || 0) + 
                                                       (amount * portion / 100);
                    }
                }
                
                remainingNeed -= macroContribution;
                if (remainingNeed <= 0) break;
            }
        });
    }

    createFoodEntry(food, portion) {
        return {
            name: food.name,
            portion: portion,
            type: this.getFoodType(food),
            macros: {
                protein: food.macros.protein * portion / 100,
                carbs: food.macros.carbs * portion / 100,
                fats: food.macros.fats * portion / 100
            },
            micronutrients: food.micronutrients ? 
                Object.fromEntries(
                    Object.entries(food.micronutrients)
                        .map(([k, v]) => [k, v * portion / 100])
                ) : {},
            benefits: food.micronutrientBenefits?.join(', ') || ''
        };
    }

    getFoodType(food) {
        if (food.macros.protein / food.calories > 0.3) return 'protein';
        if (food.macros.carbs / food.calories > 0.6) return 'carb';
        if (food.macros.fats / food.calories > 0.5) return 'fat';
        return 'balanced';
    }

    addTargetedMicronutrientFoods(meals, allFoods) {
        const micronutrientGaps = this.identifyMicronutrientGaps();
        if (micronutrientGaps.length === 0) return;
        
        // Find foods rich in needed micronutrients
        const boosterFoods = allFoods
            .filter(food => micronutrientGaps.some(gap => food.micronutrients?.[gap]))
            .sort((a, b) => {
                const aScore = micronutrientGaps.reduce((sum, gap) => 
                    sum + (a.micronutrients?.[gap] || 0), 0);
                const bScore = micronutrientGaps.reduce((sum, gap) => 
                    sum + (b.micronutrients?.[gap] || 0), 0);
                return bScore - aScore;
            });
        
        if (boosterFoods.length === 0) return;
        
        // Add to meals that need these micronutrients
        meals.forEach(meal => {
            if (meal.foods.length >= 4) return; // Don't overload meals
            
            // Check if meal is missing any key micronutrients
            const missingNutrients = micronutrientGaps.filter(gap => 
                !meal.micronutrients?.[gap] || meal.micronutrients[gap] < this.getDailyRequirement(gap) * 0.2
            );
            
            if (missingNutrients.length === 0) return;
            
            // Find suitable booster food
            const suitableBooster = boosterFoods.find(food => 
                !meal.foods.some(mf => mf.name === food.name) &&
                missingNutrients.some(gap => food.micronutrients?.[gap])
            );
            
            if (suitableBooster) {
                const portion = Math.min(
                    suitableBooster.standardPortion,
                    suitableBooster.maxPortion * 0.5
                );
                
                meal.foods.push(this.createFoodEntry(suitableBooster, portion));
                
                // Update meal macros and micronutrients
                meal.macros.protein += suitableBooster.macros.protein * portion / 100;
                meal.macros.carbs += suitableBooster.macros.carbs * portion / 100;
                meal.macros.fats += suitableBooster.macros.fats * portion / 100;
                meal.macros.calories += suitableBooster.calories * portion / 100;
                
                if (suitableBooster.micronutrients) {
                    for (const [nutrient, amount] of Object.entries(suitableBooster.micronutrients)) {
                        meal.micronutrients[nutrient] = (meal.micronutrients[nutrient] || 0) + 
                                                       (amount * portion / 100);
                    }
                }
            }
        });
    }

    getDailyRequirement(nutrient) {
        // Simplified daily requirements - in real app would use more precise data
        const requirements = {
            iron: this.user.sex === 'female' ? 18 : 8,
            calcium: 1000,
            vitaminD: 15, // mcg
            vitaminB12: 2.4,
            omega3: 1.6 // g
        };
        return requirements[nutrient] || 0;
    }

    identifyMicronutrientGaps() {
        const gaps = [];
        
        if (this.user.sex === 'female' && this.user.age < 50) {
            gaps.push('iron');
        }
        
        if (!this.user.livesInHotClimate) {
            gaps.push('vitaminD');
        }
        
        if (this.user.dietaryPreferences?.vegetarian) {
            gaps.push('vitaminB12', 'omega3');
        }
        
        if (this.user.dietaryPreferences?.dairyFree) {
            gaps.push('calcium');
        }
        
        // Check for any medical conditions requiring specific nutrients
        if (this.conditions?.some(c => c.requiresExtra?.includes('magnesium'))) {
            gaps.push('magnesium');
        }
        
        return gaps;
    }

    generateSupplementAdvice() {
        if (!this.user.supplements || this.user.supplements.length === 0) {
            return null;
        }
        
        const advice = [];
        const now = new Date();
        const currentHour = now.getHours();
        
        this.user.supplements.forEach(supp => {
            let timing = '';
            
            switch (supp.timing) {
                case 'morning':
                    timing = 'with your breakfast';
                    break;
                case 'evening':
                    timing = 'with your dinner';
                    break;
                case 'post-workout':
                    timing = 'after your workout session';
                    break;
                case 'pre-workout':
                    timing = '30 minutes before training';
                    break;
                default:
                    timing = 'with a meal';
            }
            
            let notes = '';
            if (supp.name.toLowerCase().includes('vitamin d') && currentHour >= 16) {
                notes = ' (best taken in the morning)';
            }
            if (supp.name.toLowerCase().includes('magnesium') && supp.timing !== 'evening') {
                notes = ' (consider taking in the evening for better sleep)';
            }
            
            advice.push({
                name: supp.name,
                timing: `${timing}${notes}`,
                dosage: supp.dosage || 'as directed',
                withFood: supp.withFood !== false
            });
        });
        
        return advice;
    }

   

    generateRecommendation() {
        try {
            const macros = this.calculateMacros();
            const hydration = this.calculateHydration();
            const rest = this.calculateRest();
            const optimalFoods = this.findOptimalFoods(macros);
            const mealPlan = this.generateMealPlan(optimalFoods, macros, this.user.mealFrequency || 3);
            const supplementAdvice = this.generateSupplementAdvice();
            
            // Generate comprehensive notification with micronutrient focus
            let message = `Hey ${this.user.name}, here's your Day ${this.currentDay} nutrition plan:\n\n`;
            
            // Add daily macros
            message += `Daily Nutrition Targets:\n`;
            message += `- Protein: ${macros.protein}g\n`;
            message += `- Carbs: ${macros.carbs}g\n`;
            message += `- Fats: ${macros.fats}g\n`;
            message += `- Calories: ${macros.calories}kcal\n\n`;
            
            // Add meal plan with micronutrient highlights
            message += `Meal Plan (Today's Variation):\n`;
            mealPlan.forEach((meal, index) => {
                message += `${meal.timing} (${meal.type}):\n`;
                meal.foods.forEach(food => {
                    message += `- ${food.portion}g ${food.name}`;
                    if (food.benefits) message += ` (Rich in: ${food.benefits})`;
                    message += `\n`;
                });
                message += `\n`;
            });
            
            // Add micronutrient focus section
            const micronutrientGaps = this.identifyMicronutrientGaps();
            if (micronutrientGaps.length > 0) {
                message += `Today's Micronutrient Focus:\n`;
                micronutrientGaps.forEach(nutrient => {
                    message += `- ${nutrient}: Aim for ${this.getDailyRequirement(nutrient)}${nutrient === 'vitaminD' ? 'mcg' : 'mg'}\n`;
                });
                message += `\n`;
            }
            
            // Add hydration
            message += `Hydration: Aim for ${hydration}ml of water throughout the day\n\n`;
            
            message += `\n`;
            
            
            return {
                notification: message,
                macros,
                mealPlan,
                hydration,
            };
        } catch (error) {
            logger.error('Error generating recommendation:', error);
            return {
                error: 'Failed to generate recommendation',
                details: error.message
            };
        }
    }
}

module.exports = AdvancedNutritionCalculator;








