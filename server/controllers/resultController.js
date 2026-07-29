import TestAttempt from '../models/TestAttempt.js';
import Test from '../models/Test.js';
import Question from '../models/Question.js';
import Result from '../models/Result.js';
import Certificate from '../models/Certificate.js';
import User from '../models/User.js';
import { generateCertificatePDF } from '../services/pdfService.js';

// Helper: Check Array Set Equality
function isAnswerEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every(val => setA.has(val));
}

/**
 * Submit Test Attempt (Scoring, Dynamic Ranks, Certificate triggers)
 */
export async function submitAttempt(req, res) {
  try {
    const { id } = req.params;
    const { timeTaken } = req.body; // Total time taken in seconds from front-end
    const studentId = req.user._id;

    const attempt = await TestAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    if (attempt.status !== 'InProgress') {
      return res.status(400).json({ error: 'Test attempt has already been submitted.' });
    }

    if (attempt.student.toString() !== studentId.toString()) {
      return res.status(403).json({ error: 'Unauthorized attempt access.' });
    }

    const test = await Test.findById(attempt.test);
    if (!test) {
      return res.status(404).json({ error: 'Test configuration template not found' });
    }

    // 1. Backend validation of optional questions answering quotas
    const sectionPerformance = [];
    const optionalAnswerCount = {};

    for (const section of test.sections) {
      const sectionQuestions = attempt.questions.filter(q => q.sectionId.toString() === section._id.toString());
      let answeredCount = 0;

      sectionQuestions.forEach(sq => {
        const ans = attempt.answers.get(sq.question.toString());
        if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
          answeredCount++;
        }
      });

      optionalAnswerCount[section._id.toString()] = answeredCount;

      if (answeredCount > section.answerRequired) {
        return res.status(400).json({ 
          error: `Validation Failed: Section "${section.name}" has ${answeredCount} answered questions, exceeding the optional limit of ${section.answerRequired}. Please clear choices before submitting.`
        });
      }

      // Initialize performance storage
      sectionPerformance.push({
        sectionId: section._id,
        name: section.name,
        correct: 0,
        wrong: 0,
        skipped: 0,
        marksObtained: 0
      });
    }

    // 2. Grading calculations
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;
    let totalMarksObtained = 0;
    let totalNegativeMarks = 0;

    for (const sq of attempt.questions) {
      const question = await Question.findById(sq.question);
      const ans = attempt.answers.get(sq.question.toString());
      const sectionPerf = sectionPerformance.find(p => p.sectionId.toString() === sq.sectionId.toString());

      if (!question) continue;

      const isAnswered = ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0;

      if (!isAnswered) {
        skippedCount++;
        sectionPerf.skipped++;
        if (ans) {
          ans.skipped = true;
          ans.answered = false;
        }
        continue;
      }

      // Compare choices
      const correct = isAnswerEqual(ans.selectedOptionIds, question.correctAnswer);
      if (correct) {
        correctCount++;
        sectionPerf.correct++;
        const earned = question.marks || 2;
        totalMarksObtained += earned;
        sectionPerf.marksObtained += earned;
        if (ans) {
          ans.answered = true;
          ans.skipped = false;
        }
      } else {
        wrongCount++;
        sectionPerf.wrong++;
        const loss = question.negativeMarks || 0.5;
        totalNegativeMarks += loss;
        sectionPerf.marksObtained -= loss;
        if (ans) {
          ans.answered = true;
          ans.skipped = false;
        }
      }
    }

    const netMarks = parseFloat((totalMarksObtained - totalNegativeMarks).toFixed(2));

    // Determine Total Possible Marks (Sum of highest value allowed questions)
    let totalPossibleMarks = 0;
    for (const section of test.sections) {
      const sectionQuestions = attempt.questions.filter(q => q.sectionId.toString() === section._id.toString());
      const questionDetails = [];
      for (const sq of sectionQuestions) {
        const q = await Question.findById(sq.question);
        if (q) questionDetails.push(q);
      }
      // Sort descending by marks
      questionDetails.sort((a, b) => b.marks - a.marks);
      const topK = questionDetails.slice(0, section.answerRequired);
      const sectionMax = topK.reduce((sum, q) => sum + q.marks, 0);
      totalPossibleMarks += sectionMax;
    }

    const percentage = totalPossibleMarks > 0 
      ? parseFloat(((netMarks / totalPossibleMarks) * 100).toFixed(2)) 
      : 0;

    const passFail = percentage >= test.passingPercentage ? 'Pass' : 'Fail';

    // 3. Mark attempt as submitted
    attempt.status = 'Submitted';
    attempt.markModified('answers');
    await attempt.save();

    // 4. Save initial scorecard in Result collection
    let result = await Result.create({
      attempt: attempt._id,
      student: studentId,
      test: test._id,
      correctCount,
      wrongCount,
      skippedCount,
      marksObtained: totalMarksObtained,
      negativeMarksDeducted: totalNegativeMarks,
      netMarks,
      totalPossibleMarks,
      percentage,
      passFail,
      timeTaken: Number(timeTaken) || 0,
      sectionPerformance,
      rank: 0 // placeholder
    });

    // 5. Update rankings for this test dynamically
    const allResults = await Result.find({ test: test._id }).sort({ netMarks: -1, timeTaken: 1 });
    let finalUserRank = 0;
    for (let i = 0; i < allResults.length; i++) {
      allResults[i].rank = i + 1;
      await allResults[i].save();
      if (allResults[i]._id.toString() === result._id.toString()) {
        finalUserRank = i + 1;
      }
    }
    result.rank = finalUserRank;

    // 6. Generate certificate PDF if student passed
    let certificate = null;
    if (passFail === 'Pass') {
      const student = await User.findById(studentId);
      const certificateId = `CERT-${test._id.toString().substring(18)}-${student.lastName.substring(0,3).toUpperCase()}-${Math.floor(10000 + Math.random() * 90000)}`;
      
      try {
        const pdfUrl = await generateCertificatePDF(student, test, result, certificateId);
        
        certificate = await Certificate.create({
          student: studentId,
          test: test._id,
          result: result._id,
          certificateId,
          pdfUrl
        });
      } catch (pdfErr) {
        console.error("Failed to generate PDF Certificate:", pdfErr);
        // Do not crash the submission: let the result save succeed
      }
    }

    res.json({
      success: true,
      result,
      certificate
    });

  } catch (err) {
    console.error("Submit test attempt error:", err);
    res.status(500).json({ error: `Submission failed: ${err.message}` });
  }
}

