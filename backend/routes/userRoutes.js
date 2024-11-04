const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const authenticateToken = require('../middleware/authMiddleware');
const router = express.Router();

const multer = require('multer');
const storage = multer.memoryStorage(); // Store the image in memory as a buffer
const upload = multer({ storage });


// User Registration
router.post('/register', upload.single('picture'), async (req, res) => {
    try {
      const { name, surname, email, username, password } = req.body;
  
      // Create a new user instance
      const user = new User({
        name,
        surname,
        email,
        username,
        password,
        profilePicture: req.file ? req.file.buffer : undefined, // Save the uploaded file buffer
      });
  
      await user.save();
      res.status(201).json({ message: 'User registered successfully', user });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: error.message });
    }
  });

// User Login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) return res.status(404).json({ message: 'User not found' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET);
  res.json({ token, user });
});
// Profile route
router.get('/profile', authenticateToken, async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-password'); // Exclude password from response
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Send user data along with the success message
      res.status(200).json({
        message: 'User profile fetched successfully!',
        user: {
          name: user.name,
          email: user.email,
          profilePicture: user.profilePicture?.toString('base64'), // Encode profile picture if needed
        },
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  
  router.put('/profile', authenticateToken, async (req, res) => {
    try {
      const { name, email, password, newPassword } = req.body;
  
      const user = await User.findById(req.user.id);
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // Verify current password if provided
      if (password) {
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(401).json({ message: 'Incorrect current password' });
      }
  
      // Update user information
      if (name) user.name = name;
      if (email) user.email = email;
      if (newPassword) {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
      }
  
      await user.save();
      res.status(200).json({ message: 'Profile updated successfully', user });
    } catch (error) {
      console.error('Error updating profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

module.exports = router;
