import Question from '../models/Question.js';

/**
 * Procedural AI Question Generator (Fallback when Gemini API Key is not set or times out)
 */
function generateProceduralQuestion(category, difficulty) {
  const templates = {
    'Quantitative Aptitude': [
      () => {
        const x = Math.floor(Math.random() * 20) + 10; // 10% to 30%
        const y = Math.floor(Math.random() * 10) + 5;  // 5% to 15%
        const sp = 100 + x;
        const finalSp = Math.round(sp * (100 - y) / 100);
        const profit = finalSp - 100;
        return {
          text: `A shopkeeper marks his articles ${x}% above the cost price and allows a discount of ${y}%. What is his net profit percentage?`,
          hindiText: `एक दुकानदार अपनी वस्तुओं पर क्रय मूल्य से ${x}% अधिक मूल्य अंकित करता है और ${y}% की छूट देता है। उसका शुद्ध लाभ प्रतिशत क्या है?`,
          subCategory: 'Profit and Loss',
          options: [
            { id: 1, text: `${profit - 2}%`, hindiText: `${profit - 2}%` },
            { id: 2, text: `${profit}%`, hindiText: `${profit}%` },
            { id: 3, text: `${profit + 1.5}%`, hindiText: `${profit + 1.5}%` },
            { id: 4, text: `${profit + 3}%`, hindiText: `${profit + 3}%` }
          ],
          correctAnswer: [2],
          explanation: `Let Cost Price = 100. Marked Price = 100 + ${x}% = ${100 + x}. Selling Price = ${100 + x} - ${y}% of Marked Price = ${finalSp}. Net Profit = ${profit}%.`,
          marks: 2,
          negativeMarks: 0.5
        };
      },
      () => {
        const daysA = [10, 12, 15, 20][Math.floor(Math.random() * 4)];
        const daysB = daysA * 2;
        // 1/A + 1/B = (B + A)/(A*B)
        const combined = Math.round((daysA * daysB) / (daysA + daysB) * 10) / 10;
        return {
          text: `A can complete a work in ${daysA} days and B can complete the same work in ${daysB} days. In how many days can they complete the work working together?`,
          hindiText: `A किसी कार्य को ${daysA} दिनों में पूरा कर सकता है और B उसी कार्य को ${daysB} दिनों में पूरा कर सकता है। वे एक साथ मिलकर कार्य को कितने दिनों में पूरा कर सकते हैं?`,
          subCategory: 'Time and Work',
          options: [
            { id: 1, text: `${combined} days`, hindiText: `${combined} दिन` },
            { id: 2, text: `${combined + 2.5} days`, hindiText: `${combined + 2.5} दिन` },
            { id: 3, text: `${Math.round(combined - 1)} days`, hindiText: `${Math.round(combined - 1)} दिन` },
            { id: 4, text: `${Math.round(combined + 4)} days`, hindiText: `${Math.round(combined + 4)} दिन` }
          ],
          correctAnswer: [1],
          explanation: `A's 1-day work = 1/${daysA}. B's 1-day work = 1/${daysB}. Combined 1-day work = 1/${daysA} + 1/${daysB} = ${daysA + daysB}/${daysA * daysB}. Total days required = ${combined} days.`,
          marks: 2,
          negativeMarks: 0.5
        };
      }
    ],
    'Reasoning Ability': [
      () => {
        const words = [
          { eng: 'CODER', hint: 'DPEFS', ans: 'PYTHON', options: ['QZUIOP', 'QZUIPO', 'QZUPIN', 'QZVIPO'] },
          { eng: 'SMART', hint: 'TNBUS', ans: 'BRAIN', options: ['CSBJO', 'CSBIP', 'CSCJO', 'CTBJO'] }
        ][Math.floor(Math.random() * 2)];
        return {
          text: `If '${words.eng}' is coded as '${words.hint}' in a certain language, how will '${words.ans}' be coded in that same language?`,
          hindiText: `यदि किसी निश्चित भाषा में '${words.eng}' को '${words.hint}' के रूप में कोडित किया जाता है, तो उसी भाषा में '${words.ans}' को कैसे कोडित किया जाएगा?`,
          subCategory: 'Coding-Decoding',
          options: [
            { id: 1, text: words.options[0], hindiText: words.options[0] },
            { id: 2, text: words.options[1], hindiText: words.options[1] },
            { id: 3, text: words.options[2], hindiText: words.options[2] },
            { id: 4, text: words.options[3], hindiText: words.options[3] }
          ],
          correctAnswer: [1],
          explanation: `The coding scheme shifts each alphabet by +1 letter. S->T, M->N, A->B, etc. Similarly, for '${words.ans}', B->C, R->S, A->B, I->J, N->O. Code: '${words.options[0]}'.`,
          marks: 2,
          negativeMarks: 0.5
        };
      }
    ],
    'English': [
      () => {
        const items = [
          { word: 'ABANDON', syn: 'FORSAKE', wrong: ['RETAIN', 'CHERISH', 'ADOPT'] },
          { word: 'BENEVOLENT', syn: 'KIND', wrong: ['MALEVOLENT', 'CRUEL', 'STINGY'] }
        ][Math.floor(Math.random() * 2)];
        return {
          text: `Choose the correct synonym of the given word: "${items.word}"`,
          hindiText: `दिए गए शब्द का सही पर्यायवाची चुनें: "${items.word}"`,
          subCategory: 'Synonyms',
          options: [
            { id: 1, text: items.wrong[0], hindiText: items.wrong[0] },
            { id: 2, text: items.syn, hindiText: items.syn },
            { id: 3, text: items.wrong[1], hindiText: items.wrong[1] },
            { id: 4, text: items.wrong[2], hindiText: items.wrong[2] }
          ],
          correctAnswer: [2],
          explanation: `The synonym of "${items.word}" is "${items.syn}". Other options represent antonyms or unrelated terms.`,
          marks: 2,
          negativeMarks: 0.5
        };
      }
    ],
    'General Knowledge': [
      () => {
        const article = [352, 356, 360][Math.floor(Math.random() * 3)];
        const types = {
          352: { eng: 'National Emergency', hin: 'राष्ट्रीय आपातकाल' },
          356: { eng: "President's Rule", hin: 'राष्ट्रपति शासन' },
          360: { eng: 'Financial Emergency', hin: 'वित्तीय आपातकाल' }
        };
        return {
          text: `Which article of the Indian Constitution empowers the President to declare a ${types[article].eng}?`,
          hindiText: `भारतीय संविधान का कौन सा अनुच्छेद राष्ट्रपति को ${types[article].hin} घोषित करने की शक्ति प्रदान करता है?`,
          subCategory: 'Indian Polity',
          options: [
            { id: 1, text: 'Article 350', hindiText: 'अनुच्छेद 350' },
            { id: 2, text: `Article ${article}`, hindiText: `अनुच्छेद ${article}` },
            { id: 3, text: 'Article 368', hindiText: 'अनुच्छेद 368' },
            { id: 4, text: 'Article 370', hindiText: 'अनुच्छेद 370' }
          ],
          correctAnswer: [2],
          explanation: `Article ${article} of the Constitution deals with the declaration of a ${types[article].eng} in India.`,
          marks: 2,
          negativeMarks: 0.5
        };
      }
    ],
    'Computer Awareness': [
      () => {
        const keys = [
          { shortcut: 'Ctrl + Z', action: 'Undo an action', hin: 'कार्य पूर्ववत (Undo) करने' },
          { shortcut: 'Ctrl + Y', action: 'Redo an action', hin: 'कार्य को फिर से करने (Redo)' }
        ][Math.floor(Math.random() * 2)];
        return {
          text: `What is the keyboard shortcut to ${keys.action} in MS Word?`,
          hindiText: `MS Word में ${keys.hin} के लिए कीबोर्ड शॉर्टकट क्या है?`,
          subCategory: 'MS Office Shortcut Keys',
          options: [
            { id: 1, text: keys.shortcut, hindiText: keys.shortcut },
            { id: 2, text: 'Ctrl + X', hindiText: 'Ctrl + X' },
            { id: 3, text: 'Ctrl + S', hindiText: 'Ctrl + S' },
            { id: 4, text: 'Ctrl + P', hindiText: 'Ctrl + P' }
          ],
          correctAnswer: [1],
          explanation: `${keys.shortcut} is the standard shortcut key command in Microsoft Office and general applications to ${keys.action}.`,
          marks: 2,
          negativeMarks: 0.5
        };
      }
    ],
    'Science': [
      () => {
        const items = [
          { comp: 'Baking Soda', formula: 'NaHCO3', wrong: ['Na2CO3', 'NaOH', 'NaCl'] },
          { comp: 'Bleaching Powder', formula: 'CaOCl2', wrong: ['CaCO3', 'Ca(OH)2', 'CaCl2'] }
        ][Math.floor(Math.random() * 2)];
        return {
          text: `What is the chemical formula of ${items.comp}?`,
          hindiText: `${items.comp} का रासायनिक सूत्र क्या है?`,
          subCategory: 'Chemistry Formulas',
          options: [
            { id: 1, text: items.wrong[0], hindiText: items.wrong[0] },
            { id: 2, text: items.wrong[1], hindiText: items.wrong[1] },
            { id: 3, text: items.formula, hindiText: items.formula },
            { id: 4, text: items.wrong[2], hindiText: items.wrong[2] }
          ],
          correctAnswer: [3],
          explanation: `The chemical formula for ${items.comp} is ${items.formula}.`,
          marks: 2,
          negativeMarks: 0.5
        };
      }
    ]
  };

  const pool = templates[category] || templates['General Knowledge'];
  const creator = pool[Math.floor(Math.random() * pool.length)];
  return creator();
}

