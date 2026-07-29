import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true
  },
  mobileNumber: {
    type: String,
    required: [true, 'Mobile number is required'],
    trim: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  },
  dateOfBirth: {
    type: Date,
    required: [true, 'Date of birth is required']
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: [true, 'Gender is required']
  },
  country: {
    type: String,
    required: [true, 'Country is required']
  },
  state: {
    type: String,
    required: [true, 'State is required']
  },
  city: {
    type: String,
    required: [true, 'City is required']
  },
  qualification: {
    type: String,
    required: [true, 'Qualification is required']
  },
  college: {
    type: String,
    required: [true, 'College is required']
  },
  passingYear: {
    type: Number,
    required: [true, 'Passing year is required']
  },
  profilePhoto: {
    type: String,
    default: '' // Cloudinary URL string or empty
  },
  role: {
    type: String,
    enum: ['student', 'admin', 'superadmin'],
    default: 'student'
  },
  status: {
    type: String,
    enum: ['active', 'suspended'],
    default: 'active'
  }
}, {
  timestamps: true
});

const User = mongoose.model('User', userSchema);
export default User;