/**
 * Get results and solutions of a completed attempt
 */
export async function getAttemptResults(req, res) {
  try {
    const { id } = req.params; // attempt ID
    const studentId = req.user._id;

    const attempt = await TestAttempt.findById(id).populate('test');
    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    if (attempt.status !== 'Submitted') {
      return res.status(400).json({ error: 'Scorecard not generated: Test attempt is still in-progress.' });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied.' });
    }

    const result = await Result.findOne({ attempt: attempt._id });
    const certificate = await Certificate.findOne({ result: result?._id });

    // Reconstruct questions including correct answers and explanations
    const solutions = [];
    for (const sq of attempt.questions) {
      const q = await Question.findById(sq.question);
      if (!q) continue;

      const orderedOptions = sq.shuffledOptions
        .map(optId => q.options.find(o => o.id === optId))
        .filter(Boolean);

      solutions.push({
        _id: q._id,
        text: q.text,
        image: q.image,
        category: q.category,
        subCategory: q.subCategory,
        difficulty: q.difficulty,
        type: q.type,
        options: orderedOptions,
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        sectionId: sq.sectionId
      });
    }

    res.json({
      success: true,
      attempt,
      result,
      certificate,
      questions: solutions
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get Leaderboard (Daily, Weekly, Monthly, Overall)
 */
export async function getLeaderboard(req, res) {
  try {
    const { testId, type = 'overall' } = req.query;

    const filter = {};
    if (testId) {
      filter.test = testId;
    }

    const now = new Date();
    if (type === 'daily') {
      filter.createdAt = { $gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) };
    } else if (type === 'weekly') {
      filter.createdAt = { $gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) };
    } else if (type === 'monthly') {
      filter.createdAt = { $gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) };
    }

    // Load top scores
    const topResults = await Result.find(filter)
      .sort({ netMarks: -1, timeTaken: 1 })
      .limit(20)
      .populate('student', 'firstName lastName profilePhoto college')
      .populate('test', 'title');

    const formatted = topResults.map((r, idx) => ({
      rank: idx + 1,
      studentName: `${r.student?.firstName || 'Unknown'} ${r.student?.lastName || 'Student'}`,
      profilePhoto: r.student?.profilePhoto || '',
      college: r.student?.college || '',
      testTitle: r.test?.title || 'Unknown Test',
      netMarks: r.netMarks,
      totalPossibleMarks: r.totalPossibleMarks,
      percentage: r.percentage,
      timeTaken: r.timeTaken,
      passFail: r.passFail,
      date: r.createdAt
    }));

    res.json({ success: true, leaderboard: formatted });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get results matching active student session
 */
export async function getMyResults(req, res) {
  try {
    const studentId = req.user._id;
    const results = await Result.find({ student: studentId })
      .sort({ createdAt: -1 })
      .populate('test', 'title');
    res.json({ success: true, results });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

/**
 * Get certificates matching active student session
 */
export async function getMyCertificates(req, res) {
  try {
    const studentId = req.user._id;
    const certificates = await Certificate.find({ student: studentId })
      .populate('test', 'title')
      .populate('result', 'percentage netMarks totalPossibleMarks');
    res.json({ success: true, certificates });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
