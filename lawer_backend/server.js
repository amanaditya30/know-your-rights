// A simple backend server using Node.js and Express
// You will need to install the following packages:
// npm install express multer cors

// 1. Import necessary packages
const express = require('express');
const multer = require('multer'); // 'multer' is a middleware for handling multipart/form-data, which is used for file uploads.
const cors = require('cors'); // 'cors' allows your frontend app to make requests to this backend.
const path = require('path');

// 2. Set up the Express app
const app = express();
const PORT = 5001; // This port matches the one you specified in your React Native code.

// 3. Configure Middleware
app.use(cors());
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: true })); // For parsing application/x-www-form-urlencoded

// 4. Configure Multer for file uploads
// 'diskStorage' allows you to control where the files are stored and how they are named.
const storage = multer.diskStorage({
  // Specify the destination folder for uploaded files.
  // We're creating a 'uploads' folder in the same directory as this server file.
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  // Customize the filename to avoid overwriting files.
  // This uses the original filename and adds a timestamp.
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// 5. Create the registration endpoint
// This handles the POST request from your React Native app.
// 'upload.fields' specifies the names of the file fields you expect.
app.post('/lawyers/register', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'barIdCard', maxCount: 1 },
  { name: 'enrollmentCertificate', maxCount: 1 },
  { name: 'govtId', maxCount: 1 }
]), async (req, res) => {
  try {
    // req.body contains all the text data from the form.
    const { fullName, email, password, contactNumber, barEnrollmentNumber, stateBarCouncil, enrollmentYear, cityOfPractice, stateOfPractice, bio } = req.body;

    // req.files contains the uploaded files.
    const profilePicture = req.files['profilePicture'] ? req.files['profilePicture'][0] : null;
    const barIdCard = req.files['barIdCard'] ? req.files['barIdCard'][0] : null;
    const enrollmentCertificate = req.files['enrollmentCertificate'] ? req.files['enrollmentCertificate'][0] : null;
    const govtId = req.files['govtId'] ? req.files['govtId'][0] : null;

    // TODO: Add logic here to save the text data to a database.
    // For example, using Mongoose for MongoDB or a different ORM for SQL.
    console.log('Received registration request for:', fullName);
    console.log('Text data:', req.body);
    console.log('File data:', {
      profilePicture: profilePicture ? profilePicture.path : 'None',
      barIdCard: barIdCard ? barIdCard.path : 'None',
      enrollmentCertificate: enrollmentCertificate ? enrollmentCertificate.path : 'None',
      govtId: govtId ? govtId.path : 'None',
    });

    // TODO: Implement verification logic.
    // For now, let's assume the registration is successful.
    res.status(200).json({ success: true, message: 'Registration data and files received successfully. Awaiting approval.' });

  } catch (error) {
    console.error('Error during registration:', error);
    res.status(500).json({ success: false, message: 'An internal server error occurred.' });
  }
});

// 6. Start the server
app.listen(PORT, () => {
  console.log(`Backend server is running on http://localhost:${PORT}`);
});
