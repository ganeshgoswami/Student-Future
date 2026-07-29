import Test from '../models/Test.js';
import Question from '../models/Question.js';
import TestAttempt from '../models/TestAttempt.js';
import { generateAIQuestion } from '../services/aiGenerator.js';

// Helper: Fisher-Yates Shuffling
function shuffle(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Helper: Check Array Equality (Sets)
function isAnswerEqual(a, b) {
  if (!a || !b) return false;
  if (a.length !== b.length) return false;
  const setA = new Set(a);
  return b.every(val => setA.has(val));
}

/**
 * Start a Test Attempt (Random Question Engine)
 */
export async function startAttempt(req, res) {
  try {
    const { testId } = req.body;
    const studentId = req.user._id;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ error: 'Test configuration not found' });
    }

    // 1. Attempt limits check
    const pastAttemptsCount = await TestAttempt.countDocuments({
      student: studentId,
      test: testId,
      status: 'Submitted'
    });

    if (pastAttemptsCount >= test.maxAttempts) {
      return res.status(400).json({ 
        error: `Maximum attempt limit reached. You have already completed ${pastAttemptsCount} of ${test.maxAttempts} attempts.` 
      });
    }

    // 2. Collate previously used question IDs to avoid repetitions
    const pastAttempts = await TestAttempt.find({
      student: studentId,
      test: testId
    });

    const usedQuestionIds = new Set();
    pastAttempts.forEach(att => {
      att.questions.forEach(q => usedQuestionIds.add(q.question.toString()));
    });

    const attemptQuestions = [];

    // 3. Section by section random question generation with real-time AI creation
    for (const section of test.sections) {
      const sectionSelection = [];
      
      // We will generate brand new questions using AI on-the-fly!
      for (let i = 0; i < section.totalQuestions; i++) {
        try {
          // Select difficulty dynamically or default to Medium
          const difficulty = ['Easy', 'Medium', 'Hard'][Math.floor(Math.random() * 3)];
          const aiQuestion = await generateAIQuestion(section.category, difficulty);
          sectionSelection.push(aiQuestion);
        } catch (err) {
          console.error("AI question generation failed, falling back to db candidates:", err);
          // Fallback to database candidates if AI fails
          const candidates = await Question.find({ category: section.category, status: 'Active' });
          if (candidates.length > 0) {
            const randomCandidate = candidates[Math.floor(Math.random() * candidates.length)];
            sectionSelection.push(randomCandidate);
          }
        }
      }

      if (sectionSelection.length === 0) {
        return res.status(400).json({ error: `No active or AI questions generated for category: ${section.category}` });
      }

      // Shuffle question sequence if required
      const finalSectionQuestions = section.randomQuestions ? shuffle(sectionSelection) : sectionSelection;

      // Shuffle option order for each question
      finalSectionQuestions.forEach(q => {
        const optionIds = q.options.map(o => o.id);
        const shuffledOptions = shuffle(optionIds);
        
        attemptQuestions.push({
          question: q._id,
          sectionId: section._id,
          shuffledOptions
        });
      });
    }

    // 4. Create and save the attempt Mongoose document
    const attempt = await TestAttempt.create({
      student: studentId,
      test: testId,
      status: 'InProgress',
      questions: attemptQuestions,
      answers: {}
    });

    // Populate default answer records
    attemptQuestions.forEach(q => {
      attempt.answers.set(q.question.toString(), {
        selectedOptionIds: [],
        timeTaken: 0,
        visited: false,
        answered: false,
        markedForReview: false,
        skipped: false,
        answerChangedCount: 0
      });
    });
    await attempt.save();

    res.status(201).json({ success: true, attemptId: attempt._id });

  } catch (err) {
    console.error("Start attempt error:", err);
    res.status(500).json({ error: `Failed to initialize test attempt: ${err.message}` });
  }
}

/**
 * Get Attempt State (Securely shuffles options and strips answers during exam)
 */
export async function getAttempt(req, res) {
  try {
    const { id } = req.params;
    const studentId = req.user._id;

    const attempt = await TestAttempt.findById(id).populate('test');
    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    // Verify ownership
    if (attempt.student.toString() !== studentId.toString() && req.user.role !== 'admin' && req.user.role !== 'superadmin') {
      return res.status(403).json({ error: 'Access denied to this attempt' });
    }

    // Reconstruct list of questions securely
    const secureQuestions = [];
    for (const sq of attempt.questions) {
      const q = await Question.findById(sq.question);
      if (!q) continue;

      // Re-order option list matching attempt's shuffledOptions mapping
      const orderedOptions = sq.shuffledOptions
        .map(optId => q.options.find(o => o.id === optId))
        .filter(Boolean);

      const secureQ = {
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
        sectionId: sq.sectionId
      };

      // Expose answer/explanation fields ONLY if submitted
      if (attempt.status !== 'InProgress') {
        secureQ.correctAnswer = q.correctAnswer;
        secureQ.explanation = q.explanation;
      }

      secureQuestions.push(secureQ);
    }

    res.json({
      success: true,
      attempt,
      questions: secureQuestions
    });

  } catch (err) {
    res.status(500).json({ error: `Failed to retrieve test state: ${err.message}` });
  }
}

/**
 * Save Student Answer (telemetry on option clicks, visits, timer ticks)
 */
export async function saveAnswer(req, res) {
  try {
    const { id } = req.params;
    const { questionId, selectedOptionIds, timeTaken, visited, answered, markedForReview, skipped } = req.body;
    const studentId = req.user._id;

    const attempt = await TestAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ error: 'Test attempt not found' });
    }

    if (attempt.status !== 'InProgress') {
      return res.status(400).json({ error: 'Cannot save answers: Test attempt has already been submitted.' });
    }

    if (attempt.student.toString() !== studentId.toString()) {
      return res.status(403).json({ error: 'Unauthorized attempt access.' });
    }

    const prevAns = attempt.answers.get(questionId) || { selectedOptionIds: [], timeTaken: 0, answerChangedCount: 0 };
    const prevSelected = prevAns.selectedOptionIds || [];
    const nextSelected = selectedOptionIds || [];

    // Track answer changed count
    let changeInc = 0;
    if (prevSelected.length > 0 && !isAnswerEqual(prevSelected, nextSelected)) {
      changeInc = 1;
    }

    attempt.answers.set(questionId, {
      selectedOptionIds: nextSelected,
      timeTaken: (prevAns.timeTaken || 0) + (Number(timeTaken) || 0),
      visited: visited !== undefined ? visited : prevAns.visited,
      answered: answered !== undefined ? answered : (nextSelected.length > 0),
      markedForReview: markedForReview !== undefined ? markedForReview : prevAns.markedForReview,
      skipped: skipped !== undefined ? skipped : (nextSelected.length === 0),
      answerChangedCount: (prevAns.answerChangedCount || 0) + changeInc
    });

    attempt.markModified('answers');
    await attempt.save();

    res.json({ success: true, answerState: attempt.answers.get(questionId) });

  } catch (err) {
    res.status(500).json({ error: `Save answer telemetry failed: ${err.message}` });
  }
}
