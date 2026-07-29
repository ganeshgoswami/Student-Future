import Test from '../models/Test.js';

/**
 * List all active tests
 */
export async function getTests(req, res) {
  try {
    const tests = await Test.find({}).sort({ createdAt: -1 });
    res.json({ success: true, tests });
  } catch (err) {
    res.status(500).json({ error: `Failed to fetch tests: ${err.message}` });
  }
}

/**
 * Get details of a single test by ID
 */
export async function getTestById(req, res) {
  try {
    const { id } = req.params;
    const test = await Test.findById(id);
    if (!test) {
      return res.status(404).json({ error: 'Test not found' });
    }
    res.json({ success: true, test });
  } catch (err) {
    res.status(500).json({ error: `Error retrieving test: ${err.message}` });
  }
}

/**
 * Create a new Test configuration (Admin only)
 */
export async function createTest(req, res) {
  try {
    const {
      title,
      description,
      durationMinutes,
      passingPercentage,
      negativeMarking,
      randomQuestions,
      maxAttempts,
      sections
    } = req.body;

    if (!sections || !Array.isArray(sections) || sections.length === 0) {
      return res.status(400).json({ error: 'A test must contain at least one section' });
    }

    const test = await Test.create({
      title,
      description,
      durationMinutes: Number(durationMinutes),
      passingPercentage: Number(passingPercentage),
      negativeMarking,
      randomQuestions,
      maxAttempts: Number(maxAttempts),
      sections,
      createdBy: req.user._id
    });

    res.status(201).json({ success: true, test });

  } catch (err) {
    res.status(400).json({ error: `Failed to create test configuration: ${err.message}` });
  }
}
