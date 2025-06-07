// Required modules
const express = require("express");
const nodemailer = require("nodemailer");
const mongoose = require("mongoose");
const app = express();
app.use(express.static("public"));
// MongoDB connection
const dbURI = "mongodb://localhost:27017/gimnify"; // Update with your MongoDB URI
mongoose
  .connect(dbURI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((error) => console.error("Error connecting to MongoDB:", error));

// Define Mongoose schemas and models
const userSchema = new mongoose.Schema({
  username: String,
  email: String,
  notificationTime: String,
  TodayNotification: { type: String, default: "Stay fit and healthy!" },
});

const GymSchema = new mongoose.Schema({
  name: String,
  users: [userSchema],
});

const Gym = mongoose.model("Gymers", GymSchema);

// Nodemailer configuration
const transporter = nodemailer.createTransport({
  host: "smtp-relay.sendinblue.com",
  port: 587,
  secure: false, // Use TLS
  auth: {
    user: "8094fa001@smtp-brevo.com",
    pass: "LBTAcWHDtvxJZgkP",
  },
});

const mailOptionsTemplate = {
  from: '"Gimnify App" <gimnifyapp@gmail.com>',
  subject: "Good Morning",
};



// Fetch users with notification times from the database
async function getUsersWithNotificationTime() {
  try {
    const gymHouseData = await Gym.findOne({ name: "Thunder Gym" });
    if (!gymHouseData) return [];

    return gymHouseData.users.map((user) => ({
      username: user.username,
      email: user.email,
      notificationTime: user.notificationTime,
      notificationMessage: user.TodayNotification,
    }));
  } catch (error) {
    console.error("Error fetching user data from MongoDB:", error);
    return [];
  }
}

// Send email to a specific user
function sendEmailToUser(email, message) {
  const mailOptions = {
    ...mailOptionsTemplate,
    to: email,
    html: `<p>${message}</p>`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error(`Error sending email to ${email}:`, error);
    } else {
      console.log(`Email sent to ${email}:`, info.response);
    }
  });
}

// Check and send emails to users
async function checkAndSendEmails() {
  const now = new Date();
  const currentTime = now.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });

  console.log(`Checking emails for time: ${currentTime}`);
  const users = await getUsersWithNotificationTime();

  for (const user of users) {
    if (user.notificationTime === currentTime) {
      console.log(`Sending email to ${user.username} at ${user.email}`);
      sendEmailToUser(user.email, user.notificationMessage);
    }
  }
}

// Schedule email checks every minute
setInterval(checkAndSendEmails, 60000);

// Endpoint for status check
app.get("/send_email", (req, res) => {
  res.send("Email scheduler is running, checking every minute...");
});

// Start the server
app.listen(3000, () => {
  console.log("Server is running on http://localhost:3000");
});
