/**
 * Calculates the cosine similarity score between two numerical vectors.
 * Formula: (A . B) / (||A|| * ||B||)
 */
export const calculateCosineSimilarity = (vectorA, vectorB) => {
  if (vectorA.length !== vectorB.length) {
    return 0;
  }

  let dotProduct = 0;
  let magnitudeA = 0;
  let magnitudeB = 0;

  for (let i = 0; i < vectorA.length; i++) {
    dotProduct += vectorA[i] * vectorB[i];
    magnitudeA += vectorA[i] * vectorA[i];
    magnitudeB += vectorB[i] * vectorB[i];
  }

  if (magnitudeA === 0 || magnitudeB === 0) {
    return 0;
  }

  const similarity = dotProduct / (Math.sqrt(magnitudeA) * Math.sqrt(magnitudeB));
  return parseFloat(similarity.toFixed(4));
};

/**
 * Transforms a user preferences object into a numerical array representation
 */
export const getPreferenceVector = (user) => {
  const { sleep, cleanliness, socialness, diet } = user.preferences;
  return [sleep, cleanliness, socialness, diet];
};
