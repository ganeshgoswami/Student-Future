import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import User from '../models/User.js';
import { uploadImage } from '../services/cloudinaryService.js';

dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || 'studentfuturesecretkey12345';
const JWT_EXPIRES = process.env.JWT_EXPIRES || '7d';

/**
 * Generate a JWT standard token
 */
const generateToken = (id) => {
  return jwt.sign({ id }, JWT_SECRET, { expiresIn: JWT_EXPIRES });
};

/**
 * Register a new student
 */
export async function registerStudent(req, res) {
  try {
    const {
      firstName,
      lastName,
      email,
      mobileNumber,
      password,
      dateOfBirth,
      gender,
      country,
      state,
      city,
      qualification,
      college,
      passingYear
    } = req.body;

    // Check if email already registered
    const emailExists = await User.findOne({ email: email.toLowerCase() });
    if (emailExists) {
      return res.status(400).json({ error: 'Email address is already registered' });
    }

    // Process Profile photo upload
    let profilePhotoUrl = '';
    if (req.file) {
      profilePhotoUrl = await uploadImage(req.file, 'profiles');
    }

    // Hash Password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create User
    const user = await User.create({
      firstName,
      lastName,
      email: email.toLowerCase(),
      mobileNumber,
      password: hashedPassword,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      country,
      state,
      city,
      qualification,
      college,
      passingYear: Number(passingYear),
      profilePhoto: profilePhotoUrl,
      role: 'student',
      status: 'active'
    });

    const token = generateToken(user._id);

    // Return response without password
    res.status(201).json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        mobileNumber: user.mobileNumber,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Registration error:", err);
    res.status(500).json({ error: `Registration failed: ${err.message}` });
  }
}

/**
 * Login User (Student or Admin)
 */
export async function loginUser(req, res) {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    if (user.status === 'suspended') {
      return res.status(403).json({ error: 'Access Denied: Your account has been suspended' });
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password credentials' });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        profilePhoto: user.profilePhoto,
        role: user.role
      }
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: `Login failed: ${err.message}` });
  }
}

/**
 * Send password reset token links
 */
export async function forgotPassword(req, res) {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      // Security best practice: don't reveal user existence
      return res.json({ success: true, message: 'If email is registered, reset link will be logged in console.' });
    }

    // Sign a temporary reset token valid for 15 minutes
    const resetToken = jwt.sign({ email: user.email }, JWT_SECRET, { expiresIn: '15m' });

    console.log(`\n================ PASSWORD RESET LINK ================`);
    console.log(`Student: ${user.firstName} ${user.lastName}`);
    console.log(`Reset Token: ${resetToken}`);
    console.log(`Client URL: http://localhost:3000/reset-password?token=${resetToken}`);
    console.log(`=====================================================\n`);

    res.json({
      success: true,
      message: 'Password reset link successfully generated. Check server console logs.'
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Reset password using token
 */
export async function resetPassword(req, res) {
  try {
    const { token, password } = req.body;

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (tokenErr) {
      return res.status(400).json({ error: 'Invalid, corrupted, or expired reset token.' });
    }

    const user = await User.findOne({ email: decoded.email });
    if (!user) {
      return res.status(404).json({ error: 'User associated with this token not found.' });
    }

    // Update password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    res.json({
      success: true,
      message: 'Password changed successfully. You can now login with your new credentials.'
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * Fetch authenticated profile details
 */
export async function getProfile(req, res) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
