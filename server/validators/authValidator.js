import { body, validationResult } from 'express-validator';

// Helper to catch validation outputs
export const validateFields = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const messages = errors.array().map(err => err.msg);
    return res.status(400).json({ error: messages.join(', ') });
  }
  next();
};

export const validateRegister = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').trim().isEmail().withMessage('Enter a valid email address'),
  body('mobileNumber').trim().notEmpty().withMessage('Mobile number is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters long'),
  body('confirmPassword').custom((value, { req }) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  body('dateOfBirth').notEmpty().withMessage('Date of birth is required'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Select a valid gender (Male, Female, Other)'),
  body('country').trim().notEmpty().withMessage('Country is required'),
  body('state').trim().notEmpty().withMessage('State is required'),
  body('city').trim().notEmpty().withMessage('City is required'),
  body('qualification').trim().notEmpty().withMessage('Qualification is required'),
  body('college').trim().notEmpty().withMessage('College is required'),
  body('passingYear').isInt({ min: 1950, max: 2100 }).withMessage('Enter a valid passing year'),
  validateFields
];

export const validateLogin = [
  body('email').trim().isEmail().withMessage('Enter a valid registered email address'),
  body('password').notEmpty().withMessage('Password is required'),
  validateFields
];

export const validateForgotPassword = [
  body('email').trim().isEmail().withMessage('Enter a valid registered email address'),
  validateFields
];

export const validateResetPassword = [
  body('token').notEmpty().withMessage('Reset token is required'),
  body('password').isLength({ min: 6 }).withMessage('New password must be at least 6 characters long'),
  validateFields
];
