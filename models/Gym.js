const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    ID: Number,
    userName: String,
    email: { type: String, unique: true},
    password: String,
    phone: String,
    age: Number,
    attendance:Boolean,
    qrCode: {
        type: String, // This will store the base64 encoded QR code image
        default: ''
    },
    sex: String,
    height: Number,
    weight: Number,
    registeredDate: String,
    paymentDate: String,
    monthlyAttendance: [{
            month: String,
            daysAttended: { type: Number, default: 0 },
            dateOfAttended: { type: [String], default: [] }
        }],
    paymentStatus: Boolean,
    exerciseTimePerDay: String,
    notificationTime: String,
    healthStatus: String,
    exerciseType: String,
    enteringTime: String,
    bloodType: String,
    exercises: [String],
    dailyAttendance: String,
    upComingExercise: String,
    totalTimeSpendOnGym: String,
    proteinAmountRequired: String,
    TodayNotification: { type: String, default: "Stay fit and healthy!" },
    activityLevel: { 
    type: String, 
},
    fitnessGoal: { 
        type: String, 
    },
    bodyFat: Number,
    metabolicHealth: String,
    livesInHotClimate: Boolean,
    medicalConditions: [String],
    dietaryPreferences: {
        vegetarian: Boolean,
        vegan: Boolean,
        glutenFree: Boolean,
        dairyFree: Boolean,
        halal: Boolean,
        kosher: Boolean,
        allergies: [String],
        dislikes: [String],
        preferredCuisines: [String],
        budget: String
    },
    mealFrequency: Number,
    wakeTime: String,
    sleepTime: String,
    cookingTime: String,
    supplements: [{
        name: String,
        type: {
            type: String,
            enum: ['protein', 'general', 'amino', 'creatine']
        },
        timing: {
            type: String,
            enum: ['morning', 'pre-workout', 'post-workout', 'evening']
        }
    }],
    foodPreferences: Boolean,
    exerciseTimeToday: String,
    lastUpdated: { type: Date, default: Date.now },
    nutritionHistory: [{
        date: Date,
        macros: {
            protein: Number,
            carbs: Number,
            fats: Number,
            calories: Number
        },
        foodsConsumed: [{
            name: String,
            portion: Number
        }]
    }],
    spentTimeOnGym: {
    type: Map,
    of: String,
    default: {}
  },
    membershipDetail: [{
        planName: String,
        packageLength: String,
        price: String
    }],
    bodyMeasurements: {
        waistSize: Number,
        neckSize: Number,
        hipSize: Number // Only required for females
  },
});     

const weeklySchema = new mongoose.Schema({
    Mon: { type: Number, default: 0 },
    Tue: { type: Number, default: 0 },
    Wed: { type: Number, default: 0 },
    Thu: { type: Number, default: 0 },
    Fri: { type: Number, default: 0 },
    Sat: { type: Number, default: 0 },
    Sun: { type: Number, default: 0 }
}, { _id: false }); 

const GymSchema = new mongoose.Schema({
    name: String,
    users: [userSchema],
    dailyIncome: [Number],
    dailyOutcome: [Number],
    dailyRevenue: Number,
    weeklyIncome: { type: [weeklySchema], default: [] },
    weeklyExpense: { type: [weeklySchema], default: [] },
    weeklyRevenue: { type: [weeklySchema], default: [] },
    monthlyIncome: [Number],
    monthlyExpense: [Number],
    monthlyRevenue: [Number],
    email: String,
    password: String,
    phoneNumber: String,
    registeredDate: String,
    totalUsers: Number,
    currentUsers: Number,
    location: String,
    adminNotifications: [Array],
    pricePlan: Number,
    paymentsList: [{
    date_of_payment: String,
    amount: Number,
    // ... other payment fields
  }],
    accountNumbers: [String],
    payDone: Boolean,
    serviceTermination: Boolean,
    memberShip: {
        Basic: {
            "1": { type: String, default: "" },
            "2": { type: String, default: "" },
            "3": { type: String, default: "" },
            "6": { type: String, default: "" },
            "12": { type: String, default: "" },
            services: [{ type: String }],
        },
        Plus: {
            "1": { type: String, default: "" },
            "2": { type: String, default: "" },
            "3": { type: String, default: "" },
            "6": { type: String, default: "" },
            "12": { type: String, default: "" },
            services: [{ type: String }],
        },
        Pro: {
            "1": { type: String, default: "" },
            "2": { type: String, default: "" },
            "3": { type: String, default: "" },
            "6": { type: String, default: "" },
            "12": { type: String, default: "" },
            services: [{ type: String }],
        },
    },
});

GymSchema.index({ name: 1 });
GymSchema.index({ 'users.email': 1 }, { unique: true, sparse: true });
module.exports = mongoose.model('Gymers', GymSchema);