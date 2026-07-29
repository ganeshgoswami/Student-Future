import mongoose from 'mongoose';

const attemptQuestionSchema = new mongoose.Schema({
  question: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Question',
    required: true
  },
  sectionId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  shuffledOptions: {
    type: [Number], // Sequence of option IDs shuffled, e.g. [3, 1, 4, 2]
    required: true
  }
}, { _id: false });

const studentAnswerSchema = new mongoose.Schema({
  selectedOptionIds: {
    type: [Number],
    default: []
  },
  timeTaken: {
    type: Number,
    default: 0
  },
  visited: {
    type: Boolean,
    default: false
  },
  answered: {
    type: Boolean,
    default: false
  },
  markedForReview: {
    type: Boolean,
    default: false
  },
  skipped: {
    type: Boolean,
    default: false
  },
  answerChangedCount: {
    type: Number,
    default: 0
  }
}, { _id: false });

const testAttemptSchema = new mongoose.Schema({
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
  status: {
    type: String,
    enum: ['InProgress', 'Submitted', 'TimedOut'],
    default: 'InProgress'
  },
  questions: [attemptQuestionSchema],
  answers: {
    type: Map,
    of: studentAnswerSchema,
    default: {}
  }
}, {
  timestamps: true
});

const TestAttempt = mongoose.model('TestAttempt', testAttemptSchema);
export default TestAttempt;
