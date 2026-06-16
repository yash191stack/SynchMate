/**
 * Checks if two users have conflicting dealbreakers.
 * Returns true if a conflict exists (incompatible), false otherwise.
 */
export const hasDealbreakerConflict = (userA, userB) => {
  // 1. Budget Range Alignment Check
  const noBudgetOverlap = 
    userA.dealbreakers.budgetMax < userB.dealbreakers.budgetMin ||
    userB.dealbreakers.budgetMax < userA.dealbreakers.budgetMin;

  if (noBudgetOverlap) {
    return true;
  }

  // 2. Smoking Compatibility Check
  if (userA.dealbreakers.smokingAllowed !== userB.dealbreakers.smokingAllowed) {
    return true;
  }

  // 3. Pets Compatibility Check
  if (userA.dealbreakers.petsAllowed !== userB.dealbreakers.petsAllowed) {
    return true;
  }

  return false;
};

/**
 * Express middleware to perform quick filtering on candidate pairs (optional helper)
 */
export const evaluateDealbreakersMiddleware = (req, res, next) => {
  const { user, candidate } = req.body;
  if (!user || !candidate) {
    return res.status(400).json({ error: 'Both user profiles are required for evaluation.' });
  }

  if (hasDealbreakerConflict(user, candidate)) {
    return res.status(200).json({ 
      compatibilityScore: 0, 
      status: 'disqualified', 
      reason: 'Hard-lock dealbreaker mismatch' 
    });
  }

  next();
};
