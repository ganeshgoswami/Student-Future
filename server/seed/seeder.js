import fs from 'fs/promises';
import path from 'path';
import bcrypt from 'bcryptjs';
import { fileURLToPath } from 'url';
import { connectDB } from '../config/db.js';
import User from '../models/User.js';
import Question from '../models/Question.js';
import Test from '../models/Test.js';
import TestAttempt from '../models/TestAttempt.js';
import Result from '../models/Result.js';
import Certificate from '../models/Certificate.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// English-to-Hindi Seeder Translation Map
const translationDictionary = {
  // Quantitative Aptitude
  "Which number should come next in the pattern: 37, 34, 31, 28, ...?": 
    "पैटर्न में अगली संख्या कौन सी होनी चाहिए: 37, 34, 31, 28, ...?",
  "Find the missing number in the sequence: 4, 9, 16, 25, ?, 49": 
    "अनुक्रम में लुप्त संख्या ज्ञात कीजिए: 4, 9, 16, 25, ?, 49",
  "If 5 workers can build a wall in 12 days, how many days would it take 6 workers to build the same wall?": 
    "यदि 5 मजदूर एक दीवार को 12 दिनों में बना सकते हैं, तो उसी दीवार को बनाने में 6 मजदूरों को कितने दिन लगेंगे?",
  "A train traveling at 60 km/h passes a post in 9 seconds. What is the length of the train in meters?": 
    "60 किमी/घंटा की गति से चलने वाली एक ट्रेन 9 सेकंड में एक खंभे को पार करती है। मीटर में ट्रेन की लंबाई क्या है?",
  "A sum of money double itself in 8 years at simple interest. What is the rate of interest per annum?": 
    "साधारण ब्याज पर कोई राशि 8 वर्षों में दोगुनी हो जाती. है। प्रति वर्ष ब्याज दर क्या है?",

  // Reasoning Ability
  "If in a certain code language, BOMBAY is coded as MYMYMY, how will TAMIL NADU be coded?": 
    "यदि किसी निश्चित कूट भाषा में BOMBAY को MYMYMY लिखा जाता है, तो TAMIL NADU को क्या लिखा जाएगा?",
  "Point to a photograph, a man says, 'His brother's father is the only son of my grandfather.' How is the man related to the person in the photograph?": 
    "एक तस्वीर की ओर इशारा करते हुए एक व्यक्ति कहता है, 'इसके भाई के पिता मेरे दादा के इकलौते बेटे हैं।' वह व्यक्ति तस्वीर वाले व्यक्ति से कैसे संबंधित है?",
  "Choose the word which is least like the other words in the group.": 
    "वह शब्द चुनें जो समूह के अन्य शब्दों से सबसे कम मिलता-जुलता हो किया जाता है।",
  "Find the odd one out from the following list of items.": 
    "निम्नलिखित मदों की सूची में से विषम को चुनिए।",
  "If A + B means A is the brother of B; A - B means A is the sister of B; and A * B means A is the father of B. Which of the following means that C is the son of M?": 
    "यदि A + B का अर्थ A, B का भाई है; A - B का अर्थ A, B की बहन है; और A * B का अर्थ A, B के पिता हैं। निम्नलिखित में से किसका अर्थ है कि C, M का बेटा है?",

  // General Knowledge
  "Which chemical element has the symbol 'Au' and atomic number 79?": 
    "किस रासायनिक तत्व का प्रतीक 'Au' और परमाणु संख्या 79 है?",
  "Which of the following countries share a land border with Brazil? (Select all correct options)": 
    "निम्नलिखित में से कौन से देश ब्राजील के साथ भूमि सीमा साझा करते हैं? (सभी सही विकल्प चुनें)",
  "Who was the first President of the United States?": 
    "संयुक्त राज्य अमेरिका के पहले राष्ट्रपति कौन थे?",
  "In which city are the headquarters of the United Nations located?": 
    "संयुक्त राज्य राष्ट्र का मुख्यालय किस शहर में स्थित है?",
  "Which planet is known as the Red Planet?": 
    "किस ग्रह को लाल ग्रह के रूप में जाना जाता है?",

  // Computer Awareness
  "What does CPU stand for?": 
    "CPU का पूर्ण रूप क्या है?",
  "Which of the following are examples of operating systems? (Select all correct options)": 
    "निम्नलिखित में से कौन से ऑपरेटिंग सिस्टम के उदाहरण हैं? (सभी सही विकल्प चुनें)",
  "What is the standard port number used for secure HTTP connections (HTTPS)?": 
    "सुरक्षित HTTP कनेक्शन (HTTPS) के लिए उपयोग किया जाने वाला मानक पोर्ट नंबर क्या है?",
  "Which memory component is volatile and used by the CPU for temporary runtime storage?": 
    "कौन सा मेमोरी घटक अस्थिर है और अस्थायी रनटाइम स्टोरेज के लिए CPU द्वारा उपयोग किया जाता है?",
  "What is the name of a program designed to replicate itself and spread to other computers?": 
    "उस प्रोग्राम का नाम क्या है जो खुद को दोहराने और अन्य कंप्यूटरों में फैलने के लिए डिज़ाइन किया गया है?",

  // Seed Options
  "Silver": "चांदी",
  "Gold": "सोना",
  "Copper": "तांबा",
  "Aluminum": "एल्युमिनियम",
  "Argentina": "अर्जेंटीना",
  "Chile": "चिली",
  "Colombia": "कोलंबिया",
  "Ecuador": "इक्वेडोर",
  "Venezuela": "वेनेजुएला",
  "Thomas Jefferson": "थॉमस जेफरसन",
  "Benjamin Franklin": "बेंजामिन फ्रैंकलिन",
  "George Washington": "जॉर्ज वाशिंगटन",
  "John Adams": "जॉन एडम्स",
  "Geneva": "जेनेवा",
  "London": "लंदन",
  "New York City": "न्यू यॉर्क शहर",
  "Paris": "पेरिस",
  "Venus": "शुक्र",
  "Mars": "मंगल",
  "Jupiter": "बृहस्पति",
  "Saturn": "शनि",
  "Central Process Unit": "सेंट्रल प्रोसेस यूनिट",
  "Central Processing Unit": "सेंट्रल प्रोसेसिंग यूनिट",
  "Computer Processing Unit": "कंप्यूटर प्रोसेसिंग यूनिट",
  "Central Peripheral Unit": "सेंट्रल पेरिफेरल यूनिट",
  "Linux": "लिनक्स",
  "Microsoft Word": "माइक्रोसॉफ्ट वर्ड",
  "Android": "एंड्रॉइड",
  "Google Chrome": "गूगल क्रोम",
  "macOS": "मैक ओएस",
  "ROM": "रॉम (ROM)",
  "Hard Disk Drive": "हार्ड डिस्क ड्राइव",
  "RAM": "रैम (RAM)",
  "Solid State Drive": "सॉलिड स्टेट ड्राइव",
  "Firewall": "फ़ायरवॉल",
  "Computer Virus": "कंप्यूटर वायरस",
  "Spam filter": "स्पैम फ़िल्टर",
  "Adware": "एडवेयर",
  "Brother": "भाई",
  "Uncle": "चाचा",
  "Cousin": "चचेरा भाई",
  "Father": "पिता",
  "Grandson": "पोता",
  "Snake": "सांप",
  "Lizard": "छिपकली",
  "Whale": "ह्वेल",
  "Crocodile": "मगरमच्छ",
  "Car": "कार",
  "Bicycle": "साइकिल",
  "Motorcycle": "मोटर साइकिल",
  "Submarine": "पनडुब्बी"
};

