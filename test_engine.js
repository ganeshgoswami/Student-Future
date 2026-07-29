import { db } from './src/db/jsonDb.js';
import { generateTestPaper, calculateAttemptResult } from './src/engine/testEngine.js';

async function runTests() {
  console.log("=========================================");
  console.log("RUNNING AUTOMATED ENGINE VERIFICATION TESTS");
  console.log("=========================================");

  await db.init();

  // Test 1: Random Question Engine Shuffling & Student Isolation
  console.log("\n[TEST 1] Starting attempt for Alice Vance on Test T1...");
  const attempt1 = await generateTestPaper("S101", "T1");
  console.log(`Generated Attempt ID: ${attempt1.id}`);
  console.log(`Total questions in attempt: ${attempt1.questions.length}`);
  
  console.log("\n[TEST 2] Starting another attempt for Bob Miller on Test T1...");
  const attempt2 = await generateTestPaper("S102", "T1");
  console.log(`Bob's Attempt ID: ${attempt2.id}`);
  
  const q1 = attempt1.questions[0];
  console.log(`Alice's Q1 ID: ${q1.id}, Option shuffle sequence: ${JSON.stringify(q1.shuffledOptions)}`);
  
  // Test 3: No repetition for consecutive attempts
  console.log("\n[TEST 3] Generating consecutive attempt for Alice on Test T1...");
  const attempt3 = await generateTestPaper("S101", "T1");
  console.log(`Alice's Second Attempt ID: ${attempt3.id}`);
  
  const qIds1 = attempt1.questions.map(q => q.id);
  const qIds3 = attempt3.questions.map(q => q.id);
  const duplicates = qIds3.filter(id => qIds1.includes(id));
  console.log(`Duplicate questions between attempt 1 and attempt 3: ${duplicates.length}`);

  // Test 4: Optional Limit Violation Validation
  console.log("\n[TEST 4] Simulating answer submission exceeding optional limit...");
  const sec1Questions = attempt1.questions.filter(q => q.sectionId === "sec1");
  
  // Alice answers 5 questions in Section 1 (Limit is 4)
  for (let i = 0; i < 5 && i < sec1Questions.length; i++) {
    attempt1.answers[sec1Questions[i].id].selectedOptionIds = [1];
  }
  
  // Save modifications to memory db
  await db.updateAttempt(attempt1.id, { answers: attempt1.answers });
  
  try {
    await calculateAttemptResult(attempt1.id);
    console.error("❌ FAIL: Submission succeeded even though optional limits were violated!");
  } catch (err) {
    console.log(`✅ SUCCESS: Submission correctly rejected: ${err.message}`);
  }

  // Test 5: Accurate scoring calculation
  console.log("\n[TEST 5] Verifying exact result scoring logic...");
  const cleanAttempt = await generateTestPaper("S104", "T1");
  
  const sec1 = cleanAttempt.questions.filter(q => q.sectionId === "sec1").slice(0, 4);
  const sec2 = cleanAttempt.questions.filter(q => q.sectionId === "sec2").slice(0, 4);
  const sec3 = cleanAttempt.questions.filter(q => q.sectionId === "sec3").slice(0, 3);
  
  // Answer all correct for sec1
  let expectedCorrect = 0;
  let expectedMarks = 0;
  
  for (const sq of sec1) {
    const q = await db.getQuestion(sq.id);
    cleanAttempt.answers[sq.id].selectedOptionIds = [...q.correctAnswer];
    expectedCorrect++;
    expectedMarks += q.marks;
  }
  // Answer 3 correct, 1 wrong for sec2
  for (let i = 0; i < 3; i++) {
    const sq = sec2[i];
    const q = await db.getQuestion(sq.id);
    cleanAttempt.answers[sq.id].selectedOptionIds = [...q.correctAnswer];
    expectedCorrect++;
    expectedMarks += q.marks;
  }
  // Answer 1 wrong (select a wrong option)
  const wrongSq = sec2[3];
  const wrongQ = await db.getQuestion(wrongSq.id);
  const wrongChoice = wrongQ.options.find(o => !wrongQ.correctAnswer.includes(o.id)).id;
  cleanAttempt.answers[wrongSq.id].selectedOptionIds = [wrongChoice];
  const expectedNegativeMarks = wrongQ.negativeMarks || 0;

  // Leave sec3 skipped (no selectedOptionIds)
  
  await db.updateAttempt(cleanAttempt.id, { answers: cleanAttempt.answers });

  const finalAttempt = await calculateAttemptResult(cleanAttempt.id);
  console.log("Scoring result calculations:");
  console.log(`- Correct Count: ${finalAttempt.results.correct} (Expected: ${expectedCorrect})`);
  console.log(`- Wrong Count: ${finalAttempt.results.wrong} (Expected: 1)`);
  console.log(`- Net Marks: ${finalAttempt.results.netMarks} (Expected: ${expectedMarks - expectedNegativeMarks})`);
  console.log(`- Total Possible Marks: ${finalAttempt.results.totalPossibleMarks}`);
  console.log(`- Percentage: ${finalAttempt.results.percentage}%`);
  console.log(`- Pass/Fail Status: ${finalAttempt.results.passFail}`);

  console.log("\n=========================================");
  console.log("AUTOMATED ENGINE VERIFICATION COMPLETED");
  console.log("=========================================");
}

runTests().catch(console.error);
