const Bill = require('../models/Bill');

exports.uploadBill = async (req, res) => {
  try {
    const { email, fileData, fileName, fileType } = req.body;

    if (!email || !fileData) {
      return res.status(400).json({ error: 'Email and file data are required' });
    }

    const bill = new Bill({ 
      email, 
      fileData, 
      fileName,
      fileType
    });

    await bill.save();

    res.status(201).json({ 
      message: 'Bill submitted successfully', 
      bill: {
        id: bill._id,
        email: bill.email,
        fileName: bill.fileName,
        submittedAt: bill.submittedAt
      }
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Server error' });
  }
};