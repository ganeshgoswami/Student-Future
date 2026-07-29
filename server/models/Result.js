import mongoose from 'mongoose';

const sectionPerformanceSchema = new mongoose.Schema({
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  correct: {
    type: Number,
    required: true
  },
  wrong: {
    type: Number,
    required: true
  },
  skipped: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  }
}, { _id: false });

const resultSchema = new mongoose.Schema({
  attempt: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'TestAttempt',
    required: true,
    unique: true
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  test: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true
  },
  correctCount: {
    type: Number,
    required: true
  },
  wrongCount: {
    type: Number,
    required: true
  },
  skippedCount: {
    type: Number,
    required: true
  },
  marksObtained: {
    type: Number,
    required: true
  },
  negativeMarksDeducted: {
    type: Number,
    required: true
  },
  netMarks: {
    type: Number,
    required: true
  },
  totalPossibleMarks: {
    type: Number,
    required: true
  },
  percentage: {
    type: Number,
    required: true
  },
  passFail: {
    type: String,
    enum: ['Pass', 'Fail'],
    required: true
  },
  timeTaken: {
    type: Number, // total time taken in seconds
    required: true
  },
  sectionPerformance: [sectionPerformanceSchema],
  rank: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

const Result = mongoose.model('Result', resultSchema);
export default Result;
