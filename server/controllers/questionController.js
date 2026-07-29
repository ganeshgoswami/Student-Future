import Question from '../models/Question.js';

/**
 * Get Questions (supporting Search, Filter by Category/Difficulty, Pagination)
 */
export async function getQuestions(req, res) {
  try {
    const { category, difficulty, search, page = 1, limit = 10 } = req.query;

    const query = {};

    // Filter by Category
    if (category && category !== 'All') {
      query.category = category;
    }

    // Filter by Difficulty
    if (difficulty && difficulty !== 'All') {
      query.difficulty = difficulty;
    }

    // Search by text snippet
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    // Paginate results
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const totalCount = await Question.countDocuments(query);
    
    const questions = await Question.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    res.json({
      success: true,
      questions,
      pagination: {
        totalItems: totalCount,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalCount / limit),
        limit: parseInt(limit)
      }
    });

  } catch (err) {
    res.status(500).json({ error: `Failed to load questions: ${err.message}` });
  }
}

/**
 * Create a single Question (Admin only)
 */
export async function createQuestion(req, res) {
  try {
    const {
      text,
      image,
      category,
      subCategory,
      difficulty,
      type,
      options,
      correctAnswer,
      explanation,
      marks,
      negativeMarks
    } = req.body;

    const newQuestion = await Question.create({
      text,
      image,
      category,
      subCategory,
      difficulty,
      type,
      options,
      correctAnswer,
      explanation,
      marks: Number(marks),
      negativeMarks: Number(negativeMarks),
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, question: newQuestion });

  } catch (err) {
    res.status(400).json({ error: `Failed to create question: ${err.message}` });
  }
}

/**
 * Bulk upload Questions from JSON array (Admin only)
 */
export async function bulkImportQuestions(req, res) {
  try {
    const questionsArray = req.body;
    if (!Array.isArray(questionsArray)) {
      return res.status(400).json({ error: 'Request body must be a JSON array of questions' });
    }

    // Sanitize and set creator field
    const sanitized = questionsArray.map(q => ({
      text: q.text,
      image: q.image || '',
      category: q.category,
      subCategory: q.subCategory,
      difficulty: q.difficulty,
      type: q.type,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      marks: Number(q.marks) || 2,
      negativeMarks: Number(q.negativeMarks) || 0.5,
      language: q.language || 'English',
      status: q.status || 'Active',
      createdBy: req.user._id
    }));

    const docs = await Question.insertMany(sanitized);

    res.status(201).json({
      success: true,
      message: `Successfully seeded ${docs.length} questions into Database pool.`
    });

  } catch (err) {
    res.status(400).json({ error: `Bulk upload parsing error: ${err.message}` });
  }
}

/**
 * Delete single Question (Admin only)
 */
export async function deleteQuestion(req, res) {
  try {
    const { id } = req.params;
    const deleted = await Question.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({ error: 'Question not found' });
    }
    res.json({ success: true, message: 'Question removed from database pool successfully.' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
