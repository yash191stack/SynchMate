// Regex for standard email validation
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/i;

export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (!EMAIL_REGEX.test(email)) {
    return res.status(400).json({
      error: 'Please provide a valid email address.'
    });
  }

  next();
};
