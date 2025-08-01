const Bill = require('../models/Bill');
const gymHouse = require('../models/Gym');

exports.uploadBill = async (req, res) => {
  try {
    const { phone_number, fileData, fileName, fileType } = req.body;

    const gym = await gymHouse.findOne({phoneNumber: phone_number});

    if (!phone_number || !fileData) {
      return res.status(400).json({ error: 'Phone number and file data are required' });
    }

    const bill = new Bill({ 
      phone_number, 
      fileData, 
      fileName,
      fileType,
      gym_name: gym.name,
      price_plan: gym.pricePlan
    });

    await bill.save();

    res.status(201).json({ 
      message: 'Bill submitted successfully', 
      bill: {
        id: bill._id,
        phone_number: bill.phone_number,
        fileName: bill.fileName,
        date_of_payment: bill.submittedAt
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};