/**
 * Generate AI Question
 * Attempt to call Gemini API, fallback to procedural generation if not configured.
 */
export async function generateAIQuestion(category, difficulty) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
      
      const payload = {
        contents: [{
          parts: [{
            text: `You are an expert SSC Examination Question Generator.
Generate a high-quality, original, SSC exam multiple-choice question in JSON format.
Subject/Category: "${category}"
Difficulty: "${difficulty}" (Easy, Medium, or Hard)

The output MUST be a valid JSON object matching the following structure exactly:
{
  "text": "The question statement in English",
  "hindiText": "The question statement in Hindi (accurate MERN Mapped translation)",
  "subCategory": "Subtopic name",
  "options": [
    {"id": 1, "text": "Option A in English", "hindiText": "Option A in Hindi"},
    {"id": 2, "text": "Option B in English", "hindiText": "Option B in Hindi"},
    {"id": 3, "text": "Option C in English", "hindiText": "Option C in Hindi"},
    {"id": 4, "text": "Option D in English", "hindiText": "Option D in Hindi"}
  ],
  "correctAnswer": [correct_option_id],
  "explanation": "Detailed explanation in both English and Hindi",
  "marks": 2,
  "negativeMarks": 0.5
}
Ensure the question is unique, concept-based, matches standard SSC syllabus guidelines. Do not output markdown backticks, only return raw JSON.`
          }]
        }],
        generationConfig: {
          responseMimeType: "application/json"
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(8000) // 8-second timeout for snappy response
      });

      if (response.ok) {
        const data = await response.json();
        const jsonText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (jsonText) {
          const parsed = JSON.parse(jsonText.trim());
          
          // Save to database as AI generated
          const dbQuestion = await Question.create({
            category,
            subCategory: parsed.subCategory || 'General',
            difficulty,
            type: 'MCQ',
            text: parsed.text,
            hindiText: parsed.hindiText,
            options: parsed.options,
            correctAnswer: parsed.correctAnswer,
            explanation: parsed.explanation,
            marks: parsed.marks || 2,
            negativeMarks: parsed.negativeMarks || 0.5,
            isAIGenerated: true,
            status: 'Active'
          });

          console.log(`🤖 [AI GENERATED] Seeded new question for Category: ${category}`);
          return dbQuestion;
        }
      }
    } catch (err) {
      console.warn("⚠️ Gemini API call failed. Falling back to local procedural AI generator:", err.message);
    }
  }

  // Fallback to procedural generator
  const qData = generateProceduralQuestion(category, difficulty);
  
  // Save to DB
  const dbQuestion = await Question.create({
    category,
    subCategory: qData.subCategory,
    difficulty,
    type: 'MCQ',
    text: qData.text,
    hindiText: qData.hindiText,
    options: qData.options,
    correctAnswer: qData.correctAnswer,
    explanation: qData.explanation,
    marks: qData.marks,
    negativeMarks: qData.negativeMarks,
    isAIGenerated: true,
    status: 'Active'
  });

  console.log(`🤖 [PROCEDURAL AI] Created new question for Category: ${category}`);
  return dbQuestion;
}
