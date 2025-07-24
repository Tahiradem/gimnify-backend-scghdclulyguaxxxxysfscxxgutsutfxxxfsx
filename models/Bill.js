const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  email: {
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
  submittedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Bill', billSchema);