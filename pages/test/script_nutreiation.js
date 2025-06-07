document.getElementById('calculate-btn').addEventListener('click', () => {
    const weight = parseFloat(document.getElementById('weight').value);
    const height = parseFloat(document.getElementById('height').value);
    const age = parseInt(document.getElementById('age').value);
    const gender = document.getElementById('gender').value;
    const activityLevel = parseFloat(document.getElementById('activity').value);
    const sport = document.getElementById('sport').value;
    const goal = document.getElementById('goal').value;
  
    if (!weight || !height || !age || !activityLevel || !goal || !sport) {
      alert('Please fill out all fields!');
      return;
    }
  
    // 1. Calculate BMR
    let bmr;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
  
    // 2. Adjust for Activity Level
    const tdee = bmr * activityLevel;
  
    // 3. Adjust for Fitness Goals
    let calories;
    if (goal === 'maintenance') {
      calories = tdee;
    } else if (goal === 'muscle_gain') {
      calories = tdee + 500;
    } else if (goal === 'fat_loss') {
      calories = tdee - 500;
    }
  
    // 4. Macronutrient Distribution by Sport
    let proteinGrams, carbGrams, fatGrams;
    switch (sport) {
      case 'gym':
        proteinGrams = weight * 2; // Gym: 2 g/kg protein
        carbGrams = weight * 4; // Gym: 4 g/kg carbs
        break;
      case 'yoga':
        proteinGrams = weight * 1.2; // Yoga: 1.2 g/kg protein
        carbGrams = weight * 3; // Yoga: 3 g/kg carbs
        break;
      case 'cardio':
        proteinGrams = weight * 1.6; // Cardio: 1.6 g/kg protein
        carbGrams = weight * 6; // Cardio: 6 g/kg carbs
        break;
      case 'hiit':
        proteinGrams = weight * 2; // HIIT: 2 g/kg protein
        carbGrams = weight * 5; // HIIT: 5 g/kg carbs
        break;
      case 'mixed':
        proteinGrams = weight * 1.8; // Mixed: 1.8 g/kg protein
        carbGrams = weight * 5; // Mixed: 5 g/kg carbs
        break;
    }
    fatGrams = (calories - (proteinGrams * 4 + carbGrams * 4)) / 9;
  
    // 5. Hydration Recommendation
    const hydrationLiters = (weight * 0.033).toFixed(2); // 33 ml/kg
  
    // 6. Micronutrient Recommendations (Critical for Sports)
    const micronutrients = {
      VitaminC: '90mg',
      Calcium: '1000mg',
      Iron: gender === 'male' ? '8mg' : '18mg',
      Magnesium: gender === 'male' ? '400mg' : '310mg',
      Potassium: '4700mg',
      Sodium: '1500-2300mg',
      Zinc: gender === 'male' ? '11mg' : '8mg',
      VitaminD: '15mcg',
    };
  
    // 7. Display Results
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = `
      <h2>Results</h2>
      <p><strong>Total Calories:</strong> ${calories.toFixed(2)} kcal</p>
      <p><strong>Protein:</strong> ${proteinGrams.toFixed(2)} g</p>
      <p><strong>Carbohydrates:</strong> ${carbGrams.toFixed(2)} g</p>
      <p><strong>Fat:</strong> ${fatGrams.toFixed(2)} g</p>
      <p><strong>Hydration:</strong> ${hydrationLiters} liters/day</p>
      <h3>Micronutrient Recommendations:</h3>
      <ul>
        <li><strong>Vitamin C:</strong> ${micronutrients.VitaminC}</li>
        <li><strong>Calcium:</strong> ${micronutrients.Calcium}</li>
        <li><strong>Iron:</strong> ${micronutrients.Iron}</li>
        <li><strong>Magnesium:</strong> ${micronutrients.Magnesium}</li>
        <li><strong>Potassium:</strong> ${micronutrients.Potassium}</li>
        <li><strong>Sodium:</strong> ${micronutrients.Sodium}</li>
        <li><strong>Zinc:</strong> ${micronutrients.Zinc}</li>
        <li><strong>Vitamin D:</strong> ${micronutrients.VitaminD}</li>
      </ul>
    `;
  });
  