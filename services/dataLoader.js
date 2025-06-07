const fs = require('fs');
const path = require('path');
const logger = require('../config/logger');

// Cache for food data to reduce I/O
let foodDataCache = null;
let lastFoodDataUpdate = null;

// Enhanced data loader with caching
const loadJSONData = (filename) => {
    try {
        const filePath = path.join(__dirname, '..', filename);
        const stats = fs.statSync(filePath);
        
        // Use cache if data is fresh (updated within last 5 minutes)
        if (filename === 'foods.json' && foodDataCache && lastFoodDataUpdate && 
            (new Date() - lastFoodDataUpdate) < 300000) {
            logger.info(`Using cached data for ${filename}`);
            return foodDataCache;
        }

        const data = fs.readFileSync(filePath, 'utf8');
        const parsedData = JSON.parse(data);
        
        if (filename === 'foods.json') {
            foodDataCache = parsedData;
            lastFoodDataUpdate = new Date();
        }
        
        return parsedData;
    } catch (err) {
        logger.error(`Error reading ${filename}:`, err);
        return null;
    }
};

module.exports = {
    loadJSONData
};