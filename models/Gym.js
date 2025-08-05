const mongoose = require('mongoose');

// --- User Schema ---
const userSchema = new mongoose.Schema({
  ID: Number,
  fullName: String,
  userName: { 
  type: String, 
  unique: true,
  sparse: true,
  default: null
},
  email: { type: String, unique: true },
  password: String,
  phone: String,
  profilePhoto: String,
  age: Number,
  attendance: Boolean,
  qrCode: { type: String, default: '' },
  sex: String,
  height: Number,
  weight: Number,
  registeredDate: String,
  paymentDate: String,
  phoneVerified: Boolean,
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
  activityLevel: String,
  fitnessGoal: String,
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
    type: { type: String, enum: ['protein', 'general', 'amino', 'creatine'] },
    timing: { type: String, enum: ['morning', 'pre-workout', 'post-workout', 'evening'] }
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
    hipSize: Number
  }
});

// --- Weekly Financial Schema ---
const weeklySchema = new mongoose.Schema({
  Mon: { type: Number, default: 0 },
  Tue: { type: Number, default: 0 },
  Wed: { type: Number, default: 0 },
  Thu: { type: Number, default: 0 },
  Fri: { type: Number, default: 0 },
  Sat: { type: Number, default: 0 },
  Sun: { type: Number, default: 0 }
}, { _id: false });

// --- Daily Financial Record ---
const dailyFinancialRecordSchema = new mongoose.Schema({
  income: Number,
  outcome: Number,
  revenue: Number,
  day: String
}, { _id: false });

// --- Monthly Financial Record ---
const monthlyFinancialDataSchema = new mongoose.Schema({
  days: {
    type: Map,
    of: dailyFinancialRecordSchema,
    default: {}
  }
}, { _id: false });

// --- Main Gym Schema ---
const GymSchema = new mongoose.Schema({
  // Basic Info
  name: String,
  email: { type: String, unique: true },
  password: String,
  phoneNumber: String,
  location: String,
  registeredDate: String,

  // Users
  users: [userSchema],
  totalUsers: Number,
  currentUsers: Number,

  // Financials: Daily
  dailyIncome: { type: [Number], default: [] },
  dailyOutcome: { type: [Number], default: [] },
  dailyRevenue: { type: Number, default: 0 },

  // Financials: Weekly
  weeklyIncome: { type: [weeklySchema], default: () => Array(4).fill({}) },
  weeklyExpense: { type: [weeklySchema], default: () => Array(4).fill({}) },
  weeklyRevenue: { type: [weeklySchema], default: () => Array(4).fill({}) },

  // Financials: Monthly (Using Map -> Object with nested days)
 monthlyIncome: {
        type: Object,
        default: {}
    },
    monthlyOutcome: {
        type: Object,
        default: {}
    },
    monthlyRevenue: {
        type: Object,
        default: {}
    },

  // Totals (optional for graphing)
  monthlyIncomeTotals: { type: [Number], default: [] },
  monthlyExpenseTotals: { type: [Number], default: [] },
  monthlyRevenueTotals: { type: [Number], default: [] },

  // Admin and Payments
  adminNotifications: [
  {
    type: { type: String },
    date: { type: Date },
    days_left: { type: Number }
  }
],
notificationOperator:[String],
  paymentsList: [{
    date_of_payment: String,
    amount: Number,
    paymentMethod: String,
    reference: String
  }],
  accountNumbers: [String],
  pricePlan: Number,
  payDone: Boolean,
  serviceTermination: Boolean,

  // Membership Plans
  memberShip: {
    Basic: {
      "1": { type: String, default: "" },
      "2": { type: String, default: "" },
      "3": { type: String, default: "" },
      "6": { type: String, default: "" },
      "12": { type: String, default: "" },
      services: [{ type: String }]
    },
    Plus: {
      "1": { type: String, default: "" },
      "2": { type: String, default: "" },
      "3": { type: String, default: "" },
      "6": { type: String, default: "" },
      "12": { type: String, default: "" },
      services: [{ type: String }]
    },
    Pro: {
      "1": { type: String, default: "" },
      "2": { type: String, default: "" },
      "3": { type: String, default: "" },
      "6": { type: String, default: "" },
      "12": { type: String, default: "" },
      services: [{ type: String }]
    }
  },

  // Financial Metadata
  lastFinancialUpdate: { type: Date, default: null }

}, { timestamps: true });

// --- Indexes ---
GymSchema.index({ email: 1 }, { unique: true });
GymSchema.index({ 'users.email': 1 }, { sparse: true });
GymSchema.index({ lastFinancialUpdate: 1 });

// --- Pre-save Hook ---
GymSchema.pre('save', function (next) {
  if (this.isModified('dailyIncome') || this.isModified('dailyOutcome')) {
    this.lastFinancialUpdate = new Date();
  }
  next();
});

module.exports = mongoose.model('Gymers', GymSchema);
