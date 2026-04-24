// Input validation middleware

// Sanitize string - trim and limit length
function sanitize(value, maxLength = 1000) {
  if (typeof value !== 'string') return value;
  return value.trim().slice(0, maxLength);
}

// Email validation
function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// Validation rules factory
export function validate(rules) {
  return (req, res, next) => {
    const errors = [];

    for (const [field, fieldRules] of Object.entries(rules)) {
      const value = req.body[field];

      for (const rule of fieldRules) {
        if (rule === 'required' && (!value || (typeof value === 'string' && !value.trim()))) {
          errors.push(`${field} is required`);
          break;
        }
        if (rule === 'email' && value && !isValidEmail(value)) {
          errors.push(`${field} must be a valid email address`);
        }
        if (rule === 'string' && value && typeof value !== 'string') {
          errors.push(`${field} must be a string`);
        }
        if (typeof rule === 'object') {
          if (rule.minLength && value && value.length < rule.minLength) {
            errors.push(`${field} must be at least ${rule.minLength} characters`);
          }
          if (rule.maxLength && value && value.length > rule.maxLength) {
            errors.push(`${field} must be at most ${rule.maxLength} characters`);
          }
          if (rule.pattern && value && !rule.pattern.test(value)) {
            errors.push(`${field} has invalid format`);
          }
          if (rule.isIn && value && !rule.isIn.includes(value)) {
            errors.push(`${field} must be one of: ${rule.isIn.join(', ')}`);
          }
          if (rule.isInt && value !== undefined && value !== '') {
            const num = Number(value);
            if (!Number.isInteger(num)) {
              errors.push(`${field} must be an integer`);
            } else {
              if (rule.min !== undefined && num < rule.min) errors.push(`${field} must be at least ${rule.min}`);
              if (rule.max !== undefined && num > rule.max) errors.push(`${field} must be at most ${rule.max}`);
            }
          }
        }
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({ error: 'Validation failed', details: errors });
    }

    // Sanitize string fields
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = sanitize(req.body[key]);
      }
    }

    next();
  };
}

// Common validation rules
export const loginValidation = validate({
  email: ['required', 'email'],
  password: ['required', { minLength: 1 }]
});

export const registerValidation = validate({
  email: ['required', 'email'],
  password: ['required', { minLength: 6, maxLength: 128 }],
  name: ['string', { maxLength: 255 }]
});

export const productValidation = validate({
  name: ['required', 'string', { maxLength: 255 }],
  category: ['string', { maxLength: 100 }],
  description: ['string', { maxLength: 5000 }]
});

export const profileValidation = validate({
  name: ['string', { maxLength: 255 }],
  email: ['email']
});

export const passwordResetValidation = validate({
  email: ['required', 'email']
});

export const passwordResetConfirmValidation = validate({
  token: ['required', 'string'],
  password: ['required', { minLength: 6, maxLength: 128 }]
});
