import User from '../models/User.js';
import Question from '../models/Question.js';
import Test from '../models/Test.js';
import TestAttempt from '../models/TestAttempt.js';
import Result from '../models/Result.js';

/**
 * Get Admin Dashboard Metrics
 */
export async function getDashboardMetrics(req, res) {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalQuestions = await Question.countDocuments({});
    const totalTests = await Test.countDocuments({});
    const totalAttempts = await TestAttempt.countDocuments({});
    
    // Calculate overall Pass Percentage
    const totalResults = await Result.countDocuments({});
    const passResults = await Result.countDocuments({ passFail: 'Pass' });
    const passRate = totalResults > 0 
      ? parseFloat(((passResults / totalResults) * 100).toFixed(2)) 
      : 0;

    // Load recent completions
    const recentResults = await Result.find({})
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('student', 'firstName lastName profilePhoto')
      .populate('test', 'title');

    // Aggregate category distribution (for frontend charts)
    const questions = await Question.find({});
    const categoryCounts = {};
    questions.forEach(q => {
      categoryCounts[q.category] = (categoryCounts[q.category] || 0) + 1;
    });

    const categoryDistribution = Object.keys(categoryCounts).map(cat => ({
      name: cat,
      value: categoryCounts[cat]
    }));

    res.json({
      success: true,
      metrics: {
        totalStudents,
        totalQuestions,
        totalTests,
        totalAttempts,
        passRate,
        recentResults,
        categoryDistribution
      }
    });

  } catch (err) {
    res.status(500).json({ error: `Failed to load dashboard metrics: ${err.message}` });
  }
}

/**
 * Fetch List of all Students (Admin only)
 */
export async function getStudentsList(req, res) {
  try {
    const students = await User.find({ role: 'student' }).select('-password').sort({ createdAt: -1 });
    res.json({ success: true, students });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Suspend/Activate Student account (Admin only)
 */
export async function toggleStudentStatus(req, res) {
  try {
    const { id } = req.params;
    const student = await User.findById(id);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    student.status = student.status === 'active' ? 'suspended' : 'active';
    await student.save();

    res.json({ 
      success: true, 
      message: `Student account status successfully updated to: ${student.status}.` 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
