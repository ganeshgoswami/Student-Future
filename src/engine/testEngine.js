import { db } from '../db/jsonDb.js';
import { v4 as uuidv4 } from 'uuid';

// Helper to shuffle array in-place (Fisher-Yates)
export function shuffleArray(array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

// Check set equality for option selection
export function isCorrectAnswer(selected, correct) {
  if (!Array.isArray(selected) || !Array.isArray(correct)) return false;
  if (selected.length !== correct.length) return false;
  const setS = new Set(selected);
  return correct.every(val => setS.has(val));
}

/**
 * Random Question Engine
 * Generates a customized test paper for a student, respecting shuffling,
 * uniqueness, and attempt-history constraints.
 */
export async function generateTestPaper(studentId, testId) {
  const test = await db.getTest(testId);
  if (!test) throw new Error("Test not found");

  const student = await db.getStudent(studentId);
  if (!student) throw new Error("Student not found");

  const allQuestions = await db.getQuestions();

  // Find all previous attempts by this student for this test to avoid repeating questions
  const allAttempts = await db.getAttempts();
  const studentPreviousAttempts = allAttempts.filter(
    att => att.studentId === studentId && att.testId === testId && att.status === "Submitted"
  );

  const usedQuestionIds = new Set();
  studentPreviousAttempts.forEach(att => {
    att.questions.forEach(q => usedQuestionIds.add(q.id));
  });

  const selectedQuestions = []; // Array of { id, sectionId, shuffledOptions }

  for (const section of test.sections) {
    // Filter questions by section category
    const categoryPool = allQuestions.filter(
      q => q.category.toLowerCase() === section.category.toLowerCase() && q.status === "Active"
    );

    if (categoryPool.length === 0) {
      throw new Error(`No active questions available for section category: ${section.category}`);
    }

    // Partition pool into unused and previously used questions
    const unusedQuestions = categoryPool.filter(q => !usedQuestionIds.has(q.id));
    const usedQuestions = categoryPool.filter(q => usedQuestionIds.has(q.id));

    // Shuffle both pools
    const shuffledUnused = shuffleArray(unusedQuestions);
    const shuffledUsed = shuffleArray(usedQuestions);

    // Combine: prefer unused questions first, fill up with used questions if needed
    let sectionSelectionPool = [...shuffledUnused, ...shuffledUsed];

    if (sectionSelectionPool.length < section.totalQuestions) {
      console.warn(`Not enough unique questions in pool for section "${section.name}". Available: ${sectionSelectionPool.length}, Requested: ${section.totalQuestions}. Using all available.`);
      // If we don't have enough, use whatever we have
    }

    // Slice to the requested totalQuestions
    const sectionSelected = sectionSelectionPool.slice(0, section.totalQuestions);

    // Shuffle the final selection order if section.randomQuestions is true
    const finalSectionQuestions = section.randomQuestions ? shuffleArray(sectionSelected) : sectionSelected;

    // For each selected question, shuffle the option order and record it
    finalSectionQuestions.forEach(q => {
      const optionIds = q.options.map(opt => opt.id);
      const shuffledOptions = shuffleArray(optionIds);

      selectedQuestions.push({
        id: q.id,
        sectionId: section.id,
        shuffledOptions // Store this shuffle mapping
      });
    });
  }

  // Create new attempt record
  const attempt = {
    id: `att_${uuidv4().substring(0, 8)}`,
    studentId,
    studentName: student.name,
    testId,
    testTitle: test.title,
    status: "InProgress",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    questions: selectedQuestions,
    answers: {} // Will store QuestionId -> StudentAnswer
  };

  // Pre-initialize answers dictionary for all questions
  selectedQuestions.forEach(sq => {
    attempt.answers[sq.id] = {
      selectedOptionIds: [],
      timeTaken: 0,
      visited: false,
      answered: false,
      markedForReview: false,
      skipped: false,
      answerChangedCount: 0
    };
  });

  await db.addAttempt(attempt);
  return attempt;
}

/**
 * Validates that the optional question limits are not violated.
 */
export async function validateOptionalQuestions(attempt, test) {
  const errors = [];
  const optionalAnswerCount = {};

  for (const section of test.sections) {
    const sectionQuestions = attempt.questions.filter(q => q.sectionId === section.id);
    let answeredCount = 0;

    sectionQuestions.forEach(sq => {
      const ans = attempt.answers[sq.id];
      if (ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0) {
        answeredCount++;
      }
    });

    optionalAnswerCount[section.id] = answeredCount;

    if (answeredCount > section.answerRequired) {
      errors.push(`Section "${section.name}" has ${answeredCount} answered questions, exceeding the limit of ${section.answerRequired}.`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    optionalAnswerCount
  };
}

/**
 * Result Calculation Engine
 * Computes scores, correct/wrong counts, percentages, and rank.
 */
export async function calculateAttemptResult(attemptId, forceTimeTaken = null) {
  const attempt = await db.getAttempt(attemptId);
  if (!attempt) throw new Error("Attempt not found");

  const test = await db.getTest(attempt.testId);
  if (!test) throw new Error("Test not found");

  // Validate optional limits first
  const validation = await validateOptionalQuestions(attempt, test);
  if (!validation.isValid) {
    throw new Error(`Validation Failed: ${validation.errors.join(" ")}`);
  }

  let correctCount = 0;
  let wrongCount = 0;
  let skippedCount = 0;
  let totalMarksObtained = 0;
  let totalNegativeMarks = 0;
  let calculatedTimeTaken = 0;

  for (const sq of attempt.questions) {
    const question = await db.getQuestion(sq.id);
    const ans = attempt.answers[sq.id];

    if (!question) continue;

    // Accumulate time taken per question
    if (ans) {
      calculatedTimeTaken += (ans.timeTaken || 0);
    }

    const isAnswered = ans && ans.selectedOptionIds && ans.selectedOptionIds.length > 0;

    if (!isAnswered) {
      skippedCount++;
      // Mark answer state as skipped if visited but not answered
      if (ans) {
        ans.skipped = true;
        ans.answered = false;
      }
      continue;
    }

    // Check if correct
    const correct = isCorrectAnswer(ans.selectedOptionIds, question.correctAnswer);
    if (correct) {
      correctCount++;
      totalMarksObtained += question.marks;
      if (ans) {
        ans.answered = true;
        ans.skipped = false;
      }
    } else {
      wrongCount++;
      totalNegativeMarks += (question.negativeMarks || 0);
      if (ans) {
        ans.answered = true;
        ans.skipped = false;
      }
    }
  }

  const netMarks = parseFloat((totalMarksObtained - totalNegativeMarks).toFixed(2));

  // Determine total possible marks for this attempt.
  // Formula: For each section, sum the marks of the top 'answerRequired' questions in the selected set.
  let totalPossibleMarks = 0;
  for (const section of test.sections) {
    const sectionQuestions = attempt.questions.filter(q => q.sectionId === section.id);
    const questionDetails = [];
    for (const sq of sectionQuestions) {
      const q = await db.getQuestion(sq.id);
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

  const passFail = percentage >= test.passingPercentage ? "Pass" : "Fail";

  // Performance qualitative summary
  let resultSummary = "";
  if (percentage >= 85) {
    resultSummary = "Outstanding performance! You have shown mastery across all subjects.";
  } else if (percentage >= 70) {
    resultSummary = "Great work! You scored well, but review the explanations to fine-tune your concepts.";
  } else if (percentage >= test.passingPercentage) {
    resultSummary = "Congratulations, you passed! Focus on managing your time and correcting minor errors.";
  } else {
    resultSummary = "Attempt unsuccessful. We recommend revising your weak sections and trying again.";
  }

  const timeTaken = forceTimeTaken !== null ? forceTimeTaken : calculatedTimeTaken;

  const results = {
    correct: correctCount,
    wrong: wrongCount,
    skipped: skippedCount,
    optionalAnswerCount: validation.optionalAnswerCount,
    marks: totalMarksObtained,
    negativeMarks: totalNegativeMarks,
    netMarks,
    totalPossibleMarks,
    percentage,
    passFail,
    timeTaken,
    resultSummary
  };

  // Save the result calculations in the database
  const updatedAttempt = await db.updateAttempt(attemptId, {
    status: "Submitted",
    results,
    answers: attempt.answers // Sync any modified skipped statuses
  });

  return updatedAttempt;
}

/**
 * Calculates the rank of a specific attempt among all submitted attempts for that test.
 */
export async function calculateAttemptRank(testId, attemptId) {
  const allAttempts = await db.getAttempts();
  const testAttempts = allAttempts.filter(
    att => att.testId === testId && att.status === "Submitted"
  );

  if (testAttempts.length === 0) return { rank: 1, total: 1 };

  // Sort: 1. Net Marks (descending) 2. Time Taken (ascending)
  testAttempts.sort((a, b) => {
    const marksA = a.results?.netMarks || 0;
    const marksB = b.results?.netMarks || 0;
    if (marksB !== marksA) {
      return marksB - marksA;
    }
    const timeA = a.results?.timeTaken || 999999;
    const timeB = b.results?.timeTaken || 999999;
    return timeA - timeB;
  });

  const index = testAttempts.findIndex(att => att.id === attemptId);
  const rank = index === -1 ? testAttempts.length + 1 : index + 1;

  return {
    rank,
    total: testAttempts.length
  };
}
