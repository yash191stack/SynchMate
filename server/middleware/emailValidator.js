// Regex for institutional emails (e.g., user@collegedomain.edu or user@gla.ac.in)
const INSTITUTIONAL_EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.edu|[a-zA-Z0-9.-]+\.ac\.in)$/i;

export const validateEmail = (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email address is required.' });
  }

  if (!INSTITUTIONAL_EMAIL_REGEX.test(email)) {
    return res.status(403).json({
      error: 'Access restricted. You must register using a verified college email domain (.edu or .ac.in).'
    });
  }

  next();
};
