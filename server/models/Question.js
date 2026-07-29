import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  hindiText: {
    type: String,
    default: ''
  }
}, { _id: false });

const questionSchema = new mongoose.Schema({
  text: {
    type: String,
    required: [true, 'Question text is required'],
    trim: true
  },
  hindiText: {
    type: String,
    default: ''
  },
  image: {
    type: String,
    default: ''
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: [
      'Quantitative Aptitude',
      'Reasoning Ability',
      'English',
      'General Knowledge',
      'Computer Awareness',
      'Science'
    ]
  },
  subCategory: {
    type: String,
    required: [true, 'Subcategory is required'],
    trim: true
  },
  difficulty: {
    type: String,
    required: [true, 'Difficulty is required'],
    enum: ['Easy', 'Medium', 'Hard']
  },
  type: {
    type: String,
    required: [true, 'Question type is required'],
    enum: ['MCQ', 'Multiple Correct']
  },
  options: {
    type: [optionSchema],
    validate: {
      validator: function (val) {
        return val.length >= 4 && val.length <= 5;
      },
      message: 'Options must contain between 4 and 5 options'
    }
  },
  correctAnswer: {
    type: [Number], // Array of option IDs
    required: [true, 'Correct answer option ID(s) is required'],
    validate: {
      validator: function (val) {
        return val.length > 0;
      },
      message: 'Correct answer list cannot be empty'
    }
  },
  explanation: {
    type: String,
    default: ''
  },
  marks: {
    type: Number,
    required: true,
    default: 2
  },
  negativeMarks: {
    type: Number,
    required: true,
    default: 0.5
  },
  language: {
    type: String,
    default: 'English'
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  isAIGenerated: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const Question = mongoose.model('Question', questionSchema);
export default Question;
