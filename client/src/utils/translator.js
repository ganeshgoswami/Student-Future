/**
 * Hindi Translation Map & Helper for Examination Questions
 */

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
    "साधारण ब्याज पर कोई राशि 8 वर्षों में दोगुनी हो जाती है। प्रति वर्ष ब्याज दर क्या है?",

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

/**
 * Translates a given question text or option string into Hindi
 * @param {String} text - English text
 * @param {String} category - Question Category (to skip English section)
 * @returns {String} - Translated Hindi text or fallback English
 */
export function translateToHindi(text, category) {
  if (!text) return '';
  if (category === 'English') return text; // Skip English grammar questions

  // Check for Variant prefix format: "[Variant #2] Who was..."
  const variantMatch = text.match(/^\[Variant #(\d+)\]\s*(.*)$/i);
  if (variantMatch) {
    const num = variantMatch[1];
    const coreText = variantMatch[2];
    const translatedCore = translationDictionary[coreText.trim()] || coreText;
    return `[वेरिएंट #${num}] ${translatedCore}`;
  }

  // Check for option alt format: "Option (Alt #2)"
  const altOptionMatch = text.match(/^(.*)\s*\(Alt #(\d+)\)$/i);
  if (altOptionMatch) {
    const label = altOptionMatch[1];
    const num = altOptionMatch[2];
    const translatedLabel = translationDictionary[label.trim()] || label;
    return `${translatedLabel} (विकल्प #${num})`;
  }

  return translationDictionary[text.trim()] || text;
}
