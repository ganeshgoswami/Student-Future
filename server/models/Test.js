import mongoose from 'mongoose';

const testSectionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Section name is required'],
    trim: true
  },
  category: {
    type: String,
    required: [true, 'Section category is required'],
    enum: [
      'Quantitative Aptitude',
      'Reasoning Ability',
      'English',
      'General Knowledge',
      'Computer Awareness',
      'Science'
    ]
  },
  totalQuestions: {
    type: Number,
    required: [true, 'Total questions to be generated in section is required']
  },
  answerRequired: {
    type: Number,
    required: [true, 'Required optional answer count is required']
  },
  randomQuestions: {
    type: Boolean,
    default: true
  }
}, { _id: true });

const testSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Test name is required'],
    trim: true
  },
  description: {
    type: String,
    default: ''
  },
  sections: [testSectionSchema],
  durationMinutes: {
    type: Number,
    required: [true, 'Duration in minutes is required']
  },
  passingPercentage: {
    type: Number,
    required: true,
    default: 45
  },
  negativeMarking: {
    type: Boolean,
    default: true
  },
  randomQuestions: {
    type: Boolean,
    default: true
  },
  maxAttempts: {
    type: Number,
    required: true,
    default: 3
  },
  examType: {
    type: String,
    enum: ['CGL', 'CHSL', 'MTS', 'GD', 'Practice'],
    default: 'Practice'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

const Test = mongoose.model('Test', testSchema);
export default Test;
