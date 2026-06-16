import { calculateCosineSimilarity, getPreferenceVector } from './services/matchingEngine.js';
import { hasDealbreakerConflict } from './middleware/dealbreakerEvaluator.js';

// Mock User A
const userA = {
  name: 'Yash',
  preferences: { sleep: 0.8, cleanliness: 0.9, socialness: 0.3, diet: 0.5 },
  dealbreakers: { budgetMin: 1000, budgetMax: 2500, smokingAllowed: false, petsAllowed: true }
};

// Mock User B (Lifestyle matches, overlapping budget)
const userB = {
  name: 'Aarav',
  preferences: { sleep: 0.7, cleanliness: 0.8, socialness: 0.4, diet: 0.6 },
  dealbreakers: { budgetMin: 1200, budgetMax: 2000, smokingAllowed: false, petsAllowed: true }
};

// Mock User C (Smoking dealbreaker mismatch)
const userC = {
  name: 'Kabir',
  preferences: { sleep: 0.8, cleanliness: 0.9, socialness: 0.3, diet: 0.5 },
  dealbreakers: { budgetMin: 1000, budgetMax: 2500, smokingAllowed: true, petsAllowed: true }
};

// Mock User D (Budget dealbreaker mismatch)
const userD = {
  name: 'Rohan',
  preferences: { sleep: 0.8, cleanliness: 0.9, socialness: 0.3, diet: 0.5 },
  dealbreakers: { budgetMin: 3000, budgetMax: 4000, smokingAllowed: false, petsAllowed: true }
};

console.log('--- RoommateIQ Match Engine Telemetry Check ---');

const runEvaluation = (profile1, profile2) => {
  console.log(`\nEvaluating compatibility: ${profile1.name} & ${profile2.name}`);
  
  if (hasDealbreakerConflict(profile1, profile2)) {
    console.log('-> Result: 0% compatibility (Forced by hard-lock dealbreaker mismatch).');
    return;
  }
  
  const vec1 = getPreferenceVector(profile1);
  const vec2 = getPreferenceVector(profile2);
  const similarity = calculateCosineSimilarity(vec1, vec2);
  
  console.log(`-> Vector A: [${vec1.join(', ')}]`);
  console.log(`-> Vector B: [${vec2.join(', ')}]`);
  console.log(`-> Cosine Similarity: ${similarity}`);
  console.log(`-> Result: ${Math.round(similarity * 100)}% compatibility score.`);
};

runEvaluation(userA, userB);
runEvaluation(userA, userC);
runEvaluation(userA, userD);
