import mongoose from 'mongoose';

const certificateSchema = new mongoose.Schema({
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
  result: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Result',
    required: true
  },
  certificateId: {
    type: String,
    required: true,
    unique: true
  },
  pdfUrl: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const Certificate = mongoose.model('Certificate', certificateSchema);
export default Certificate;