async function seedDatabase() {
  console.log("Starting database seeding process...");
  await connectDB();

  // 1. Clear Existing Data
  console.log("Clearing all collection data...");
  await User.deleteMany({});
  await Question.deleteMany({});
  await Test.deleteMany({});
  await TestAttempt.deleteMany({});
  await Result.deleteMany({});
  await Certificate.deleteMany({});
  console.log("Collections cleared successfully.");

  // 2. Create Default Accounts (Admin & Students)
  console.log("Creating default administrator and student credentials...");
  const hashedPassword = await bcrypt.hash('StudentFuturePass123', 10);

  const adminUser = await User.create({
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@studentfuture.com',
    mobileNumber: '9876543210',
    password: hashedPassword,
    dateOfBirth: new Date('1990-01-01'),
    gender: 'Male',
    country: 'United States',
    state: 'California',
    city: 'San Francisco',
    qualification: 'Master of Science',
    college: 'Stanford University',
    passingYear: 2012,
    role: 'admin',
    status: 'active'
  });

  const studentUser = await User.create({
    firstName: 'Alice',
    lastName: 'Vance',
    email: 'student@studentfuture.com',
    mobileNumber: '9999999999',
    password: hashedPassword,
    dateOfBirth: new Date('2000-05-15'),
    gender: 'Female',
    country: 'United States',
    state: 'New York',
    city: 'New York',
    qualification: 'Bachelor of Technology',
    college: 'Cornell University',
    passingYear: 2022,
    role: 'student',
    status: 'active'
  });

  console.log(`Created accounts:`);
  console.log(`- Admin: admin@studentfuture.com / StudentFuturePass123`);
  console.log(`- Student: student@studentfuture.com / StudentFuturePass123`);

  // 3. Load Base Questions from JSON files
  console.log("Loading base questions from JSON files...");
  const loadJson = async (filename) => {
    const filePath = path.join(__dirname, 'questions', filename);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  };

  const baseQuant = await loadJson('quantitative.json');
  const baseReasoning = await loadJson('reasoning.json');
  const baseEnglish = await loadJson('english.json');
  const baseGk = await loadJson('gk.json');
  const baseComputer = await loadJson('computer.json');
  const baseScience = await loadJson('science.json');

  const categoriesMap = [
    { base: baseQuant, catName: 'Quantitative Aptitude' },
    { base: baseReasoning, catName: 'Reasoning Ability' },
    { base: baseEnglish, catName: 'English' },
    { base: baseGk, catName: 'General Knowledge' },
    { base: baseComputer, catName: 'Computer Awareness' },
    { base: baseScience, catName: 'Science' }
  ];

  // 4. Determine Scale factor from arguments (Default: 170 per category, yielding 1,020 total questions)
  let targetScale = 170;
  const scaleArgIdx = process.argv.indexOf('--scale');
  if (scaleArgIdx !== -1 && process.argv[scaleArgIdx + 1]) {
    targetScale = parseInt(process.argv[scaleArgIdx + 1]);
    if (isNaN(targetScale)) targetScale = 170;
  }

  console.log(`Generating database questions (Target questions per category: ${targetScale}, Total expected: ${targetScale * categoriesMap.length})...`);
  const finalQuestions = [];

  const getHindiTranslation = (text, category) => {
    if (category === 'English') return '';
    return translationDictionary[text.trim()] || '';
  };

  for (const { base, catName } of categoriesMap) {
    const baseCount = base.length;
    
    for (let i = 0; i < targetScale; i++) {
      const baseQ = base[i % baseCount];
      const variantNum = Math.floor(i / baseCount) + 1;
      
      // Translate statement
      const baseHindi = baseQ.hindiText || getHindiTranslation(baseQ.text, catName);

      const qText = variantNum === 1 
        ? baseQ.text 
        : `[Variant #${variantNum}] ${baseQ.text}`;

      const qHindiText = baseHindi 
        ? (variantNum === 1 ? baseHindi : `[वेरिएंट #${variantNum}] ${baseHindi}`)
        : '';
      
      // Translate Options
      const options = baseQ.options.map(opt => {
        const baseOptHindi = opt.hindiText || translationDictionary[opt.text.trim()] || '';

        if (variantNum === 1) {
          return { id: opt.id, text: opt.text, hindiText: baseOptHindi };
        }

        // Vary numeric options slightly
        const matchNumber = opt.text.match(/^(\$)?(\d+(\.\d+)?)(%)?$/);
        if (matchNumber) {
          const prefix = matchNumber[1] || '';
          const originalVal = parseFloat(matchNumber[2]);
          const suffix = matchNumber[4] || '';
          const modifiedVal = parseFloat((originalVal + variantNum * 1.5).toFixed(2));
          
          let hindiSuffix = suffix;
          if (baseOptHindi) {
            const unitMatch = baseOptHindi.match(/^[0-9.]+\s*(.*)$/);
            if (unitMatch) hindiSuffix = unitMatch[1];
          }

          return { 
            id: opt.id, 
            text: `${prefix}${modifiedVal}${suffix}`,
            hindiText: baseOptHindi ? `${modifiedVal} ${hindiSuffix}` : ''
          };
        }

        return { 
          id: opt.id, 
          text: `${opt.text} (Alt #${variantNum})`,
          hindiText: baseOptHindi ? `${baseOptHindi} (विकल्प #${variantNum})` : ''
        };
      });

      finalQuestions.push({
        text: qText,
        hindiText: qHindiText,
        category: catName,
        subCategory: baseQ.subCategory,
        difficulty: baseQ.difficulty,
        type: baseQ.type,
        options,
        correctAnswer: baseQ.correctAnswer,
        explanation: `Variant #${variantNum} Solution: ${baseQ.explanation}`,
        marks: baseQ.marks,
        negativeMarks: baseQ.negativeMarks,
        language: 'English',
        status: 'Active',
        createdBy: adminUser._id
      });
    }
  }

  console.log(`Inserting ${finalQuestions.length} questions into MongoDB...`);
  // Bulk insert questions
  const insertedQuestions = await Question.insertMany(finalQuestions);
  console.log(`Successfully seeded ${insertedQuestions.length} questions.`);

  // 5. Create Default Mock Tests
  console.log("Creating default test configurations...");
  
  // Test 1: Quantitative Aptitude Challenge
  const mathTest = await Test.create({
    title: "Quantitative Aptitude Challenge",
    description: "A specialized test focusing on arithmetic, algebra, simple interest, and problem solving.",
    durationMinutes: 20,
    passingPercentage: 50,
    negativeMarking: true,
    randomQuestions: true,
    maxAttempts: 3,
    examType: 'MTS',
    createdBy: adminUser._id,
    sections: [
      {
        name: "Arithmetic & Math",
        category: "Quantitative Aptitude",
        totalQuestions: 15,
        answerRequired: 15,
        randomQuestions: true
      }
    ]
  });

  // Test 2: General Aptitude Assessment (Full Exam Structure with Science category!)
  const fullTest = await Test.create({
    title: "General Aptitude Assessment",
    description: "Comprehensive 6-section testing suite evaluating Quant, Logical Reasoning, English Verbal, GK, Computer, and Science concepts.",
    durationMinutes: 60,
    passingPercentage: 45,
    negativeMarking: true,
    randomQuestions: true,
    maxAttempts: 5,
    examType: 'CGL',
    createdBy: adminUser._id,
    sections: [
      {
        name: "Quantitative Aptitude",
        category: "Quantitative Aptitude",
        totalQuestions: 10,
        answerRequired: 10,
        randomQuestions: true
      },
      {
        name: "Reasoning Ability",
        category: "Reasoning Ability",
        totalQuestions: 10,
        answerRequired: 10,
        randomQuestions: true
      },
      {
        name: "English Verbal",
        category: "English",
        totalQuestions: 10,
        answerRequired: 10,
        randomQuestions: true
      },
      {
        name: "General Knowledge",
        category: "General Knowledge",
        totalQuestions: 10,
        answerRequired: 10,
        randomQuestions: true
      },
      {
        name: "Computer Awareness",
        category: "Computer Awareness",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "Science Section",
        category: "Science",
        totalQuestions: 10,
        answerRequired: 10,
        randomQuestions: true
      }
    ]
  });

  // Test 3: SSC CHSL mock exam
  const chslTest = await Test.create({
    title: "SSC CHSL Practice Test",
    description: "SSC CHSL pattern test featuring Quantitative Aptitude, Logical Reasoning, English Verbal, and General Knowledge.",
    durationMinutes: 60,
    passingPercentage: 45,
    negativeMarking: true,
    randomQuestions: true,
    maxAttempts: 5,
    examType: 'CHSL',
    createdBy: adminUser._id,
    sections: [
      {
        name: "Quantitative Section",
        category: "Quantitative Aptitude",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "Reasoning Section",
        category: "Reasoning Ability",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "English Section",
        category: "English",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "General Awareness",
        category: "General Knowledge",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      }
    ]
  });

  // Test 4: SSC GD Constable mock exam
  const gdTest = await Test.create({
    title: "SSC GD Constable Mock Exam",
    description: "SSC GD Constable pattern test focusing on Basic Mathematics, Reasoning, General Awareness, and General Science concepts.",
    durationMinutes: 45,
    passingPercentage: 40,
    negativeMarking: true,
    randomQuestions: true,
    maxAttempts: 5,
    examType: 'GD',
    createdBy: adminUser._id,
    sections: [
      {
        name: "Basic Mathematics",
        category: "Quantitative Aptitude",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "General Intelligence & Reasoning",
        category: "Reasoning Ability",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "General Awareness",
        category: "General Knowledge",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      },
      {
        name: "General Science Section",
        category: "Science",
        totalQuestions: 8,
        answerRequired: 8,
        randomQuestions: true
      }
    ]
  });

  console.log(`Created tests:`);
  console.log(`- '${mathTest.title}' (${mathTest.sections.length} Section, examType: ${mathTest.examType})`);
  console.log(`- '${fullTest.title}' (${fullTest.sections.length} Sections, examType: ${fullTest.examType})`);
  console.log(`- '${chslTest.title}' (${chslTest.sections.length} Sections, examType: ${chslTest.examType})`);
  console.log(`- '${gdTest.title}' (${gdTest.sections.length} Sections, examType: ${gdTest.examType})`);

  console.log("\n=========================================");
  console.log("DATABASE SEEDING COMPLETED SUCCESSFULLY!");
  console.log("=========================================");
  process.exit(0);
}

seedDatabase().catch(err => {
  console.error("❌ Fatal Error during seeding:", err);
  process.exit(1);
});
