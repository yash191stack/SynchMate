import express from 'express';
import User from '../models/User.js';
import Swipe from '../models/Swipe.js';
import { calculateCosineSimilarity, getPreferenceVector } from '../services/matchingEngine.js';
import { hasDealbreakerConflict } from '../middleware/dealbreakerEvaluator.js';
import { getSwipedUsers, trackSwipe } from '../services/cacheService.js';
import { notifyMatch } from '../services/socketService.js';
import mongoose from 'mongoose';

const router = express.Router();

// Compatibility calculation endpoint (Phase 2 legacy support)
router.post('/compatibility', (req, res) => {
  const { user, candidate } = req.body;
  if (!user || !candidate) {
    return res.status(400).json({ error: 'Both user and candidate profiles are required.' });
  }

  if (hasDealbreakerConflict(user, candidate)) {
    return res.status(200).json({
      compatibilityScore: 0,
      dealbreakerDisqualified: true,
      message: 'Forced to 0% compatibility due to hard-lock dealbreaker mismatch.'
    });
  }

  const vectorA = getPreferenceVector(user);
  const vectorB = getPreferenceVector(candidate);
  const similarityScore = calculateCosineSimilarity(vectorA, vectorB);
  const compatibilityPercentage = Math.round(similarityScore * 100);

  return res.status(200).json({
    compatibilityScore: compatibilityPercentage,
    dealbreakerDisqualified: false,
    message: `Vector matched successfully: ${compatibilityPercentage}% compatibility.`
  });
});

// Discover matches within campus radius, optimized using geospatial indexing and Redis exclusions
router.get('/discover/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { maxDistance = 50000 } = req.query; // default 50km

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format.' });
    }

    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({ error: 'User profile not found.' });
    }

    if (!currentUser.location || !currentUser.location.coordinates) {
      return res.status(400).json({ error: 'User coordinates must be configured to fetch geographical matches.' });
    }

    // Retrieve already swiped profiles from Redis cache to exclude them in query
    const swipedUserIds = await getSwipedUsers(userId);
    const excludeObjectIds = swipedUserIds
      .filter(id => mongoose.Types.ObjectId.isValid(id))
      .map(id => new mongoose.Types.ObjectId(id));
    excludeObjectIds.push(currentUser._id);

    // Geospatial pipeline query
    const candidates = await User.aggregate([
      {
        $geoNear: {
          near: {
            type: 'Point',
            coordinates: currentUser.location.coordinates
          },
          distanceField: 'distance',
          maxDistance: Number(maxDistance),
          spherical: true,
          query: {
            _id: { $nin: excludeObjectIds }
          }
        }
      }
    ]);

    // Apply dealbreakers and compute scores for matching candidates
    const scoredMatches = candidates
      .filter(candidate => !hasDealbreakerConflict(currentUser, candidate))
      .map(candidate => {
        const vectorA = getPreferenceVector(currentUser);
        const vectorB = getPreferenceVector(candidate);
        const score = calculateCosineSimilarity(vectorA, vectorB);
        return {
          ...candidate,
          compatibilityScore: Math.round(score * 100)
        };
      })
      // Sort candidates by compatibility score descending
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    return res.status(200).json(scoredMatches);
  } catch (error) {
    console.error('Discovery query failed:', error);
    return res.status(500).json({ error: 'Internal server error during profile discovery.' });
  }
});

// Track swipe action, sync to Redis, and evaluate double-blind opt-in match status
router.post('/swipe', async (req, res) => {
  try {
    const { userId, candidateId, direction } = req.body;

    if (!userId || !candidateId || !direction) {
      return res.status(400).json({ error: 'userId, candidateId, and direction (left/right) are required.' });
    }

    // Save swipe event to MongoDB to support persistent relationship checks
    await Swipe.findOneAndUpdate(
      { swiper: userId, swipee: candidateId },
      { direction },
      { upsert: true, new: true }
    );

    // Sync to Redis cache (seen user exclusion check cache)
    await trackSwipe(userId, candidateId);

    // Double-blind opt-in evaluation
    if (direction === 'right') {
      const counterSwipe = await Swipe.findOne({
        swiper: candidateId,
        swipee: userId,
        direction: 'right'
      });

      if (counterSwipe) {
        // Broadcast WebSocket event for real-time notification
        notifyMatch(userId, candidateId, {
          matchedUser: candidateId,
          timestamp: new Date()
        });

        return res.status(200).json({
          matchCreated: true,
          message: 'It is a match! Double-blind opt-in criteria satisfied.'
        });
      }
    }

    return res.status(200).json({
      matchCreated: false,
      message: 'Swipe tracked successfully.'
    });
  } catch (error) {
    console.error('Swipe tracking failed:', error);
    return res.status(500).json({ error: 'Internal server error logging swipe.' });
  }
});

export default router;
