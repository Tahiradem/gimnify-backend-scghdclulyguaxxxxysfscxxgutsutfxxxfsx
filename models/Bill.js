const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  phone_number: {
    type: String,
    required: true
  },
  fileData: {
    type: String, // This will store the Base64 string
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  date_of_payment: {
    type: Date,
    default: Date.now
  },
  gym_name:{
    type: String,
  },
  price_plan:{
    type:String,
  }
});

module.exports = mongoose.model('Bill', billSchema);