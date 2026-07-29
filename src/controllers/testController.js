import { db } from '../db/jsonDb.js';
import { generateTestPaper, calculateAttemptResult, calculateAttemptRank, isCorrectAnswer } from '../engine/testEngine.js';

export async function getStudents(req, res) {
  try {
    const students = await db.getStudents();
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getTests(req, res) {
  try {
    const tests = await db.getTests();
    res.json(tests);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getQuestions(req, res) {
  try {
    const questions = await db.getQuestions();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function startAttempt(req, res) {
  const { studentId, testId } = req.body;
  if (!studentId || !testId) {
    return res.status(400).json({ error: "studentId and testId are required" });
  }

  try {
    const attempt = await generateTestPaper(studentId, testId);
    res.json(attempt);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAttempt(req, res) {
  const { id } = req.params;
  try {
    const attempt = await db.getAttempt(id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    const test = await db.getTest(attempt.testId);
    if (!test) return res.status(404).json({ error: "Test template not found" });

    // Build questions list tailored for student state (respecting option shuffling and security)
    const secureQuestions = [];
    for (const sq of attempt.questions) {
      const q = await db.getQuestion(sq.id);
      if (!q) continue;

      // Re-order options according to the stored shuffle mapping
      const orderedOptions = sq.shuffledOptions
        .map(optId => q.options.find(o => o.id === optId))
        .filter(Boolean);

      const secureQ = {
        id: q.id,
        text: q.text,
        image: q.image,
        category: q.category,
        subCategory: q.subCategory,
        difficulty: q.difficulty,
        type: q.type,
        options: orderedOptions, // Shuffled options served here
        marks: q.marks,
        negativeMarks: q.negativeMarks,
        sectionId: sq.sectionId
      };

      // Expose answer-related fields ONLY if already submitted
      if (attempt.status === "Submitted") {
        secureQ.correctAnswer = q.correctAnswer;
        secureQ.explanation = q.explanation;
      }

      secureQuestions.push(secureQ);
    }

    res.json({
      attempt,
      test,
      questions: secureQuestions
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function saveAnswer(req, res) {
  const { id } = req.params;
  const { questionId, selectedOptionIds, timeTaken, visited, answered, markedForReview, skipped } = req.body;

  if (!questionId) {
    return res.status(400).json({ error: "questionId is required" });
  }

  try {
    const attempt = await db.getAttempt(id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status === "Submitted") {
      return res.status(400).json({ error: "Cannot save answer: attempt already submitted" });
    }

    const prevAns = attempt.answers[questionId] || { selectedOptionIds: [] };
    const prevSel = prevAns.selectedOptionIds || [];
    const nextSel = selectedOptionIds || [];

    // Answer changed count tracking logic:
    // We increment if the student had already selected an answer previously, 
    // and now selects a different non-empty answer.
    let changedIncrement = 0;
    if (prevSel.length > 0 && !isCorrectAnswer(prevSel, nextSel)) {
      changedIncrement = 1;
    }

    const updatedAnswers = { ...attempt.answers };
    updatedAnswers[questionId] = {
      selectedOptionIds: nextSel,
      timeTaken: (prevAns.timeTaken || 0) + (timeTaken || 0),
      visited: visited !== undefined ? visited : prevAns.visited,
      answered: answered !== undefined ? answered : (nextSel.length > 0),
      markedForReview: markedForReview !== undefined ? markedForReview : prevAns.markedForReview,
      skipped: skipped !== undefined ? skipped : (nextSel.length === 0),
      answerChangedCount: (prevAns.answerChangedCount || 0) + changedIncrement
    };

    // Auto-update section and total validation counters
    const updatedAttempt = await db.updateAttempt(id, {
      answers: updatedAnswers,
      updatedAt: new Date().toISOString()
    });

    res.json({ success: true, answerState: updatedAttempt.answers[questionId] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function submitAttempt(req, res) {
  const { id } = req.params;
  const { timeTaken } = req.body; // Final time taken from client timer

  try {
    const attempt = await db.getAttempt(id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status === "Submitted") {
      return res.status(400).json({ error: "Attempt already submitted" });
    }

    // Process result calculation and mark as submitted
    const finalAttemptState = await calculateAttemptResult(id, timeTaken);
    
    // Fetch ranking
    const ranking = await calculateAttemptRank(finalAttemptState.testId, finalAttemptState.id);

    res.json({
      success: true,
      attempt: finalAttemptState,
      rankInfo: ranking
    });
  } catch (err) {
    // If validation fails (e.g. exceeds optional limit), returns 400
    res.status(400).json({ error: err.message });
  }
}

export async function getAttemptResults(req, res) {
  const { id } = req.params;
  try {
    const attempt = await db.getAttempt(id);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });
    if (attempt.status !== "Submitted") {
      return res.status(400).json({ error: "Results not available: attempt in-progress" });
    }

    const test = await db.getTest(attempt.testId);
    const ranking = await calculateAttemptRank(attempt.testId, attempt.id);

    // Reconstruct detailed questions list with answers exposed
    const questionsWithAnswers = [];
    for (const sq of attempt.questions) {
      const q = await db.getQuestion(sq.id);
      if (!q) continue;

      // Match correct options with option array sequence
      const orderedOptions = sq.shuffledOptions
        .map(optId => q.options.find(o => o.id === optId))
        .filter(Boolean);

      questionsWithAnswers.push({
        id: q.id,
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
      attempt,
      test,
      questions: questionsWithAnswers,
      rankInfo: ranking
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getDashboardStats(req, res) {
  try {
    const allAttempts = await db.getAttempts();
    const tests = await db.getTests();
    const students = await db.getStudents();
    const questions = await db.getQuestions();

    const submittedAttempts = allAttempts.filter(a => a.status === "Submitted");

    // Group leaderboard by test
    const leaderboards = {};
    tests.forEach(test => {
      const testSubmitted = submittedAttempts.filter(a => a.testId === test.id);
      testSubmitted.sort((a, b) => {
        const marksA = a.results?.netMarks || 0;
        const marksB = b.results?.netMarks || 0;
        if (marksB !== marksA) {
          return marksB - marksA;
        }
        return (a.results?.timeTaken || 999999) - (b.results?.timeTaken || 999999);
      });

      leaderboards[test.id] = testSubmitted.map((a, idx) => ({
        rank: idx + 1,
        studentName: a.studentName,
        netMarks: a.results.netMarks,
        totalPossibleMarks: a.results.totalPossibleMarks,
        percentage: a.results.percentage,
        timeTaken: a.results.timeTaken,
        passFail: a.results.passFail,
        submittedAt: a.updatedAt
      }));
    });

    // Subject/Category count
    const subjectStats = {};
    questions.forEach(q => {
      subjectStats[q.category] = (subjectStats[q.category] || 0) + 1;
    });

    res.json({
      totalQuestions: questions.length,
      totalTests: tests.length,
      totalStudents: students.length,
      totalAttempts: allAttempts.length,
      leaderboards,
      subjectStats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

// Add/Create question endpoint
export async function createQuestion(req, res) {
  const { text, category, subCategory, difficulty, type, options, correctAnswer, explanation, marks, negativeMarks } = req.body;
  
  if (!text || !category || !difficulty || !type || !options || !correctAnswer) {
    return res.status(400).json({ error: "Missing required question fields." });
  }

  if (!Array.isArray(options) || options.length < 4 || options.length > 5) {
    return res.status(400).json({ error: "Options must be an array of size between 4 and 5." });
  }

  if (!Array.isArray(correctAnswer) || correctAnswer.length === 0) {
    return res.status(400).json({ error: "correctAnswer must be a non-empty array of Option IDs." });
  }

  try {
    const questions = await db.getQuestions();
    // Generate new unique ID
    const maxIdNum = questions.reduce((max, q) => {
      const match = q.id.match(/\d+/);
      if (match) {
        const num = parseInt(match[0]);
        return num > max ? num : max;
      }
      return max;
    }, 0);
    const newId = `Q${maxIdNum + 1}`;

    const newQuestion = {
      id: newId,
      text,
      category,
      subCategory: subCategory || "General",
      difficulty,
      type,
      options,
      correctAnswer: correctAnswer.map(Number),
      explanation: explanation || "No explanation provided.",
      marks: Number(marks) || 2,
      negativeMarks: Number(negativeMarks) || 0,
      language: "English",
      status: "Active",
      createdBy: "Admin",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    await db.addQuestion(newQuestion);
    res.status(201).json(newQuestion);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
