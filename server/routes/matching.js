import express from 'express';
import { calculateCosineSimilarity, getPreferenceVector } from '../services/matchingEngine.js';
import { hasDealbreakerConflict } from '../middleware/dealbreakerEvaluator.js';

const router = express.Router();

// Computes compatibility score between two profiles
router.post('/compatibility', (req, res) => {
  const { user, candidate } = req.body;

  if (!user || !candidate) {
    return res.status(400).json({ error: 'Both user and candidate profiles are required.' });
  }

  // 1. Evaluate Hard-Lock Dealbreakers
  if (hasDealbreakerConflict(user, candidate)) {
    return res.status(200).json({
      compatibilityScore: 0,
      dealbreakerDisqualified: true,
      message: 'Forced to 0% compatibility due to hard-lock dealbreaker mismatch.'
    });
  }

  // 2. Perform Cosine Similarity matching
  const vectorA = getPreferenceVector(user);
  const vectorB = getPreferenceVector(candidate);
  const similarityScore = calculateCosineSimilarity(vectorA, vectorB);

  // Convert score representation (e.g. 0.95 -> 95%)
  const compatibilityPercentage = Math.round(similarityScore * 100);

  return res.status(200).json({
    compatibilityScore: compatibilityPercentage,
    dealbreakerDisqualified: false,
    message: `Vector matched successfully: ${compatibilityPercentage}% compatibility.`
  });
});

export default router;
