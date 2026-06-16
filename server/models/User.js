import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  college: {
    type: String,
    required: true,
    trim: true
  },
  major: {
    type: String,
    trim: true
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Non-Binary', 'Other']
  },
  age: {
    type: Number,
    required: true,
    min: 16
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  profileImage: {
    type: String,
    default: ''
  },
  // Numerical preference vectors for Cosine Similarity matching (scaled 0.1 - 0.9)
  preferences: {
    sleep: { type: Number, required: true, min: 0.1, max: 0.9 },
    cleanliness: { type: Number, required: true, min: 0.1, max: 0.9 },
    socialness: { type: Number, required: true, min: 0.1, max: 0.9 },
    diet: { type: Number, required: true, min: 0.1, max: 0.9 }
  },
  // Hard-lock filters that instantly disqualify a match if there is a conflict
  dealbreakers: {
    budgetMin: { type: Number, required: true },
    budgetMax: { type: Number, required: true },
    smokingAllowed: { type: Boolean, required: true, default: false },
    petsAllowed: { type: Boolean, required: true, default: false }
  },
  // GeoJSON location index for geospatial campus radius searches
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  }
}, {
  timestamps: true
});

// Enable geospatial queries on the location field
UserSchema.index({ location: '2dsphere' });

export default mongoose.model('User', UserSchema);
